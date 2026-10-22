import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Smartphone,
  Battery,
  Layers,
  Wrench,
  Compass,
  CheckCircle2,
  Calendar,
  ThumbsUp,
  Store,
  DollarSign,
  AlertCircle,
  ListChecks,
  BookOpen
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// ============================================================================
// DATOS EXACTOS DE LA "GUÍA DE CIERRE POR WHATSAPP PARA REPARACIONES"
// ============================================================================

export const GOLDEN_RULE = "No cerrar una pieza por chat. Cerrar el ingreso del equipo para diagnosticar, recomendar y presupuestar sin costo.";
export const CORE_PRINCIPLE = "No se cambia un porcentaje, se resuelve una consecuencia. El diagnóstico comercial descubre por qué quiere resolverlo; el diagnóstico técnico confirma qué necesita el equipo.";

// Las 8 Etapas Universales del Mapa de Conversación (Págs. 2 y 8)
export const STAGES = [
  {
    id: 1,
    title: '1. Seteo de marco',
    short: 'Marco',
    goal: 'Dar contexto y permiso para preguntar sin mandarlo a la opción más cara.',
    phrase: 'te hago dos preguntitas así veo qué opción realmente te conviene y no te mando de una a la más cara, dale?'
  },
  {
    id: 2,
    title: '2. Síntoma / Dolor',
    short: 'Síntoma y Dolor',
    goal: 'Descubrir qué ocurre y cómo le afecta en el día a día.',
    phrase: 'además del porcentaje/rotura, ¿qué problema te está dando y cómo te complica?'
  },
  {
    id: 3,
    title: '3. Deseo',
    short: 'Deseo',
    goal: 'Entender qué resultado ideal quiere conseguir con el arreglo.',
    phrase: '¿qué te gustaría conseguir con el arreglo / qué sería lo más importante?'
  },
  {
    id: 4,
    title: '4. Contexto / Arquetipo',
    short: 'Contexto',
    goal: 'Saber uso, destino, tiempos y prioridades sin encasillar.',
    phrase: 'como para recomendarte bien y no hacerte gastar de más, ¿qué uso le vas a dar al equipo?'
  },
  {
    id: 5,
    title: '5. Recomendación con criterio',
    short: 'Recomendación',
    goal: 'Conectar su caso con un criterio razonable y educar antes de presupuestar.',
    phrase: 'como vos [uso] y priorizás [deseo], en principio conviene [criterio] porque...'
  },
  {
    id: 6,
    title: '6. Microconfirmación',
    short: 'Microconf.',
    goal: 'Lograr que acepte el criterio antes de invitarlo al local.',
    phrase: '¿me explico? / ¿tiene sentido?'
  },
  {
    id: 7,
    title: '7. Revisión sin costo',
    short: 'Revisión sin costo',
    goal: 'Cerrar un paso de bajo riesgo: se prueba en el local sin costo ni compromiso.',
    phrase: 'hagamos una cosa: coordinemos un turno y lo revisamos sin costo antes de hacer nada.'
  },
  {
    id: 8,
    title: '8. Turno (Doble alternativa)',
    short: 'Turno',
    goal: 'Transformar intención en compromiso con 2 horarios específicos.',
    phrase: 'mañana puedo recibirlo a las 11:30 o a las 16:30, ¿cuál te queda mejor?'
  }
];

// Arquetipos de la Guía (Pág. 4)
export const ARCHETYPES = [
  {
    id: 'trabajo',
    label: 'Trabajo / Estudio',
    icon: '💼',
    dolor: 'Quedarse sin herramienta o incomunicado.',
    deseo: 'Recuperarlo rápido y confiable.',
    prioriza: 'Demora, disponibilidad y continuidad de uso.'
  },
  {
    id: 'uso_propio',
    label: 'Uso propio',
    icon: '📱',
    dolor: 'Molestia diaria y bajo rendimiento.',
    deseo: 'Volver a usarlo con normalidad.',
    prioriza: 'Calidad, autonomía, tacto/imagen, garantía.'
  },
  {
    id: 'venta',
    label: 'Venta / Reventa',
    icon: '🤝',
    dolor: 'Pierde valor o genera desconfianza.',
    deseo: 'Presentarlo prolijo y vender mejor.',
    prioriza: 'Terminación, mensajes, inversión razonable.'
  },
  {
    id: 'regalo',
    label: 'Regalo / Familiar',
    icon: '🎁',
    dolor: 'Entregar un equipo que falle.',
    deseo: 'Que quede confiable y presentable.',
    prioriza: 'Equilibrio entre costo, seguridad y duración.'
  },
  {
    id: 'segundo_equipo',
    label: 'Segundo equipo',
    icon: '🔄',
    dolor: 'No quiere invertir de más.',
    deseo: 'Que funcione correctamente.',
    prioriza: 'Costo-beneficio y reparación suficiente.'
  }
];

// Fallas analizadas en la Guía
export const FAILURES = [
  { id: 'bateria', label: 'Batería', icon: Battery, targetItem: 'la batería' },
  { id: 'pantalla', label: 'Pantalla', icon: Layers, targetItem: 'la pantalla' },
  { id: 'tapa', label: 'Tapa / Carcasa', icon: Smartphone, targetItem: 'la tapa trasera' }
];

