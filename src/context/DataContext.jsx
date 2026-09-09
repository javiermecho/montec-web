import React, { createContext, useContext, useState, useEffect } from 'react';
import { MODELS_DATABASE, ISSUE_TYPES, MINIMUM_REPAIR_PRICES, getMinimumRepairPrice, getRepairTimeInfo } from '../data/repairData';
import { ACCESSORIES_DATABASE } from '../data/accessoriesData';
import { fetchDolarBlueRate, DEFAULT_FALLBACK_RATE } from '../services/dolarService';
import { calculateModuleEstimate, calculateAndroidPartEstimate, PRICING_RULES } from '../services/partsPricingEngine';
import { 
  getIphoneGenerationInfo,
  getIphoneModalities,
  IPHONE_SCREEN_MODALITIES_PRE_11,
  IPHONE_SCREEN_MODALITIES_POST_11,
  IPHONE_BATTERY_MODALITIES_PRE_XS,
  IPHONE_BATTERY_MODALITIES_POST_XS,
  buildDefaultIphoneConfigs,
  getMontecIphoneMarginUsd,
  getGuildPlacaCost,
  getGuildBateriaCost,
  getGuildTapaCost
} from '../data/iphonePricingData';
import { api } from '../services/api';

const DataContext = createContext(null);

const STORAGE_KEYS = {
  MODELS: 'montec_models_v7', // v7: catálogo limpio y canónico de teléfonos reales (sin conectores FPC, sin cadenas compuestas)
  ISSUES: 'montec_issues_v5', // v5: pisos separados Android e iPhone ($55k en placa, $35k en tapa Android, térmico y SSD en PC)
  ACCESSORIES: 'montec_accessories_v2', // v2 para actualizar datos de fotos
  INVENTORY: 'montec_inventory_v1', // Inventario general de accesorios y productos
  SALES: 'montec_sales_v1', // Registro de ventas del Punto de Venta (POS)
  PRICING_RULES: 'montec_pricing_rules_v1', // Reglas de márgenes y mano de obra Android
  IPHONE_CONFIGS: 'montec_iphone_configs_v3', // v3: Modalidades condicionales por modelo iPhone (Baterías pre-XS vs post-XS, Pantallas pre-11 vs post-11)
  AUTH: 'montec_admin_auth',
  EMPLOYEE_AUTH: 'montec_employee_auth_v1',
  ORDERS: 'montec_repair_orders_v1'
};

const DEFAULT_PRICING_RULES = {
  minLaborArs: 30000,
  maxMarginArs: 80000,
  markupMultiplier: 2.0
};

