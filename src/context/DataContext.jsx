import React, { createContext, useContext, useState, useEffect } from 'react';
import { MODELS_DATABASE, ISSUE_TYPES } from '../data/repairData';
import { ACCESSORIES_DATABASE } from '../data/accessoriesData';
import { fetchDolarBlueRate, DEFAULT_FALLBACK_RATE } from '../services/dolarService';
import { calculateModuleEstimate, PRICING_RULES } from '../services/partsPricingEngine';
import { 
  IPHONE_SCREEN_MODALITIES, 
  IPHONE_BATTERY_MODALITIES, 
  buildDefaultIphoneConfigs,
  getMontecIphoneMarginUsd,
  getGuildPlacaCost,
  getGuildBateriaCost,
  getGuildTapaCost
} from '../data/iphonePricingData';

const DataContext = createContext(null);

const STORAGE_KEYS = {
  MODELS: 'montec_models_v6', // v6: catálogo completo con 1.090 modelos de 4 proveedores oficiales
  ISSUES: 'montec_issues_v2', // v2: incluye Reparación en Placa detallada y Cambio de Tapa Trasera
  ACCESSORIES: 'montec_accessories_v2', // v2 para actualizar datos de fotos
  PRICING_RULES: 'montec_pricing_rules_v1', // Reglas de márgenes y mano de obra Android
  IPHONE_CONFIGS: 'montec_iphone_configs_v2', // v2: Precios oficiales del gremio (iLab) y márgenes $30 a $100 USD
  AUTH: 'montec_admin_auth'
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
      // Limpiar versiones obsoletas para forzar actualización con el catálogo completo
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
      const saved = localStorage.getItem(STORAGE_KEYS.ISSUES);
      return saved ? JSON.parse(saved) : ISSUE_TYPES;
    } catch {
      return ISSUE_TYPES;
    }
  });

  // 3. Catálogo de accesorios (con imágenes)
  const [accessories, setAccessories] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCESSORIES);
      if (saved) {
        return JSON.parse(saved);
      }
      // Fallback a versión 1 si existía, enriqueciendo con fotos
      const savedV1 = localStorage.getItem('montec_accessories_v1');
      if (savedV1) {
        const parsed = JSON.parse(savedV1);
        return parsed.map((acc, idx) => ({
          ...acc,
          image: acc.image || ACCESSORIES_DATABASE[idx]?.image || ''
        }));
      }
      return ACCESSORIES_DATABASE;
    } catch {
      return ACCESSORIES_DATABASE;
    }
  });

  // 4. Estado de autenticación del administrador
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  });

  // 5. Estado de apertura del modal de admin
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // 5.1 Estado de apertura del modal de cotizador interactivo
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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
      localStorage.setItem(STORAGE_KEYS.PRICING_RULES, JSON.stringify(updated));
      return updated;
    });
  };

  const resetPricingRules = () => {
    setPricingRules(DEFAULT_PRICING_RULES);
    localStorage.setItem(STORAGE_KEYS.PRICING_RULES, JSON.stringify(DEFAULT_PRICING_RULES));
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
      localStorage.setItem(STORAGE_KEYS.IPHONE_CONFIGS, JSON.stringify(updated));
      return updated;
    });
  };

  const resetIphoneConfigs = () => {
    const defaults = buildDefaultIphoneConfigs();
    setIphoneConfigs(defaults);
    localStorage.setItem(STORAGE_KEYS.IPHONE_CONFIGS, JSON.stringify(defaults));
  };

  // Autenticación por PIN
  const loginAdmin = (pin) => {
    if (pin === 'montec2026' || pin === '2026' || pin === 'admin') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  // --- Operaciones de Modelos ---
  const addModel = (newModel) => {
    const modelWithId = {
      ...newModel,
      id: newModel.id || `custom-${Date.now()}`,
      year: parseInt(newModel.year, 10) || new Date().getFullYear()
    };
    setModels(prev => [modelWithId, ...prev]);
    return modelWithId;
  };

  const updateModel = (id, updatedFields) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
  };

  const deleteModel = (id) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  // --- Operaciones de Fallas y Precios ---
  const updateIssuePrices = (issueId, deviceType, minPrice, maxPrice) => {
    setIssues(prev => prev.map(issue => {
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
    }));
  };

  const updateIssueMeta = (issueId, fields) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id !== issueId) return issue;
      return { ...issue, ...fields };
    }));
  };

  // --- Operaciones de Accesorios ---
  const addAccessory = (item) => {
    const itemWithId = {
      ...item,
      id: item.id || `acc-${Date.now()}`,
      price: parseInt(item.price, 10) || 0,
      image: item.image || '',
      features: Array.isArray(item.features) ? item.features : (item.features ? item.features.split('\n').filter(Boolean) : [])
    };
    setAccessories(prev => [itemWithId, ...prev]);
    return itemWithId;
  };

  const updateAccessory = (id, updatedFields) => {
    setAccessories(prev => prev.map(acc => {
      if (acc.id !== id) return acc;
      return {
        ...acc,
        ...updatedFields,
        price: updatedFields.price !== undefined ? parseInt(updatedFields.price, 10) : acc.price,
        image: updatedFields.image !== undefined ? updatedFields.image : acc.image,
        features: Array.isArray(updatedFields.features) 
          ? updatedFields.features 
          : (updatedFields.features ? updatedFields.features.split('\n').filter(Boolean) : acc.features)
      };
    }));
  };

  const deleteAccessory = (id) => {
    setAccessories(prev => prev.filter(acc => acc.id !== id));
  };

  // --- Restaurar valores de fábrica ---
  const resetToDefaults = () => {
    setModels(MODELS_DATABASE);
    setIssues(ISSUE_TYPES);
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
      const modelCfg = iphoneConfigs[model.id] || (buildDefaultIphoneConfigs()[model.id]) || {
        screenLabor: { compatible_unknown: 30000, ic_transplant: 55000, original_used: 42000 },
        batteryLabor: { standard_unknown: 25000, bms_transplant: 48000, original_used: 32000 }
      };

      // 1. Módulo / Pantalla iPhone (Compatible con aviso vs Trasplante IC vs Original)
      if (issueId === 'screen') {
        const moduleEstimate = calculateModuleEstimate(targetModelName, 'Apple', dolarRate, pricingRules);
        const basePartCostArs = moduleEstimate && moduleEstimate.bestOption 
          ? moduleEstimate.bestOption.cost_ars 
          : Math.round(35 * dolarRate);

        const modalities = IPHONE_SCREEN_MODALITIES.map(mod => {
          const labor = modelCfg.screenLabor?.[mod.key] || mod.defaultLabor;
          const partMultiplier = mod.key === 'original_used' ? 1.35 : 1.0;
          const totalRaw = (basePartCostArs * partMultiplier) + labor;
          const finalPrice = Math.round(totalRaw / 500) * 500;
          return {
            ...mod,
            labor,
            partCostArs: Math.round(basePartCostArs * partMultiplier),
            finalPrice
          };
        });

        const selectedKey = extraOptions.iphoneOptionKey || 'compatible_unknown';
        const activeMod = modalities.find(m => m.key === selectedKey) || modalities[0];

        return {
          minPrice: activeMod.finalPrice,
          maxPrice: activeMod.finalPrice,
          duration: activeMod.key === 'ic_transplant' ? '90 a 120 min (Microelectrónica)' : '45 a 60 min (Express)',
          warranty: '30 días escrita',
          issueName: issue.name,
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

      // 2. Batería iPhone (Costos del gremio + Ganancia gradual Montec $30 a $100 USD)
      if (issueId === 'battery') {
        const guildBatteryUsd = modelCfg.guildBateriaUsd || getGuildBateriaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const baseBatteryCostArs = Math.round(guildBatteryUsd * dolarRate);

        const modalities = IPHONE_BATTERY_MODALITIES.map(mod => {
          let labor = modelCfg.batteryLabor?.[mod.key];
          if (!labor) {
            if (mod.key === 'standard_unknown') labor = Math.round((marginUsd * 0.85 * dolarRate) / 500) * 500;
            else if (mod.key === 'bms_transplant') labor = Math.round((marginUsd * 1.1 * dolarRate) / 500) * 500;
            else labor = Math.round((marginUsd * 0.95 * dolarRate) / 500) * 500;
          }
          const tagOnBonus = mod.key === 'bms_transplant' ? 8000 : 0; // Insumo flex tag-on reprogramable
          const partMultiplier = mod.key === 'original_used' ? 1.2 : 1.0;
          const totalRaw = (baseBatteryCostArs * partMultiplier) + labor + tagOnBonus;
          const finalPrice = Math.round(totalRaw / 500) * 500;
          return {
            ...mod,
            labor,
            partCostArs: Math.round(baseBatteryCostArs * partMultiplier),
            finalPrice
          };
        });

        const selectedKey = extraOptions.iphoneOptionKey || 'bms_transplant';
        const activeMod = modalities.find(m => m.key === selectedKey) || modalities[1] || modalities[0];

        return {
          minPrice: activeMod.finalPrice,
          maxPrice: activeMod.finalPrice,
          duration: activeMod.key === 'bms_transplant' ? '60 a 90 min (Trasplante BMS + Programación)' : '30 a 45 min (Express)',
          warranty: '30 días escrita',
          issueName: issue.name,
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

      // 3. Reparación en Placa (Sonido, Señal, Mojado, En Corto, Face ID, etc.)
      if (issueId === 'motherboard') {
        const guildPlacaUsd = modelCfg.guildPlacaUsd || getGuildPlacaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const totalUsd = guildPlacaUsd + marginUsd;
        const finalPrice = Math.round((totalUsd * dolarRate) / 1000) * 1000;

        return {
          minPrice: finalPrice,
          maxPrice: finalPrice,
          duration: '24 a 48 hs (Laboratorio Especializado)',
          warranty: '30 días escrita',
          issueName: issue.name,
          issueBadge: 'Microelectrónica Gremio',
          qualityLabel: 'Diagnóstico y reparación de microcomponentes (Audio IC, Baseband, Cortos, Face ID)',
          modelName: targetModelName,
          brand: 'Apple',
          isDirectMatch: true,
          dolarRate,
          dolarInfo,
          notes: `Gremio: $${guildPlacaUsd} USD + Ganancia Montec: $${marginUsd} USD`
        };
      }

      // 4. Cambio de Tapa Trasera (Glass Trasero con Láser)
      if (issueId === 'back-glass') {
        const guildTapaUsd = modelCfg.guildTapaUsd || getGuildTapaCost(targetModelName);
        const marginUsd = modelCfg.montecMarginUsd || getMontecIphoneMarginUsd(targetModelName);
        const totalUsd = guildTapaUsd + marginUsd;
        const finalPrice = Math.round((totalUsd * dolarRate) / 1000) * 1000;

        return {
          minPrice: finalPrice,
          maxPrice: finalPrice,
          duration: 'En el día (3 a 5 hs)',
          warranty: '30 días escrita',
          issueName: issue.name,
          issueBadge: 'Láser & Precisión',
          qualityLabel: 'Vidrio Trasero de Alta Resistencia (MagSafe Compatible)',
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
        return {
          minPrice: moduleEstimate.minPrice,
          maxPrice: moduleEstimate.maxPrice,
          duration: moduleEstimate.duration,
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

    const min = Math.round((baseRange.min * multiplier) / 500) * 500;
    const max = Math.round((baseRange.max * multiplier) / 500) * 500;

    return {
      minPrice: min,
      maxPrice: max,
      duration: issue.duration,
      warranty: '30 días escrita',
      issueName: issue.name,
      issueBadge: issue.badge,
      modelName: targetModelName || (model ? model.model : 'Modelo Personalizado'),
      brand: targetBrand || (model ? model.brand : 'Genérico'),
      isDirectMatch: false,
      dolarRate: dolarRate,
      dolarInfo: dolarInfo
    };
  };

  return (
    <DataContext.Provider value={{
      models,
      issues,
      accessories,
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
      calculateCurrentEstimate
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