// Piedritas literales de la Guía (Pág. 9)
export const PIEDRITAS = [
  {
    id: 'general',
    title: 'Piedrita General (Comparación)',
    badge: 'Validar y Ampliar Criterio',
    icon: ShieldCheck,
    text: 'entiendo que estés comparando precios\n\nigual, para compararlo bien habría que ver qué incluye cada trabajo, qué garantía tiene y si realmente cumple con lo que vos necesitás\n\npor lo que me contaste, para vos lo importante es la tranquilidad y el rendimiento diario\n\npor eso prefiero revisar el equipo y recomendarte algo acorde, sin mandarte a gastar de más'
  },
  {
    id: 'bateria',
    title: 'Piedrita Batería',
    badge: 'No solo mirar el 100%',
    icon: Battery,
    text: 'ojo con mirar solamente que marque 100%\n\nuna batería puede marcarlo y no necesariamente darte la autonomía que buscás\n\ncomo vos lo usás bastante, primero conviene medir el consumo y elegir según rendimiento, demora y garantía'
  },
  {
    id: 'pantalla',
    title: 'Piedrita Pantalla',
    badge: 'Compatibles vs Rendimiento',
    icon: Layers,
    text: 'dos pantallas pueden ser compatibles y verse parecidas en una lista, pero no necesariamente rendir igual en brillo, color, tacto o duración\n\ncomo para vos importa la experiencia de uso, conviene comparar el resultado y la garantía, no solo el número'
  },
  {
    id: 'tapa',
    title: 'Piedrita Tapa',
    badge: 'Qué incluye el trabajo',
    icon: Smartphone,
    text: 'en una tapa, el precio puede cambiar según qué incluye el trabajo y cómo está el marco alrededor del golpe\n\npara no presupuestarte de más ni quedarnos cortos, primero conviene verla y confirmar qué necesita'
  }
];

// Conversaciones Modelo Literales de la Guía (Págs. 10 y 11)
export const MODEL_CONVERSATIONS = [
  {
    id: 'bateria_trabajo',
    title: 'Caso A: Batería - Uso para trabajar',
    failure: 'bateria',
    archetype: 'trabajo',
    messages: [
      { sender: 'client', text: 'Hola buenas, ¿cuánto me sale cambiar la batería de un iPhone 11?' },
      { sender: 'agent', text: 'buenasss, te hago dos preguntitas así veo qué opción realmente te conviene y no te mando de una a la más cara, dale?', stage: 1, rationale: 'Seteo de marco: Permiso + beneficio acotado.' },
      { sender: 'client', text: 'sí' },
      { sender: 'agent', text: 'además del porcentaje, ¿qué problema te está dando la batería?', stage: 2, rationale: 'Síntoma: Descubrir qué ocurre más allá del número técnico.' },
      { sender: 'client', text: 'la cargo tres veces y a la tarde me quedo sin nada' },
      { sender: 'agent', text: 'claro, ¿y la usás durante el día para trabajar?', stage: 4, rationale: 'Dolor y contexto: Identificar si es herramienta de trabajo.' },
      { sender: 'client', text: 'sí, todo el día' },
      { sender: 'agent', text: 'ahí va. Como dependés del celu para trabajar, en tu caso pesan mucho la autonomía y la demora. Igual primero habría que medir el consumo, porque no tendría sentido recomendarte una batería más cara si el equipo no tiene ningún consumo fuera de lo normal. La idea es que recuperes rendimiento sin quedarte sin teléfono más tiempo del necesario, ¿me explico?', stage: 5, rationale: 'Recomendación con criterio + Microconfirmación.' },
      { sender: 'client', text: 'sí' },
      { sender: 'agent', text: 'de una. Hagamos una cosa: coordinemos un turno y le hacemos una prueba de consumo sin costo. Con eso confirmamos qué opción te conviene y te pasamos el presupuesto exacto antes de cambiar nada. Mañana puedo recibirlo a las 11:30 o a las 16:30, ¿cuál te queda mejor?', stage: 7, rationale: 'Revisión sin costo + Cierre con doble alternativa.' }
    ]
  },
  {
    id: 'pantalla_propio',
    title: 'Caso B: Pantalla - Uso propio',
    failure: 'pantalla',
    archetype: 'uso_propio',
    messages: [
      { sender: 'client', text: 'Hola, cuánto sale cambiar el módulo de un iPhone 12 Pro?' },
      { sender: 'agent', text: 'sí, obvio, ahora te paso bien. Antes te hago dos preguntitas porque hay distintas opciones y no quiero mandarte de una a la más cara si no la necesitás, dale?', stage: 1, rationale: 'Seteo de marco para pantalla con beneficio explícito.' },
      { sender: 'client', text: 'dale' },
      { sender: 'agent', text: 'contame, ¿qué pasó y cómo quedó funcionando después del golpe?', stage: 2, rationale: 'Síntoma y dolor: Evaluar estado tras el golpe.' },
      { sender: 'client', text: 'se ve, pero tiene una mancha y a veces no responde' },
      { sender: 'agent', text: 'entiendo. ¿Y qué te gustaría priorizar con el arreglo?', stage: 3, rationale: 'Deseo: Conocer qué resultado busca.' },
      { sender: 'client', text: 'lo uso yo y quiero que quede bien' },
      { sender: 'agent', text: 'perfecto. Como lo usás todos los días y ya falla el táctil, conviene priorizar una pantalla con buena respuesta y una experiencia acorde al uso. Igual primero habría que revisar el marco y confirmar que el golpe no haya afectado otra cosa, así no te hago gastar de más. ¿Me explico?', stage: 5, rationale: 'Recomendación según arquetipo + Microconfirmación.' },
      { sender: 'client', text: 'sí' },
      { sender: 'agent', text: 'de una. Hagamos una cosa: traelo y lo revisamos sin costo. Vemos imagen, táctil, marco y qué opción te conviene. Con eso te pasamos el presupuesto exacto antes de hacer nada. ¿Te queda mejor mañana a las 12 o a las 17?', stage: 7, rationale: 'Revisión sin costo + Doble alternativa de turno.' }
    ]
  },
  {
    id: 'tapa_venta',
    title: 'Caso C: Tapa - Equipo para vender',
    failure: 'tapa',
    archetype: 'venta',
    messages: [
      { sender: 'client', text: 'Buenas, precio para cambiar la tapa de vidrio de atrás?' },
      { sender: 'agent', text: 'te hago dos preguntitas porque según el golpe puede ser solo la tapa o puede haber algo más. La idea es recomendarte el trabajo justo y no hacerte cambiar piezas que no necesitás, dale?', stage: 1, rationale: 'Seteo de marco para tapa: trabajo justo sin cambiar piezas al vicio.' },
      { sender: 'client', text: 'sí' },
      { sender: 'agent', text: 'además de la rotura, ¿qué te preocupa del equipo?', stage: 2, rationale: 'Dolor y preocupación real del cliente.' },
      { sender: 'client', text: 'lo quiero vender y así me lo tiran abajo' },
      { sender: 'agent', text: 'claro. Como lo querés vender, lo importante es que quede presentable y que la inversión tenga sentido para el valor que querés recuperar. Primero conviene ver si el daño quedó solo en la tapa o si afectó el marco o las cámaras. Si es solo estético, no tendría sentido mandarte a un trabajo más grande. ¿Me explico?', stage: 5, rationale: 'Recomendación acorde a arquetipo venta + Microconfirmación.' },
      { sender: 'client', text: 'sí' },
      { sender: 'agent', text: 'hagamos una cosa: coordinemos un turno y lo revisamos sin costo. Con eso te digo qué trabajo conviene y te paso el presupuesto exacto antes de hacer nada. ¿Mañana podés a las 11 o a las 16?', stage: 7, rationale: 'Revisión sin costo + Cierre con doble alternativa.' }
    ]
  }
];