export function DataProvider({ children }) {
  // 1. Modelos de equipos
  const [models, setModels] = useState(() => {
    try {
      // Limpiar versiones obsoletas para forzar actualización con el catálogo limpio
      localStorage.removeItem('montec_models_v6');
      localStorage.removeItem('montec_models_v5');
      localStorage.removeItem('montec_models_v4');
      localStorage.removeItem('montec_models_v3');
      localStorage.removeItem('montec_models_v2');
      localStorage.removeItem('montec_models_v1');

      const saved = localStorage.getItem(STORAGE_KEYS.MODELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= MODELS_DATABASE.length) {
          return parsed;
        }
      }
      return MODELS_DATABASE;
    } catch {
      return MODELS_DATABASE;
    }
  });

  // 2. Fallas y precios de reparación
  const [issues, setIssues] = useState(() => {
    try {
      localStorage.removeItem('montec_issues_v4');
      localStorage.removeItem('montec_issues_v3');
      localStorage.removeItem('montec_issues_v2');
      localStorage.removeItem('montec_issues_v1');
      const saved = localStorage.getItem(STORAGE_KEYS.ISSUES);
      return saved ? JSON.parse(saved) : ISSUE_TYPES;
    } catch {
      return ISSUE_TYPES;
    }
  });

  // 3. Catálogo de Inventario & Accesorios
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Fallback: verificar si había accesorios guardados en versiones anteriores
      const savedAcc = localStorage.getItem(STORAGE_KEYS.ACCESSORIES);
      if (savedAcc) {
        const parsed = JSON.parse(savedAcc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => {
            const def = ACCESSORIES_DATABASE[idx] || {};
            return {
              ...def,
              ...item,
              sku: item.sku || def.sku || `SKU-${idx + 101}`,
              barcode: item.barcode || def.barcode || `779123400${idx + 101}`,
              costPrice: Number(item.costPrice || def.costPrice || Math.round((item.price || 10000) * 0.45)),
              price: Number(item.price || def.price || 15000),
              stock: item.stock !== undefined ? Number(item.stock) : (def.stock ?? 10),
              minStock: item.minStock !== undefined ? Number(item.minStock) : (def.minStock ?? 3),
              visibleInWeb: item.visibleInWeb !== undefined ? Boolean(item.visibleInWeb) : true
            };
          });
        }
      }
      return ACCESSORIES_DATABASE;
    } catch {
      return ACCESSORIES_DATABASE;
    }
  });

  // Guardar siempre el inventario en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      // Mantener sincronizado STORAGE_KEYS.ACCESSORIES para compatibilidad
      localStorage.setItem(STORAGE_KEYS.ACCESSORIES, JSON.stringify(inventory));
    } catch (e) {
      console.error('Error guardando inventario en localStorage:', e);
    }
  }, [inventory]);

  // accessories es un alias reactivo que alimenta el catálogo público filtrando los visibles
  const accessories = inventory.filter(item => item.visibleInWeb !== false);

  // 3.1 Ventas y movimientos de caja del Punto de Venta (POS)
  const [sales, setSales] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error('Error guardando ventas en localStorage:', e);
    }
  }, [sales]);

  // 4. Estado de autenticación del administrador
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  // 4.1 Estado de autenticación de empleados / taller
  const [isEmployeeAuthenticated, setIsEmployeeAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.EMPLOYEE_AUTH) === 'true' ||
           Boolean(localStorage.getItem('montec_auth_session_v2'));
  });

  // 4.2 Órdenes de reparación de taller
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [
        {
          id: 'order-sample-1',
          orderNumber: '#MON-1041',
          createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          customer: {
            docType: 'DNI',
            docNumber: '38492019',
            name: 'Martín Benítez',
            taxCondition: 'Consumidor Final',
            phone: '+54 9 223 512-3456',
            email: 'martin.b@gmail.com',
            sendWhatsApp: true,
            sendEmail: false,
            internalNotes: 'Cliente habitual recomendado por local vecino.'
          },
          device: {
            type: 'iPhone',
            brand: 'Apple',
            model: 'iPhone 13',
            imei: '358920104829102',
            color: 'Midnight Black',
            aestheticCondition: 'Bisel con marcas leves de uso, templado roto.',
            security: {
              type: 'pin',
              pin: '147258',
              patternSequence: [],
              accountInfo: ''
            }
          },
          service: {
            location: 'En Taller (Montes Carballo)',
            requestedRepair: 'Cambio de Módulo de Pantalla Completa Original',
            preliminaryDiagnosis: 'Display OLED quebrado con líneas verdes verticales tras caída.',
            checklist: {
              turnsOn: true,
              touchOk: false,
              camerasOk: true,
              audioOk: true,
              chargingOk: true,
              biometricsOk: true,
              simTrayPresent: true
            },
            budgetTotal: 125000,
            deposit: 50000,
            balanceDue: 75000,
            estimatedDeliveryDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
            status: 'in_progress',
            technician: 'Taller Montec'
          },
          logs: [
            {
              timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
              action: 'Recepción en mostrador y pago de seña $50.000',
              status: 'received'
            },
            {
              timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
              action: 'Ingresado a mesa de trabajo para reemplazo de display',
              status: 'in_progress'
            }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  // 5. Estado de apertura del modal de admin
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // 5.1 Estado de apertura del modal de cotizador interactivo
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // 5.2 Estado de apertura del sistema de taller / mostrador
  const [isTallerOpen, setIsTallerOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.hash === '#taller' || window.location.hash === '#empleados');
  });

  // Escuchar cambios de hash para abrir módulo taller directamente
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#taller' || window.location.hash === '#empleados') {
        setIsTallerOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 6. Cotización del Dólar Blue Venta (Bluelytics API)
  const [dolarRate, setDolarRate] = useState(DEFAULT_FALLBACK_RATE);
  const [dolarInfo, setDolarInfo] = useState({
    rate: DEFAULT_FALLBACK_RATE,
    lastUpdate: null,
    isLive: false,
    fromCache: false,
    loading: true
  });

  const updateDolar = async () => {
    try {
      const res = await fetchDolarBlueRate();
      if (res && res.rate) {
        setDolarRate(res.rate);
        setDolarInfo({
          rate: res.rate,
          lastUpdate: res.lastUpdate,
          isLive: res.isLive,
          fromCache: res.fromCache,
          loading: false
        });
      }
    } catch (e) {
      console.warn('⚠️ Error actualizando cotización de dólar:', e);
      setDolarInfo(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    updateDolar();
    const interval = setInterval(updateDolar, 30 * 60 * 1000); // Actualización cada 30 min
    return () => clearInterval(interval);
  }, []);

  // 6.1 Monitoreo de Conexión con Railway / PostgreSQL
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [serverHealth, setServerHealth] = useState(null);

  const syncWithServer = async (silent = false) => {
    try {
      if (!silent) setServerStatus('checking');
      const health = await api.checkServerHealth();
      
      if (health && (health.online || health.status === 'online')) {
        setServerStatus('online');
        setServerHealth(health);

        // Helper para normalizar ordenes y asegurar compatibilidad de campos
        const normalizeOrderData = (ord) => {
          if (!ord) return ord;
          const customerObj = ord.customer || ord.client || {};
          const statusVal = ord.status || ord.service?.status || 'received';
          return {
            ...ord,
            status: statusVal,
            customer: {
              ...customerObj,
              name: customerObj.name || ord.clientName || 'Cliente Mostrador',
              phone: customerObj.phone || ord.clientPhone || ''
            },
            client: customerObj,
            device: {
              ...(ord.device || {}),
              model: ord.device?.model || ord.deviceModel || 'Dispositivo'
            },
            service: {
              ...(ord.service || {}),
              status: statusVal,
              requestedRepair: ord.service?.requestedRepair || ord.service?.issue || ord.issue || 'Reparación'
            }
          };
        };

        // 1. Sincronizar órdenes desde PostgreSQL en segundo plano
        try {
          const remoteOrders = await api.getOrdenes();
          if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
            const normalizedRemote = remoteOrders.map(normalizeOrderData);
            setOrders(prev => {
              // Si hay órdenes reales en PostgreSQL, filtramos la orden de ejemplo de muestra inicial
              const filteredPrev = prev.filter(o => o.id !== 'order-sample-1' && o.orderNumber !== '#MON-1041');
              const merged = [...normalizedRemote];
              filteredPrev.forEach(localOrd => {
                if (!merged.some(m => m.orderNumber === localOrd.orderNumber || String(m.id) === String(localOrd.id))) {
                  merged.push(normalizeOrderData(localOrd));
                }
              });
              try {
                localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        } catch (e) {
          console.warn('⚠️ No se pudieron cargar órdenes de PostgreSQL:', e);
        }

        // 2. Sincronizar productos de inventario desde PostgreSQL si existen
        try {
          const remoteProducts = await api.getProductos();
          if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
            setInventory(prev => {
              const merged = [...remoteProducts];
              try {
                localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        } catch (e) {
          console.warn('⚠️ No se pudo sincronizar inventario de PostgreSQL:', e);
        }

        // 3. Sincronizar y Respaldar Modelos Soportados en PostgreSQL
        try {
          const remoteModels = await api.getSetting('models');
          if (Array.isArray(remoteModels) && remoteModels.length > 0) {
            setModels(remoteModels);
            try {
              localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(remoteModels));
            } catch (e) {}
          } else {
            // Backup inicial en PostgreSQL
            api.saveSetting('models', models).catch(() => {});
          }
        } catch (e) {
          console.warn('⚠️ Error sincronizando modelos de PostgreSQL:', e);
        }

        // 4. Sincronizar y Respaldar Precios y Tipos de Falla en PostgreSQL
        try {
          const remoteIssues = await api.getSetting('issues');
          if (Array.isArray(remoteIssues) && remoteIssues.length > 0) {
            setIssues(remoteIssues);
            try {
              localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(remoteIssues));
            } catch (e) {}
          } else {
            // Backup inicial en PostgreSQL
            api.saveSetting('issues', issues).catch(() => {});
          }
        } catch (e) {
          console.warn('⚠️ Error sincronizando fallas/precios de PostgreSQL:', e);
        }

        // 5. Sincronizar Reglas de Precios y Márgenes en PostgreSQL
        try {
          const remotePricing = await api.getSetting('pricing_rules');
          if (remotePricing && typeof remotePricing === 'object' && remotePricing.markupMultiplier) {
            setPricingRules(remotePricing);
            try {
              localStorage.setItem(STORAGE_KEYS.PRICING_RULES, JSON.stringify(remotePricing));
            } catch (e) {}
          } else {
            api.saveSetting('pricing_rules', pricingRules).catch(() => {});
          }
        } catch (e) {}

        // 6. Sincronizar Configuraciones de iPhone en PostgreSQL
        try {
          const remoteIphoneConfigs = await api.getSetting('iphone_configs');
          if (remoteIphoneConfigs && typeof remoteIphoneConfigs === 'object') {
            setIphoneConfigs(remoteIphoneConfigs);
            try {
              localStorage.setItem(STORAGE_KEYS.IPHONE_CONFIGS, JSON.stringify(remoteIphoneConfigs));
            } catch (e) {}
          } else {
            api.saveSetting('iphone_configs', iphoneConfigs).catch(() => {});
          }
        } catch (e) {}

        return true;
      } else {
        setServerStatus('offline');
        setServerHealth(null);
        return false;
      }
    } catch (err) {
      setServerStatus('offline');
      setServerHealth(null);
      return false;
    }
  };

  useEffect(() => {
    syncWithServer();
    // Polling inteligente cada 10 segundos para sincronización instantánea entre celular y PC
    const syncInterval = setInterval(() => syncWithServer(true), 10 * 1000);
    const handleOnline = () => syncWithServer();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer(true);
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 7. Reglas de márgenes y mano de obra (Android / Global)
  const [pricingRules, setPricingRules] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRICING_RULES);
      return saved ? { ...DEFAULT_PRICING_RULES, ...JSON.parse(saved) } : DEFAULT_PRICING_RULES;
    } catch {
      return DEFAULT_PRICING_RULES;
    }
  });

  const updatePricingRules = (newRules) => {
    setPricingRules(prev => {
      const updated = { ...prev, ...newRules };
      try {
        localStorage.setItem(STORAGE_KEYS.PRICING_RULES, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('pricing_rules', updated).catch(() => {});
      return updated;
    });
  };

  const resetPricingRules = () => {
    setPricingRules(DEFAULT_PRICING_RULES);
    try {
      localStorage.setItem(STORAGE_KEYS.PRICING_RULES, JSON.stringify(DEFAULT_PRICING_RULES));
    } catch (e) {}
    api.saveSetting('pricing_rules', DEFAULT_PRICING_RULES).catch(() => {});
  };

  // 8. Configuración especializada de iPhone (Mano de obra y microelectrónica por modelo)
  const [iphoneConfigs, setIphoneConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IPHONE_CONFIGS);
      return saved ? JSON.parse(saved) : buildDefaultIphoneConfigs();
    } catch {
      return buildDefaultIphoneConfigs();
    }
  });

  const updateIphoneConfig = (modelId, newFields) => {
    setIphoneConfigs(prev => {
      const updated = {
        ...prev,
        [modelId]: {
          ...(prev[modelId] || {}),
          ...newFields
        }
      };
      try {
        localStorage.setItem(STORAGE_KEYS.IPHONE_CONFIGS, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('iphone_configs', updated).catch(() => {});
      return updated;
    });
  };

  const resetIphoneConfigs = () => {
    const defaults = buildDefaultIphoneConfigs();
    setIphoneConfigs(defaults);
    try {
      localStorage.setItem(STORAGE_KEYS.IPHONE_CONFIGS, JSON.stringify(defaults));
    } catch (e) {}
    api.saveSetting('iphone_configs', defaults).catch(() => {});
  };

  // ============================================================================
  // CLAVES DE ACCESO A PANELES (ADMINISTRADOR Y TALLER)
  // Podés modificar estas contraseñas acá en cualquier momento:
  // ============================================================================
  const ADMIN_PASSWORD = 'Milan844@';
  const TALLER_PASSWORD = 'Milan844@';

  // Autenticación por Clave Administrador
  const loginAdmin = (pin) => {
    const cleanPin = (pin || '').trim();
    if (cleanPin === ADMIN_PASSWORD || cleanPin === ADMIN_PASSWORD.toLowerCase()) {
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  // Autenticación por Clave Empleados / Taller
  const loginEmployee = (pin) => {
    const cleanPin = (pin || '').trim();
    const savedPin = localStorage.getItem('montec_operator_pin_v1') || '1234';
    const savedAdmin = localStorage.getItem('montec_admin_password_v1') || 'Milan844@';
    if (
      cleanPin === savedPin || 
      cleanPin === '1234' || 
      cleanPin === savedAdmin || 
      cleanPin === TALLER_PASSWORD || 
      cleanPin === TALLER_PASSWORD.toLowerCase()
    ) {
      setIsEmployeeAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.EMPLOYEE_AUTH, 'true');
      return true;
    }
    return false;
  };

  const logoutEmployee = () => {
    setIsEmployeeAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEE_AUTH);
  };

  // --- Operaciones de Órdenes de Reparación ---
  const createRepairOrder = async (orderData) => {
    // 1. Intentar registrar en PostgreSQL mediante Railway si la API está accesible
    try {
      const response = await api.createOrden({
        client: {
          name: orderData.customer?.name || orderData.client?.name || 'Cliente Mostrador',
          phone: orderData.customer?.phone || orderData.client?.phone || '',
          docNumber: orderData.customer?.docNumber || '',
          docType: orderData.customer?.docType || 'DNI',
          email: orderData.customer?.email || '',
          address: orderData.customer?.address || '',
          internalNotes: orderData.customer?.internalNotes || ''
        },
        device: {
          model: orderData.device?.model || '',
          brand: orderData.device?.brand || '',
          type: orderData.device?.type || 'Smartphone',
          imei: orderData.device?.imei || '',
          color: orderData.device?.color || '',
          patternLock: orderData.device?.security?.patternSequence?.join('-') || orderData.device?.patternLock || '',
          pinLock: orderData.device?.security?.pin || orderData.device?.pinLock || '',
          security: orderData.device?.security || {},
          checklist: orderData.device?.checklist || {}
        },
        service: {
          requestedRepair: orderData.service?.requestedRepair || '',
          issue: orderData.service?.requestedRepair || orderData.service?.issue || '',
          diagnosis: orderData.service?.diagnosis || '',
          budgetTotal: parseFloat(orderData.service?.budgetTotal || 0),
          deposit: parseFloat(orderData.service?.deposit || 0),
          balanceDue: parseFloat(orderData.service?.balanceDue || 0),
          warranty: orderData.service?.warranty || '90 días de garantía escrita',
          status: orderData.status || orderData.service?.status || 'received',
          technician: orderData.service?.technician || orderData.technician || 'Sin Asignar'
        },
        operator: orderData.service?.technician || 'Operador Mostrador'
      });

      if (response && response.success && response.order) {
        const savedOrder = {
          ...orderData,
          id: String(response.order.id),
          orderNumber: response.order.orderNumber, // Ej: #MON-1042 oficial desde PostgreSQL
          createdAt: response.order.createdAt || new Date().toISOString(),
          updatedAt: response.order.updatedAt || new Date().toISOString(),
          status: response.order.service?.status || 'received',
          customer: {
            ...orderData.customer,
            name: response.order.client?.name || orderData.customer?.name,
            phone: response.order.client?.phone || orderData.customer?.phone
          },
          device: {
            ...orderData.device,
            model: response.order.device?.model || orderData.device?.model
          },
          service: {
            ...orderData.service,
            ...response.order.service
          },
          logs: response.order.logs || [
            {
              timestamp: new Date().toISOString(),
              action: 'Recepción e ingreso de orden a taller (PostgreSQL)',
              status: 'received'
            }
          ]
        };

        setOrders(prev => {
          const updated = [savedOrder, ...prev];
          try {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        return savedOrder;
      }
    } catch (apiErr) {
      console.warn('⚠️ Guardando orden localmente por falla de red con Railway:', apiErr.message);
    }

    // Fallback a correlativo local si la API estuviera offline o inaccesible
    const nextNumber = orders.reduce((max, o) => {
      const num = parseInt((o.orderNumber || '').replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1041) + 1;

    const orderNumber = `#MON-${nextNumber}`;
    const newOrder = {
      ...orderData,
      id: `order-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'received',
      logs: [
        {
          timestamp: new Date().toISOString(),
          action: 'Recepción e ingreso de orden a taller (Local)',
          status: orderData.status || 'received'
        }
      ]
    };

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando orden en localStorage:', e);
      }
      return updated;
    });

    return newOrder;
  };

  const updateRepairOrder = (orderId, updatedFields) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId && o.orderNumber !== orderId) return o;
        return {
          ...o,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error actualizando orden:', e);
      }
      return updated;
    });
  };

  const updateRepairOrderStatus = async (orderId, newStatus, note = '', extraData = {}) => {
    // 1. Actualización optimista inmediata en state y localStorage
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId && o.orderNumber !== orderId) return o;
        const newLogs = [
          ...(o.logs || []),
          {
            timestamp: new Date().toISOString(),
            action: note || `Estado cambiado a: ${newStatus}`,
            status: newStatus
          }
        ];
        return {
          ...o,
          ...extraData,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          logs: newLogs
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error actualizando orden:', e);
      }
      return updated;
    });

    // 2. Persistencia en PostgreSQL (Railway)
    try {
      const res = await api.updateOrdenEstado(orderId, {
        status: newStatus,
        technicalReport: note,
        operator: 'Taller Montec',
        ...extraData
      });
      if (res && res.success && (res.order || res.data?.order)) {
        const remoteOrder = res.order || res.data.order;
        const normalized = normalizeOrderData(remoteOrder);
        setOrders(prev => {
          const updated = prev.map(o => (o.id === normalized.id || o.orderNumber === normalized.orderNumber) ? normalized : o);
          try {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (e) {
      console.warn('⚠️ No se pudo sincronizar estado con PostgreSQL:', e.message);
    }
  };

  const addOrderInternalNote = (orderId, noteText, author = 'Taller Montec') => {
    if (!noteText || !noteText.trim()) return;
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId && o.orderNumber !== orderId) return o;
        const newNotes = [
          ...(o.internalNotesList || []),
          {
            id: `note-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author,
            text: noteText.trim()
          }
        ];
        const newLogs = [
          ...(o.logs || []),
          {
            timestamp: new Date().toISOString(),
            action: `Nota interna (${author}): "${noteText.trim().slice(0, 60)}${noteText.trim().length > 60 ? '...' : ''}"`,
            status: o.status
          }
        ];
        return {
          ...o,
          internalNotesList: newNotes,
          updatedAt: new Date().toISOString(),
          logs: newLogs
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando nota interna:', e);
      }
      return updated;
    });
  };

  const recordOrderPayment = (orderId, paymentAmount, paymentMethod = 'Efectivo', note = '') => {
    const amount = Number(paymentAmount) || 0;
    if (amount <= 0) return;

    // 1. Actualización optimista local
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId && o.orderNumber !== orderId) return o;
        const currentDeposit = Number(o.service?.deposit) || 0;
        const currentBudget = Number(o.service?.budgetTotal) || 0;
        const newDeposit = currentDeposit + amount;
        const newBalance = Math.max(0, currentBudget - newDeposit);

        const newPaymentEntry = {
          id: `pay-${Date.now()}`,
          timestamp: new Date().toISOString(),
          amount,
          method: paymentMethod,
          note: note || 'Cobro registrado en taller'
        };

        const newPayments = [...(o.payments || []), newPaymentEntry];
        const newLogs = [
          ...(o.logs || []),
          {
            timestamp: new Date().toISOString(),
            action: `Cobro registrado: +$${amount.toLocaleString('es-AR')} (${paymentMethod}). Saldo restante: $${newBalance.toLocaleString('es-AR')}`,
            status: o.status
          }
        ];

        return {
          ...o,
          payments: newPayments,
          service: {
            ...o.service,
            deposit: newDeposit,
            balanceDue: newBalance
          },
          updatedAt: new Date().toISOString(),
          logs: newLogs
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error registrando cobro:', e);
      }
      return updated;
    });

    // 2. Notificación en segundo plano a PostgreSQL
    api.updateOrdenPago(orderId, {
      amount,
      method: paymentMethod,
      operator: 'Operador Mostrador'
    }).catch(e => {
      console.warn('⚠️ No se pudo sincronizar cobro con PostgreSQL:', e.message);
    });
  };

  const deleteRepairOrder = (orderId) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId && o.orderNumber !== orderId);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error eliminando orden:', e);
      }
      return updated;
    });

    api.deleteOrden(orderId).catch(e => {
      console.warn('⚠️ No se pudo eliminar orden en Railway:', e.message);
    });
  };

  // Búsqueda rápida de clientes históricos
  const searchClients = (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const clientMap = new Map();

    orders.forEach(o => {
      const c = o.customer;
      if (!c) return;
      const key = `${c.docNumber || ''}_${c.name || ''}_${c.phone || ''}`;
      if (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.docNumber && c.docNumber.includes(q)) ||
        (c.phone && c.phone.includes(q))
      ) {
        if (!clientMap.has(key)) {
          clientMap.set(key, c);
        }
      }
    });

    return Array.from(clientMap.values());
  };

  // 9. Tema visual de paneles (Claro / Oscuro)
  const [panelTheme, setPanelTheme] = useState(() => {
    return localStorage.getItem('montec_panel_theme') || 'dark';
  });

  const togglePanelTheme = () => {
    setPanelTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('montec_panel_theme', next);
      return next;
    });
  };

  // --- Operaciones de Modelos ---
  const addModel = (newModel) => {
    const modelWithId = {
      ...newModel,
      id: newModel.id || `custom-${Date.now()}`,
      year: parseInt(newModel.year, 10) || new Date().getFullYear()
    };
    setModels(prev => {
      const updated = [modelWithId, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando modelo:', e);
      }
      api.saveSetting('models', updated).catch(() => {});
      return updated;
    });
    return modelWithId;
  };

  const updateModel = (id, updatedFields) => {
    setModels(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updatedFields } : m);
      try {
        localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('models', updated).catch(() => {});
      return updated;
    });
  };

  const deleteModel = (id) => {
    setModels(prev => {
      const updated = prev.filter(m => m.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('models', updated).catch(() => {});
      return updated;
    });
  };

  // --- Operaciones de Fallas y Precios ---
  const updateIssuePrices = (issueId, deviceType, minPrice, maxPrice) => {
    setIssues(prev => {
      const updated = prev.map(issue => {
        if (issue.id !== issueId) return issue;
        return {
          ...issue,
          basePrices: {
            ...issue.basePrices,
            [deviceType]: {
              min: parseInt(minPrice, 10) || 0,
              max: parseInt(maxPrice, 10) || 0
            }
          }
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('issues', updated).catch(() => {});
      return updated;
    });
  };

  const updateIssueMeta = (issueId, fields) => {
    setIssues(prev => {
      const updated = prev.map(issue => {
        if (issue.id !== issueId) return issue;
        return { ...issue, ...fields };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(updated));
      } catch (e) {}
      api.saveSetting('issues', updated).catch(() => {});
      return updated;
    });
  };

  // --- Operaciones de Inventario & Productos ---
  const addProduct = (item) => {
    const cost = Number(item.costPrice) || 0;
    const price = Number(item.price) || 0;
    const newProduct = {
      id: item.id || `prod-${Date.now()}`,
      sku: (item.sku || `SKU-${Date.now().toString().slice(-6)}`).toUpperCase().trim(),
      barcode: (item.barcode || '').trim(),
      name: item.name || 'Nuevo Accesorio',
      category: item.category || 'Cargadores & Fuentes',
      compatible: item.compatible || '',
      features: Array.isArray(item.features) ? item.features : (item.features ? item.features.split('\n').filter(Boolean) : []),
      costPrice: cost,
      price: price,
      stock: parseInt(item.stock, 10) >= 0 ? parseInt(item.stock, 10) : 0,
      minStock: parseInt(item.minStock, 10) >= 0 ? parseInt(item.minStock, 10) : 3,
      visibleInWeb: item.visibleInWeb !== undefined ? Boolean(item.visibleInWeb) : true,
      badge: item.badge || 'Disponible',
      image: item.image || ''
    };

    setInventory(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setInventory(prev => prev.map(p => {
      if (p.id !== id && p.sku !== id) return p;
      return {
        ...p,
        ...updatedFields,
        costPrice: updatedFields.costPrice !== undefined ? Number(updatedFields.costPrice) : p.costPrice,
        price: updatedFields.price !== undefined ? Number(updatedFields.price) : p.price,
        stock: updatedFields.stock !== undefined ? parseInt(updatedFields.stock, 10) : p.stock,
        minStock: updatedFields.minStock !== undefined ? parseInt(updatedFields.minStock, 10) : p.minStock,
        visibleInWeb: updatedFields.visibleInWeb !== undefined ? Boolean(updatedFields.visibleInWeb) : p.visibleInWeb
      };
    }));

    // Sincronizar con PostgreSQL
    api.updateProducto(id, updatedFields).catch(e => {
      console.warn('⚠️ No se pudo sincronizar producto con Railway:', e.message);
    });
  };

  const updateProductStock = (id, amount, isDelta = false) => {
    let finalStock = 0;
    setInventory(prev => prev.map(p => {
      if (p.id !== id && p.sku !== id) return p;
      const newStock = isDelta ? Math.max(0, (p.stock || 0) + Number(amount)) : Math.max(0, Number(amount));
      finalStock = newStock;
      return { ...p, stock: newStock };
    }));

    // Sincronizar stock con PostgreSQL
    api.updateProducto(id, { stock: finalStock }).catch(e => {
      console.warn('⚠️ No se pudo actualizar stock en Railway:', e.message);
    });
  };

  const deleteProduct = (id) => {
    setInventory(prev => prev.filter(p => p.id !== id && p.sku !== id));
  };

  // Aliases para retrocompatibilidad con componentes existentes
  const addAccessory = addProduct;
  const updateAccessory = updateProduct;
  const deleteAccessory = deleteProduct;

  // --- Operaciones de Ventas (Punto de Venta - POS) ---
  const recordSale = (saleData) => {
    const saleId = `sale-${Date.now()}`;
    const dateNow = new Date();
    const ticketNumber = `#TCK-${1000 + sales.length + 1}`;

    const newSale = {
      id: saleId,
      ticketNumber,
      createdAt: dateNow.toISOString(),
      formattedDate: dateNow.toLocaleString('es-AR'),
      items: saleData.items || [],
      subtotal: Number(saleData.subtotal) || 0,
      discountType: saleData.discountType || 'none', // 'percentage', 'fixed', 'none'
      discountValue: Number(saleData.discountValue) || 0,
      discountAmount: Number(saleData.discountAmount) || 0,
      total: Number(saleData.total) || 0,
      paymentMethod: saleData.paymentMethod || 'Efectivo',
      cashGiven: Number(saleData.cashGiven) || 0,
      changeDue: Number(saleData.changeDue) || 0,
      customer: {
        name: saleData.customer?.name?.trim() || 'Consumidor Final',
        phone: saleData.customer?.phone?.trim() || ''
      },
      seller: saleData.seller || 'Mostrador Montec'
    };

    // 1. Descontar stock de cada producto vendido localmente
    if (Array.isArray(saleData.items) && saleData.items.length > 0) {
      setInventory(prev => {
        return prev.map(prod => {
          const soldItem = saleData.items.find(it => it.id === prod.id || it.sku === prod.sku);
          if (soldItem) {
            const qty = Number(soldItem.quantity) || 1;
            return {
              ...prod,
              stock: Math.max(0, (prod.stock || 0) - qty)
            };
          }
          return prod;
        });
      });
    }

    // 2. Registrar venta en el historial local
    setSales(prev => [newSale, ...prev]);

    // 3. Sincronizar venta y descuento atómico de stock en PostgreSQL (Railway)
    api.createVenta({
      items: newSale.items,
      subtotal: newSale.subtotal,
      discount: newSale.discountAmount,
      total: newSale.total,
      paymentMethod: newSale.paymentMethod,
      customer: newSale.customer,
      seller: newSale.seller
    }).catch(e => {
      console.warn('⚠️ No se pudo registrar venta en PostgreSQL:', e.message);
    });

    return newSale;
  };

  const deleteSale = (saleId) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
  };

  // --- Operación de Entrega Unificada (Reparación + Venta de Accesorios) ---
  const recordUnifiedDelivery = (deliveryData) => {
    const {
      orderId,
      orderNumber,
      clientName,
      clientPhone,
      deviceModel,
      repairName,
      balancePaid = 0,
      accessories = [],
      accessoriesTotal = 0,
      discount = 0,
      totalAmount = 0,
      paymentMethod = 'cash',
      cashGiven,
      changeDue,
      notes = '',
      deliveredAt = new Date().toISOString()
    } = deliveryData;

    const paymentLabel = {
      cash: 'Efectivo',
      transfer: 'Transferencia / Alias',
      card: 'Tarjeta Débito/Crédito',
      qr: 'Mercado Pago QR'
    }[paymentMethod] || paymentMethod;

    // 1. Actualizar orden de taller (Marcar entregado, saldar deuda, registrar pago y log)
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId && o.orderNumber !== orderId && o.orderNumber !== orderNumber) return o;
        const currentDeposit = Number(o.service?.deposit) || 0;
        const newDeposit = currentDeposit + balancePaid;
        const newPayments = [
          ...(o.payments || []),
          {
            id: `pay-delivery-${Date.now()}`,
            timestamp: deliveredAt,
            amount: balancePaid,
            method: paymentLabel,
            note: `Cobro final de saldo en entrega (${paymentLabel})${accessories.length > 0 ? ` + ${accessories.length} accesorios` : ''}`
          }
        ];

        const resolutionText = deliveryData.repairResolution === 'ready' 
          ? '🟢 Reparado OK' 
          : '🔴 Sin Reparación / Devolución';

        const accSummary = accessories.map(a => `${a.quantity}x ${a.name}`).join(', ');
        const logAction = `Entrega finalizada en mostrador (${resolutionText}). Saldo cobrado: $${balancePaid.toLocaleString('es-AR')}${
          accessories.length > 0 ? ` + Accesorios: ${accSummary} ($${accessoriesTotal.toLocaleString('es-AR')})` : ''
        }. Total abonado: $${totalAmount.toLocaleString('es-AR')} vía ${paymentLabel}.${notes ? ` Nota: ${notes}` : ''}`;

        const newLogs = [
          ...(o.logs || []),
          {
            timestamp: deliveredAt,
            action: logAction,
            status: 'delivered'
          }
        ];

        return {
          ...o,
          status: 'delivered',
          repairResolution: deliveryData.repairResolution || 'ready',
          isRepaired: deliveryData.isRepaired !== undefined ? deliveryData.isRepaired : true,
          payments: newPayments,
          service: {
            ...o.service,
            status: 'delivered',
            repairResolution: deliveryData.repairResolution || 'ready',
            isRepaired: deliveryData.isRepaired !== undefined ? deliveryData.isRepaired : true,
            deposit: newDeposit,
            balanceDue: 0,
            deliveredAt: deliveredAt
          },
          updatedAt: deliveredAt,
          logs: newLogs
        };
      });

      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando orden entregada:', e);
      }
      return updated;
    });

    // 1.b Sincronizar estado 'delivered' y pago en PostgreSQL (Railway)
    try {
      const resText = deliveryData.repairResolution === 'ready' ? 'Reparado OK' : 'Sin Reparación / Devolución';
      api.updateOrdenEstado(orderId, {
        status: 'delivered',
        technicalReport: `Entrega realizada: ${resText}. Saldo: $${balancePaid}. Vía ${paymentLabel}`,
        operator: 'Mostrador Montec',
        repairResolution: deliveryData.repairResolution || 'ready',
        isRepaired: deliveryData.isRepaired !== undefined ? deliveryData.isRepaired : true
      }).catch(err => console.warn('⚠️ No se pudo sincronizar estado de entrega a PostgreSQL:', err.message));

      if (balancePaid > 0) {
        api.updateOrdenPago(orderId, {
          amount: balancePaid,
          method: paymentLabel,
          note: `Cobro final en mostrador (${resText})`
        }).catch(err => console.warn('⚠️ No se pudo sincronizar pago a PostgreSQL:', err.message));
      }
    } catch (apiErr) {
      console.warn('⚠️ Error al contactar API para entrega:', apiErr);
    }

    // 2. Si se vendieron accesorios, descontar su stock de inventory
    if (Array.isArray(accessories) && accessories.length > 0) {
      setInventory(prev => {
        return prev.map(prod => {
          const sold = accessories.find(a => a.id === prod.id || a.sku === prod.sku);
          if (sold) {
            const qty = Number(sold.quantity) || 1;
            return {
              ...prod,
              stock: Math.max(0, (prod.stock || 0) - qty)
            };
          }
          return prod;
        });
      });

      // 3. Registrar venta de los accesorios en sales
      const saleId = `sale-delivery-${Date.now()}`;
      const newSale = {
        id: saleId,
        ticketNumber: `#TCK-ACC-${1000 + sales.length + 1}`,
        createdAt: deliveredAt,
        formattedDate: new Date(deliveredAt).toLocaleString('es-AR'),
        items: accessories.map(a => ({
          id: a.id,
          name: a.name,
          price: a.price,
          quantity: a.quantity,
          sku: a.sku
        })),
        subtotal: accessoriesTotal,
        discountType: discount > 0 ? 'fixed' : 'none',
        discountValue: discount,
        discountAmount: discount,
        total: Math.max(0, accessoriesTotal - discount),
        paymentMethod: paymentLabel,
        cashGiven: cashGiven || 0,
        changeDue: changeDue || 0,
        customer: {
          name: clientName,
          phone: clientPhone
        },
        orderRef: orderNumber,
        seller: 'Mostrador Montec (Entrega Taller)'
      };

      setSales(prev => [newSale, ...prev]);
    }

    return true;
  };

  // --- Restaurar valores de fábrica ---
  const resetToDefaults = () => {
    setModels(MODELS_DATABASE);
    setIssues(ISSUE_TYPES);
    setInventory(ACCESSORIES_DATABASE);
    setAccessories(ACCESSORIES_DATABASE);
  };

  // --- Función calculadora de cotizaciones reactiva con los datos actuales ---
  const calculateCurrentEstimate = (deviceType, modelId, issueId, customModel = '', extraOptions = {}) => {
    const model = models.find(m => m.id === modelId);
    const issue = issues.find(i => i.id === issueId);

    if (!issue) return null;

    const targetModelName = customModel && customModel.trim() !== '' ? customModel.trim() : (model ? model.model : '');
    const targetBrand = model ? model.brand : '';

    // A. LÓGICA ESPECIALIZADA PARA IPHONE (PANTALLAS & BATERÍAS CON MICROELECTRÓNICA)
    if (deviceType === 'iphone' && model) {
      const genInfo = getIphoneGenerationInfo(targetModelName);
      const modelCfg = iphoneConfigs[model.id] || (buildDefaultIphoneConfigs()[model.id]) || {
        screenLabor: { compatible_unknown: 32000, ic_transplant: 55000, screen_premium: 30000, screen_incell_oled_premium: 30000 },
        batteryLabor: { standard_unknown: 28000, bms_transplant: 48000, battery_standard_100: 25000 }
      };

      // 1. MÓDULO / PANTALLA IPHONE:
      // - iPhone 6 al 8 Plus / X / XS / XR: Calidad Premium con reprogramación True Tone incluida.
      // - iPhone 11 en adelante: Opción 1 Calidad Premium vs Opción 2 Calidad Original sin avisos.
      if (issueId === 'screen') {
        const moduleEstimate = calculateModuleEstimate(targetModelName, 'Apple', dolarRate, pricingRules);
        const basePartCostArs = moduleEstimate && moduleEstimate.bestOption 
          ? moduleEstimate.bestOption.cost_ars 
          : Math.round(35 * dolarRate);

        const screenFloor = getMinimumRepairPrice('iphone', 'screen');
        const availableModalities = genInfo.isScreenBefore11 
          ? IPHONE_SCREEN_MODALITIES_PRE_11 
          : IPHONE_SCREEN_MODALITIES_POST_11;

        const modalities = availableModalities.map(mod => {
          const labor = modelCfg.screenLabor?.[mod.key] || mod.defaultLabor;
          const totalRaw = basePartCostArs + labor;
          const finalPrice = Math.max(screenFloor, Math.round(totalRaw / 500) * 500);
          return {
            ...mod,
            labor,
            partCostArs: Math.round(basePartCostArs),
            finalPrice
          };
        });

        // Selección activa: si la clave enviada existe en las modalidades del modelo, usarla; si no, la primera válida
        const selectedKey = extraOptions.iphoneOptionKey;
        const activeMod = modalities.find(m => m.key === selectedKey) || modalities[0];

        const modTime = getRepairTimeInfo('iphone', 'screen', activeMod.key);
        return {
          minPrice: activeMod.finalPrice,
          maxPrice: activeMod.finalPrice,
          duration: modTime.label,
          timeCondition: modTime.condition,
          timeFullText: modTime.fullText,
          repairTime: modTime,
          warranty: '30 días de garantía escrita',
          issueName: 'Módulo / Pantalla Completa',
          issueBadge: activeMod.badge,
          qualityLabel: activeMod.name,
          iosNotice: activeMod.iosNotice,
          isIphoneSpecialized: true,
          modalities,
          selectedModality: activeMod,
          modelName: targetModelName,
          brand: 'Apple',
          isDirectMatch: true,
          dolarRate,
          dolarInfo
        };
      }

      // 2. BATERÍA IPHONE:
      // - iPhone 6 al 8 Plus / X: Opción estándar de Cambio de Batería (Calidad Original) con 100% automático.
      // - iPhone XS, XR, SE 2020 en adelante: Opción 1 Premium (económica) vs Opción 2 Traspaso de Flex & Reprogramación 100%.
      if (issueId === 'battery') {
        const guildBatteryUsd = modelCfg.guildBateriaUsd || getGuildBateriaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const baseBatteryCostArs = Math.round(guildBatteryUsd * dolarRate);
        const batteryFloor = getMinimumRepairPrice('iphone', 'battery');

        const availableModalities = genInfo.isBatteryWithoutBmsLock
          ? IPHONE_BATTERY_MODALITIES_PRE_XS
          : IPHONE_BATTERY_MODALITIES_POST_XS;

        const modalities = availableModalities.map(mod => {
          let labor = modelCfg.batteryLabor?.[mod.key];
          if (!labor) {
            if (mod.key === 'standard_unknown') labor = Math.round((marginUsd * 0.85 * dolarRate) / 500) * 500;
            else if (mod.key === 'bms_transplant') labor = Math.round((marginUsd * 1.15 * dolarRate) / 500) * 500;
            else labor = Math.round((marginUsd * 0.9 * dolarRate) / 500) * 500;
          }
          const tagOnBonus = mod.key === 'bms_transplant' ? 8000 : 0; // Insumo flex tag-on reprogramable
          const totalRaw = baseBatteryCostArs + labor + tagOnBonus;
          const finalPrice = Math.max(batteryFloor, Math.round(totalRaw / 500) * 500);
          return {
            ...mod,
            labor,
            partCostArs: Math.round(baseBatteryCostArs),
            finalPrice
          };
        });

        // Selección activa: para XS en adelante preseleccionar bms_transplant; para pre-XS la única modalidad
        const selectedKey = extraOptions.iphoneOptionKey;
        const activeMod = modalities.find(m => m.key === selectedKey) 
          || modalities.find(m => m.key === 'bms_transplant') 
          || modalities[0];

        const batteryTime = getRepairTimeInfo('iphone', 'battery', activeMod.key);
        return {
          minPrice: activeMod.finalPrice,
          maxPrice: activeMod.finalPrice,
          duration: batteryTime.label,
          timeCondition: batteryTime.condition,
          timeFullText: batteryTime.fullText,
          repairTime: batteryTime,
          warranty: '30 días de garantía escrita',
          issueName: 'Cambio de Batería Original / Premium',
          issueBadge: activeMod.badge,
          qualityLabel: activeMod.name,
          iosNotice: activeMod.iosNotice,
          isIphoneSpecialized: true,
          modalities,
          selectedModality: activeMod,
          modelName: targetModelName,
          brand: 'Apple',
          isDirectMatch: true,
          dolarRate,
          dolarInfo
        };
      }

      // 3. REPARACIÓN EN PLACA (Sonido, Señal, Mojado, En Corto, Face ID, etc.)
      if (issueId === 'motherboard') {
        const guildPlacaUsd = modelCfg.guildPlacaUsd || getGuildPlacaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const totalUsd = guildPlacaUsd + marginUsd;
        const placaFloor = getMinimumRepairPrice('iphone', 'motherboard');
        const finalPrice = Math.max(placaFloor, Math.round((totalUsd * dolarRate) / 1000) * 1000);

        const mbTime = getRepairTimeInfo('iphone', 'motherboard');
        return {
          minPrice: finalPrice,
          maxPrice: finalPrice,
          duration: mbTime.label,
          timeCondition: mbTime.condition,
          timeFullText: mbTime.fullText,
          repairTime: mbTime,
          warranty: '30 días escrita',
          issueName: issue.name,
          issueBadge: 'Garantía Escrita',
          qualityLabel: 'Diagnóstico y Reparación de Placa Madre (Solución a fallas complejas, encendido o reinicios)',
          modelName: targetModelName,
          brand: 'Apple',
          isDirectMatch: true,
          dolarRate,
          dolarInfo,
          notes: `Gremio: $${guildPlacaUsd} USD + Ganancia Montec: $${marginUsd} USD`
        };
      }

      // 4. CAMBIO DE TAPA TRASERA DE VIDRIO (Láser / Proceso Térmico)
      // iPhone 6 al 7 Plus son chasis de aluminio, no tienen vidrio trasero
      if (issueId === 'back-glass') {
        if (!genInfo.hasBackGlass) {
          return null;
        }

        const guildTapaUsd = modelCfg.guildTapaUsd || getGuildTapaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const totalUsd = guildTapaUsd + marginUsd;
        const tapaFloor = getMinimumRepairPrice('iphone', 'back-glass');
        const finalPrice = Math.max(tapaFloor, Math.round((totalUsd * dolarRate) / 1000) * 1000);

        const bgTime = getRepairTimeInfo('iphone', 'back-glass');
        return {
          minPrice: finalPrice,
          maxPrice: finalPrice,
          duration: bgTime.label,
          timeCondition: bgTime.condition,
          timeFullText: bgTime.fullText,
          repairTime: bgTime,
          warranty: '30 días escrita',
          issueName: 'Cambio de Tapa Trasera de Vidrio (Láser / Proceso Térmico)',
          issueBadge: 'Láser & Precisión',
          qualityLabel: 'Vidrio Trasero de Alta Resistencia y Acabado Original (Compatible con Carga Inalámbrica / MagSafe)',
          modelName: targetModelName,
          brand: 'Apple',
          isDirectMatch: true,
          dolarRate,
          dolarInfo,
          notes: `Gremio: $${guildTapaUsd} USD + Ganancia Montec: $${marginUsd} USD`
        };
      }
    }

    // B. LÓGICA PARA ANDROID & NOTEBOOKS (MÓDULOS CON REGLAS DINÁMICAS)
    if (issueId === 'screen' && targetModelName) {
      const moduleEstimate = calculateModuleEstimate(targetModelName, targetBrand, dolarRate, pricingRules);
      if (moduleEstimate && moduleEstimate.success) {
        const screenTime = getRepairTimeInfo(deviceType, 'screen');
        return {
          minPrice: moduleEstimate.minPrice,
          maxPrice: moduleEstimate.maxPrice,
          duration: screenTime.label,
          timeCondition: screenTime.condition,
          timeFullText: screenTime.fullText,
          repairTime: screenTime,
          warranty: '30 días escrita',
          issueName: issue.name,
          issueBadge: moduleEstimate.badge,
          qualityLabel: moduleEstimate.qualityLabel,
          options: moduleEstimate.options,
          optionsCount: moduleEstimate.optionsCount,
          bestOption: moduleEstimate.bestOption,
          modelName: targetModelName,
          brand: targetBrand || (moduleEstimate.bestOption ? moduleEstimate.bestOption.brand : 'Genérico'),
          isDirectMatch: true,
          dolarRate: dolarRate,
          dolarInfo: dolarInfo
        };
      }
    }

    // B.2 LÓGICA ESPECIALIZADA PARA ANDROID: BATERÍAS, PLACAS DE CARGA Y PARLANTES (Mano de obra fija $35.000)
    if (deviceType === 'android' && ['battery', 'charging-port', 'speaker'].includes(issueId) && targetModelName) {
      const partEstimate = calculateAndroidPartEstimate(issueId, targetModelName, targetBrand, dolarRate);
      if (partEstimate && partEstimate.success) {
        const partTime = getRepairTimeInfo('android', issueId);
        return {
          minPrice: partEstimate.minPrice,
          maxPrice: partEstimate.maxPrice,
          duration: partTime.label,
          timeCondition: partTime.condition,
          timeFullText: partTime.fullText,
          repairTime: partTime,
          warranty: '30 días escrita',
          issueName: issue.name,
          issueBadge: partEstimate.badge,
          qualityLabel: partEstimate.qualityLabel,
          partCostArs: partEstimate.partCostArs,
          laborArs: partEstimate.laborArs,
          notes: partEstimate.notes,
          bestOption: partEstimate.bestOption,
          modelName: targetModelName,
          brand: targetBrand || 'Genérico',
          isDirectMatch: partEstimate.isDirectMatch,
          dolarRate: dolarRate,
          dolarInfo: dolarInfo
        };
      }
    }

    // C. Fallback estándar para otras fallas
    const baseRange = issue.basePrices[deviceType] || issue.basePrices.android || { min: pricingRules.minLaborArs, max: pricingRules.minLaborArs + 20000 };
    let multiplier = 1.0;

    if (model) {
      const isRecent = model.year >= 2023;
      const isApple = model.brand === 'Apple';
      const isPro = (model.model || '').toLowerCase().includes('pro') || (model.model || '').toLowerCase().includes('ultra');

      if (isApple && isPro) multiplier = 1.35;
      else if (isApple) multiplier = 1.15;
      else if (isPro) multiplier = 1.25;
      else if (isRecent) multiplier = 1.1;
    }

    const fallbackQualityMap = {
      'screen': 'Calidad Premium (Excelente brillo, color y respuesta táctil)',
      'battery': 'Batería Nueva de Alta Capacidad y Rendimiento',
      'back-glass': 'Vidrio Trasero de Alta Resistencia y Acabado Original (Compatible con Carga Inalámbrica / MagSafe)',
      'charging-port': 'Repuesto Nuevo y Limpieza Profunda (Carga rápida y conexión estable)',
      'speaker': 'Reemplazo de Altavoz / Parlante (Audio limpio y volumen potente sin distorsión)',
      'motherboard': 'Diagnóstico y Reparación de Placa Madre (Solución a fallas complejas, encendido o reinicios)',
      'software': 'Restauración y Optimización de Sistema (Solución a lentitud y bloqueos)'
    };
    const resolvedQualityLabel = fallbackQualityMap[issueId] || 'Repuesto Seleccionado Calidad Premium';

    const floorMin = getMinimumRepairPrice(deviceType, issueId);
    const min = Math.max(floorMin, Math.round((baseRange.min * multiplier) / 500) * 500);
    const max = Math.max(min, Math.round((baseRange.max * multiplier) / 500) * 500);

    const fallbackTime = getRepairTimeInfo(deviceType, issueId, extraOptions?.iphoneOptionKey);

    return {
      minPrice: min,
      maxPrice: max,
      duration: fallbackTime.label,
      timeCondition: fallbackTime.condition,
      timeFullText: fallbackTime.fullText,
      repairTime: fallbackTime,
      warranty: '30 días escrita',
      issueName: issue.name,
      issueBadge: 'Instalación Incluida',
      qualityLabel: resolvedQualityLabel,
      modelName: targetModelName || (model ? model.model : 'Modelo Personalizado'),
      brand: targetBrand || (model ? model.brand : 'Genérico'),
      isDirectMatch: false,
      dolarRate: dolarRate,
      dolarInfo: dolarInfo
    };
  };

  const triggerManualBackup = async () => {
    try {
      // 1. Respaldar en PostgreSQL todas las configuraciones actuales
      await Promise.allSettled([
        api.saveSetting('models', models),
        api.saveSetting('issues', issues),
        api.saveSetting('pricing_rules', pricingRules),
        api.saveSetting('iphone_configs', iphoneConfigs)
      ]);

      // 2. Obtener el snapshot completo desde PostgreSQL
      const backup = await api.getFullBackup();
      if (backup) {
        // Descargar copia física JSON al dispositivo
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `montec_backup_cloud_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        return { success: true, message: 'Copia de seguridad en la nube y archivo JSON generados con éxito' };
      }
      return { success: true, message: 'Datos respaldados exitosamente en PostgreSQL' };
    } catch (e) {
      console.error('Error generando backup:', e);
      return { success: false, error: e.message };
    }
  };

  return (
    <DataContext.Provider value={{
      models,
      issues,
      accessories,
      inventory,
      products: inventory,
      addProduct,
      updateProduct,
      updateProductStock,
      deleteProduct,
      sales,
      recordSale,
      recordUnifiedDelivery,
      deleteSale,
      dolarRate,
      dolarInfo,
      refreshDolarRate: updateDolar,
      pricingRules,
      updatePricingRules,
      resetPricingRules,
      iphoneConfigs,
      updateIphoneConfig,
      resetIphoneConfigs,
      isAdminAuthenticated,
      isAdminOpen,
      setIsAdminOpen,
      isQuoteModalOpen,
      setIsQuoteModalOpen,
      loginAdmin,
      logoutAdmin,
      addModel,
      updateModel,
      deleteModel,
      updateIssuePrices,
      updateIssueMeta,
      addAccessory,
      updateAccessory,
      deleteAccessory,
      resetToDefaults,
      calculateCurrentEstimate,
      orders,
      isEmployeeAuthenticated,
      isTallerOpen,
      setIsTallerOpen,
      loginEmployee,
      logoutEmployee,
      createRepairOrder,
      updateRepairOrder,
      updateRepairOrderStatus,
      addOrderInternalNote,
      recordOrderPayment,
      deleteRepairOrder,
      searchClients,
      serverStatus,
      serverHealth,
      refreshConnection: syncWithServer,
      triggerManualBackup,
      api,
      panelTheme,
      togglePanelTheme,
      setPanelTheme
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe utilizarse dentro de un DataProvider');
  }
  return context;
}
