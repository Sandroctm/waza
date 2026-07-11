import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { offlineStorage } from '../services/indexedDb';
import { Equipo } from '../types';
import {
  CheckSquare, AlertTriangle, Wifi, WifiOff, PenTool, CheckCircle,
  HelpCircle, Lock, MapPin, Clock, Fuel, ThumbsUp, Send, X,
  ChevronDown, ChevronUp, ShieldAlert, Loader2
} from 'lucide-react';

interface CheckListDigitalProps {
  onNavigate: (view: string) => void;
  user: any;
}

// ─── 60-Item Inspection Definition (7 Sections) ───────────────────────────────

type EstadoItem = 'OK' | 'Advertencia' | 'Falla Crítica' | 'N/A';

interface InspectionItem {
  id: string;
  label: string;
  critical: boolean;
  helpText?: string;
}

interface InspectionSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: InspectionItem[];
}

const SECTIONS: InspectionSection[] = [
  {
    id: 'motor_tren_fuerza',
    title: 'Motor y Tren de Fuerza',
    icon: '⚙️',
    color: 'orange',
    items: [
      { id: 'niv_aceite_motor', label: 'Nivel de aceite de motor', critical: true, helpText: 'Verificar entre MIN y MAX en varilla de medición con motor frío.' },
      { id: 'niv_refrigerante', label: 'Nivel de refrigerante (agua radiador)', critical: true, helpText: 'No abrir tapa en caliente. Verificar nivel en depósito de expansión.' },
      { id: 'niv_aceite_hidra', label: 'Nivel aceite hidráulico', critical: false },
      { id: 'niv_aceite_trasmision', label: 'Nivel aceite transmisión/caja', critical: false },
      { id: 'niv_aceite_diferencial', label: 'Nivel aceite diferencial/puentes', critical: false },
      { id: 'fugas_aceite', label: 'Fugas de aceite visibles (motor, trasmisión)', critical: true, helpText: 'Inspección visual bajo el equipo. Falla crítica si hay charco.' },
      { id: 'fugas_refrigerante', label: 'Fugas de refrigerante', critical: true },
      { id: 'fugas_combustible', label: 'Fugas de combustible', critical: true, helpText: 'RIESGO DE INCENDIO. Marcar como Falla Crítica ante cualquier fuga.' },
      { id: 'filtros_aire', label: 'Indicador de filtros de aire (limpio)', critical: false },
      { id: 'correas_fajas', label: 'Estado correas/fajas (sin rajaduras)', critical: false },
    ]
  },
  {
    id: 'sistema_frenos',
    title: 'Sistema de Frenos',
    icon: '🛑',
    color: 'red',
    items: [
      { id: 'freno_servicio', label: 'Freno de servicio (pedal firme)', critical: true, helpText: 'Presionar pedal: debe estar firme a 1/3 de recorrido. Si cede al fondo → Falla Crítica.' },
      { id: 'freno_parqueo', label: 'Freno de parqueo/emergencia (efectivo)', critical: true },
      { id: 'niv_liquido_frenos', label: 'Nivel líquido de frenos', critical: true },
      { id: 'frenos_retardador', label: 'Retardador/freno motor (si aplica)', critical: false },
      { id: 'frenos_tambores', label: 'Condición visible tambores/discos', critical: false },
      { id: 'lineas_frenos', label: 'Líneas y mangueras de frenos (sin fugas)', critical: true },
      { id: 'abs_indicador', label: 'Indicador ABS (si aplica, sin luz encendida)', critical: false },
    ]
  },
  {
    id: 'sistema_direccion',
    title: 'Sistema de Dirección y Suspensión',
    icon: '🔄',
    color: 'blue',
    items: [
      { id: 'direccion_juego', label: 'Volante: juego libre aceptable (< 30°)', critical: true, helpText: 'Más de 30° de juego libre indica desgaste crítico.' },
      { id: 'niv_aceite_dir', label: 'Nivel aceite dirección hidráulica', critical: false },
      { id: 'fugas_dir_hidra', label: 'Fugas sistema dirección hidráulica', critical: true },
      { id: 'amortiguadores', label: 'Amortiguadores (sin fugas de aceite)', critical: false },
      { id: 'rotulas_terminales', label: 'Rótulas y terminales de dirección', critical: true },
      { id: 'muelles_resortes', label: 'Muelles/resortes (sin fracturas)', critical: false },
      { id: 'pernos_rueda', label: 'Pernos de rueda (completos y apretados)', critical: true, helpText: 'Verificar todos los pernos. Falta de pernos → Falla Crítica.' },
      { id: 'alineacion_visual', label: 'Alineación visual (sin inclinación anormal)', critical: false },
    ]
  },
  {
    id: 'neumaticos_tren_rodamiento',
    title: 'Neumáticos y Tren de Rodamiento',
    icon: '🔧',
    color: 'slate',
    items: [
      { id: 'neum_presion_ad', label: 'Presión neumáticos eje delantero', critical: true, helpText: 'Usar manómetro. Verificar presión según tabla del fabricante.' },
      { id: 'neum_presion_pos', label: 'Presión neumáticos eje posterior', critical: true },
      { id: 'neum_cocada_ad', label: 'Profundidad cocada eje delantero (> 2mm)', critical: true, helpText: 'Usar medidor de cocada. Mínimo 2mm. Bald → Falla Crítica.' },
      { id: 'neum_cocada_pos', label: 'Profundidad cocada eje posterior (> 2mm)', critical: true },
      { id: 'neum_daños_fisicos', label: 'Daños físicos neumáticos (cortes, burbujas)', critical: true },
      { id: 'llanta_repuesto', label: 'Llanta de repuesto (completa y con presión)', critical: false },
      { id: 'aros_llantas', label: 'Estado aros/rines (sin deformación)', critical: false },
    ]
  },
  {
    id: 'sistema_electrico_luces',
    title: 'Sistema Eléctrico y Luces',
    icon: '💡',
    color: 'yellow',
    items: [
      { id: 'luces_delantera', label: 'Luces delanteras (alta y baja)', critical: true },
      { id: 'luces_trasera', label: 'Luces traseras y stop', critical: true },
      { id: 'luces_direccionales', label: 'Direccionales/indicadores (4 flancos)', critical: true },
      { id: 'luces_retroceso', label: 'Luces de retroceso (blancas)', critical: true },
      { id: 'alarma_retroceso', label: 'Alarma sonora de retroceso (activa)', critical: true, helpText: 'CRÍTICO según DS 024-2016-EM. Prueba en marcha atrás.' },
      { id: 'luz_emergencia', label: 'Luz de emergencia/destelladora (si aplica)', critical: false },
      { id: 'bateria_nivel', label: 'Batería: sin corrosión ni fugas', critical: false },
      { id: 'claxon_bocina', label: 'Claxon/bocina (funcional)', critical: true },
      { id: 'indicadores_tablero', label: 'Tablero: sin luces de advertencia activas', critical: true, helpText: 'Luz de motor encendida → Verificar; si persiste → Advertencia.' },
    ]
  },
  {
    id: 'cabina_ergonomia',
    title: 'Cabina, Ergonomía y Seguridad Activa',
    icon: '🪑',
    color: 'teal',
    items: [
      { id: 'cinturon_seguridad', label: 'Cinturón de seguridad (funcional)', critical: true, helpText: 'OBLIGATORIO. Retráctil, sin cortes, cierre seguro.' },
      { id: 'espejos_retrovisores', label: 'Espejos retrovisores (3: izq, der, panorámico)', critical: true },
      { id: 'parabrisas_visibilidad', label: 'Parabrisas: sin grietas en área de visión', critical: true },
      { id: 'limpiaparabrisas', label: 'Limpiaparabrisas (funcional en campo)', critical: false },
      { id: 'asiento_operador', label: 'Asiento operador (ajustable, sin daños)', critical: false },
      { id: 'acceso_escaleras', label: 'Escaleras/peldaños/pasamanos seguros', critical: false },
      { id: 'puertas_pestillos', label: 'Puertas y pestillos (cierran correctamente)', critical: false },
      { id: 'vidrios_ventanas', label: 'Vidrios laterales (sin astillas peligrosas)', critical: false },
      { id: 'ROPS_FOPS', label: 'Estructura ROPS/FOPS (sin deformación)', critical: true, helpText: 'Marco protector de vuelco y caída de objetos. Verificar integridad.' },
    ]
  },
  {
    id: 'equipos_emergencia_documentos',
    title: 'Equipos de Emergencia y Documentos',
    icon: '🧯',
    color: 'purple',
    items: [
      { id: 'extintor_carga', label: 'Extintor (cargado, fecha vigente, accesible)', critical: true, helpText: 'PQS 4kg mínimo. Verificar aguja en verde, sello intacto, fecha de recarga.' },
      { id: 'kit_primeros_auxilios', label: 'Kit de primeros auxilios (completo)', critical: false },
      { id: 'triangulos_señalizacion', label: 'Triángulos de señalización (2 unidades)', critical: false },
      { id: 'herramientas_basicas', label: 'Herramientas básicas (llave de ruedas, gata)', critical: false },
      { id: 'tarjeta_propiedad', label: 'Tarjeta de propiedad vigente', critical: true },
      { id: 'soat_vigente', label: 'SOAT vigente', critical: true, helpText: 'Verificar fecha de vencimiento.' },
      { id: 'rev_tecnica', label: 'Revisión técnica vehicular vigente', critical: true },
      { id: 'permiso_circulacion', label: 'Permiso de circulación en mina vigente', critical: true, helpText: 'Autorización MEM/titular minero. Obligatorio DS 024-2016-EM.' },
      { id: 'licencia_conductor', label: 'Licencia de conducir vigente del operador', critical: true },
      { id: 'epp_operador', label: 'EPP operador completo (casco, lentes, guantes, botas)', critical: true, helpText: 'Inspección visual del operador antes de subir al equipo.' },
    ]
  },
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoItem, { label: string; cls: string; dot: string }> = {
  'OK':            { label: 'OK ✓',   cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Advertencia':   { label: '⚠ Adv.', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  'Falla Crítica': { label: '✖ Crit', cls: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400', dot: 'bg-rose-500 animate-pulse' },
  'N/A':           { label: 'N/A',    cls: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400', dot: 'bg-slate-300' },
};

const sectionColorMap: Record<string, { header: string; border: string }> = {
  orange: { header: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20', border: 'border-orange-500/20' },
  red:    { header: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',    border: 'border-rose-500/20' },
  blue:   { header: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',        border: 'border-sky-500/20' },
  slate:  { header: 'bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200',      border: 'border-slate-200 dark:border-slate-800' },
  yellow: { header: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', border: 'border-amber-500/20' },
  teal:   { header: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',   border: 'border-teal-500/20' },
  purple: { header: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20', border: 'border-violet-500/20' },
};

function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CheckListDigital: React.FC<CheckListDigitalProps> = ({ onNavigate, user }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedPlaca, setSelectedPlaca] = useState('');
  const [combustible, setCombustible] = useState(50);
  const [horometro, setHorometro] = useState('');
  const [kmOdometro, setKmOdometro] = useState('');
  const [observacionesGlobales, setObservacionesGlobales] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fechaHora] = useState(new Date().toLocaleString('es-PE'));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(SECTIONS.map(s => s.id)));

  // Item states: map from itemId → { estado, observacion }
  const [itemsState, setItemsState] = useState<Record<string, { estado: EstadoItem; observacion: string }>>(
    ALL_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: { estado: 'OK', observacion: '' } }), {})
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | 'blocked'; message: string } | null>(null);
  const [blockedItems, setBlockedItems] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState<string | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasFirma, setHasFirma] = useState(false);

  // Init
  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const data = await api.getEquipos();
        setEquipos(data.filter(e => e.estado !== 'Fuera de servicio'));
        if (data.length > 0) setSelectedPlaca(data[0].placa);
      } catch {
        /* offline */
      } finally {
        setLoading(false);
      }
    };
    fetchEquipos();
    getCurrentLocation().then(setLocation);
    if (user?.nombre) setConductorName(`${user.nombre} ${user.apellido ?? ''}`.trim());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Canvas init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, [loading]);

  // Computed
  const criticalFailures = ALL_ITEMS.filter(
    item => item.critical && itemsState[item.id]?.estado === 'Falla Crítica'
  );
  const warnings = ALL_ITEMS.filter(
    item => itemsState[item.id]?.estado === 'Advertencia'
  );
  const okCount = ALL_ITEMS.filter(item => itemsState[item.id]?.estado === 'OK').length;
  const naCount = ALL_ITEMS.filter(item => itemsState[item.id]?.estado === 'N/A').length;
  const totalDefined = ALL_ITEMS.length - naCount;
  const completionPct = totalDefined > 0 ? Math.round((okCount / totalDefined) * 100) : 100;

  const overallStatus: 'OK' | 'Advertencia' | 'Bloqueado' =
    criticalFailures.length > 0 ? 'Bloqueado' :
    warnings.length > 0 ? 'Advertencia' : 'OK';

  // Item update
  const setItemEstado = (itemId: string, estado: EstadoItem) => {
    setItemsState(prev => ({ ...prev, [itemId]: { ...prev[itemId], estado } }));
  };

  const setItemObs = (itemId: string, obs: string) => {
    setItemsState(prev => ({ ...prev, [itemId]: { ...prev[itemId], observacion: obs } }));
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Signature
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasFirma(true);
    e.preventDefault();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasFirma(false);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaca) return alert('Seleccione un equipo.');
    if (!conductorName) return alert('Ingrese el nombre del operador.');

    // Auto-block check
    if (criticalFailures.length > 0) {
      const names = criticalFailures.map(i => i.label).join('\n• ');
      const confirmBlock = window.confirm(
        `⛔ ATENCIÓN: Se detectaron ${criticalFailures.length} FALLA(S) CRÍTICA(S):\n\n• ${names}\n\n` +
        `El equipo será BLOQUEADO automáticamente.\n` +
        `¿Desea registrar el checklist y bloquear el equipo?`
      );
      if (!confirmBlock) return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      const firmaBase64 = canvasRef.current?.toDataURL() ?? '';
      const checklistPayload = {
        placa: selectedPlaca,
        operadorNombre: conductorName,
        fecha: new Date().toISOString(),
        ubicacionLat: location?.lat ?? null,
        ubicacionLng: location?.lng ?? null,
        combustiblePct: combustible,
        horometroActual: horometro ? parseFloat(horometro) : null,
        kmOdometro: kmOdometro ? parseFloat(kmOdometro) : null,
        items: ALL_ITEMS.map(item => ({
          itemId: item.id,
          label: item.label,
          section: SECTIONS.find(s => s.items.find(i => i.id === item.id))?.title ?? '',
          critical: item.critical,
          estado: itemsState[item.id]?.estado ?? 'OK',
          observacion: itemsState[item.id]?.observacion ?? '',
        })),
        firmaBase64,
        observacionesGlobales,
        resultadoGlobal: overallStatus,
        fallasCount: criticalFailures.length,
        advertenciasCount: warnings.length,
      };

      if (isOnline) {
        await api.submitChecklist(checklistPayload);

        // Auto-block equipment on critical failures
        if (criticalFailures.length > 0) {
          try {
            await api.actualizarEstadoEquipo(selectedPlaca, 'Bloqueado por SSOMA');
            setBlockedItems(criticalFailures.map(i => i.label));
          } catch (err) {
            console.warn('No se pudo bloquear equipo via API:', err);
          }
        }

        setSubmitStatus({
          type: criticalFailures.length > 0 ? 'blocked' : 'success',
          message: criticalFailures.length > 0
            ? `⛔ Checklist registrado. Equipo ${selectedPlaca} BLOQUEADO por ${criticalFailures.length} falla(s) crítica(s). SSOMA notificado.`
            : `✅ Checklist registrado exitosamente. Equipo ${selectedPlaca} APROBADO para operación.`
        });
      } else {
        await offlineStorage.saveChecklist(checklistPayload);
        setSubmitStatus({
          type: 'success',
          message: '📴 Sin conexión. Checklist guardado localmente. Se sincronizará al recuperar señal.'
        });
      }
    } catch (err) {
      console.error(err);
      try {
        await offlineStorage.saveChecklist({ placa: selectedPlaca, error: String(err) });
      } catch {}
      setSubmitStatus({ type: 'error', message: 'Error al enviar. Se guardó copia offline.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">Cargando equipos...</span>
      </div>
    );
  }

  const sectionStats = (section: InspectionSection) => {
    const crit = section.items.filter(i => itemsState[i.id]?.estado === 'Falla Crítica').length;
    const adv = section.items.filter(i => itemsState[i.id]?.estado === 'Advertencia').length;
    const ok = section.items.filter(i => itemsState[i.id]?.estado === 'OK').length;
    return { crit, adv, ok };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">

      {/* Header Banner */}
      <div className={`rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden ${
        overallStatus === 'Bloqueado' ? 'bg-gradient-to-r from-rose-600 to-red-700 shadow-rose-600/20' :
        overallStatus === 'Advertencia' ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20' :
        'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">Checklist Pre-Operacional</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOnline ? 'bg-white/20' : 'bg-black/20'} flex items-center gap-1`}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? 'En línea' : 'Offline'}
                </span>
              </div>
              <p className="text-white/70 text-xs">F-CHK-006 · DS 024-2016-EM · 60 ítems en 7 secciones</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <p className="text-xl font-black text-emerald-200">{okCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">OK</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-black ${warnings.length > 0 ? 'text-amber-200' : 'text-white/30'}`}>{warnings.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Advertencias</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <p className={`text-xl font-black ${criticalFailures.length > 0 ? 'text-rose-200 animate-pulse' : 'text-white/30'}`}>{criticalFailures.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Fallas Crít.</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Progreso de Inspección</span>
            <span className="text-xs font-black">{completionPct}% ítems OK</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      </div>

      {/* Submit Result Banner */}
      {submitStatus && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${
          submitStatus.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' :
          submitStatus.type === 'blocked' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400' :
          'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400'
        }`}>
          {submitStatus.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> :
           submitStatus.type === 'blocked' ? <Lock className="h-5 w-5 shrink-0 mt-0.5" /> :
           <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />}
          <p className="text-sm font-semibold leading-relaxed">{submitStatus.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Header Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos de la Inspección</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipo / Placa <span className="text-rose-500">*</span></label>
              <select
                value={selectedPlaca}
                onChange={e => setSelectedPlaca(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              >
                <option value="">— Seleccione —</option>
                {equipos.map(e => (
                  <option key={e.placa} value={e.placa}>{e.placa} — {e.descripcion}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operador / Conductor <span className="text-rose-500">*</span></label>
              <input
                value={conductorName}
                onChange={e => setConductorName(e.target.value)}
                placeholder="Nombre completo..."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                {fechaHora}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horómetro Actual (hrs)</label>
              <input type="number" min={0} step={0.1} value={horometro} onChange={e => setHorometro(e.target.value)} placeholder="Ej. 4521.5" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Km Odómetro (si aplica)</label>
              <input type="number" min={0} value={kmOdometro} onChange={e => setKmOdometro(e.target.value)} placeholder="Ej. 87432" className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Fuel className="h-3 w-3 inline mr-1" />Combustible — {combustible}%
              </label>
              <input type="range" min={0} max={100} step={5} value={combustible} onChange={e => setCombustible(Number(e.target.value))}
                className="w-full h-2 accent-emerald-500 cursor-pointer" />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Vacío</span><span>1/4</span><span>1/2</span><span>3/4</span><span>Lleno</span>
              </div>
            </div>
          </div>
          {location && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
              GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
          )}
        </div>

        {/* ── Inspection Sections ── */}
        {SECTIONS.map(section => {
          const stats = sectionStats(section);
          const colors = sectionColorMap[section.color];
          const isExpanded = expandedSections.has(section.id);

          return (
            <div key={section.id} className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden ${
              stats.crit > 0 ? 'border-rose-500/30' : stats.adv > 0 ? 'border-amber-500/30' : 'border-slate-100 dark:border-slate-800'
            }`}>
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-4 border-b ${colors.header} ${colors.border} transition-colors hover:opacity-90`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{section.icon}</span>
                  <div className="text-left">
                    <h3 className="font-bold text-sm">{section.title}</h3>
                    <p className="text-[10px] opacity-70">{section.items.length} ítems</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stats.crit > 0 && <span className="text-xs font-black px-2 py-0.5 bg-rose-500 text-white rounded-full animate-pulse">{stats.crit} CRÍTICA{stats.crit > 1 ? 'S' : ''}</span>}
                  {stats.adv > 0 && <span className="text-xs font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full">{stats.adv} adv.</span>}
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full">{stats.ok} ok</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 opacity-60" /> : <ChevronDown className="h-4 w-4 opacity-60" />}
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {section.items.map((item, idx) => {
                    const state = itemsState[item.id];
                    const config = ESTADO_CONFIG[state?.estado ?? 'OK'];
                    const isHelp = showHelp === item.id;

                    return (
                      <div key={item.id} className={`p-3 md:p-4 ${state?.estado === 'Falla Crítica' ? 'bg-rose-50/50 dark:bg-rose-950/10' : state?.estado === 'Advertencia' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 pt-2.5 w-5 shrink-0 text-right">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${config.dot}`} />
                                <p className={`text-sm font-semibold leading-snug ${item.critical ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {item.label}
                                  {item.critical && <span className="ml-1.5 text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">CRÍTICO</span>}
                                </p>
                                {item.helpText && (
                                  <button type="button" onClick={() => setShowHelp(isHelp ? null : item.id)} className="text-slate-300 hover:text-indigo-500 transition-colors shrink-0">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              {/* Estado buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                {(['OK', 'Advertencia', 'Falla Crítica', 'N/A'] as EstadoItem[]).map(opt => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setItemEstado(item.id, opt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                      state?.estado === opt
                                        ? ESTADO_CONFIG[opt].cls + ' shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                                    }`}
                                  >
                                    {ESTADO_CONFIG[opt].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {isHelp && item.helpText && (
                              <div className="mt-2 ml-4 p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                💡 {item.helpText}
                              </div>
                            )}
                            {(state?.estado === 'Advertencia' || state?.estado === 'Falla Crítica') && (
                              <textarea
                                value={state.observacion}
                                onChange={e => setItemObs(item.id, e.target.value)}
                                placeholder="Describa el problema observado..."
                                rows={1}
                                className={`mt-2 ml-4 w-[calc(100%-1rem)] px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 bg-transparent resize-none ${
                                  state.estado === 'Falla Crítica'
                                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/30 placeholder-rose-400'
                                    : 'border-amber-300 dark:border-amber-700 focus:ring-amber-500/30 placeholder-amber-400'
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Critical failures alert */}
        {criticalFailures.length > 0 && (
          <div className="bg-rose-600 text-white rounded-2xl p-5 shadow-xl shadow-rose-600/20">
            <div className="flex items-start gap-3">
              <Lock className="h-6 w-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-base">⛔ EQUIPO SERÁ BLOQUEADO</h3>
                <p className="text-rose-100 text-sm mt-1">Se detectaron {criticalFailures.length} falla(s) crítica(s). Al enviar, el equipo será marcado como "Bloqueado por SSOMA" y el personal de seguridad será notificado.</p>
                <ul className="mt-2 space-y-1">
                  {criticalFailures.map(i => (
                    <li key={i.id} className="text-xs text-rose-200 flex items-center gap-2">
                      <X className="h-3 w-3" /> {i.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Observaciones generales */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Observaciones Generales</label>
          <textarea
            value={observacionesGlobales}
            onChange={e => setObservacionesGlobales(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
            placeholder="Notas adicionales del operador..."
          />
        </div>

        {/* Firma Digital */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-slate-400" />
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firma Digital del Operador</label>
            </div>
            <div className="flex items-center gap-3">
              {hasFirma && <span className="text-[10px] text-emerald-500 font-bold">✓ Firmado</span>}
              <button type="button" onClick={clearCanvas} className="text-xs text-rose-500 hover:underline font-semibold">Limpiar</button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={700}
            height={120}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            className="w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 cursor-crosshair"
          />
          <p className="text-[10px] text-slate-400 mt-1">Al firmar, el operador declara haber inspeccionado el equipo y es responsable de la información consignada.</p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Resumen de Inspección</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Ítems', val: ALL_ITEMS.length, cls: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800' },
              { label: 'OK / Conforme', val: okCount, cls: 'text-emerald-600 bg-emerald-500/10' },
              { label: 'Advertencias', val: warnings.length, cls: warnings.length > 0 ? 'text-amber-600 bg-amber-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800' },
              { label: 'Fallas Críticas', val: criticalFailures.length, cls: criticalFailures.length > 0 ? 'text-rose-600 bg-rose-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
                <p className="text-2xl font-black">{s.val}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
          <div className={`mt-3 p-3 rounded-xl text-center font-black text-sm border ${
            overallStatus === 'Bloqueado' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
            overallStatus === 'Advertencia' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            {overallStatus === 'Bloqueado' && '⛔ RESULTADO: EQUIPO BLOQUEADO — NO OPERAR'}
            {overallStatus === 'Advertencia' && '⚠ RESULTADO: CON OBSERVACIONES — REPORTAR A SSOMA'}
            {overallStatus === 'OK' && '✅ RESULTADO: EQUIPO APROBADO PARA OPERACIÓN'}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="text-xs text-slate-400">
            {!isOnline && <span className="flex items-center gap-1"><WifiOff className="h-3.5 w-3.5" /> Se guardará sin conexión</span>}
          </div>
          <button
            type="submit"
            disabled={submitting || !selectedPlaca}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
              criticalFailures.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
            }`}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : criticalFailures.length > 0 ? (
              <><Lock className="h-4 w-4" /> Registrar y Bloquear Equipo</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar Checklist</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