// Errores que bajan el cierre (Pág. 11)
export const CLOSING_ERRORS = [
  { error: 'Pasar precio apenas pregunta.', correccion: 'Primero entender dolor, deseo y contexto; después recomendar o cerrar revisión.' },
  { error: 'Hacer un interrogatorio.', correccion: 'Setear el marco, preguntar de a una, validar y explicar el beneficio.' },
  { error: 'Explicar demasiada técnica.', correccion: 'Dar solo la información que resuelve la objeción o justifica la recomendación.' },
  { error: 'Dar opciones sin recomendar.', correccion: 'Elegir una dirección según lo que el cliente dijo y explicar por qué.' },
  { error: 'Prometer diagnóstico por chat.', correccion: 'Usar lenguaje condicional y confirmar en la revisión.' },
  { error: 'Preguntar "¿cuándo querés venir?".', correccion: 'Ofrecer dos horarios concretos (doble alternativa).' },
  { error: 'Cerrar la reparación antes de revisar.', correccion: 'Cerrar el ingreso para diagnóstico y presupuesto sin costo.' },
  { error: 'Hacer el trabajo sin permiso explícito.', correccion: 'Aclarar que no se cambia nada sin aprobar el presupuesto.' }
];

// Checklist de 10 puntos antes de terminar el chat (Pág. 12)
export const CLOSING_CHECKLIST = [
  "¿Entendí qué consecuencia real le genera la falla?",
  "¿Sé qué quiere conseguir con el arreglo?",
  "¿Sé para qué usa o qué destino tendrá el equipo?",
  "¿Sé qué prioriza: rendimiento, tiempo, terminación, mensaje, garantía o costo?",
  "¿Le expliqué por qué le hago las preguntas?",
  "¿Le di una recomendación conectada con su caso?",
  "¿Usé una microconfirmación antes de cerrar?",
  "¿Ofrecí revisión y presupuesto sin costo?",
  "¿Aclaré que no se hace nada sin autorización?",
  "¿Propuse dos horarios concretos?"
];

