export interface Rol {
  id: number;
  nombre: string;
  permisos: string;
}

export interface Area {
  id: number;
  nombre: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
  ubicacion: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  cargo?: string;
  rolId: number;
  rol?: Rol;
  areaId?: number;
  area?: Area;
  activo: boolean;
  permisos?: string[];
}

export interface ReporteTonelada {
  id: number;
  fecha: string;
  codBalanza?: string;
  descMat?: string;
  centroOrigen?: string;
  descRuta?: string;
  regPesaje?: string;
  placa: string;
  conductor: string;
  empresaContratista: string;
  tipoMaterial: string;
  ruta: string;
  pesoBruto: number;
  tara: number;
  pesoNeto: number;
  tms: number;
  humedad: number;
  observaciones: string;
}

export interface Equipo {
  placa: string;
  codigoInterno: string;
  descripcion?: string;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  motor: string;
  chasis: string;
  color: string;
  anioFabricacion?: number | string;
  proyectoId?: number;
  proyecto?: Proyecto;
  areaId?: number;
  area?: Area;
  supervisorId?: number;
  supervisor?: Usuario;
  operadorId?: number;
  operador?: Usuario;
  estado: string; // Disponible, Operativo, Bloqueado por SSOMA, etc.
  fechaCompra?: string;
  valor: number;
  seguro: string;
  soatVencimiento?: string;
  revisionTecnicaVencimiento?: string;
  permisoCirculacionVencimiento?: string;
  polizaVencimiento?: string;
  fotoUrl: string;
  gpsId: string;
}

export interface CheckList {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  fechaHora: string;
  semana: number;
  mes: number;
  anio: number;
  operadorId: number;
  operador?: Usuario;
  supervisorId?: number;
  supervisor?: Usuario;
  proyectoId?: number;
  proyecto?: Proyecto;
  areaId?: number;
  area?: Area;
  combustibleNivel: number;
  fotoUrl: string;
  observaciones: string;
  tieneFallasCriticas: boolean;
  estado: string; // Aprobado, Rechazado, Corregido
  firmaOperador: string;
  firmaSupervisor: string;
  itemsJson: string; // JSON string of components
  servicio: string;
  conductorId?: number;
  kilometrajeInicial?: number;
  kilometrajeFinal?: number;
  horometroInicial?: number;
  horometroFinal?: number;
}

export interface Tareo {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  operadorId: number;
  operador?: Usuario;
  conductorId?: number;
  conductor?: Conductor;
  actividad: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasNormales: number;
  horasExtras: number;
  proyectoId?: number;
  proyecto?: Proyecto;
  areaId?: number;
  area?: Area;
  observaciones: string;
}

export interface Horometro {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  fecha: string;
  inicial: number;
  final: number;
  horasTrabajadas: number;
  proximoMantenimiento: number;
}

export interface Combustible {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  proveedor: string;
  grifo: string;
  galones: number;
  precioGalon: number;
  costoTotal: number;
  horometroVal: number;
  operadorId: number;
  operador?: Usuario;
  conductorId?: number;
  conductor?: Conductor;
  proyectoId?: number;
  proyecto?: Proyecto;
  areaId?: number;
  area?: Area;
  fecha: string;
}

export interface Mantenimiento {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  tipo: string; // Preventivo, Correctivo
  descripcion: string;
  repuestos: string; // JSON string of parts
  costoTotal: number;
  proveedor: string;
  responsable: string;
  fecha: string;
  facturaUrl: string;
  fotoUrl: string;
}

export interface Documento {
  id: number;
  equipoPlaca: string;
  nombre: string;
  tipo: string;
  url: string;
  fechaVencimiento?: string;
  fechaSubida: string;
}

export interface Alerta {
  id: number;
  equipoPlaca: string;
  equipo?: Equipo;
  tipo: string;
  mensaje: string;
  fechaCreacion: string;
  resuelta: boolean;
  resueltaPorId?: number;
  resueltaPor?: Usuario;
  fechaResolucion?: string;
}

export interface GpsData {
  id: number;
  equipoPlaca: string;
  latitud: number;
  longitud: number;
  velocidad: number;
  tiempoDetenidoMinutos: number;
  ultimaActualizacion: string;
  motorEncendido: boolean;
}

export interface AuditoriaLog {
  id: number;
  usuarioId?: number;
  usuario?: Usuario;
  accion: string;
  modulo: string;
  detalles: string;
  ip: string;
  computadora: string;
  fechaHora: string;
}

export interface DashboardKpis {
  total: number;
  disponible: number;
  operativo: number;
  mantenimientoPrev: number;
  mantenimientoCorr: number;
  bloqueado: number;
  fueraServicio: number;
}

export interface Conductor {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  licencia: string;
  categoriaLicencia: string;
  telefono: string;
  equipoPlacaAsignada: string;
  tipoEquipoAutorizado: string;
  activo: boolean;
  fechaRegistro: string;
}
