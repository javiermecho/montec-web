import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  RotateCcw, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Wrench, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  ExternalLink,
  Laptop,
  Cpu,
  Droplets,
  BatteryCharging,
  Maximize2,
  Bot,
  Zap,
  Calculator
} from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { useData } from '../context/DataContext';
import { getMinimumRepairPrice } from '../data/repairData';

const WHATSAPP_PHONE = '5492235000000';

// Sugerencias de modelos populares para agilizar la interacción
const POPULAR_MODELS = {
  'iPhone / iPad': ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone XR', 'iPhone SE'],
  'Samsung': ['Galaxy A54', 'Galaxy A34', 'Galaxy A14', 'Galaxy S23', 'Galaxy A04s', 'Galaxy A23'],
  'Motorola': ['Moto G22', 'Moto G23', 'Moto G54', 'Moto G42', 'Moto Edge 30', 'Moto E22'],
  'Xiaomi': ['Redmi Note 11', 'Redmi Note 12', 'Redmi Note 13', 'Poco X5 Pro', 'Redmi 10C'],
  'Notebook / PC': ['Lenovo ThinkPad', 'Dell Inspiron', 'HP Pavilion', 'MacBook Air', 'PC de Escritorio']
};

export default function DiagnosticChatbot() {
  const { models, issues, calculateCurrentEstimate } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  
  // Estado del flujo de diagnóstico
  const [step, setStep] = useState('welcome'); // 'welcome', 'brand', 'model_input', 'issue_category', 'triage_question', 'sub_triage', 'result'
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [modelInput, setModelInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [subAnswer, setSubAnswer] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // Historial de mensajes en el chat
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'bot',
      text: '¡Hola! 👋 Soy el Asistente Técnico Virtual de **montec**.',
      time: 'Ahora'
    },
    {
      id: 'msg-2',
      sender: 'bot',
      text: 'Estoy programado para ayudarte a diagnosticar la falla de tu equipo y cotizar la reparación al instante con nuestro presupuestador de laboratorio. ¿Qué te gustaría consultar?',
      time: 'Ahora'
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnreadNotification(false);
    }
  }, [messages, isOpen, step]);

  // Agregar mensaje del bot con pequeño delay para sensación humana
  const addBotMessage = (text, delay = 200) => {
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: 'bot-' + Date.now() + '-' + Math.random(),
          sender: 'bot',
          text,
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [
      ...prev,
      {
        id: 'user-' + Date.now() + '-' + Math.random(),
        sender: 'user',
        text,
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Reiniciar consulta
  const handleReset = () => {
    setSelectedBrand(null);
    setModelInput('');
    setSelectedCategory(null);
    setSelectedSymptom(null);
    setSubAnswer(null);
    setDiagnosticResult(null);
    setStep('welcome');
    setMessages([
      {
        id: 'msg-reset-1',
        sender: 'bot',
        text: 'Consulta reiniciada 🔄. ¿Cómo puedo ayudarte hoy con tu equipo?',
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Mapear marca a tipo de dispositivo del cotizador
  const getDeviceType = (brand) => {
    if (brand === 'iPhone / iPad') return 'iphone';
    if (brand === 'Notebook / PC') return 'notebook';
    return 'android';
  };

  // Mapear síntoma del bot a ID de falla del presupuestador
  const mapCategoryToIssueId = (category, symptomId, isScreenBlackVibrate) => {
    if (category?.id === 'screen') {
      if (symptomId === 'screen_black' && isScreenBlackVibrate === false) {
        return 'motherboard'; // Daño en circuito de encendido o placa
      }
      return 'screen';
    }
    if (category?.id === 'charging') {
      if (symptomId === 'charge_fake') return 'battery';
      return 'charging-port';
    }
    if (category?.id === 'power' || category?.id === 'wet') {
      return 'motherboard';
    }
    if (category?.id === 'pc') {
      if (symptomId === 'pc_thermal') return 'thermal-maintenance';
      return 'upgrade-storage';
    }
    return 'screen';
  };

  // Buscar coincidencia inteligente con el catálogo de modelos
  const findMatchingModel = (brand, input) => {
    if (!models || !Array.isArray(models) || !input || !input.trim()) return null;
    const cleanInput = input.toLowerCase().trim();

    const pool = models.filter(m => {
      if (brand === 'iPhone / iPad') return m.brand === 'Apple' || m.type === 'iphone';
      if (brand === 'Samsung') return m.brand?.toLowerCase() === 'samsung';
      if (brand === 'Motorola') return m.brand?.toLowerCase() === 'motorola';
      if (brand === 'Xiaomi') return m.brand?.toLowerCase() === 'xiaomi';
      if (brand === 'Notebook / PC') return m.type === 'notebook';
      return true;
    });

    let found = pool.find(m => m.model.toLowerCase() === cleanInput);
    if (found) return found;

    found = pool.find(m => cleanInput.includes(m.model.toLowerCase()) || m.model.toLowerCase().includes(cleanInput));
    if (found) return found;

    const normInput = cleanInput.replace(/[^a-z0-9]/g, '');
    found = pool.find(m => {
      const norm = m.model.toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm === normInput || normInput.includes(norm) || norm.includes(normInput);
    });
    if (found) return found;

    return models.find(m => cleanInput.includes(m.model.toLowerCase()));
  };

  // Atajos rápidos
  const handleQuickChip = (action) => {
    trackEvent('chatbot_quick_chip', { action });

    if (action === 'location') {
      addUserMessage('📍 Horarios y Ubicación');
      addBotMessage(
        '📍 **Horarios y Ubicación:**\n\n' +
        '• **Dirección:** Montes Carballo 943 (a metros de ex Sobremonte), Mar del Plata.\n' +
        '• **Horarios:** Lunes a Sábado de 9:30 a 19:30 hs.\n' +
        '• **Comodidad:** Estacionamiento libre en la puerta.'
      );
    } else if (action === 'trust') {
      addUserMessage('🛡️ Garantía y Confianza');
      addBotMessage(
        '🛡️ **Garantía y Confianza Montec:**\n\n' +
        '• **12 años de trayectoria** en Mar del Plata con laboratorio de microelectrónica especializado.\n' +
        '• **Diagnósticos sin cargo** y presupuestos transparentes.\n' +
        '• **Garantía escrita de 30 días** en todas nuestras reparaciones.'
      );
    } else if (action === 'start_diagnostic') {
      addUserMessage('⚡ Cotizar Reparación');
      setStep('brand');
      addBotMessage('¡Excelente! Vamos a realizar el diagnóstico y cotización paso a paso de tu equipo.\n\n¿De qué tipo y marca es tu dispositivo?');
    }
  };

  // Selección de Marca
  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    addUserMessage(`Marca: ${brand}`);
    setStep('model_input');
    addBotMessage(`Excelente, ${brand}. ¿Qué modelo específico es? Podés escribirlo o elegir uno de los modelos frecuentes:`);
  };

  // Confirmar Modelo
  const handleConfirmModel = (chosenModel) => {
    const finalModel = (typeof chosenModel === 'string' ? chosenModel : modelInput).trim() || `${selectedBrand} (Modelo estándar)`;
    setModelInput(finalModel);
    addUserMessage(`Modelo: ${finalModel}`);
    setStep('issue_category');
    addBotMessage('¡Anotado! Ahora seleccioná la falla o síntoma principal que presenta el equipo:');
  };

  // Selección de Categoría de Falla
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    addUserMessage(`Falla: ${cat.label}`);
    setStep('triage_question');

    if (cat.id === 'screen') {
      addBotMessage('🔬 **Triage de Pantalla / Imagen:**\n¿Qué síntoma exacto presenta el visor o display?');
    } else if (cat.id === 'charging') {
      addBotMessage('🔋 **Triage de Carga / Batería:**\n¿Qué ocurre exactamente cuando le conectás el cargador?');
    } else if (cat.id === 'power') {
      addBotMessage('⚡ **Triage de Encendido / Placa:**\n¿En qué circunstancias dejó de encender el equipo?');
    } else if (cat.id === 'wet') {
      addBotMessage('💧 **Protocolo de Emergencia - Equipo Mojado:**\n¿Se intentó encender o enchufar después del contacto con el líquido?');
    } else if (cat.id === 'pc') {
      addBotMessage('💻 **Triage de Computadoras / Notebooks:**\n¿Qué problema de rendimiento o hardware experimentás?');
    }
  };

  // Selección de Síntoma Específico
  const handleSelectSymptom = (symptom) => {
    setSelectedSymptom(symptom);
    addUserMessage(symptom.text);

    // Caso especial: pantalla negra total requiere sub-pregunta
    if (symptom.id === 'screen_black') {
      setStep('sub_triage');
      addBotMessage('Pregunta clave de diagnóstico: Al enchufar el cargador o presionar el botón de encendido, ¿el celular vibra, emite sonido o prende alguna luz testigo?');
      return;
    }

    // Resolver diagnóstico y presupuesto con el cotizador
    generateFinalDiagnostic(symptom.diagnostic, symptom.timeEstimate, symptom.possibleCauses, symptom.id);
  };

  // Sub-pregunta para pantalla negra
  const handleSubTriageAnswer = (vibrates) => {
    setSubAnswer(vibrates ? 'vibra' : 'no_vibra');
    addUserMessage(vibrates ? 'Sí, vibra o suena' : 'No hace nada, no responde');

    if (vibrates) {
      generateFinalDiagnostic(
        'Excelente: placa madre viva. 95% probabilidades de cambio de Módulo/Display.',
        selectedBrand === 'iPhone / iPad' ? '24 horas hábiles (o en el día antes de las 12 hs)' : 'De 2 a 3 horas',
        ['Panel OLED/LCD interno quebrado o fundido sin imagen', 'Flex de pantalla averiado tras golpe'],
        'screen_black',
        true
      );
    } else {
      generateFinalDiagnostic(
        'Puede haber daño en circuito de encendido o placa. Requiere revisión de microelectrónica sin cargo.',
        '24 a 48 horas hábiles',
        ['Módulo en corto', 'Circuito de carga o PMIC dañado', 'Batería en descarga profunda irreversible'],
        'screen_black',
        false
      );
    }
  };

  // Generar Tarjeta Final de Diagnóstico y Presupuesto
  const generateFinalDiagnostic = (diagnosticText, timeEstimate, possibleCauses = [], symptomId = null, vibrates = null) => {
    const devType = getDeviceType(selectedBrand);
    const symId = symptomId || selectedSymptom?.id;
    const issueId = mapCategoryToIssueId(selectedCategory, symId, vibrates);
    const matchedModel = findMatchingModel(selectedBrand, modelInput);

    const activeModelId = matchedModel ? matchedModel.id : null;
    const targetModelName = matchedModel ? matchedModel.model : modelInput;

    // Calcular el precio real con el presupuestador
    let calculatedEstimate = null;
    if (typeof calculateCurrentEstimate === 'function') {
      try {
        calculatedEstimate = calculateCurrentEstimate(
          devType,
          activeModelId,
          issueId,
          targetModelName,
          { iphoneOptionKey: 'compatible_unknown' }
        );
      } catch (err) {
        console.error('Error calculando presupuesto en chatbot:', err);
      }
    }

    let priceFormatted = '';
    let qualityLabel = '';
    let finalTimeEstimate = timeEstimate;
    let finalWarranty = '30 días de garantía escrita';

    if (calculatedEstimate) {
      if (calculatedEstimate.minPrice && calculatedEstimate.maxPrice) {
        priceFormatted = calculatedEstimate.minPrice === calculatedEstimate.maxPrice
          ? `$${calculatedEstimate.minPrice.toLocaleString('es-AR')}`
          : `$${calculatedEstimate.minPrice.toLocaleString('es-AR')} a $${calculatedEstimate.maxPrice.toLocaleString('es-AR')}`;
      } else if (calculatedEstimate.minPrice) {
        priceFormatted = `$${calculatedEstimate.minPrice.toLocaleString('es-AR')}`;
      }

      if (calculatedEstimate.qualityLabel) {
        qualityLabel = calculatedEstimate.qualityLabel;
      }
      if (calculatedEstimate.duration) {
        finalTimeEstimate = calculatedEstimate.duration;
      }
      if (calculatedEstimate.warranty) {
        finalWarranty = calculatedEstimate.warranty;
      }
    }

    if (!priceFormatted) {
      const minFloor = getMinimumRepairPrice(devType, issueId) || 35000;
      priceFormatted = `Desde $${minFloor.toLocaleString('es-AR')}`;
    }

    const resultObj = {
      device: `${selectedBrand} ${targetModelName || modelInput}`,
      category: selectedCategory?.label,
      symptom: selectedSymptom?.text,
      diagnostic: diagnosticText,
      causes: possibleCauses,
      timeEstimate: finalTimeEstimate || (selectedBrand === 'iPhone / iPad' ? '24 horas hábiles' : 'De 2 a 3 horas'),
      warranty: finalWarranty,
      priceFormatted: priceFormatted,
      qualityLabel: qualityLabel,
      issueName: calculatedEstimate?.issueName || selectedCategory?.label,
      address: 'Montes Carballo 943, Mar del Plata'
    };

    setDiagnosticResult(resultObj);
    setStep('result');

    trackEvent('chatbot_diagnostic_completed', {
      device: resultObj.device,
      category: resultObj.category,
      diagnostic: diagnosticText,
      price: priceFormatted
    });

    addBotMessage(
      `✅ **¡Diagnóstico técnico completado!**\n\n` +
      `💰 **Presupuesto Estimado:** **${priceFormatted}**\n` +
      `*(Incluye repuesto + mano de obra e instalación con ${finalWarranty})*.\n\n` +
      `A continuación tenés el ticket de reparación para enviarlo al taller por WhatsApp y coordinar tu turno:`
    );
  };

  // Link de WhatsApp con el ticket pre-redactado
  const generateWhatsAppLink = () => {
    if (!diagnosticResult) return `https://wa.me/${WHATSAPP_PHONE}`;

    const text = 
      `¡Hola Montec! Estuve utilizando el Asistente Técnico Virtual de la web y obtuve el siguiente diagnóstico y presupuesto:%0A%0A` +
      `📱 *Equipo:* ${diagnosticResult.device}%0A` +
      `🛠️ *Falla reportada:* ${diagnosticResult.category} - ${diagnosticResult.symptom || 'Falla técnica'}%0A` +
      `🔍 *Diagnóstico preliminar:* ${diagnosticResult.diagnostic}%0A` +
      `💰 *Presupuesto estimado web:* ${diagnosticResult.priceFormatted}%0A` +
      `⏱️ *Tiempo estimado:* ${diagnosticResult.timeEstimate}%0A` +
      `🛡️ *Garantía:* ${diagnosticResult.warranty}%0A%0A` +
      `¿Podría consultar disponibilidad de repuesto o coordinar para acercarlo al local de Montes Carballo 943?`;

    return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
  };

  return (
    <>
      {/* 1. Burbuja Flotante en la esquina inferior derecha */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
        
        {/* Tooltip de Bienvenida (visible cuando está cerrado y hay notificación) */}
        {!isOpen && hasUnreadNotification && (
          <div 
            onClick={() => setIsOpen(true)}
            className="mb-3 mr-1 bg-[#18181B] border border-[#FF5500]/50 text-white text-xs px-3.5 py-2.5 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center gap-2.5 cursor-pointer max-w-[280px] animate-bounce-subtle group hover:border-[#FF5500]"
          >
            <div className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping shrink-0" />
            <span className="font-medium text-[11px] leading-tight text-zinc-200">
              ¿Tu equipo tiene una falla? <strong className="text-[#FF5500]">Diagnóstico Técnico Express</strong> en el acto.
            </span>
            <X 
              className="w-3.5 h-3.5 text-zinc-500 hover:text-white shrink-0 ml-1" 
              onClick={(e) => {
                e.stopPropagation();
                setHasUnreadNotification(false);
              }}
            />
          </div>
        )}

        {/* Botón Principal Flotante */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir asistente técnico de diagnóstico"
          className={`relative p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border ${
            isOpen 
              ? 'bg-zinc-900 border-zinc-700 text-white' 
              : 'bg-gradient-to-tr from-[#E64D00] to-[#FF5500] border-[#FF7700]/60 text-white shadow-[0_0_30px_rgba(255,85,0,0.5)]'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              {/* Badge Pulsante Online */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-black"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* 2. Modal Flotante de Chat */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#121214] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden backdrop-blur-2xl animate-fade-in">
          
          {/* Header del Chat */}
          <div className="bg-gradient-to-r from-zinc-900 via-[#18181B] to-zinc-900 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5500] to-orange-400 flex items-center justify-center text-white font-black text-sm shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-white leading-tight">
                    montec • Asistente Técnico
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Protocolo UCIP • Laboratorio Mar del Plata
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reiniciar consulta"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo de Mensajes (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#FF5500] to-[#E64D00] text-white rounded-tr-none shadow-md'
                      : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">
                    {m.text}
                  </p>
                </div>
                <span className="text-[9px] text-zinc-600 mt-1 px-1 font-mono">
                  {m.time}
                </span>
              </div>
            ))}

            {/* Renderizado Condicional según el Paso del Árbol de Decisión */}

            {/* PASO 1: ATAJOS RÁPIDOS INICIALES */}
            {step === 'welcome' && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                  Opciones Rápidas:
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleQuickChip('start_diagnostic')}
                    className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-[#FF5500]/15 to-transparent border border-[#FF5500]/40 text-xs font-semibold text-white hover:bg-[#FF5500]/25 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#FF5500]" />
                      <span>Diagnosticar falla de mi celular o PC</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleQuickChip('location')}
                    className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <span>Horarios y Dirección (Montes Carballo 943)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  <button
                    onClick={() => handleQuickChip('trust')}
                    className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Garantías y Diagnósticos sin cargo</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO A: SELECCIÓN DE MARCA */}
            {step === 'brand' && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                  Elegí la marca de tu equipo:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['iPhone / iPad', 'Samsung', 'Motorola', 'Xiaomi', 'Notebook / PC', 'Otra marca'].map((b) => (
                    <button
                      key={b}
                      onClick={() => handleSelectBrand(b)}
                      className="p-2 rounded-xl bg-zinc-900/80 hover:bg-[#FF5500]/20 border border-zinc-800 hover:border-[#FF5500]/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all text-left flex items-center justify-between"
                    >
                      <span>{b}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PASO A.2: INGRESO DE MODELO */}
            {step === 'model_input' && (
              <div className="pt-2 space-y-2.5">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirmModel();
                  }} 
                  className="space-y-2"
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                    Escribí tu modelo o elegí uno sugerido:
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      placeholder="ej: iPhone 13, Moto G22, S23..."
                      className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#FF5500]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#FF5500] hover:bg-[#FF6600] text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <span>OK</span>
                    </button>
                  </div>
                </form>

                {/* Modelos sugeridos rápidos para la marca seleccionada */}
                {selectedBrand && POPULAR_MODELS[selectedBrand] && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                      Modelos frecuentes de {selectedBrand}:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_MODELS[selectedBrand].map((popMod) => (
                        <button
                          key={popMod}
                          type="button"
                          onClick={() => handleConfirmModel(popMod)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/15 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer text-left"
                        >
                          {popMod}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO B: CATEGORÍA DE LA FALLA */}
            {step === 'issue_category' && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                  ¿Qué tipo de problema tiene?
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'screen', label: '📱 Pantalla / Imagen / Táctil', icon: Maximize2 },
                    { id: 'charging', label: '🔋 Problemas de Carga / Batería', icon: BatteryCharging },
                    { id: 'power', label: '⚡ No enciende / Placa en corto', icon: Cpu },
                    { id: 'wet', label: '💧 Equipo Mojado o Sulfatado', icon: Droplets },
                    { id: 'pc', label: '💻 Mantenimiento PC / Upgrade SSD', icon: Laptop }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat)}
                        className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-[#FF5500]/15 border border-zinc-800 hover:border-[#FF5500]/50 text-xs font-semibold text-zinc-200 hover:text-white transition-all text-left flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-[#FF5500]" />
                          <span>{cat.label}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASO C: TRIAGE TÉCNICO SEGÚN CATEGORÍA */}
            {step === 'triage_question' && selectedCategory && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                  Seleccioná el síntoma exacto:
                </div>
                <div className="flex flex-col gap-2">
                  
                  {/* PANTALLA */}
                  {selectedCategory.id === 'screen' && [
                    {
                      id: 'screen_glass',
                      text: 'Vidrio astillado (la imagen se ve y el táctil responde)',
                      diagnostic: 'Cambio de Módulo / Glass.',
                      timeEstimate: selectedBrand === 'iPhone / iPad' ? '24 horas hábiles (o en el día antes de las 12 hs)' : 'De 2 a 3 horas',
                      possibleCauses: ['Impacto exterior en el vidrio templado sin afectar el panel digital']
                    },
                    {
                      id: 'screen_lines',
                      text: 'Manchas negras, rayas de colores o pantalla violeta',
                      diagnostic: 'Módulo/Display roto (Daño interno).',
                      timeEstimate: selectedBrand === 'iPhone / iPad' ? '24 horas hábiles' : 'De 2 a 3 horas',
                      possibleCauses: ['Fractura interna del panel AMOLED/OLED/LCD por presión o golpe']
                    },
                    {
                      id: 'screen_black',
                      text: 'Pantalla negra total',
                      diagnostic: 'Pendiente de confirmación de placa...',
                      timeEstimate: 'De 2 a 3 horas',
                      possibleCauses: ['Display quemado o circuito de backlight / energía']
                    },
                    {
                      id: 'screen_touch',
                      text: 'La imagen se ve bien pero no responde al tacto',
                      diagnostic: 'Falla de táctil o línea en placa.',
                      timeEstimate: 'De 2 a 3 horas',
                      possibleCauses: ['Falla en capas del digitalizador', 'Línea de datos táctil en placa']
                    }
                  ].map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => handleSelectSymptom(sym)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-start justify-between gap-2"
                    >
                      <span>{sym.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                    </button>
                  ))}

                  {/* CARGA */}
                  {selectedCategory.id === 'charging' && [
                    {
                      id: 'charge_cable',
                      text: 'Tengo que mover o doblar el cable para que tome carga',
                      diagnostic: 'Pin de carga desoldado o pistas dañadas.',
                      timeEstimate: 'De 2 a 3 horas',
                      possibleCauses: ['Fatiga mecánica en conector tipo C / Lightning', 'Pistas de placa sub desoldadas']
                    },
                    {
                      id: 'charge_fake',
                      text: 'Muestra el rayito pero el porcentaje no sube (Carga falsa)',
                      diagnostic: 'Falla de circuito de carga / batería.',
                      timeEstimate: selectedBrand === 'iPhone / iPad' ? '24 horas hábiles' : 'De 2 a 3 horas',
                      possibleCauses: ['Batería agotada con resistencia interna alta', 'Circuito integrado de carga con fuga']
                    },
                    {
                      id: 'charge_dead',
                      text: 'No hace absolutamente nada',
                      diagnostic: 'Pin de carga, placa sub, flex interplaca o circuito integrado en placa main.',
                      timeEstimate: 'De 2 a 3 horas',
                      possibleCauses: ['Placa de carga en corto', 'Pin sulfatado', 'Batería totalmente descargada a 0V']
                    }
                  ].map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => handleSelectSymptom(sym)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-start justify-between gap-2"
                    >
                      <span>{sym.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                    </button>
                  ))}

                  {/* NO ENCIENDE / PLACA */}
                  {selectedCategory.id === 'power' && [
                    {
                      id: 'power_sudden',
                      text: 'Se apagó de repente mientras lo usaba o cargaba',
                      diagnostic: 'Cortocircuito en línea principal VDD_MAIN o falla del microchip de energía PMIC. Reparación en placa en laboratorio.',
                      timeEstimate: '24 a 48 horas hábiles',
                      possibleCauses: ['Pico de tensión por cargador no certificado', 'Capacitor en cortocircuito']
                    },
                    {
                      id: 'power_drop',
                      text: 'Se cayó o golpeó y no volvió a encender',
                      diagnostic: 'Desprendimiento de pistas BGA de la placa o flex de batería/pantalla desconectado.',
                      timeEstimate: '24 a 48 horas hábiles',
                      possibleCauses: ['Fisura en soldaduras de placa', 'Flex desprendido']
                    }
                  ].map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => handleSelectSymptom(sym)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-start justify-between gap-2"
                    >
                      <span>{sym.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                    </button>
                  ))}

                  {/* MOJADO */}
                  {selectedCategory.id === 'wet' && [
                    {
                      id: 'wet_urgent',
                      text: 'Cayó en agua / líquido (Urgencia de secado)',
                      diagnostic: 'Urgencia técnica: Requiere apertura inmediata, limpieza química en batea de ultrasonido y aislamiento térmico para frenar el sulfato.',
                      timeEstimate: '24 horas hábiles',
                      possibleCauses: ['Oxidación rápida de pistas y componentes bajo blindajes']
                    }
                  ].map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => handleSelectSymptom(sym)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-start justify-between gap-2"
                    >
                      <span>{sym.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                    </button>
                  ))}

                  {/* PC / NOTEBOOK */}
                  {selectedCategory.id === 'pc' && [
                    {
                      id: 'pc_slow',
                      text: 'Lentitud extrema al arrancar o abrir programas',
                      diagnostic: 'Upgrade a disco SSD NVMe de alta velocidad y clonación de sistema sin perder archivos personales.',
                      timeEstimate: 'En el día (2 a 4 hs)',
                      possibleCauses: ['Disco mecánico HDD desgastado con sectores dañados']
                    },
                    {
                      id: 'pc_thermal',
                      text: 'Levanta mucha temperatura y el ventilador hace mucho ruido',
                      diagnostic: 'Mantenimiento térmico profundo: desarme, limpieza de conductos y reemplazo de grasa térmica por Artic Silver.',
                      timeEstimate: 'En el día (2 a 3 hs)',
                      possibleCauses: ['Pasta térmica seca y conductos de cobre obstruidos con pelusa']
                    }
                  ].map((sym) => (
                    <button
                      key={sym.id}
                      onClick={() => handleSelectSymptom(sym)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#FF5500]/60 hover:bg-[#FF5500]/10 text-xs text-zinc-300 hover:text-white transition-all text-left flex items-start justify-between gap-2"
                    >
                      <span>{sym.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#FF5500] shrink-0 mt-0.5" />
                    </button>
                  ))}

                </div>
              </div>
            )}

            {/* SUB-TRIAGE: PANTALLA NEGRA VIBRA O NO */}
            {step === 'sub_triage' && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-1">
                  ¿Al enchufarlo o tocar botones vibra o suena?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSubTriageAnswer(true)}
                    className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>SÍ, vibra o suena</span>
                  </button>

                  <button
                    onClick={() => handleSubTriageAnswer(false)}
                    className="p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>NO hace nada</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO D: TARJETA DE RESULTADO Y BOTÓN WHATSAPP */}
            {step === 'result' && diagnosticResult && (
              <div className="pt-2 space-y-3">
                <div className="bg-[#18181B] border-2 border-[#FF5500] rounded-2xl p-4 shadow-[0_0_25px_rgba(255,85,0,0.25)] space-y-3 relative overflow-hidden">
                  
                  {/* Badge Ticket */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5500] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Ticket Técnico Preliminar
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Mar del Plata
                    </span>
                  </div>

                  {/* Dispositivo y Falla */}
                  <div>
                    <div className="text-[11px] text-zinc-400">Equipo a intervenir:</div>
                    <div className="text-sm font-bold text-white font-heading">
                      {diagnosticResult.device}
                    </div>
                  </div>

                  {/* Tarjeta de Presupuesto Estimado Web */}
                  <div className="bg-gradient-to-r from-zinc-950 via-[#1C120C] to-zinc-950 border border-[#FF5500]/50 rounded-xl p-3 shadow-[0_0_20px_rgba(255,85,0,0.15)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-[#FF5500]" />
                        Presupuesto Estimado Web:
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] font-bold border border-[#FF5500]/30">
                        Repuesto + Mano de Obra
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                      <span className="text-[#FF5500]">{diagnosticResult.priceFormatted}</span>
                    </div>
                    {diagnosticResult.qualityLabel && (
                      <div className="text-[10px] text-zinc-400 leading-tight flex items-center gap-1">
                        <span>💎 <strong className="text-zinc-300">Calidad:</strong> {diagnosticResult.qualityLabel}</span>
                      </div>
                    )}
                    <div className="text-[9px] text-zinc-500 pt-0.5">
                      * Calculado en tiempo real según catálogo de Montec. Sin sorpresas ni costos ocultos.
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Diagnóstico de Laboratorio:
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                      {diagnosticResult.diagnostic}
                    </p>
                  </div>

                  {/* Tiempos y Garantía */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-400 flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-[#FF5500]" />
                        Tiempo estimado:
                      </div>
                      <div className="font-bold text-zinc-200 mt-0.5">
                        {diagnosticResult.timeEstimate}
                      </div>
                    </div>

                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                      <div className="text-zinc-400 flex items-center gap-1 text-[10px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Garantía:
                      </div>
                      <div className="font-bold text-zinc-200 mt-0.5">
                        {diagnosticResult.warranty}
                      </div>
                    </div>
                  </div>

                  {/* Botón Principal de WhatsApp */}
                  <a
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent('chatbot_whatsapp_click', {
                        device: diagnosticResult.device,
                        diagnostic: diagnosticResult.diagnostic,
                        price: diagnosticResult.priceFormatted
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#FF5500] to-[#E64D00] hover:from-[#FF6600] hover:to-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.5)] transition-all transform hover:scale-[1.02] active:scale-98 text-center cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>Enviar diagnóstico y presupuesto por WhatsApp 📲</span>
                  </a>

                  <div className="text-center text-[10px] text-zinc-500">
                    📍 Montes Carballo 943 • Presupuesto físico sin cargo
                  </div>
                </div>

                {/* Botón para reiniciar */}
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-center text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  🔄 Iniciar otro diagnóstico
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer del Chat (Aviso sutil) */}
          <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
            <span>montec.ar • Laboratorio de Microelectrónica</span>
            <span className="text-[#FF5500] font-semibold">Mar del Plata</span>
          </div>

        </div>
      )}
    </>
  );
}