// Generador de respuesta exacta basada en las plantillas y reglas de la Guía
export function generateGuideResponse({ stageId, failureId, archetypeId, customerName }) {
  const name = customerName ? customerName.trim() : '';
  const saludo = name ? `hola ${name}` : 'buenasss';

  switch (stageId) {
    case 1: // Seteo de marco (Pág. 3, 5, 6, 7)
      if (failureId === 'bateria') {
        return `${saludo}, te hago dos preguntitas así veo qué opción realmente te conviene y no te mando de una a la más cara, dale?`;
      }
      if (failureId === 'pantalla') {
        return `sí, obvio, ahora te paso bien. Antes te hago dos preguntitas porque hay distintas opciones y no quiero mandarte de una a la más cara si no la necesitás, dale?`;
      }
      if (failureId === 'tapa') {
        return `te hago dos preguntitas porque según el golpe puede ser solo la tapa o puede haber algo más para revisar. La idea es recomendarte el trabajo justo y no hacerte cambiar piezas que no necesitás, dale?`;
      }
      return `${saludo}, te hago dos preguntitas así entiendo qué necesitás y no te mando de una a la opción más cara, dale?`;

    case 2: // Síntoma y dolor (Pág. 3, 4, 6, 7)
      if (failureId === 'bateria') {
        return `además del porcentaje, ¿qué problema te está dando la batería?`;
      }
      if (failureId === 'pantalla') {
        return `contame, ¿qué pasó y cómo quedó funcionando después del golpe? ¿Y qué es lo que más te está complicando hoy?`;
      }
      if (failureId === 'tapa') {
        return `contame, además de la rotura, ¿qué te está molestando o preocupando del equipo?`;
      }
      return `contame, ¿qué problema te está dando y cómo te complica en el día a día?`;

    case 3: // Deseo (Pág. 3, 4, 6, 7)
      if (failureId === 'bateria') {
        return `entiendo. ¿Qué sería lo más importante para vos al hacer el cambio: llegar tranquilo al final del día, tenerlo rápido o cuidar la inversión?`;
      }
      if (failureId === 'pantalla') {
        return `entiendo. ¿Y qué te gustaría priorizar con el arreglo: buena imagen y tacto, rapidez o resolverlo con presupuesto medido?`;
      }
      if (failureId === 'tapa') {
        return `¿qué sería lo más importante para vos: que quede prolijo, tenerlo rápido o cuidar la inversión?`;
      }
      return `entiendo. ¿Qué te gustaría conseguir con el arreglo?`;

    case 4: // Contexto y arquetipo (Pág. 3, 4, 5, 6, 7)
      if (archetypeId === 'trabajo') {
        return `claro, ¿y la usás durante el día para trabajar o dependés del equipo para tu actividad diaria?`;
      }
      if (archetypeId === 'venta') {
        return `como para entender qué necesitás y no hacerte gastar de más, ¿lo estás preparando para vender o lo vas a seguir usando vos?`;
      }
      if (archetypeId === 'regalo') {
        return `como para recomendarte bien y no hacerte gastar de más, ¿es para un familiar o para alguien más?`;
      }
      return `como para recomendarte una opción acorde y no hacerte gastar de más, ¿lo vas a seguir usando vos o lo estás preparando para vender o para otra persona?`;

    case 5: // Recomendación con criterio (Pág. 5, 6, 8)
      if (failureId === 'bateria') {
        if (archetypeId === 'trabajo') {
          return `ahí va. Como dependés del celu para trabajar, en tu caso pesan mucho la autonomía y la demora. Igual primero habría que medir el consumo, porque no tendría sentido recomendarte una batería más cara si el equipo no tiene ningún consumo fuera de lo normal. La idea es que recuperes rendimiento sin quedarte sin teléfono más tiempo del necesario.`;
        }
        if (archetypeId === 'venta') {
          return `como lo querés vender, pesa más que quede prolijo y acorde a lo que espera el comprador. Primero conviene confirmar si los apagados vienen solo de la batería, para no hacerte gastar de más ni devaluar el equipo.`;
        }
        return `como lo usás todos los días y te molesta cargarlo varias veces, conviene priorizar autonomía. Primero hay que medir el consumo para no mandarte a una opción más cara de la que necesitás.`;
      }
      if (failureId === 'pantalla') {
        if (archetypeId === 'trabajo') {
          return `como dependés del equipo para laburar, conviene priorizar una pantalla con excelente respuesta táctil y brillo para no perder ritmo de trabajo. Igual antes conviene revisar el marco y confirmar que el golpe no haya afectado otra cosa, así no te hago gastar de más.`;
        }
        return `perfecto. Como lo usás todos los días y ya falla el táctil, conviene priorizar una pantalla con buena respuesta y una experiencia acorde al uso. Igual primero habría que revisar el marco y confirmar que el golpe no haya afectado otra cosa, así no te hago gastar de más.`;
      }
      if (failureId === 'tapa') {
        if (archetypeId === 'venta') {
          return `como lo querés vender, lo importante es que quede presentable y que la inversión tenga sentido para el valor que querés recuperar. Primero conviene ver si el daño quedó solo en la tapa o si afectó el marco o las cámaras. Si es solo estético, no tendría sentido mandarte a un trabajo más grande.`;
        }
        return `primero conviene ver si el golpe quedó solo en la tapa o si también afectó el marco o alguna zona cercana. Si es solamente estético, no tendría sentido mandarte a un trabajo más grande del que necesitás. La idea es que quede como buscás sin hacerte gastar de más.`;
      }
      return `como vos lo usás y lo que más te importa es el rendimiento, en principio conviene priorizar una opción confiable. Igual primero habría que revisar el equipo para confirmar que el problema venga solo de ahí y no recomendarte algo de más.`;

    case 6: // Microconfirmación (Pág. 2, 5, 8)
      return `¿me explico?`;

    case 7: // Revisión sin costo (Pág. 5, 6, 7, 8)
      if (failureId === 'bateria') {
        return `de una. Hagamos una cosa: coordinemos un turno y le hacemos una prueba de consumo sin costo. Con eso confirmamos qué opción te conviene y te pasamos el presupuesto exacto antes de cambiar nada.`;
      }
      if (failureId === 'pantalla') {
        return `de una. Hagamos una cosa: traelo y lo revisamos sin costo. Vemos imagen, táctil, marco y qué opción te conviene. Con eso te pasamos el presupuesto exacto antes de hacer nada.`;
      }
      if (failureId === 'tapa') {
        return `hagamos una cosa: coordinemos un turno y revisamos sin costo el estado de la tapa, el marco y las zonas del golpe. Con eso te digo qué trabajo conviene y te paso el presupuesto exacto antes de hacer nada.`;
      }
      return `de una. Hagamos una cosa: coordinemos un turno y lo revisamos sin costo. Con eso confirmamos qué opción te conviene y te pasamos el presupuesto exacto antes de hacer cualquier trabajo.`;

    case 8: // Turno con doble alternativa (Pág. 5, 8, 10, 11)
      return `¿te queda mejor mañana a las 11:30 o a las 16:30?`;

    default:
      return `${saludo}, ¿en qué te puedo ayudar hoy?`;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SalesCloserAssistantTab() {
  const { panelTheme } = useData();
  const isLight = panelTheme === 'light';

  // Modo: 'simulator' (Roleplay WhatsApp guiado) | 'copilot' (Atención en vivo)
  const [mode, setMode] = useState('simulator');

  // Estado del embudo (1 a 8)
  const [currentStage, setCurrentStage] = useState(1);
  const [selectedFailure, setSelectedFailure] = useState('bateria');
  const [selectedArchetype, setSelectedArchetype] = useState('trabajo');
  const [customerName, setCustomerName] = useState('');

  // Modales/Pestañas de apoyo técnico (Checklist y Errores a evitar)
  const [showChecklist, setShowChecklist] = useState(false);
  const [showErrorsGuide, setShowErrorsGuide] = useState(false);

  // Copiloto: mensaje del cliente
  const [clientMessageInput, setClientMessageInput] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Generar respuesta sugerida según la guía
  const baseSuggested = useMemo(() => {
    return generateGuideResponse({
      stageId: currentStage,
      failureId: selectedFailure,
      archetypeId: selectedArchetype,
      customerName
    });
  }, [currentStage, selectedFailure, selectedArchetype, customerName]);

  useEffect(() => {
    setCustomResponse(baseSuggested);
  }, [baseSuggested]);

  // Copiar al portapapeles
  const handleCopy = (textToCopy) => {
    const text = textToCopy || customResponse;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2200);
    });
  };

  // Inserción de Piedrita
  const handleInsertPiedrita = (piedritaText) => {
    setCustomResponse(prev => `${prev}\n\n${piedritaText}`);
  };

  // Cargar una conversación modelo exacta del documento (Caso A, B o C)
  const handleLoadModelCase = (modelCase) => {
    setSelectedFailure(modelCase.failure);
    setSelectedArchetype(modelCase.archetype);
    setCurrentStage(1);
    setChatMessages([modelCase.messages[0], modelCase.messages[1]]);
    setSimScriptStep(1); // índice en el script
  };

  // ==========================================================================
  // ESTADO Y MÁQUINA DE ESTADOS DEL SIMULADOR WHATSAPP
  // ==========================================================================
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'client',
      text: 'Hola buenas, ¿cuánto me sale cambiar la batería de un iPhone 11?',
      time: '11:15'
    },
    {
      id: 2,
      sender: 'agent',
      text: 'buenasss, te hago dos preguntitas así veo qué opción realmente te conviene y no te mando de una a la más cara, dale?',
      time: '11:16',
      stage: 1,
      rationale: 'Seteo de marco: Permiso + beneficio para no competir a ciegas por precio.'
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [simScriptStep, setSimScriptStep] = useState(1);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mode]);

  // Manejo de envío en el simulador
  const handleSimSend = (textToSend) => {
    const text = (textToSend || simInput).trim();
    if (!text) return;

    const newClientMsg = {
      id: Date.now(),
      sender: 'client',
      text,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newClientMsg]);
    setSimInput('');

    // Respuesta del Bot siguiendo la lógica estricta de la Guía
    setTimeout(() => {
      evaluateAndReplyGuideBot(text);
    }, 600);
  };

  // Lógica central del Bot basada en las 13 páginas de la Guía
  const evaluateAndReplyGuideBot = (clientMsg) => {
    const lower = clientMsg.toLowerCase();
    let nextStage = currentStage;
    let rationale = '';

    // Si el cliente insiste con el precio o compara con otro local -> Aplica la Piedrita correspondiente
    if (lower.includes('otro lado') || lower.includes('otra esquina') || lower.includes('mercadolibre') || lower.includes('menos') || lower.includes('barat')) {
      const piedritaObj = PIEDRITAS.find(p => p.id === selectedFailure) || PIEDRITAS[0];
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: piedritaObj.text,
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          stage: 5,
          rationale: 'Piedrita anti-precio: Validar la comparación y recuperar la prioridad sin atacar al competidor.'
        }
      ]);
      return;
    }

    // Máquina de estados según el flujo de la guía:
    if (currentStage === 1) {
      // Cliente acepta el marco ("sí", "dale", "bueno", "ok")
      if (lower.includes('si') || lower.includes('sí') || lower.includes('dale') || lower.includes('bueno') || lower.includes('ok')) {
        nextStage = 2; // Síntoma / Dolor
        rationale = 'Síntoma: El cliente aceptó el marco. Ahora preguntamos qué problema da el equipo más allá del dato técnico.';
      } else {
        nextStage = 1;
        rationale = 'Seteo de marco: Re-explicamos que las preguntas son para cuidarlo y no mandarlo a la opción más cara.';
      }
    } else if (currentStage === 2) {
      // Cliente expresa el síntoma ("la cargo tres veces", "se me apaga", "se rompió el vidrio")
      if (selectedFailure === 'bateria') {
        nextStage = 4; // En batería salta a confirmar arquetipo/uso de laburo
        rationale = 'Contexto / Dolor: Descubrimos si el teléfono es para trabajar o uso diario.';
      } else {
        nextStage = 3; // En pantalla/tapa pregunta por el deseo/resultado que busca
        rationale = 'Deseo: Entendemos qué resultado busca (que quede prolijo, venderlo o usarlo normal).';
      }
    } else if (currentStage === 3) {
      // Cliente responde sobre su deseo
      nextStage = 5;
      rationale = 'Recomendación con criterio + Microconfirmación: Conectamos su uso con la opción razonable.';
    } else if (currentStage === 4) {
      // Cliente responde sobre arquetipo/trabajo ("sí, todo el día", "lo uso para laburar")
      nextStage = 5;
      rationale = 'Recomendación con criterio: Planteamos la solución sin dar precio ciego y pedimos microconfirmación.';
    } else if (currentStage === 5) {
      // Cliente acepta la microconfirmación ("¿me explico? -> sí / dale")
      if (lower.includes('si') || lower.includes('sí') || lower.includes('dale') || lower.includes('claro') || lower.includes('bueno')) {
        nextStage = 7; // Revisión sin costo
        rationale = 'Revisión sin costo + Turno: Paso de bajo riesgo para cerrar el ingreso al taller.';
      } else {
        nextStage = 6;
        rationale = 'Microconfirmación: Aseguramos el entendimiento antes de ofrecer la visita.';
      }
    } else if (currentStage === 6) {
      nextStage = 7;
      rationale = 'Revisión sin costo: Presentamos la prueba de consumo / revisión en banco sin compromiso.';
    } else if (currentStage === 7) {
      nextStage = 8;
      rationale = 'Turno con doble alternativa: Ofrecemos 2 horarios específicos para concretar.';
    } else {
      nextStage = 8;
      rationale = 'Cierre confirmado: Turno coordinado para ingreso del equipo.';
    }

    setCurrentStage(nextStage);

    let botText = '';
    // En las conversaciones modelo, la etapa 5 incluye la microconfirmación ("¿me explico?") y la etapa 7 incluye el turno con doble alternativa
    if (nextStage === 5) {
      botText = `${generateGuideResponse({ stageId: 5, failureId: selectedFailure, archetypeId: selectedArchetype, customerName })}\n\n¿me explico?`;
    } else if (nextStage === 7) {
      botText = `${generateGuideResponse({ stageId: 7, failureId: selectedFailure, archetypeId: selectedArchetype, customerName })}\n\n¿te queda mejor mañana a las 11:30 o a las 16:30?`;
    } else {
      botText = generateGuideResponse({ stageId: nextStage, failureId: selectedFailure, archetypeId: selectedArchetype, customerName });
    }

    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'agent',
        text: botText,
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        stage: nextStage,
        rationale
      }
    ]);
  };

  const handleResetSim = () => {
    setCurrentStage(1);
    setChatMessages([
      {
        id: Date.now(),
        sender: 'client',
        text: selectedFailure === 'bateria'
          ? 'Hola buenas, ¿cuánto me sale cambiar la batería de un iPhone 11?'
          : selectedFailure === 'pantalla'
            ? 'Hola, cuánto sale cambiar el módulo de un iPhone 12 Pro?'
            : 'Buenas, precio para cambiar la tapa de vidrio de atrás?',
        time: '11:15'
      },
      {
        id: Date.now() + 1,
        sender: 'agent',
        text: generateGuideResponse({ stageId: 1, failureId: selectedFailure, archetypeId: selectedArchetype, customerName }),
        time: '11:16',
        stage: 1,
        rationale: 'Seteo de marco: Pedir permiso con beneficio para esquivar la trampa del precio ciego.'
      }
    ]);
  };

  return (
    <div className={`space-y-4 animate-fadeIn ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>

      {/* ==================================================================== */}
      {/* 1. HEADER DE LA GUÍA DE CIERRE & PRINCIPIO CENTRAL                   */}
      {/* ==================================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-white to-amber-50/40 border-emerald-200/80 shadow-sm'
          : 'bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-[#FF5500]/10 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-heading font-extrabold flex items-center gap-2">
                  <span>Guía de Cierre por WhatsApp para Reparaciones</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    iPhone Especializado
                  </span>
                </h2>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {CORE_PRINCIPLE}
              </p>
            </div>
          </div>

          {/* Botones de Modos y Recursos de la Guía */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setShowErrorsGuide(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Errores a Evitar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChecklist(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Checklist (10 Pts)</span>
            </button>

            {/* Selector Modo Copiloto vs Modo Simulador */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/25 border border-zinc-700/60">
              <button
                type="button"
                onClick={() => setMode('simulator')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'simulator'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Simulador Bot</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('copilot')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'copilot'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Copiloto Mostrador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Banner de la Idea Central */}
        <div className={`mt-3 px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-medium ${
          isLight
            ? 'bg-emerald-500/10 border-emerald-300 text-emerald-950'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <strong className="uppercase tracking-wider text-[11px] mr-1.5 text-emerald-400">Idea Central del Documento:</strong>
            <span>"{GOLDEN_RULE}"</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BARRA DE CONVERSACIONES MODELO DE LA GUÍA (CASOS A, B Y C)         */}
      {/* ==================================================================== */}
      <div className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
      }`}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF5500]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Conversaciones Modelo del Documento (Págs. 10 y 11):
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {MODEL_CONVERSATIONS.map(mc => (
            <button
              key={mc.id}
              type="button"
              onClick={() => handleLoadModelCase(mc)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFailure === mc.failure && selectedArchetype === mc.archetype
                  ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm'
                  : isLight
                    ? 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <span>{mc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. CAJA RÁPIDA DE "PIEDRITAS" (Pág. 9 de la Guía)                     */}
      {/* ==================================================================== */}
      <div className={`p-4 rounded-2xl border ${
        isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              Piedritas para Salir de la Comparación por Precio (Pág. 9)
            </h3>
          </div>
          <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'} hidden sm:inline`}>
            Fórmula: Validar → Recuperar prioridad → Mostrar lo que el precio solo no contempla → Invitar a revisar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PIEDRITAS.map(p => {
            const IconComponent = p.icon;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  isLight
                    ? 'bg-zinc-50 hover:bg-emerald-50/40 border-zinc-200'
                    : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold">{p.title}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono inline-block mb-1.5">
                    {p.badge}
                  </span>
                  <p className={`text-[11px] leading-relaxed line-clamp-3 mb-2 whitespace-pre-line ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {p.text}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/40 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleCopy(p.text)}
                    className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                  {mode === 'simulator' ? (
                    <button
                      type="button"
                      onClick={() => handleSimSend("En otro lado me cobran menos, ¿por qué cobran eso?")}
                      className="py-1 px-2 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                      title="Simular objeción de precio"
                    >
                      Probar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInsertPiedrita(p.text)}
                      className="py-1 px-2 rounded-lg text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                      title="Sumar a la respuesta sugerida"
                    >
                      + Sumar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. CONTENIDO PRINCIPAL: MAPA DE 8 ETAPAS + CHAT O COPILOTO           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* PANEL LATERAL: STEPPER DE LAS 8 ETAPAS UNIVERSALES (Pág. 2 y 8) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/40">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF5500]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Mapa de la Conversación
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 font-bold">
                Etapa {currentStage}/8
              </span>
            </div>

            <div className="space-y-1.5">
              {STAGES.map(s => {
                const isActive = currentStage === s.id;
                const isPassed = currentStage > s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStage(s.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-orange-50 border-[#FF5500] text-zinc-900 shadow-sm ring-1 ring-[#FF5500]/30'
                          : 'bg-[#FF5500]/15 border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.25)]'
                        : isPassed
                          ? isLight
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                            : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-300'
                          : isLight
                            ? 'bg-white border-transparent text-zinc-500 hover:bg-zinc-50'
                            : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 mt-0.5 ${
                      isActive
                        ? 'bg-[#FF5500] text-white'
                        : isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isPassed ? <Check className="w-3 h-3" /> : s.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold truncate text-[11px] ${isActive ? 'text-[#FF5500]' : ''}`}>
                          {s.title}
                        </span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-ping" />}
                      </div>
                      <p className={`text-[10px] line-clamp-1 mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {s.goal}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ÁREA CENTRAL: SIMULADOR DE CHAT O COPILOTO */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">

          {/* SELECTORES DE CONFIGURACIÓN RÁPIDA (FALLA Y ARQUETIPO) */}
          <div className={`p-3.5 rounded-2xl border ${
            isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Falla */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  1. Falla a Tratar
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {FAILURES.map(f => {
                    const IconComponent = f.icon;
                    const isSelected = selectedFailure === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFailure(f.id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : isLight
                              ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                              : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Arquetipo */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  2. Arquetipo de Cliente (Pág. 4)
                </label>
                <select
                  value={selectedArchetype}
                  onChange={(e) => setSelectedArchetype(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#FF5500]'
                      : 'bg-zinc-950 border-zinc-800 text-white focus:border-[#FF5500]'
                  }`}
                >
                  {ARCHETYPES.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.label} ({a.prioriza.substring(0, 25)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre Opcional */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  3. Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Martín, Lucía..."
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#FF5500]'
                      : 'bg-zinc-950 border-zinc-800 text-white focus:border-[#FF5500]'
                  }`}
                />
              </div>

            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* VISTA 1: SIMULADOR DE CHAT WHATSAPP (CON LA LÓGICA DE LA GUÍA) */}
          {/* -------------------------------------------------------------- */}
          {mode === 'simulator' && (
            <div className={`rounded-2xl border overflow-hidden flex flex-col ${
              isLight ? 'bg-[#efeae2] border-zinc-300 shadow-md' : 'bg-[#0c1317] border-zinc-800 shadow-xl'
            }`} style={{ minHeight: '520px' }}>

              {/* Header WhatsApp */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
                isLight ? 'bg-[#f0f2f5] border-zinc-300' : 'bg-[#202c33] border-[#222d34]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold leading-tight ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      Cliente ({FAILURES.find(f => f.id === selectedFailure)?.label} • {ARCHETYPES.find(a => a.id === selectedArchetype)?.label})
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      en línea • Guía de Cierre Activa (Etapa {currentStage}/8)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSim}
                    className="p-1 px-2.5 rounded-lg text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reiniciar Chat</span>
                  </button>
                </div>
              </div>

              {/* Mensajes del Chat */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[380px] min-h-[300px]">
                {chatMessages.map(msg => {
                  const isAgent = msg.sender === 'agent';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm relative shadow-sm ${
                        isAgent
                          ? isLight
                            ? 'bg-[#d9fdd3] text-zinc-900 rounded-tr-none'
                            : 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                          : isLight
                            ? 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200'
                            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70">
                          <span>{msg.time}</span>
                          {isAgent && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                        </div>
                      </div>

                      {/* Explicación didáctica de ventas basada en el documento */}
                      {isAgent && msg.rationale && (
                        <div className="mt-1 px-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono max-w-[85%] text-right">
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{msg.rationale}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Respuestas sugeridas del cliente para roleplay de 1 clic */}
              <div className={`p-2.5 border-t shrink-0 ${
                isLight ? 'bg-[#f0f2f5] border-zinc-300' : 'bg-[#182229] border-[#222d34]'
              }`}>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
                    Respuestas Guía:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSimSend("sí")}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs shrink-0 cursor-pointer border border-zinc-700"
                  >
                    "sí" (Aceptar marco)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimSend(
                      selectedFailure === 'bateria'
                        ? "la cargo tres veces y a la tarde me quedo sin nada"
                        : selectedFailure === 'pantalla'
                          ? "se ve, pero tiene una mancha y a veces no responde"
                          : "lo quiero vender y así me lo tiran abajo"
                    )}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs shrink-0 cursor-pointer border border-zinc-700"
                  >
                    "Expresar Síntoma / Dolor"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimSend("sí, todo el día, lo uso para trabajar")}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs shrink-0 cursor-pointer border border-zinc-700"
                  >
                    "Lo uso para trabajar"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimSend("En otro local del centro me pasaron 30 lucas menos")}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs shrink-0 cursor-pointer border border-zinc-700"
                  >
                    "Comparar precio"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimSend("dale, mañana a las 11:30 me queda perfecto")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 text-xs shrink-0 cursor-pointer border border-emerald-500/40"
                  >
                    "Aceptar turno 11:30"
                  </button>
                </div>

                {/* Formulario de texto libre */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSimSend();
                  }}
                  className="flex items-center gap-2 mt-2"
                >
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    placeholder="Escribí como si fueras el cliente..."
                    className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm outline-none transition-all ${
                      isLight
                        ? 'bg-white border border-zinc-300 text-zinc-900 focus:border-emerald-500'
                        : 'bg-[#2a3942] border border-[#222d34] text-white focus:border-emerald-500 placeholder-zinc-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!simInput.trim()}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* VISTA 2: COPILOTO PARA ATENCIÓN REAL EN MOSTRADOR              */}
          {/* -------------------------------------------------------------- */}
          {mode === 'copilot' && (
            <div className="space-y-3">

              {/* Pegar mensaje real del cliente */}
              <div className={`p-4 rounded-2xl border ${
                isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/60 border-zinc-800'
              }`}>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pegar mensaje recibido del cliente:</span>
                </label>
                <textarea
                  rows={2}
                  value={clientMessageInput}
                  onChange={(e) => setClientMessageInput(e.target.value)}
                  placeholder="Ej: 'Buenas, cuánto me sale la batería de un 11 Pro? La cargo 3 veces por día...'"
                  className={`w-full p-3 rounded-xl border text-xs outline-none transition-all resize-none ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500'
                      : 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Respuesta Sugerida Exacta según la Guía */}
              <div className={`p-4 sm:p-5 rounded-2xl border relative overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-b from-emerald-50/50 to-white border-emerald-300/80 shadow-md'
                  : 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">
                      Respuesta Sugerida (Etapa {currentStage}: {STAGES[currentStage - 1]?.short})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy()}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        copiedSuccess
                          ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105'
                      }`}
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar en 1 Clic</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://web.whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp Web</span>
                    </a>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={customResponse}
                  onChange={(e) => setCustomResponse(e.target.value)}
                  className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed outline-none transition-all resize-y ${
                    isLight
                      ? 'bg-white border-emerald-200 text-zinc-900 shadow-inner'
                      : 'bg-black/40 border-emerald-500/30 text-emerald-100 shadow-inner'
                  }`}
                />

                {/* Footer de navegación entre etapas */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/40 text-xs">
                  <div className="text-zinc-400 text-[11px]">
                    Objetivo: <strong className="text-zinc-200">{STAGES[currentStage - 1]?.goal}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentStage <= 1}
                      onClick={() => setCurrentStage(prev => Math.max(1, prev - 1))}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40"
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      disabled={currentStage >= 8}
                      onClick={() => setCurrentStage(prev => Math.min(8, prev + 1))}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FF5500] hover:bg-[#FF6600] text-white disabled:opacity-40"
                    >
                      Siguiente Etapa →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ==================================================================== */}
      {/* MODAL / DRAWER: CHECKLIST DE 10 PUNTOS ANTES DE TERMINAR EL CHAT     */}
      {/* ==================================================================== */}
      {showChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`p-6 rounded-2xl border max-w-lg w-full shadow-2xl ${
            isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/40">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-bold text-base">Checklist de Cierre (Pág. 12)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChecklist(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Verificá estos 10 puntos antes de dar por cerrada la conversación por WhatsApp:
            </p>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {CLOSING_CHECKLIST.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowChecklist(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Entendido, volver al Asistente
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL / DRAWER: ERRORES QUE BAJAN EL CIERRE (Pág. 11)                */}
      {/* ==================================================================== */}
      {showErrorsGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`p-6 rounded-2xl border max-w-2xl w-full shadow-2xl ${
            isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-heading font-bold text-base">Errores que Bajan el Cierre (Pág. 11)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorsGuide(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {CLOSING_ERRORS.map((err, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Error: {err.error}</span>
                  </div>
                  <div className="text-emerald-400 pl-3">
                    <strong>Corrección: </strong>{err.correccion}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowErrorsGuide(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
            >
              Cerrar Guía de Errores
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
