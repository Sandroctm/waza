import React, { useState, useEffect, useRef } from 'react';
import {
  Users, PlusCircle, Trash2, Save, FileText, Lock, Link2,
  ChevronDown, ChevronRight, Vote, CalendarClock, UserCheck,
  ShieldCheck, AlertTriangle, CheckCircle2, X, Edit3, Search,
  Eye, ClipboardList
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Accionista {
  id: string;
  tipoDocumento: 'DNI' | 'CE' | 'Pasaporte';
  numeroDocumento: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  estadoCivil: string;
  direccion: string;
  telefono: string;
  email: string;
  fotoUrl: string;
  emergenciaNombre: string;
  emergenciaParentesco: string;
  emergenciaTelefono: string;
  numAcciones: number;
  porcentaje: number;
  fechaInscripcion: string;
  estadoCuenta: 'Al día' | 'Moroso';
  sancionesVigentes: boolean;
  representanteLegal: boolean;
  capacidadLegal: 'Activa' | 'Suspendida';
  obligacionesAlDia: boolean;
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  firmaUrl: string;
  fechaFirma: string;
}

interface AgendaItem {
  id: string;
  orden: number;
  titulo: string;
  ponente: string;
  tiempoMin: number;
  estado: 'Pendiente' | 'En Curso' | 'Finalizado';
}

interface JuntaGeneral {
  id: string;
  tipo: 'Ordinaria' | 'Extraordinaria';
  fecha: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  quorumRequerido: number;
  quorumPresente: number;
  agenda: AgendaItem[];
  notificaEmail: boolean;
  notificaSms: boolean;
  notificaWhatsapp: boolean;
  notificaPortal: boolean;
  fechaEnvio: string;
  horaEnvio: string;
  estado: 'Borrador' | 'Enviada' | 'En Sesión' | 'Cerrada';
}

interface VotoRegistro {
  accionistaId: string;
  accionistaNombre: string;
  voto: 'Favor' | 'Contra' | 'Abstención';
  fechaHora: string;
  verificado: boolean;
}

interface Votacion {
  id: string;
  juntaId: string;
  numAcuerdo: number;
  descripcion: string;
  tipoVotacion: 'Mayoría Simple' | 'Mayoría Calificada' | 'Unanimidad';
  votos: VotoRegistro[];
  resultado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Empate';
  fechaImplementacion: string;
  responsable: string;
  cerrado: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  accionistas: 'sigecosem_accionistas',
  juntas: 'sigecosem_juntas',
  votaciones: 'sigecosem_votaciones',
};

function loadFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function calcEdad(fechaNac: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--;
  return edad;
}

const ESTADOCIVIL_OPTIONS = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Conviviente'];

// ─── Subcomponents ────────────────────────────────────────────────────────────

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${color}`}>
    {children}
  </span>
);

const accionistaBadge = (estado: string) => {
  if (estado === 'Activo') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (estado === 'Suspendido') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const juntaBadge = (estado: string) => {
  if (estado === 'Cerrada') return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  if (estado === 'En Sesión') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse';
  if (estado === 'Enviada') return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
  return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
};

const resultadoBadge = (resultado: string) => {
  if (resultado === 'Aprobado') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (resultado === 'Rechazado') return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  if (resultado === 'Empate') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

// ─── Form Field ───────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all";
const selectCls = inputCls;

// ─── Signature Pad ────────────────────────────────────────────────────────────

const SignaturePad: React.FC<{ onSave?: (base64: string) => void }> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stop = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const data = canvasRef.current?.toDataURL() ?? '';
    onSave?.(data);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
          className="w-full border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 cursor-crosshair"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] text-slate-300 font-medium select-none">
          ✍️ Dibuje su firma aquí
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="text-xs text-rose-500 hover:underline font-semibold">Limpiar</button>
        <button type="button" onClick={save} className="text-xs text-violet-600 hover:underline font-semibold">Guardar Firma</button>
      </div>
    </div>
  );
};

// ─── F-ACC-001 ACCIONISTAS ────────────────────────────────────────────────────

const FormAccionista: React.FC<{
  accionistas: Accionista[];
  totalAcciones: number;
  onSave: (a: Accionista) => void;
  editando?: Accionista | null;
  onCancelar: () => void;
}> = ({ accionistas, totalAcciones, onSave, editando, onCancelar }) => {

  const blank: Accionista = {
    id: uid(), tipoDocumento: 'DNI', numeroDocumento: '', apellidoPaterno: '', apellidoMaterno: '',
    nombres: '', fechaNacimiento: '', sexo: 'M', estadoCivil: 'Soltero/a', direccion: '', telefono: '',
    email: '', fotoUrl: '', emergenciaNombre: '', emergenciaParentesco: '', emergenciaTelefono: '',
    numAcciones: 0, porcentaje: 0, fechaInscripcion: new Date().toISOString().split('T')[0],
    estadoCuenta: 'Al día', sancionesVigentes: false, representanteLegal: false,
    capacidadLegal: 'Activa', obligacionesAlDia: true, estado: 'Activo', firmaUrl: '', fechaFirma: ''
  };

  const [form, setForm] = useState<Accionista>(editando ?? blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setForm(editando ?? blank); }, [editando]);

  const totalAcc = totalAcciones + (editando ? 0 : form.numAcciones);

  const set = (key: keyof Accionista, val: unknown) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-calc percentage
      if (key === 'numAcciones') {
        const total = accionistas.reduce((s, a) => s + (a.id !== next.id ? a.numAcciones : 0), 0) + Number(val);
        next.porcentaje = total > 0 ? Math.round((Number(val) / total) * 10000) / 100 : 0;
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.numeroDocumento) e.dni = 'Requerido';
    if (!editando && accionistas.find(a => a.numeroDocumento === form.numeroDocumento)) e.dni = 'DNI ya registrado';
    if (!form.nombres) e.nombres = 'Requerido';
    if (!form.apellidoPaterno) e.apellidoPaterno = 'Requerido';
    if (form.fechaNacimiento && calcEdad(form.fechaNacimiento) < 18) e.fechaNacimiento = 'Debe ser mayor de 18 años';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email inválido';
    if (form.numAcciones <= 0) e.numAcciones = 'Debe ser > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-violet-500/10 rounded-xl text-violet-600"><UserCheck className="h-5 w-5" /></div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{editando ? 'Editar Accionista' : 'Nuevo Accionista'} — F-ACC-001</h3>
          <p className="text-[11px] text-slate-400">Complete todos los campos marcados con *</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DATOS PERSONALES */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos Personales</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo Documento" required>
              <select className={selectCls} value={form.tipoDocumento} onChange={e => set('tipoDocumento', e.target.value)}>
                <option>DNI</option><option>CE</option><option>Pasaporte</option>
              </select>
            </FormField>
            <FormField label="N° Documento" required>
              <input className={`${inputCls} ${errors.dni ? 'border-rose-400' : ''}`} value={form.numeroDocumento} onChange={e => set('numeroDocumento', e.target.value)} />
              {errors.dni && <p className="text-rose-500 text-[10px]">{errors.dni}</p>}
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Apellido Paterno" required>
              <input className={`${inputCls} ${errors.apellidoPaterno ? 'border-rose-400' : ''}`} value={form.apellidoPaterno} onChange={e => set('apellidoPaterno', e.target.value)} />
            </FormField>
            <FormField label="Apellido Materno">
              <input className={inputCls} value={form.apellidoMaterno} onChange={e => set('apellidoMaterno', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Nombres" required>
            <input className={`${inputCls} ${errors.nombres ? 'border-rose-400' : ''}`} value={form.nombres} onChange={e => set('nombres', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Fecha Nac." required>
              <input type="date" className={`${inputCls} ${errors.fechaNacimiento ? 'border-rose-400' : ''}`} value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} />
              {errors.fechaNacimiento && <p className="text-rose-500 text-[10px]">{errors.fechaNacimiento}</p>}
            </FormField>
            <FormField label="Sexo">
              <select className={selectCls} value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                <option value="M">M</option><option value="F">F</option>
              </select>
            </FormField>
            <FormField label="Estado Civil">
              <select className={selectCls} value={form.estadoCivil} onChange={e => set('estadoCivil', e.target.value)}>
                {ESTADOCIVIL_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Dirección">
            <input className={inputCls} value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono">
              <input className={inputCls} value={form.telefono} onChange={e => set('telefono', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input type="email" className={`${inputCls} ${errors.email ? 'border-rose-400' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <p className="text-rose-500 text-[10px]">{errors.email}</p>}
            </FormField>
          </div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">Contacto de Emergencia</h4>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Nombre">
              <input className={inputCls} value={form.emergenciaNombre} onChange={e => set('emergenciaNombre', e.target.value)} />
            </FormField>
            <FormField label="Parentesco">
              <input className={inputCls} value={form.emergenciaParentesco} onChange={e => set('emergenciaParentesco', e.target.value)} />
            </FormField>
            <FormField label="Teléfono">
              <input className={inputCls} value={form.emergenciaTelefono} onChange={e => set('emergenciaTelefono', e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* DATOS DE PARTICIPACIÓN */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos de Participación</h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="N° Acciones" required>
              <input type="number" min={1} className={`${inputCls} ${errors.numAcciones ? 'border-rose-400' : ''}`} value={form.numAcciones} onChange={e => set('numAcciones', Number(e.target.value))} />
              {errors.numAcciones && <p className="text-rose-500 text-[10px]">{errors.numAcciones}</p>}
            </FormField>
            <FormField label="Porcentaje (auto)">
              <div className={`${inputCls} bg-slate-100 dark:bg-slate-900 text-violet-600 font-bold`}>{form.porcentaje.toFixed(2)}%</div>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fecha Inscripción">
              <input type="date" className={inputCls} value={form.fechaInscripcion} onChange={e => set('fechaInscripcion', e.target.value)} />
            </FormField>
            <FormField label="Estado Cuenta">
              <select className={selectCls} value={form.estadoCuenta} onChange={e => set('estadoCuenta', e.target.value as any)}>
                <option>Al día</option><option>Moroso</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Capacidad Legal">
              <select className={selectCls} value={form.capacidadLegal} onChange={e => set('capacidadLegal', e.target.value as any)}>
                <option>Activa</option><option>Suspendida</option>
              </select>
            </FormField>
            <FormField label="Estado">
              <select className={selectCls} value={form.estado} onChange={e => set('estado', e.target.value as any)}>
                <option>Activo</option><option>Inactivo</option><option>Suspendido</option>
              </select>
            </FormField>
          </div>
          {/* Toggle flags */}
          <div className="space-y-2 pt-1">
            {([
              ['sancionesVigentes', 'Sanciones Vigentes'],
              ['representanteLegal', 'Representante Legal'],
              ['obligacionesAlDia', 'Obligaciones al Día'],
            ] as [keyof Accionista, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                <div
                  onClick={() => set(key, !form[key])}
                  className={`w-10 h-5 rounded-full relative transition-colors ${form[key] ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            ))}
          </div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">Firma Digital</h4>
          <SignaturePad onSave={b64 => set('firmaUrl', b64)} />
          {form.firmaUrl && <p className="text-[10px] text-emerald-500 font-semibold">✓ Firma registrada</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancelar} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 transition-all">
          <Save className="h-4 w-4" /> Guardar Accionista
        </button>
      </div>
    </form>
  );
};

// ─── F-JGA-002 JUNTA GENERAL ──────────────────────────────────────────────────

const FormJunta: React.FC<{
  accionistas: Accionista[];
  onSave: (j: JuntaGeneral) => void;
  editando?: JuntaGeneral | null;
  onCancelar: () => void;
}> = ({ accionistas, onSave, editando, onCancelar }) => {

  const blank: JuntaGeneral = {
    id: uid(), tipo: 'Ordinaria', fecha: new Date().toISOString().split('T')[0],
    horaInicio: '09:00', horaFin: '12:00', lugar: '', quorumRequerido: 51, quorumPresente: 0,
    agenda: [], notificaEmail: true, notificaSms: false, notificaWhatsapp: true, notificaPortal: true,
    fechaEnvio: '', horaEnvio: '08:00', estado: 'Borrador'
  };

  const [form, setForm] = useState<JuntaGeneral>(editando ?? blank);

  useEffect(() => { setForm(editando ?? blank); }, [editando]);

  const set = (key: keyof JuntaGeneral, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const addAgenda = () => {
    const item: AgendaItem = { id: uid(), orden: form.agenda.length + 1, titulo: '', ponente: '', tiempoMin: 15, estado: 'Pendiente' };
    set('agenda', [...form.agenda, item]);
  };

  const updateAgenda = (id: string, key: keyof AgendaItem, val: unknown) => {
    set('agenda', form.agenda.map(a => a.id === id ? { ...a, [key]: val } : a));
  };

  const removeAgenda = (id: string) => {
    set('agenda', form.agenda.filter(a => a.id !== id));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const ponentes = accionistas.map(a => `${a.nombres} ${a.apellidoPaterno}`);

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600"><CalendarClock className="h-5 w-5" /></div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{editando ? 'Editar Junta' : 'Nueva Convocatoria'} — F-JGA-002</h3>
          <p className="text-[11px] text-slate-400">Convocatoria de Junta General de Accionistas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField label="Tipo Junta" required>
          <select className={selectCls} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option>Ordinaria</option><option>Extraordinaria</option>
          </select>
        </FormField>
        <FormField label="Fecha" required>
          <input type="date" className={inputCls} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
        </FormField>
        <FormField label="Hora Inicio">
          <input type="time" className={inputCls} value={form.horaInicio} onChange={e => set('horaInicio', e.target.value)} />
        </FormField>
        <FormField label="Hora Fin">
          <input type="time" className={inputCls} value={form.horaFin} onChange={e => set('horaFin', e.target.value)} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Lugar" required>
          <input className={inputCls} placeholder="Ej. Sala de Directorio, Sede Principal" value={form.lugar} onChange={e => set('lugar', e.target.value)} />
        </FormField>
        <FormField label="Quórum Requerido (%)">
          <input type="number" min={1} max={100} className={inputCls} value={form.quorumRequerido} onChange={e => set('quorumRequerido', Number(e.target.value))} />
        </FormField>
        <FormField label="Estado">
          <select className={selectCls} value={form.estado} onChange={e => set('estado', e.target.value as any)}>
            <option>Borrador</option><option>Enviada</option><option>En Sesión</option><option>Cerrada</option>
          </select>
        </FormField>
      </div>

      {/* Agenda dinámica */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agenda</h4>
          <button type="button" onClick={addAgenda} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
            <PlusCircle className="h-4 w-4" /> Agregar Ítem
          </button>
        </div>
        {form.agenda.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            Sin ítems de agenda. Haga clic en "Agregar Ítem".
          </div>
        )}
        {form.agenda.map((item, idx) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="col-span-1 pt-2.5 text-xs font-bold text-slate-400 text-center">{idx + 1}</div>
            <div className="col-span-5">
              <input className={inputCls} placeholder="Título del punto de agenda..." value={item.titulo} onChange={e => updateAgenda(item.id, 'titulo', e.target.value)} />
            </div>
            <div className="col-span-3">
              <select className={selectCls} value={item.ponente} onChange={e => updateAgenda(item.id, 'ponente', e.target.value)}>
                <option value="">Ponente...</option>
                {ponentes.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <div className="relative">
                <input type="number" min={1} className={inputCls} value={item.tiempoMin} onChange={e => updateAgenda(item.id, 'tiempoMin', Number(e.target.value))} />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">min</span>
              </div>
            </div>
            <button type="button" onClick={() => removeAgenda(item.id)} className="col-span-1 pt-2.5 text-slate-300 hover:text-rose-500 transition-colors flex justify-center">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Medios de convocatoria */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medios de Convocatoria</h4>
        <div className="flex flex-wrap gap-4">
          {([
            ['notificaEmail', '📧 Email'],
            ['notificaSms', '📱 SMS'],
            ['notificaWhatsapp', '💬 WhatsApp'],
            ['notificaPortal', '🌐 Portal Web'],
          ] as [keyof JuntaGeneral, string][]).map(([key, label]) => (
            <label key={key} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all text-sm font-semibold select-none ${form[key] ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}>
              <input type="checkbox" className="hidden" checked={form[key] as boolean} onChange={e => set(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancelar} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all">
          <Save className="h-4 w-4" /> {editando ? 'Actualizar' : 'Crear Convocatoria'}
        </button>
      </div>
    </form>
  );
};

// ─── F-VOT-003 VOTACIONES ─────────────────────────────────────────────────────

const TabVotaciones: React.FC<{
  accionistas: Accionista[];
  juntas: JuntaGeneral[];
  votaciones: Votacion[];
  onSave: (v: Votacion) => void;
}> = ({ accionistas, juntas, votaciones, onSave }) => {

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Votacion | null>(null);

  const blank: Votacion = {
    id: uid(), juntaId: juntas[0]?.id ?? '', numAcuerdo: 1, descripcion: '',
    tipoVotacion: 'Mayoría Simple', votos: [], resultado: 'Pendiente',
    fechaImplementacion: '', responsable: '', cerrado: false
  };

  const [form, setForm] = useState<Votacion>(blank);

  const calcResultado = (votos: VotoRegistro[], tipo: string): Votacion['resultado'] => {
    const favor = votos.filter(v => v.voto === 'Favor').length;
    const contra = votos.filter(v => v.voto === 'Contra').length;
    const total = votos.length;
    if (total === 0) return 'Pendiente';
    if (tipo === 'Unanimidad') return favor === total ? 'Aprobado' : 'Rechazado';
    if (tipo === 'Mayoría Calificada') return (favor / total) >= 0.67 ? 'Aprobado' : 'Rechazado';
    if (favor > contra) return 'Aprobado';
    if (contra > favor) return 'Rechazado';
    return 'Empate';
  };

  const registrarVoto = (accionistaId: string, voto: 'Favor' | 'Contra' | 'Abstención') => {
    const accionista = accionistas.find(a => a.id === accionistaId);
    if (!accionista) return;
    const nuevosVotos = form.votos.filter(v => v.accionistaId !== accionistaId).concat({
      accionistaId,
      accionistaNombre: `${accionista.nombres} ${accionista.apellidoPaterno}`,
      voto,
      fechaHora: new Date().toLocaleString('es-PE'),
      verificado: true
    });
    const resultado = calcResultado(nuevosVotos, form.tipoVotacion);
    setForm(prev => ({ ...prev, votos: nuevosVotos, resultado }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setForm(blank);
    setShowForm(false);
  };

  const accionistasActivos = accionistas.filter(a => a.estado === 'Activo');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Votaciones Electrónicas — F-VOT-003</h3>
          <p className="text-xs text-slate-400 mt-0.5">Registro digital de votos con firma verificada</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(blank); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow transition-all">
          <PlusCircle className="h-4 w-4" /> Nueva Votación
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Sesión de Junta">
              <select className={selectCls} value={form.juntaId} onChange={e => setForm(p => ({ ...p, juntaId: e.target.value }))}>
                {juntas.map(j => <option key={j.id} value={j.id}>{j.tipo} — {j.fecha}</option>)}
                {juntas.length === 0 && <option value="">Sin juntas registradas</option>}
              </select>
            </FormField>
            <FormField label="N° Acuerdo">
              <input type="number" min={1} className={inputCls} value={form.numAcuerdo} onChange={e => setForm(p => ({ ...p, numAcuerdo: Number(e.target.value) }))} />
            </FormField>
            <FormField label="Tipo Votación">
              <select className={selectCls} value={form.tipoVotacion} onChange={e => setForm(p => ({ ...p, tipoVotacion: e.target.value as any }))}>
                <option>Mayoría Simple</option><option>Mayoría Calificada</option><option>Unanimidad</option>
              </select>
            </FormField>
          </div>
          <FormField label="Descripción del Acuerdo" required>
            <textarea className={inputCls} rows={2} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Describa el acuerdo a votar..." />
          </FormField>

          {/* Tabla de votación */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registro de Votos</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr className="text-[10px] text-slate-400 uppercase font-bold">
                    <th className="px-4 py-3 text-left">Accionista</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                    <th className="px-4 py-3 text-center">Registrar Voto</th>
                    <th className="px-4 py-3 text-center">Voto</th>
                    <th className="px-4 py-3 text-center">Fecha/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accionistasActivos.map(a => {
                    const votoActual = form.votos.find(v => v.accionistaId === a.id);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {a.nombres} {a.apellidoPaterno}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-500">{a.numAcciones}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {(['Favor', 'Contra', 'Abstención'] as const).map(opt => (
                              <button key={opt} type="button" onClick={() => registrarVoto(a.id, opt)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                  votoActual?.voto === opt
                                    ? opt === 'Favor' ? 'bg-emerald-500 text-white border-emerald-500' :
                                      opt === 'Contra' ? 'bg-rose-500 text-white border-rose-500' :
                                      'bg-slate-400 text-white border-slate-400'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                                }`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {votoActual ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              votoActual.voto === 'Favor' ? 'text-emerald-600 bg-emerald-500/10' :
                              votoActual.voto === 'Contra' ? 'text-rose-600 bg-rose-500/10' :
                              'text-slate-500 bg-slate-100'}`}>
                              <ShieldCheck className="h-3 w-3" /> {votoActual.voto}
                            </span>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] text-slate-400">{votoActual?.fechaHora ?? '—'}</td>
                      </tr>
                    );
                  })}
                  {accionistasActivos.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-slate-400 text-xs">Sin accionistas activos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Resultado en tiempo real */}
            {form.votos.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'A Favor', val: form.votos.filter(v => v.voto === 'Favor').length, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'En Contra', val: form.votos.filter(v => v.voto === 'Contra').length, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
                  { label: 'Abstenciones', val: form.votos.filter(v => v.voto === 'Abstención').length, color: 'text-slate-500 bg-slate-100 border-slate-200' },
                  { label: 'Resultado', val: form.resultado, color: resultadoBadge(form.resultado) },
                ].map(stat => (
                  <div key={stat.label} className={`p-3 rounded-xl border text-center ${stat.color}`}>
                    <p className="text-xl font-black">{stat.val}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow transition-all">
              <Lock className="h-4 w-4" /> Registrar Votación
            </button>
          </div>
        </form>
      )}

      {/* Lista de votaciones */}
      <div className="space-y-3">
        {votaciones.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <Vote className="h-8 w-8 mx-auto mb-3 text-slate-300" />
            No hay votaciones registradas aún.
          </div>
        )}
        {votaciones.map(v => {
          const junta = juntas.find(j => j.id === v.juntaId);
          return (
            <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-shadow">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Acuerdo #{v.numAcuerdo}</span>
                  <Badge color={resultadoBadge(v.resultado)}>{v.resultado}</Badge>
                  {v.cerrado && <Badge color="bg-slate-100 text-slate-500 border-slate-200">🔒 Cerrado</Badge>}
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{v.descripcion}</p>
                <p className="text-[11px] text-slate-400">{junta ? `${junta.tipo} — ${junta.fecha}` : 'Sin sesión'} · {v.tipoVotacion}</p>
              </div>
              <div className="flex items-center gap-4 text-center shrink-0">
                <div>
                  <p className="text-lg font-black text-emerald-600">{v.votos.filter(x => x.voto === 'Favor').length}</p>
                  <p className="text-[10px] text-slate-400 font-bold">FAVOR</p>
                </div>
                <div>
                  <p className="text-lg font-black text-rose-500">{v.votos.filter(x => x.voto === 'Contra').length}</p>
                  <p className="text-[10px] text-slate-400 font-bold">CONTRA</p>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-400">{v.votos.filter(x => x.voto === 'Abstención').length}</p>
                  <p className="text-[10px] text-slate-400 font-bold">ABST.</p>
                </div>
                <button className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors">
                  <Link2 className="h-4 w-4" title="Registro Blockchain" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const Gobernanza: React.FC = () => {
  const [tab, setTab] = useState<'accionistas' | 'juntas' | 'votaciones'>('accionistas');
  const [accionistas, setAccionistas] = useState<Accionista[]>(() => loadFromStorage(STORAGE_KEYS.accionistas, []));
  const [juntas, setJuntas] = useState<JuntaGeneral[]>(() => loadFromStorage(STORAGE_KEYS.juntas, []));
  const [votaciones, setVotaciones] = useState<Votacion[]>(() => loadFromStorage(STORAGE_KEYS.votaciones, []));

  const [showAccForm, setShowAccForm] = useState(false);
  const [showJuntaForm, setShowJuntaForm] = useState(false);
  const [editAcc, setEditAcc] = useState<Accionista | null>(null);
  const [editJunta, setEditJunta] = useState<JuntaGeneral | null>(null);
  const [search, setSearch] = useState('');

  const persist = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, val: T) => {
    setter(val);
    saveToStorage(key, val);
  };

  const saveAccionista = (a: Accionista) => {
    const updated = editAcc
      ? accionistas.map(x => x.id === a.id ? a : x)
      : [...accionistas, a];
    persist(STORAGE_KEYS.accionistas, setAccionistas, updated);
    setShowAccForm(false);
    setEditAcc(null);
  };

  const deleteAccionista = (id: string) => {
    if (!confirm('¿Eliminar accionista?')) return;
    persist(STORAGE_KEYS.accionistas, setAccionistas, accionistas.filter(a => a.id !== id));
  };

  const saveJunta = (j: JuntaGeneral) => {
    const updated = editJunta
      ? juntas.map(x => x.id === j.id ? j : x)
      : [...juntas, j];
    persist(STORAGE_KEYS.juntas, setJuntas, updated);
    setShowJuntaForm(false);
    setEditJunta(null);
  };

  const saveVotacion = (v: Votacion) => {
    const updated = [...votaciones.filter(x => x.id !== v.id), v];
    persist(STORAGE_KEYS.votaciones, setVotaciones, updated);
  };

  const totalAcciones = accionistas.reduce((s, a) => s + a.numAcciones, 0);
  const filteredAcc = accionistas.filter(a =>
    `${a.nombres} ${a.apellidoPaterno} ${a.numeroDocumento}`.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id: 'accionistas', label: 'Accionistas', icon: Users, count: accionistas.length },
    { id: 'juntas', label: 'Juntas Generales', icon: CalendarClock, count: juntas.length },
    { id: 'votaciones', label: 'Votaciones', icon: Vote, count: votaciones.length },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-violet-600/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Gobernanza Corporativa</h1>
            <p className="text-violet-200 text-sm">ECOSEM Pucará-Morococha S.A. — Gestión de Accionistas, Juntas y Votaciones</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Accionistas Activos', val: accionistas.filter(a => a.estado === 'Activo').length },
            { label: 'Total Acciones', val: totalAcciones.toLocaleString() },
            { label: 'Juntas Realizadas', val: juntas.filter(j => j.estado === 'Cerrada').length },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-black">{s.val}</p>
              <p className="text-[11px] text-violet-200 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm shrink-0 transition-colors ${
                tab === t.id
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}>
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: ACCIONISTAS ── */}
      {tab === 'accionistas' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 w-64" placeholder="Buscar accionista..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => { setShowAccForm(true); setEditAcc(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow transition-all">
              <PlusCircle className="h-4 w-4" /> Registrar Accionista
            </button>
          </div>

          {(showAccForm || editAcc) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <FormAccionista
                accionistas={accionistas}
                totalAcciones={totalAcciones}
                onSave={saveAccionista}
                editando={editAcc}
                onCancelar={() => { setShowAccForm(false); setEditAcc(null); }}
              />
            </div>
          )}

          {/* Table */}
          {filteredAcc.length === 0 && !showAccForm ? (
            <div className="text-center py-14 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">Sin accionistas registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr className="text-[10px] text-slate-400 uppercase font-bold">
                    <th className="px-4 py-3 text-left">Accionista</th>
                    <th className="px-4 py-3 text-left">Documento</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                    <th className="px-4 py-3 text-center">%</th>
                    <th className="px-4 py-3 text-center">Estado Cuenta</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAcc.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {a.nombres[0]}{a.apellidoPaterno[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}</p>
                            <p className="text-[10px] text-slate-400">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{a.tipoDocumento}: {a.numeroDocumento}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200 text-xs">{a.numAcciones.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full">{a.porcentaje.toFixed(2)}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={a.estadoCuenta === 'Al día' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}>
                          {a.estadoCuenta}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge color={accionistaBadge(a.estado)}>{a.estado}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditAcc(a); setShowAccForm(false); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteAccionista(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: JUNTAS ── */}
      {tab === 'juntas' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => { setShowJuntaForm(true); setEditJunta(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow transition-all">
              <PlusCircle className="h-4 w-4" /> Nueva Convocatoria
            </button>
          </div>

          {(showJuntaForm || editJunta) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <FormJunta accionistas={accionistas} onSave={saveJunta} editando={editJunta} onCancelar={() => { setShowJuntaForm(false); setEditJunta(null); }} />
            </div>
          )}

          {juntas.length === 0 && !showJuntaForm ? (
            <div className="text-center py-14 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">Sin juntas registradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {juntas.map(j => (
                <div key={j.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge color={juntaBadge(j.estado)}>{j.estado}</Badge>
                        <span className="text-[11px] text-slate-400 font-semibold">{j.tipo}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{j.fecha} — {j.horaInicio} a {j.horaFin}</h4>
                      <p className="text-xs text-slate-400">📍 {j.lugar || 'Sin lugar definido'}</p>
                      <p className="text-xs text-slate-500">Quórum requerido: <span className="font-bold text-slate-700 dark:text-slate-300">{j.quorumRequerido}%</span></p>
                      <p className="text-xs text-slate-500">Puntos de agenda: <span className="font-bold text-slate-700 dark:text-slate-300">{j.agenda.length}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditJunta(j); setShowJuntaForm(false); }} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => {
                        if (!confirm('¿Eliminar junta?')) return;
                        persist(STORAGE_KEYS.juntas, setJuntas, juntas.filter(x => x.id !== j.id));
                      }} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {j.agenda.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      {j.agenda.slice(0, 3).map((item, idx) => (
                        <div key={item.id} className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">{idx + 1}</span>
                          {item.titulo || 'Sin título'} {item.tiempoMin && `(${item.tiempoMin}min)`}
                        </div>
                      ))}
                      {j.agenda.length > 3 && <p className="text-[10px] text-slate-400">+{j.agenda.length - 3} más...</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: VOTACIONES ── */}
      {tab === 'votaciones' && (
        <TabVotaciones accionistas={accionistas} juntas={juntas} votaciones={votaciones} onSave={saveVotacion} />
      )}
    </div>
  );
};
