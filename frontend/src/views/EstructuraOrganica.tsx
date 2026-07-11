import React, { useState, useEffect } from 'react';
import {
  Network, PlusCircle, Trash2, Save, Search, Edit3, ChevronDown,
  ChevronUp, User, Briefcase, Target, BarChart2, Shield, BookOpen,
  Award, Settings2, MapPin, X, CheckSquare
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPI {
  id: string;
  nombre: string;
  formula: string;
  frecuencia: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';
  meta: string;
  peso: number;
}

interface Puesto {
  id: string;
  denominacion: string;
  codigo: string;
  area: string;
  reportaA: string;
  supervisaA: string[];
  nivelJerarquico: 'Operativo' | 'Técnico' | 'Profesional' | 'Ejecutivo' | 'Directivo';
  estado: 'Activo' | 'Observado' | 'Cancelado';
  objetivo: string;
  funcionesPrincipales: string[];
  funcionesEspecificas: string[];
  funcionesTransversales: {
    normativaISO: boolean;
    gestionCalidad: boolean;
    seguridadSalud: boolean;
    proteccionAmbiental: boolean;
    eticaValores: boolean;
  };
  formacionNivel: string;
  formacionCarrera: string;
  formacionSINEACE: string;
  formacionSINEACEVigente: boolean;
  experienciaMinima: number;
  experienciaEspecifica: number;
  sector: 'Minero' | 'Otros';
  conocimientos: string[];
  habilidades: string[];
  valores: string[];
  responsabilidades: string[];
  kpis: KPI[];
  relacionesInternas: string;
  relacionesExternas: string;
  horario: 'Diurno' | 'Nocturno' | 'Rotativo';
  turnoHoras: number;
  ubicacion: 'Oficina' | 'Campo' | 'Subterráneo' | 'Remoto';
  riesgos: string[];
  eppRequerido: string[];
  herramientas: string[];
  puestoAnterior: string;
  puestoSiguiente: string;
  capacitaciones: string;
  certificaciones: string;
  version: number;
}

// ─── Default positions ECOSEM ─────────────────────────────────────────────────

const PUESTOS_INICIALES: Puesto[] = [
  {
    id: 'DIR-001', denominacion: 'Presidente del Directorio', codigo: 'DIR-001', area: 'Directorio', reportaA: 'Asamblea General de Accionistas', supervisaA: ['Gerente Operativo', 'Gerente de Operaciones'], nivelJerarquico: 'Directivo', estado: 'Activo',
    objetivo: 'Presidir el Directorio de la Empresa Comunal, representar a la organización ante entidades externas y liderar la definición de políticas, estrategias y lineamientos institucionales.',
    funcionesPrincipales: ['Presidir sesiones del Directorio', 'Representar legalmente a ECOSEM', 'Aprobar presupuestos anuales', 'Supervisar la gestión gerencial'],
    funcionesEspecificas: ['Convocar y dirigir Juntas Generales de Accionistas', 'Suscribir contratos y convenios estratégicos'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: true, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería, Administración o afines', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 10, experienciaEspecifica: 5, sector: 'Minero',
    conocimientos: ['Microsoft Office', 'Normativa SUNAT', 'Contabilidad'], habilidades: ['Liderazgo', 'Toma de decisiones', 'Negociación'], valores: ['Integridad', 'Transparencia', 'Compromiso'],
    responsabilidades: ['Velar por el patrimonio comunal', 'Garantizar la sostenibilidad de la empresa'],
    kpis: [{ id: 'k1', nombre: 'Rentabilidad Neta', formula: 'Utilidad Neta / Ingresos', frecuencia: 'Anual', meta: '15%', peso: 40 }, { id: 'k2', nombre: 'Satisfacción Comunal', formula: 'Encuesta anual (0-100)', frecuencia: 'Anual', meta: '85', peso: 30 }],
    relacionesInternas: 'Gerencia General, Gerencia de Operaciones, Jefaturas', relacionesExternas: 'MEM, SUNAT, OEFA, Comunidades, Minera Volcan',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Psicosociales'],
    eppRequerido: [], herramientas: ['SIGECOSEM ERP', 'Microsoft Office'], puestoAnterior: 'Gerente General', puestoSiguiente: '', capacitaciones: 'Gobierno Corporativo, Gestión Empresarial', certificaciones: 'PMI, Gobernanza Corporativa', version: 1
  },
  {
    id: 'GER-001', denominacion: 'Gerente Operativo', codigo: 'GER-001', area: 'Gerencia', reportaA: 'Presidente del Directorio', supervisaA: ['Gerente de Operaciones', 'Jefe de Planeamiento', 'Jefe de RRHH', 'Jefe de Administración'], nivelJerarquico: 'Ejecutivo', estado: 'Activo',
    objetivo: 'Dirigir y coordinar las operaciones generales de ECOSEM, garantizando el cumplimiento de objetivos estratégicos, la eficiencia operativa y el bienestar de los trabajadores.',
    funcionesPrincipales: ['Dirigir la gestión operativa de la empresa', 'Implementar el plan estratégico', 'Coordinar con todas las jefaturas', 'Reportar al Directorio'],
    funcionesEspecificas: ['Aprobar contratos de proveedores', 'Gestionar relaciones con clientes clave'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: true, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería o Administración', formacionSINEACE: 'CIP', formacionSINEACEVigente: true,
    experienciaMinima: 8, experienciaEspecifica: 4, sector: 'Minero',
    conocimientos: ['Microsoft Office', 'Software minero', 'Normativa SUNAT', 'Logística'], habilidades: ['Liderazgo', 'Planificación', 'Comunicación', 'Toma de decisiones'], valores: ['Integridad', 'Responsabilidad', 'Compromiso'],
    responsabilidades: ['Cumplir metas operativas', 'Optimizar costos operacionales'],
    kpis: [{ id: 'k1', nombre: 'Disponibilidad de Flota', formula: 'Horas Operativas / Horas Programadas', frecuencia: 'Mensual', meta: '85%', peso: 35 }],
    relacionesInternas: 'Todas las áreas', relacionesExternas: 'Clientes, Proveedores, MEM',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Psicosociales', 'Ergonómicos'],
    eppRequerido: ['Casco', 'Chaleco'], herramientas: ['SIGECOSEM ERP', 'Microsoft Office', 'Microsoft Project'], puestoAnterior: 'Jefe de Operaciones', puestoSiguiente: 'Presidente del Directorio', capacitaciones: 'Gestión de Proyectos, Liderazgo', certificaciones: 'PMP, ISO 9001', version: 1
  },
  {
    id: 'OPE-001', denominacion: 'Gerente de Operaciones', codigo: 'OPE-001', area: 'Operaciones', reportaA: 'Gerente Operativo', supervisaA: ['Supervisor de Campo', 'Operadores de Maquinaria'], nivelJerarquico: 'Ejecutivo', estado: 'Activo',
    objetivo: 'Planificar, organizar y controlar todas las actividades operativas de servicio minero, garantizando el cumplimiento de contratos, la seguridad y la rentabilidad.',
    funcionesPrincipales: ['Supervisar operaciones en campo', 'Controlar rendimiento de equipos', 'Gestionar cronograma de actividades', 'Coordinar con clientes mineros'],
    funcionesEspecificas: ['Elaborar reportes de producción', 'Optimizar el uso de maquinaria'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: true, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería de Minas o Mecánica', formacionSINEACE: 'CIP', formacionSINEACEVigente: true,
    experienciaMinima: 5, experienciaEspecifica: 3, sector: 'Minero',
    conocimientos: ['Software minero', 'Seguridad industrial', 'Mantenimiento'], habilidades: ['Liderazgo', 'Análisis datos', 'Resolución conflictos'], valores: ['Responsabilidad', 'Compromiso', 'Respeto'],
    responsabilidades: ['Cumplimiento de producción', 'Cero accidentes en operación'],
    kpis: [{ id: 'k1', nombre: 'Índice de Disponibilidad', formula: 'Equipos Operativos / Total', frecuencia: 'Mensual', meta: '90%', peso: 50 }, { id: 'k2', nombre: 'Accidentes Reportados', formula: 'N° accidentes / mes', frecuencia: 'Mensual', meta: '0', peso: 50 }],
    relacionesInternas: 'Jef. Equipos, SSOMA, Logística', relacionesExternas: 'Clientes, MEM, OSINERGMIN',
    horario: 'Rotativo', turnoHoras: 12, ubicacion: 'Campo', riesgos: ['Físicos', 'Ergonómicos', 'Psicosociales'],
    eppRequerido: ['Casco', 'Lentes', 'Guantes', 'Botas', 'Chaleco', 'Arnés'], herramientas: ['SIGECOSEM ERP', 'Microsoft Project'], puestoAnterior: 'Supervisor de Campo', puestoSiguiente: 'Gerente Operativo', capacitaciones: 'Operaciones Mineras, SSOMA', certificaciones: 'ISO 45001, IPERC', version: 1
  },
  {
    id: 'PLA-001', denominacion: 'Jefe de Planeamiento y Proyectos', codigo: 'PLA-001', area: 'Planeamiento', reportaA: 'Gerente Operativo', supervisaA: ['Asistente de Planeamiento'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Planificar y coordinar los proyectos de ECOSEM, elaborar el plan estratégico institucional y garantizar el seguimiento de indicadores de gestión.',
    funcionesPrincipales: ['Elaborar el plan operativo anual', 'Gestionar proyectos de inversión', 'Monitorear KPIs corporativos', 'Coordinar licitaciones'],
    funcionesEspecificas: ['Elaborar expedientes técnicos', 'Gestionar contratos con el Estado'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: false, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería, Economía o Administración', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 4, experienciaEspecifica: 2, sector: 'Minero',
    conocimientos: ['Microsoft Office', 'Normativa SUNAT', 'Logística'], habilidades: ['Planificación', 'Análisis datos', 'Comunicación'], valores: ['Integridad', 'Transparencia'],
    responsabilidades: ['Cumplimiento del POA', 'Gestión eficiente de proyectos'],
    kpis: [{ id: 'k1', nombre: 'Proyectos Ejecutados', formula: 'Proyectos terminados / planificados', frecuencia: 'Trimestral', meta: '90%', peso: 60 }],
    relacionesInternas: 'Gerencia, Administración, Operaciones', relacionesExternas: 'MEF, PCM, Banco de Inversiones',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Psicosociales', 'Ergonómicos'],
    eppRequerido: [], herramientas: ['SIGECOSEM ERP', 'Microsoft Project', 'Primavera P6'], puestoAnterior: 'Analista de Proyectos', puestoSiguiente: 'Gerente de Operaciones', capacitaciones: 'Gestión de Proyectos, Invierte.pe', certificaciones: 'PMP', version: 1
  },
  {
    id: 'EQU-001', denominacion: 'Jefe de Equipos y Mantenimiento', codigo: 'EQU-001', area: 'Equipos y Mantenimiento', reportaA: 'Gerente de Operaciones', supervisaA: ['Técnico Mecánico', 'Técnico Eléctrico', 'Operador de Maquinaria'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Gestionar el mantenimiento preventivo y correctivo de toda la flota de vehículos y maquinaria pesada de ECOSEM, garantizando la máxima disponibilidad y vida útil de los activos.',
    funcionesPrincipales: ['Planificar mantenimiento preventivo', 'Supervisar reparaciones', 'Gestionar inventario de repuestos', 'Controlar horómetros y KM'],
    funcionesEspecificas: ['Elaborar órdenes de trabajo', 'Negociar con proveedores de repuestos'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: true, proteccionAmbiental: false, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería Mecánica o Automotriz', formacionSINEACE: 'CIP', formacionSINEACEVigente: true,
    experienciaMinima: 5, experienciaEspecifica: 3, sector: 'Minero',
    conocimientos: ['Software minero', 'Mantenimiento', 'Seguridad industrial'], habilidades: ['Análisis datos', 'Planificación', 'Trabajo equipo'], valores: ['Responsabilidad', 'Compromiso'],
    responsabilidades: ['Disponibilidad flota > 85%', 'Reducción costos mantenimiento'],
    kpis: [{ id: 'k1', nombre: 'Disponibilidad Flota', formula: 'Equipos operativos / total', frecuencia: 'Mensual', meta: '85%', peso: 50 }, { id: 'k2', nombre: 'MTTR', formula: 'Tiempo total reparación / N° fallas', frecuencia: 'Mensual', meta: '< 8hrs', peso: 30 }],
    relacionesInternas: 'Operaciones, Logística, SSOMA', relacionesExternas: 'Talleres, Proveedores repuestos',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Campo', riesgos: ['Físicos', 'Ergonómicos'],
    eppRequerido: ['Casco', 'Lentes', 'Guantes', 'Botas'], herramientas: ['SIGECOSEM ERP', 'SAP'], puestoAnterior: 'Técnico Senior', puestoSiguiente: 'Gerente de Operaciones', capacitaciones: 'Mantenimiento Predictivo, Maquinaria CAT', certificaciones: 'ISO 55001', version: 1
  },
  {
    id: 'SSO-001', denominacion: 'Jefe de SSOMA', codigo: 'SSO-001', area: 'SSOMA', reportaA: 'Gerente de Operaciones', supervisaA: ['Inspector SSOMA', 'Médico Ocupacional', 'Paramédico'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Diseñar, implementar y gestionar el Sistema de Gestión de Seguridad, Salud Ocupacional y Medio Ambiente (SSOMA) de ECOSEM, garantizando el cumplimiento de la normativa D.S. 024-2016-EM y legislación vigente.',
    funcionesPrincipales: ['Gestionar el SGSST', 'Investigar accidentes e incidentes', 'Realizar inspecciones periódicas', 'Capacitar en seguridad'],
    funcionesEspecificas: ['Elaborar IPERC y PETS', 'Gestionar documentación OSINERGMIN'],
    funcionesTransversales: { normativaISO: true, gestionCalidad: true, seguridadSalud: true, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Ingeniería de Seguridad o afines', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 5, experienciaEspecifica: 3, sector: 'Minero',
    conocimientos: ['Seguridad industrial', 'Normativa SUNAT', 'Microsoft Office'], habilidades: ['Liderazgo', 'Comunicación', 'Análisis datos'], valores: ['Integridad', 'Responsabilidad', 'Compromiso'],
    responsabilidades: ['Cero accidentes mortales', 'IF < 1'],
    kpis: [{ id: 'k1', nombre: 'Índice de Frecuencia', formula: 'Accidentes × 200000 / HH trabajadas', frecuencia: 'Mensual', meta: '< 1', peso: 50 }, { id: 'k2', nombre: 'Inspecciones Realizadas', formula: 'Insp. ejecutadas / planificadas', frecuencia: 'Mensual', meta: '100%', peso: 30 }],
    relacionesInternas: 'Todas las áreas', relacionesExternas: 'OSINERGMIN, ANA, OEFA, MINTRA',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Campo', riesgos: ['Físicos', 'Químicos', 'Biológicos'],
    eppRequerido: ['Casco', 'Lentes', 'Guantes', 'Botas', 'Chaleco', 'Respirador'], herramientas: ['SIGECOSEM ERP', 'Microsoft Office'], puestoAnterior: 'Inspector SSOMA Senior', puestoSiguiente: 'Gerente de Operaciones', capacitaciones: 'ISO 45001, Auditor SGSST', certificaciones: 'ISO 45001 Lead Auditor', version: 1
  },
  {
    id: 'RRH-001', denominacion: 'Jefe de RRHH y Desarrollo de Personal', codigo: 'RRH-001', area: 'Recursos Humanos', reportaA: 'Gerente Operativo', supervisaA: ['Asistente de RRHH', 'Trabajador Social'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Gestionar el ciclo completo de recursos humanos: selección, contratación, nómina, bienestar, capacitación y desarrollo de los 67 colaboradores de ECOSEM.',
    funcionesPrincipales: ['Gestionar reclutamiento y selección', 'Administrar planilla y beneficios', 'Coordinar capacitaciones', 'Gestionar relaciones laborales'],
    funcionesEspecificas: ['Elaborar contratos de trabajo', 'Gestionar PLAME y AFP'],
    funcionesTransversales: { normativaISO: false, gestionCalidad: true, seguridadSalud: false, proteccionAmbiental: false, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Administración, Psicología o RRHH', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 4, experienciaEspecifica: 2, sector: 'Otros',
    conocimientos: ['Recursos humanos', 'Normativa SUNAT', 'Microsoft Office', 'Contabilidad'], habilidades: ['Comunicación', 'Trabajo equipo', 'Liderazgo'], valores: ['Respeto', 'Solidaridad', 'Integridad'],
    responsabilidades: ['Rotación < 10%', 'Satisfacción laboral > 80%'],
    kpis: [{ id: 'k1', nombre: 'Rotación de Personal', formula: 'Salidas / promedio personal', frecuencia: 'Trimestral', meta: '< 10%', peso: 40 }],
    relacionesInternas: 'Gerencia, Todas las jefaturas', relacionesExternas: 'SUNAT, MINTRA, AFP, ONP',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Psicosociales', 'Ergonómicos'],
    eppRequerido: [], herramientas: ['SIGECOSEM ERP', 'Microsoft Office'], puestoAnterior: 'Analista de RRHH', puestoSiguiente: 'Gerente Operativo', capacitaciones: 'Gestión de Talento, Legislación Laboral', certificaciones: '', version: 1
  },
  {
    id: 'ADM-001', denominacion: 'Jefe de Administración y Finanzas', codigo: 'ADM-001', area: 'Administración y Finanzas', reportaA: 'Gerente Operativo', supervisaA: ['Contador', 'Tesorero', 'Asistente Administrativo'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Gestionar los recursos financieros, contables y administrativos de ECOSEM, garantizando la salud financiera de la empresa y el cumplimiento de obligaciones tributarias.',
    funcionesPrincipales: ['Gestionar tesorería y flujo de caja', 'Coordinar contabilidad y auditoría', 'Elaborar estados financieros', 'Administrar activos fijos'],
    funcionesEspecificas: ['Declarar impuestos SUNAT', 'Gestionar financiamiento bancario'],
    funcionesTransversales: { normativaISO: false, gestionCalidad: true, seguridadSalud: false, proteccionAmbiental: false, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Contabilidad, Economía o Administración', formacionSINEACE: 'CCPL', formacionSINEACEVigente: true,
    experienciaMinima: 5, experienciaEspecifica: 3, sector: 'Otros',
    conocimientos: ['Contabilidad', 'Normativa SUNAT', 'Microsoft Office'], habilidades: ['Análisis datos', 'Planificación', 'Comunicación'], valores: ['Integridad', 'Transparencia', 'Responsabilidad'],
    responsabilidades: ['Rentabilidad mínima 12%', 'Cumplimiento tributario 100%'],
    kpis: [{ id: 'k1', nombre: 'Liquidez Corriente', formula: 'Activo corriente / Pasivo corriente', frecuencia: 'Mensual', meta: '> 1.5', peso: 40 }],
    relacionesInternas: 'Gerencia, RRHH, Logística, Planeamiento', relacionesExternas: 'SUNAT, SBS, Bancos, Auditores',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Psicosociales', 'Ergonómicos'],
    eppRequerido: [], herramientas: ['SIGECOSEM ERP', 'Microsoft Office'], puestoAnterior: 'Contador Senior', puestoSiguiente: 'Gerente Operativo', capacitaciones: 'Normas NIIF, Gestión Financiera', certificaciones: 'CPA, NIIF', version: 1
  },
  {
    id: 'LOG-001', denominacion: 'Jefe de Logística', codigo: 'LOG-001', area: 'Logística', reportaA: 'Gerente Operativo', supervisaA: ['Asistente de Logística', 'Almacenero'], nivelJerarquico: 'Profesional', estado: 'Activo',
    objetivo: 'Gestionar la cadena de suministro de ECOSEM: adquisición, almacenamiento y distribución eficiente de materiales, combustibles, repuestos y equipos de protección personal.',
    funcionesPrincipales: ['Gestionar órdenes de compra', 'Administrar almacén central', 'Controlar inventario de combustibles', 'Supervisar proveedores'],
    funcionesEspecificas: ['Elaborar cuadros comparativos de proveedores', 'Gestionar importaciones de repuestos'],
    funcionesTransversales: { normativaISO: false, gestionCalidad: true, seguridadSalud: false, proteccionAmbiental: true, eticaValores: true },
    formacionNivel: 'Universitario', formacionCarrera: 'Administración, Ingeniería Industrial o Logística', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 4, experienciaEspecifica: 2, sector: 'Minero',
    conocimientos: ['Logística', 'Microsoft Office', 'Normativa SUNAT'], habilidades: ['Negociación', 'Planificación', 'Análisis datos'], valores: ['Responsabilidad', 'Transparencia'],
    responsabilidades: ['Stock mínimo garantizado', 'Ahorro en compras > 5%'],
    kpis: [{ id: 'k1', nombre: 'Ahorro en Compras', formula: '(Precio ref. - Precio real) / Precio ref.', frecuencia: 'Trimestral', meta: '5%', peso: 50 }],
    relacionesInternas: 'Equipos, Finanzas, Operaciones', relacionesExternas: 'Proveedores, Aduanas, SUNAT',
    horario: 'Diurno', turnoHoras: 8, ubicacion: 'Oficina', riesgos: ['Ergonómicos'],
    eppRequerido: ['Casco', 'Chaleco'], herramientas: ['SIGECOSEM ERP', 'Microsoft Office'], puestoAnterior: 'Asistente de Logística', puestoSiguiente: 'Gerente Operativo', capacitaciones: 'Supply Chain, CSCMP', certificaciones: '', version: 1
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sigecosem_puestos';

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function loadPuestos(): Puesto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PUESTOS_INICIALES));
  return PUESTOS_INICIALES;
}

const inputCls = "w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all";
const selectCls = inputCls;

const FF: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>
    {children}
  </div>
);

const nivelColors: Record<string, string> = {
  'Operativo': 'bg-slate-100 text-slate-600 border-slate-200',
  'Técnico': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  'Profesional': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'Ejecutivo': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'Directivo': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const CONOCIMIENTOS_LIST = ['Microsoft Office', 'Software minero', 'Normativa SUNAT', 'Seguridad industrial', 'Mantenimiento', 'Logística', 'Contabilidad', 'Recursos humanos'];
const HABILIDADES_LIST = ['Liderazgo', 'Comunicación', 'Toma de decisiones', 'Trabajo equipo', 'Resolución conflictos', 'Creatividad', 'Análisis datos', 'Planificación', 'Negociación'];
const VALORES_LIST = ['Integridad', 'Compromiso', 'Responsabilidad', 'Respeto', 'Solidaridad', 'Transparencia'];
const RIESGOS_LIST = ['Físicos', 'Químicos', 'Biológicos', 'Ergonómicos', 'Psicosociales'];
const EPP_LIST = ['Casco', 'Lentes', 'Guantes', 'Botas', 'Chaleco', 'Arnés', 'Respirador'];
const HERRAMIENTAS_LIST = ['SIGECOSEM ERP', 'Microsoft Office', 'Microsoft Project', 'AutoCAD', 'SAP', 'Primavera P6', 'Vulcan'];

const AREAS = ['Directorio', 'Gerencia', 'Operaciones', 'Planeamiento', 'Equipos y Mantenimiento', 'SSOMA', 'Recursos Humanos', 'Administración y Finanzas', 'Logística', 'Vigilancia'];

// ─── Checklist toggle group ────────────────────────────────────────────────────

const ToggleGroup: React.FC<{
  options: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const active = selected.includes(opt);
      return (
        <button key={opt} type="button"
          onClick={() => onChange(active ? selected.filter(x => x !== opt) : [...selected, opt])}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none ${active ? 'bg-teal-500 text-white border-teal-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-500/50'}`}>
          {active ? '✓ ' : ''}{opt}
        </button>
      );
    })}
  </div>
);

// ─── Form ─────────────────────────────────────────────────────────────────────

const PuestoForm: React.FC<{
  puestos: Puesto[];
  editando: Puesto | null;
  onSave: (p: Puesto) => void;
  onCancelar: () => void;
}> = ({ puestos, editando, onSave, onCancelar }) => {

  const blank: Puesto = {
    id: uid(), denominacion: '', codigo: '', area: 'Operaciones', reportaA: '', supervisaA: [],
    nivelJerarquico: 'Profesional', estado: 'Activo', objetivo: '',
    funcionesPrincipales: [''], funcionesEspecificas: [''],
    funcionesTransversales: { normativaISO: false, gestionCalidad: false, seguridadSalud: false, proteccionAmbiental: false, eticaValores: false },
    formacionNivel: 'Universitario', formacionCarrera: '', formacionSINEACE: '', formacionSINEACEVigente: false,
    experienciaMinima: 0, experienciaEspecifica: 0, sector: 'Minero',
    conocimientos: [], habilidades: [], valores: [], responsabilidades: [''], kpis: [],
    relacionesInternas: '', relacionesExternas: '', horario: 'Diurno', turnoHoras: 8,
    ubicacion: 'Oficina', riesgos: [], eppRequerido: [], herramientas: [],
    puestoAnterior: '', puestoSiguiente: '', capacitaciones: '', certificaciones: '', version: 1
  };

  const [form, setForm] = useState<Puesto>(editando ?? blank);
  const [section, setSection] = useState<number>(0);

  useEffect(() => { setForm(editando ?? blank); setSection(0); }, [editando]);

  const setF = (key: keyof Puesto, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const addList = (key: 'funcionesPrincipales' | 'funcionesEspecificas' | 'responsabilidades') => {
    setF(key, [...(form[key] as string[]), '']);
  };

  const updateList = (key: 'funcionesPrincipales' | 'funcionesEspecificas' | 'responsabilidades', idx: number, val: string) => {
    const arr = [...(form[key] as string[])];
    arr[idx] = val;
    setF(key, arr);
  };

  const removeList = (key: 'funcionesPrincipales' | 'funcionesEspecificas' | 'responsabilidades', idx: number) => {
    setF(key, (form[key] as string[]).filter((_, i) => i !== idx));
  };

  const addKPI = () => {
    setF('kpis', [...form.kpis, { id: uid(), nombre: '', formula: '', frecuencia: 'Mensual', meta: '', peso: 10 }]);
  };

  const updateKPI = (id: string, key: keyof KPI, val: unknown) => {
    setF('kpis', form.kpis.map(k => k.id === id ? { ...k, [key]: val } : k));
  };

  const removeKPI = (id: string) => { setF('kpis', form.kpis.filter(k => k.id !== id)); };

  const totalKpiWeight = form.kpis.reduce((s, k) => s + k.peso, 0);

  const SECTIONS = [
    { label: 'Identificación', icon: Briefcase },
    { label: 'Funciones', icon: CheckSquare },
    { label: 'Perfil Requerido', icon: BookOpen },
    { label: 'KPIs', icon: BarChart2 },
    { label: 'Condiciones', icon: Shield },
    { label: 'Desarrollo', icon: Award },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.denominacion) return alert('El campo Denominación es requerido.');
    const codigo = form.codigo || `${form.area.substring(0, 3).toUpperCase()}-${String(puestos.length + 1).padStart(3, '0')}`;
    onSave({ ...form, codigo });
  };

  return (
    <form onSubmit={submit} className="space-y-0">
      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mb-6 overflow-x-auto">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.label} type="button" onClick={() => setSection(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${section === i ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Section 0: Identificación */}
      {section === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FF label="Denominación del Puesto" required>
              <input className={inputCls} value={form.denominacion} onChange={e => setF('denominacion', e.target.value)} placeholder="Ej. Supervisor de Campo" />
            </FF>
            <FF label="Código (auto si vacío)">
              <input className={inputCls} value={form.codigo} onChange={e => setF('codigo', e.target.value)} placeholder="Ej. OPE-005" />
            </FF>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FF label="Área">
              <select className={selectCls} value={form.area} onChange={e => setF('area', e.target.value)}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </FF>
            <FF label="Nivel Jerárquico">
              <select className={selectCls} value={form.nivelJerarquico} onChange={e => setF('nivelJerarquico', e.target.value as any)}>
                {['Operativo', 'Técnico', 'Profesional', 'Ejecutivo', 'Directivo'].map(n => <option key={n}>{n}</option>)}
              </select>
            </FF>
            <FF label="Estado">
              <select className={selectCls} value={form.estado} onChange={e => setF('estado', e.target.value as any)}>
                <option>Activo</option><option>Observado</option><option>Cancelado</option>
              </select>
            </FF>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FF label="Reporta a">
              <select className={selectCls} value={form.reportaA} onChange={e => setF('reportaA', e.target.value)}>
                <option value="">Ninguno</option>
                {puestos.filter(p => p.id !== form.id).map(p => <option key={p.id}>{p.denominacion}</option>)}
              </select>
            </FF>
            <FF label="Objetivo del Cargo" required>
              <textarea className={inputCls} rows={3} value={form.objetivo} onChange={e => setF('objetivo', e.target.value)} placeholder="Describir el propósito del puesto..." />
            </FF>
          </div>
        </div>
      )}

      {/* Section 1: Funciones */}
      {section === 1 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funciones Principales</label>
              <button type="button" onClick={() => addList('funcionesPrincipales')} className="text-xs text-teal-600 hover:text-teal-500 font-semibold flex items-center gap-1">
                <PlusCircle className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>
            {form.funcionesPrincipales.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs text-slate-400 font-bold pt-2.5 w-5 shrink-0">{i + 1}.</span>
                <input className={inputCls} value={f} onChange={e => updateList('funcionesPrincipales', i, e.target.value)} placeholder="Función principal..." />
                <button type="button" onClick={() => removeList('funcionesPrincipales', i)} className="text-slate-300 hover:text-rose-500 transition-colors pt-1"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funciones Específicas</label>
              <button type="button" onClick={() => addList('funcionesEspecificas')} className="text-xs text-teal-600 hover:text-teal-500 font-semibold flex items-center gap-1">
                <PlusCircle className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>
            {form.funcionesEspecificas.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs text-slate-400 font-bold pt-2.5 w-5 shrink-0">{i + 1}.</span>
                <input className={inputCls} value={f} onChange={e => updateList('funcionesEspecificas', i, e.target.value)} placeholder="Función específica..." />
                <button type="button" onClick={() => removeList('funcionesEspecificas', i)} className="text-slate-300 hover:text-rose-500 transition-colors pt-1"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Funciones Transversales</label>
            <div className="flex flex-wrap gap-3">
              {([
                ['normativaISO', 'Cumplimiento Normativo ISO'],
                ['gestionCalidad', 'Gestión de Calidad'],
                ['seguridadSalud', 'Seguridad y Salud Ocupacional'],
                ['proteccionAmbiental', 'Protección Ambiental'],
                ['eticaValores', 'Ética y Valores Organizacionales'],
              ] as [keyof typeof form.funcionesTransversales, string][]).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs font-semibold select-none ${form.funcionesTransversales[key] ? 'bg-teal-500/10 border-teal-500/30 text-teal-600' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                  <input type="checkbox" className="hidden" checked={form.funcionesTransversales[key]} onChange={e => setF('funcionesTransversales', { ...form.funcionesTransversales, [key]: e.target.checked })} />
                  {form.funcionesTransversales[key] ? '✓ ' : ''}{label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Perfil */}
      {section === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FF label="Nivel de Formación">
              <select className={selectCls} value={form.formacionNivel} onChange={e => setF('formacionNivel', e.target.value)}>
                {['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Posgrado'].map(n => <option key={n}>{n}</option>)}
              </select>
            </FF>
            <FF label="Carrera / Especialidad">
              <input className={inputCls} value={form.formacionCarrera} onChange={e => setF('formacionCarrera', e.target.value)} />
            </FF>
            <FF label="Colegiatura / SINEACE">
              <input className={inputCls} value={form.formacionSINEACE} onChange={e => setF('formacionSINEACE', e.target.value)} placeholder="Ej. CIP-12345" />
            </FF>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FF label="Experiencia Mínima (años)">
              <input type="number" min={0} className={inputCls} value={form.experienciaMinima} onChange={e => setF('experienciaMinima', Number(e.target.value))} />
            </FF>
            <FF label="Exp. Específica (años)">
              <input type="number" min={0} className={inputCls} value={form.experienciaEspecifica} onChange={e => setF('experienciaEspecifica', Number(e.target.value))} />
            </FF>
            <FF label="Sector">
              <select className={selectCls} value={form.sector} onChange={e => setF('sector', e.target.value as any)}>
                <option>Minero</option><option>Otros</option>
              </select>
            </FF>
          </div>
          <FF label="Conocimientos Requeridos">
            <ToggleGroup options={CONOCIMIENTOS_LIST} selected={form.conocimientos} onChange={val => setF('conocimientos', val)} />
          </FF>
          <FF label="Habilidades Requeridas">
            <ToggleGroup options={HABILIDADES_LIST} selected={form.habilidades} onChange={val => setF('habilidades', val)} />
          </FF>
          <FF label="Valores Requeridos">
            <ToggleGroup options={VALORES_LIST} selected={form.valores} onChange={val => setF('valores', val)} />
          </FF>
        </div>
      )}

      {/* Section 3: KPIs */}
      {section === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indicadores de Desempeño (KPIs)</p>
              <p className={`text-[11px] font-semibold mt-0.5 ${totalKpiWeight === 100 ? 'text-emerald-500' : totalKpiWeight > 100 ? 'text-rose-500' : 'text-amber-500'}`}>
                Peso total: {totalKpiWeight}% {totalKpiWeight === 100 ? '✓' : `(debe sumar 100%)`}
              </p>
            </div>
            <button type="button" onClick={addKPI} className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-500 font-semibold">
              <PlusCircle className="h-4 w-4" /> Agregar KPI
            </button>
          </div>
          {form.kpis.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              Sin KPIs definidos. Haga clic en "Agregar KPI".
            </div>
          )}
          {form.kpis.map((kpi, idx) => (
            <div key={kpi.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="col-span-1 text-xs text-slate-400 font-bold text-center pb-2">{idx + 1}</div>
              <div className="col-span-4">
                <input className={inputCls} placeholder="Nombre del KPI" value={kpi.nombre} onChange={e => updateKPI(kpi.id, 'nombre', e.target.value)} />
              </div>
              <div className="col-span-3">
                <input className={inputCls} placeholder="Fórmula de cálculo" value={kpi.formula} onChange={e => updateKPI(kpi.id, 'formula', e.target.value)} />
              </div>
              <div className="col-span-1">
                <select className={selectCls} value={kpi.frecuencia} onChange={e => updateKPI(kpi.id, 'frecuencia', e.target.value)}>
                  <option>Mensual</option><option>Trimestral</option><option>Semestral</option><option>Anual</option>
                </select>
              </div>
              <div className="col-span-1">
                <input className={inputCls} placeholder="Meta" value={kpi.meta} onChange={e => updateKPI(kpi.id, 'meta', e.target.value)} />
              </div>
              <div className="col-span-1">
                <div className="relative">
                  <input type="number" min={0} max={100} className={inputCls} value={kpi.peso} onChange={e => updateKPI(kpi.id, 'peso', Number(e.target.value))} />
                  <span className="absolute right-2 top-2.5 text-[9px] text-slate-400">%</span>
                </div>
              </div>
              <button type="button" onClick={() => removeKPI(kpi.id)} className="col-span-1 pb-2 flex justify-center text-slate-300 hover:text-rose-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section 4: Condiciones */}
      {section === 4 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FF label="Horario">
              <select className={selectCls} value={form.horario} onChange={e => setF('horario', e.target.value as any)}>
                <option>Diurno</option><option>Nocturno</option><option>Rotativo</option>
              </select>
            </FF>
            <FF label="Horas por Turno">
              <input type="number" min={1} max={24} className={inputCls} value={form.turnoHoras} onChange={e => setF('turnoHoras', Number(e.target.value))} />
            </FF>
            <FF label="Ubicación">
              <select className={selectCls} value={form.ubicacion} onChange={e => setF('ubicacion', e.target.value as any)}>
                <option>Oficina</option><option>Campo</option><option>Subterráneo</option><option>Remoto</option>
              </select>
            </FF>
          </div>
          <FF label="Riesgos Laborales">
            <ToggleGroup options={RIESGOS_LIST} selected={form.riesgos} onChange={val => setF('riesgos', val)} />
          </FF>
          <FF label="EPP Requerido">
            <ToggleGroup options={EPP_LIST} selected={form.eppRequerido} onChange={val => setF('eppRequerido', val)} />
          </FF>
          <FF label="Herramientas de Gestión">
            <ToggleGroup options={HERRAMIENTAS_LIST} selected={form.herramientas} onChange={val => setF('herramientas', val)} />
          </FF>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FF label="Relaciones Internas">
              <textarea className={inputCls} rows={2} value={form.relacionesInternas} onChange={e => setF('relacionesInternas', e.target.value)} />
            </FF>
            <FF label="Relaciones Externas">
              <textarea className={inputCls} rows={2} value={form.relacionesExternas} onChange={e => setF('relacionesExternas', e.target.value)} />
            </FF>
          </div>
        </div>
      )}

      {/* Section 5: Desarrollo */}
      {section === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FF label="Puesto Anterior (Carrera)">
              <select className={selectCls} value={form.puestoAnterior} onChange={e => setF('puestoAnterior', e.target.value)}>
                <option value="">Ninguno</option>
                {puestos.filter(p => p.id !== form.id).map(p => <option key={p.id}>{p.denominacion}</option>)}
              </select>
            </FF>
            <FF label="Puesto Siguiente (Carrera)">
              <select className={selectCls} value={form.puestoSiguiente} onChange={e => setF('puestoSiguiente', e.target.value)}>
                <option value="">Ninguno</option>
                {puestos.filter(p => p.id !== form.id).map(p => <option key={p.id}>{p.denominacion}</option>)}
              </select>
            </FF>
          </div>
          <FF label="Capacitaciones Requeridas">
            <textarea className={inputCls} rows={2} value={form.capacitaciones} onChange={e => setF('capacitaciones', e.target.value)} placeholder="Ej. ISO 45001, Primeros Auxilios..." />
          </FF>
          <FF label="Certificaciones Requeridas">
            <textarea className={inputCls} rows={2} value={form.certificaciones} onChange={e => setF('certificaciones', e.target.value)} placeholder="Ej. CIP, PMP, ISO 9001 Lead Auditor..." />
          </FF>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <button type="button" onClick={onCancelar} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          {section > 0 && (
            <button type="button" onClick={() => setSection(s => s - 1)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              ← Anterior
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {section < SECTIONS.length - 1 ? (
            <button type="button" onClick={() => setSection(s => s + 1)} className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow transition-all">
              Siguiente →
            </button>
          ) : (
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-all">
              <Save className="h-4 w-4" /> Guardar Puesto
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const EstructuraOrganica: React.FC = () => {
  const [puestos, setPuestos] = useState<Puesto[]>(loadPuestos);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Puesto | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const save = (p: Puesto) => {
    const updated = puestos.find(x => x.id === p.id)
      ? puestos.map(x => x.id === p.id ? { ...p, version: (p.version ?? 1) + (editando ? 1 : 0) } : x)
      : [...puestos, p];
    setPuestos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowForm(false);
    setEditando(null);
  };

  const del = (id: string) => {
    if (!confirm('¿Eliminar puesto?')) return;
    const updated = puestos.filter(p => p.id !== id);
    setPuestos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filtered = puestos.filter(p => {
    const term = search.toLowerCase();
    const matchSearch = !term || p.denominacion.toLowerCase().includes(term) || p.area.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term);
    const matchArea = !areaFilter || p.area === areaFilter;
    const matchNivel = !nivelFilter || p.nivelJerarquico === nivelFilter;
    return matchSearch && matchArea && matchNivel;
  });

  const areas = [...new Set(puestos.map(p => p.area))];
  const niveles = ['Operativo', 'Técnico', 'Profesional', 'Ejecutivo', 'Directivo'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-teal-600/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Network className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Estructura Orgánica</h1>
            <p className="text-teal-200 text-sm">ECOSEM Pucará-Morococha — Manual de Organización y Funciones (MOF)</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Total Puestos', val: puestos.length },
            { label: 'Puestos Activos', val: puestos.filter(p => p.estado === 'Activo').length },
            { label: 'Puestos Directivos', val: puestos.filter(p => p.nivelJerarquico === 'Ejecutivo' || p.nivelJerarquico === 'Directivo').length },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="text-2xl font-black">{s.val}</p>
              <p className="text-[11px] text-teal-200 font-semibold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and New */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-60" placeholder="Buscar puesto..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
            <option value="">Todas las Áreas</option>
            {areas.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" value={nivelFilter} onChange={e => setNivelFilter(e.target.value)}>
            <option value="">Todos los Niveles</option>
            {niveles.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <button onClick={() => { setShowForm(true); setEditando(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow transition-all">
          <PlusCircle className="h-4 w-4" /> Nuevo Puesto
        </button>
      </div>

      {/* Form */}
      {(showForm || editando) && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600"><Briefcase className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{editando ? `Editar: ${editando.denominacion}` : 'Nuevo Perfil de Puesto'} — F-PER-004</h3>
              <p className="text-[11px] text-slate-400">Complete las secciones requeridas y guarde el perfil</p>
            </div>
          </div>
          <PuestoForm puestos={puestos} editando={editando} onSave={save} onCancelar={() => { setShowForm(false); setEditando(null); }} />
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
            <Network className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Sin puestos encontrados.</p>
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow transition-shadow overflow-hidden">
            <button className="w-full text-left p-5 flex items-center justify-between gap-4" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${nivelColors[p.nivelJerarquico] ?? 'bg-slate-100 text-slate-500'}`}>
                  {p.codigo.split('-')[1] ?? p.codigo.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{p.denominacion}</h4>
                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${nivelColors[p.nivelJerarquico]}`}>{p.nivelJerarquico}</span>
                    {p.estado !== 'Activo' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">{p.estado}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{p.area} · Reporta a: {p.reportaA || 'N/A'} · v{p.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">{p.codigo}</span>
                <button onClick={e => { e.stopPropagation(); setEditando(p); setShowForm(false); }} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-500/10 transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={e => { e.stopPropagation(); del(p.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {expanded === p.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {expanded === p.id && (
              <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Objetivo del Cargo</p>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{p.objetivo || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Funciones Principales</p>
                      <ul className="space-y-1">
                        {p.funcionesPrincipales.filter(Boolean).map((f, i) => <li key={i} className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5"><span className="text-teal-500 font-bold shrink-0">·</span>{f}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perfil Mínimo</p>
                      <p className="text-slate-600 dark:text-slate-300">📚 {p.formacionNivel} — {p.formacionCarrera || '—'}</p>
                      <p className="text-slate-600 dark:text-slate-300">⏱ {p.experienciaMinima} años mín. | {p.experienciaEspecifica} años específicos</p>
                      <p className="text-slate-600 dark:text-slate-300">🏭 Sector: {p.sector}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Habilidades</p>
                      <div className="flex flex-wrap gap-1">
                        {p.habilidades.map(h => <span key={h} className="px-2 py-0.5 bg-teal-500/10 text-teal-600 rounded-lg text-[10px] font-semibold">{h}</span>)}
                        {p.habilidades.length === 0 && <span className="text-slate-400">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KPIs ({p.kpis.length})</p>
                      {p.kpis.slice(0, 3).map(k => (
                        <div key={k.id} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <span className="text-slate-600 dark:text-slate-300 truncate">{k.nombre}</span>
                          <span className="text-teal-600 font-bold shrink-0 ml-2">{k.meta}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Condiciones</p>
                      <p className="text-slate-600 dark:text-slate-300">🏢 {p.ubicacion} | ⏰ {p.horario} ({p.turnoHoras}h)</p>
                      {p.eppRequerido.length > 0 && (
                        <p className="text-slate-500 text-[10px] mt-1">EPP: {p.eppRequerido.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
