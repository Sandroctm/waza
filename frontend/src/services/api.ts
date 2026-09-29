const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

// ─── Local Mock Data Fallbacks ───────────────────────────────────────────────

const MOCK_EQUIPOS = [
  {
    placa: "EGS-123", codigoInterno: "VOL-01", tipo: "Volquete", marca: "Volvo", modelo: "FMX 460",
    serie: "YV3RT40A9H876543", motor: "D13K460", chasis: "9BV231908H", color: "Blanco",
    estado: "Disponible", valor: 155000, seguro: "Rimac Todo Riesgo",
    soatVencimiento: new Date(Date.now() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revisionTecnicaVencimiento: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    permisoCirculacionVencimiento: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    polizaVencimiento: new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fotoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400",
    proyecto: { nombre: "Las Bambas" }, area: { nombre: "Lodos" },
    supervisor: { nombre: "Juan", apellido: "Perez" }, operador: { nombre: "Carlos", apellido: "Gomez" },
    anioFabricacion: 2023, tipoCombustible: "Diesel", potenciaHP: 460, capacidadM3: 15, pesoTon: 28
  },
  {
    placa: "EGS-456", codigoInterno: "VOL-02", tipo: "Volquete", marca: "Scania", modelo: "G440 XT",
    serie: "YS2G8X4000432190", motor: "DC13", chasis: "9BV231908K", color: "Amarillo",
    estado: "Operativo", valor: 175000, seguro: "Pacífico Corporativo",
    soatVencimiento: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revisionTecnicaVencimiento: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencido!
    permisoCirculacionVencimiento: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    polizaVencimiento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencido!
    fotoUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400",
    proyecto: { nombre: "Toromocho" }, area: { nombre: "Lodos" },
    supervisor: { nombre: "Juan", apellido: "Perez" }, operador: { nombre: "Carlos", apellido: "Gomez" },
    anioFabricacion: 2022, tipoCombustible: "Diesel", potenciaHP: 440, capacidadM3: 15, pesoTon: 28
  },
  {
    placa: "EXC-789", codigoInterno: "EXC-01", tipo: "Excavadora", marca: "Caterpillar", modelo: "336 GC",
    serie: "CAT0336GCE876543", motor: "C7.1 ACERT", chasis: "CAT-CHASIS-336", color: "Amarillo",
    estado: "Bloqueado por SSOMA", valor: 280000, seguro: "La Positiva",
    soatVencimiento: new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revisionTecnicaVencimiento: new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    permisoCirculacionVencimiento: new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    polizaVencimiento: new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fotoUrl: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400",
    proyecto: { nombre: "Las Bambas" }, area: { nombre: "Lodos" },
    supervisor: { nombre: "Juan", apellido: "Perez" }, operador: { nombre: "Carlos", apellido: "Gomez" },
    anioFabricacion: 2020, tipoCombustible: "Diesel", potenciaHP: 310, capacidadM3: 2.1, pesoTon: 36
  },
  {
    placa: "RET-101", codigoInterno: "RET-01", tipo: "Retroexcavadora", marca: "John Deere", modelo: "310L",
    serie: "1T0310LJC876543", motor: "4045T", chasis: "JD-CHASIS-310", color: "Verde",
    estado: "Disponible", valor: 95000, seguro: "Rimac Todo Riesgo",
    soatVencimiento: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revisionTecnicaVencimiento: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    permisoCirculacionVencimiento: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    polizaVencimiento: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fotoUrl: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400",
    proyecto: { nombre: "Relleno Sanitario" }, area: { nombre: "Relleno" },
    supervisor: { nombre: "Juan", apellido: "Perez" }, operador: { nombre: "Carlos", apellido: "Gomez" },
    anioFabricacion: 2024, tipoCombustible: "Diesel", potenciaHP: 93, capacidadM3: 1.0, pesoTon: 8.5
  },
  {
    placa: "CAR-202", codigoInterno: "CAR-01", tipo: "Cargador Frontal", marca: "Caterpillar", modelo: "950 GC",
    serie: "CAT0950GCE876543", motor: "C7.1", chasis: "CAT-CHASIS-950", color: "Amarillo",
    estado: "En mantenimiento preventivo", valor: 220000, seguro: "Pacífico",
    soatVencimiento: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    revisionTecnicaVencimiento: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    permisoCirculacionVencimiento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    polizaVencimiento: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fotoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400",
    proyecto: { nombre: "Relleno Sanitario" }, area: { nombre: "Relleno" },
    supervisor: { nombre: "Juan", apellido: "Perez" }, operador: { nombre: "Carlos", apellido: "Gomez" },
    anioFabricacion: 2019, tipoCombustible: "Diesel", potenciaHP: 250, capacidadM3: 3.3, pesoTon: 18.8
  }
];

function getMockDataForPath<T>(path: string, options: RequestOptions): T {
  const normPath = path.toLowerCase();
  
  if (normPath.includes('/auth/login')) {
    return {
      token: 'mock-token-123',
      usuario: {
        id: 1,
        username: 'admin',
        nombre: 'Admin',
        apellido: 'Ecosem',
        rol: 'Administrador',
        area: 'Sistemas e Informática'
      }
    } as unknown as T;
  }

  if (normPath.endsWith('/equipos/kpis')) {
    return {
      total: MOCK_EQUIPOS.length,
      disponible: MOCK_EQUIPOS.filter(e => e.estado === 'Disponible').length,
      operativo: MOCK_EQUIPOS.filter(e => e.estado === 'Operativo').length,
      mantenimientoPrev: MOCK_EQUIPOS.filter(e => e.estado === 'En mantenimiento preventivo').length,
      mantenimientoCorr: MOCK_EQUIPOS.filter(e => e.estado === 'En mantenimiento correctivo').length,
      bloqueado: MOCK_EQUIPOS.filter(e => e.estado === 'Bloqueado por SSOMA').length,
      fueraServicio: 0
    } as unknown as T;
  }

  if (normPath.includes('/equipos') && !normPath.includes('/equipos/')) {
    return MOCK_EQUIPOS as unknown as T;
  }

  if (normPath.includes('/documentos/upload')) {
    return {
      id: Math.floor(Math.random() * 10000),
      nombre: 'Documento_Prueba.pdf',
      tipo: 'SOAT',
      url: '#',
      fechaVencimiento: new Date().toISOString(),
      fechaSubida: new Date().toISOString()
    } as unknown as T;
  }

  if (normPath.includes('/equipos/') && !normPath.includes('/documentos')) {
    const parts = normPath.split('/');
    const placa = parts[parts[1] === 'equipos' ? 2 : parts.length - 1].toUpperCase();
    const equipo = MOCK_EQUIPOS.find(e => e.placa === placa) || MOCK_EQUIPOS[0];
    return {
      equipo,
      checklists: [],
      tareos: [],
      horometros: [],
      combustibles: [],
      mantenimientos: [],
      documentos: [],
      gps: {
        latitud: -12.04637,
        longitud: -77.04279,
        velocidad: 0,
        motorEncendido: false,
        tiempoDetenidoMinutos: 45,
        ultimaActualizacion: new Date().toISOString()
      },
      alertas: []
    } as unknown as T;
  }

  if (normPath.includes('/checklists')) {
    return [] as unknown as T;
  }
  
  if (normPath.includes('/operaciones/')) {
    return [] as unknown as T;
  }

  if (normPath.includes('/usuarios')) {
    return [] as unknown as T;
  }

  if (normPath.includes('/reportetonelada')) {
    return [
      {
        id: 1,
        descRuta: "MTIC - C. 6",
        fecha: new Date().toISOString(),
        regPesaje: "10699070",
        placa: "CDQ-747",
        ruta: "3000120",
        centroOrigen: "PUCARA",
        empresaContratista: "ECOSEM",
        tipoMaterial: "Mineral",
        conductor: "Juan Perez",
        pesoBruto: 42.50,
        tara: 15.20,
        pesoNeto: 27.30,
        humedad: 3.5,
        tms: 26.3445,
        observaciones: "T010-0002",
        codBalanza: "213",
        descMat: "213"
      },
      {
        id: 2,
        descRuta: "MTIC - C. 6",
        fecha: new Date(Date.now() - 86400000).toISOString(),
        regPesaje: "10699071",
        placa: "EGS-123",
        ruta: "3000120",
        centroOrigen: "PUCARA",
        empresaContratista: "ECOSEM",
        tipoMaterial: "Concentrado",
        conductor: "Carlos Gomez",
        pesoBruto: 45.10,
        tara: 14.80,
        pesoNeto: 30.30,
        humedad: 4.0,
        tms: 29.0880,
        observaciones: "T010-0003",
        codBalanza: "Balanza 01",
        descMat: "Mineral"
      }
    ] as unknown as T;
  }

  if (normPath.includes('/conductores')) {
    return [] as unknown as T;
  }

  return {} as unknown as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('sigecosem_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.bodyData) {
    if (options.bodyData instanceof FormData) {
      options.body = options.bodyData;
      // Do not set Content-Type for FormData, the browser will set it with the correct boundary
    } else {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.bodyData);
    }
  }

  options.headers = headers;

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errMsg = errJson.message || errMsg;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    // Handle file downloads
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    
    return response.blob() as unknown as T;
  } catch (error) {
    if (path.toLowerCase().includes('/auth/login')) {
      throw error;
    }
    console.warn(`API Request to ${path} failed. Falling back to local mock data.`, error);
    return getMockDataForPath<T>(path, options);
  }
}

export const api = {
  // Auth
  login: (body: any) => request<any>('/auth/login', { method: 'POST', bodyData: body }),
  
  // Usuarios
  getRoles: () => request<any[]>('/usuarios/roles'),
  getAreas: () => request<any[]>('/usuarios/areas'),

  // Equipos (Fleet)
  getEquipos: async (tipo?: string, estado?: string) => {
    let query = '';
    if (tipo || estado) {
      const params = new URLSearchParams();
      if (tipo) params.append('tipo', tipo);
      if (estado) params.append('estado', estado);
      query = `?${params.toString()}`;
    }
    const rawData = await request<any>(`/equipos${query}`);
    const data = Array.isArray(rawData) ? rawData : [];
    
    const savedUser = localStorage.getItem('sigecosem_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.rol === 'Alpayana' || parsed.nombre === 'Alpayana' || parsed.username?.toLowerCase() === 'alpayana') {
          const allowedTypes = ['volquete', 'tracto oruga', 'rodillo compactador', 'excavadora', 'camioneta'];
          return data.filter(eq => allowedTypes.includes(eq.tipo?.toLowerCase()));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return data;
  },
  getKpis: async () => {
    const savedUser = localStorage.getItem('sigecosem_user');
    let isAlpayana = false;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.rol === 'Alpayana' || parsed.nombre === 'Alpayana' || parsed.username?.toLowerCase() === 'alpayana') {
          isAlpayana = true;
        }
      } catch {}
    }
    if (isAlpayana) {
      const equipments = await api.getEquipos();
      return {
        total: equipments.length,
        disponible: equipments.filter(e => e.estado === 'Disponible').length,
        operativo: equipments.filter(e => e.estado === 'Operativo').length,
        mantenimientoPrev: equipments.filter(e => e.estado === 'En mantenimiento preventivo').length,
        mantenimientoCorr: equipments.filter(e => e.estado === 'En mantenimiento correctivo').length,
        bloqueado: equipments.filter(e => e.estado === 'Bloqueado por SSOMA').length,
        fueraServicio: equipments.filter(e => e.estado === 'Fuera de servicio' || e.estado === 'En espera de repuestos').length,
      };
    }
    return request<any>('/equipos/kpis');
  },
  getEquipoByPlaca: (placa: string) => request<any>(`/equipos/${placa}`),
  createEquipo: (equipo: any) => request<any>('/equipos', { method: 'POST', bodyData: equipo }),
  updateEquipo: (placa: string, equipo: any) => request<any>(`/equipos/${placa}`, { method: 'PUT', bodyData: equipo }),
  deleteEquipo: (placa: string) => request<any>(`/equipos/${placa}`, { method: 'DELETE' }),
  blockEquipo: (placa: string, motivo: string) => request<any>(`/equipos/${placa}/block`, { method: 'POST', bodyData: motivo }),
  releaseEquipo: (placa: string, motivo: string) => request<any>(`/equipos/${placa}/release`, { method: 'POST', bodyData: motivo }),

  // Checklists
  getCheckLists: async () => {
    const data = await request<any[]>('/checklists');
    const savedUser = localStorage.getItem('sigecosem_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.rol === 'Alpayana' || parsed.nombre === 'Alpayana' || parsed.username?.toLowerCase() === 'alpayana') {
          const allowedTypes = ['volquete', 'tracto oruga', 'rodillo compactador', 'excavadora', 'camioneta'];
          return data.filter(item => allowedTypes.includes(item.equipo?.tipo?.toLowerCase()));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return data;
  },
  getCheckListsByWeek: (anio: number, semana: number) => request<any[]>(`/checklists/semana/${anio}/${semana}`),
  createCheckList: (checklist: any) => request<any>('/checklists', { method: 'POST', bodyData: checklist }),
  deleteCheckList: (id: number) => request<any>(`/checklists/${id}`, { method: 'DELETE' }),

  // Usuarios
  getUsuarios: () => request<any[]>('/usuarios'),
  createUsuario: (usuario: any) => request<any>('/usuarios', { method: 'POST', bodyData: usuario }),
  updateUsuario: (id: number, usuario: any) => request<any>(`/usuarios/${id}`, { method: 'PUT', bodyData: usuario }),
  toggleUsuarioActivo: (id: number) => request<any>(`/usuarios/${id}/toggle-activo`, { method: 'PUT' }),
  deleteUsuario: (id: number) => request<any>(`/usuarios/${id}`, { method: 'DELETE' }),

  // Conductores
  getConductores: () => request<any[]>('/conductores'),
  getConductoresTodos: () => request<any[]>('/conductores/todos'),
  createConductor: (conductor: any) => request<any>('/conductores', { method: 'POST', bodyData: conductor }),
  updateConductor: (id: number, conductor: any) => request<any>(`/conductores/${id}`, { method: 'PUT', bodyData: conductor }),
  deleteConductor: (id: number) => request<any>(`/conductores/${id}`, { method: 'DELETE' }),

  // Reporte Tonelada
  getReportesTonelada: (params?: { start?: string; end?: string; codBalanza?: string; descMat?: string; centroOrigen?: string }) => {
    const queryParts: string[] = [];
    if (params?.start) queryParts.push(`startDate=${encodeURIComponent(params.start)}`);
    if (params?.end) queryParts.push(`endDate=${encodeURIComponent(params.end)}`);
    if (params?.codBalanza) queryParts.push(`codBalanza=${encodeURIComponent(params.codBalanza)}`);
    if (params?.descMat) queryParts.push(`descMat=${encodeURIComponent(params.descMat)}`);
    if (params?.centroOrigen) queryParts.push(`centroOrigen=${encodeURIComponent(params.centroOrigen)}`);
    const q = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return request<any[]>(`/reportetonelada${q}`);
  },
  createReporteTonelada: (reporte: any) => request<any>('/reportetonelada', { method: 'POST', bodyData: reporte }),

  // Operaciones
  getTareos: () => request<any[]>('/operaciones/tareos'),
  createTareo: (tareo: any) => request<any>('/operaciones/tareos', { method: 'POST', bodyData: tareo }),

  getHorometros: () => request<any[]>('/operaciones/horometros'),
  createHorometro: (horometro: any) => request<any>('/operaciones/horometros', { method: 'POST', bodyData: horometro }),
  
  getCombustibles: async () => {
    const data = await request<any[]>('/operaciones/combustibles');
    const savedUser = localStorage.getItem('sigecosem_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.rol === 'Alpayana' || parsed.nombre === 'Alpayana' || parsed.username?.toLowerCase() === 'alpayana') {
          const allowedTypes = ['volquete', 'tracto oruga', 'rodillo compactador', 'excavadora', 'camioneta'];
          return data.filter(item => allowedTypes.includes(item.equipo?.tipo?.toLowerCase()));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return data;
  },
  createCombustible: (combustible: any) => request<any>('/operaciones/combustibles', { method: 'POST', bodyData: combustible }),
  
  getMantenimientos: async () => {
    const data = await request<any[]>('/operaciones/mantenimientos');
    const savedUser = localStorage.getItem('sigecosem_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.rol === 'Alpayana' || parsed.nombre === 'Alpayana' || parsed.username?.toLowerCase() === 'alpayana') {
          const allowedTypes = ['volquete', 'tracto oruga', 'rodillo compactador', 'excavadora', 'camioneta'];
          return data.filter(item => allowedTypes.includes(item.equipo?.tipo?.toLowerCase()));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return data;
  },
  createMantenimiento: (mantenimiento: any) => request<any>('/operaciones/mantenimientos', { method: 'POST', bodyData: mantenimiento }),

  // Checklist extended (60-item F-CHK-006)
  submitChecklist: (payload: any) => request<any>('/checklists', { method: 'POST', bodyData: payload }),
  actualizarEstadoEquipo: (placa: string, estado: string) =>
    request<any>(`/equipos/${placa}/block`, { method: 'POST', bodyData: estado }),

  // Auditoria
  getAuditoria: () => request<any[]>('/auditoria'),

  // Config
  getBackupUrl: () => `${window.location.origin}/api/config/backup?access_token=${localStorage.getItem('sigecosem_token')}`,
  getExcelDbUrl: () => `${window.location.origin}/api/config/descargar-excel-db?access_token=${localStorage.getItem('sigecosem_token')}`,
  restoreBackup: (backupData: any) => request<any>('/config/restore', { method: 'POST', bodyData: backupData }),

  // AI Assistant
  chatWithAi: (message: string) => request<{ reply: string }>('/ai/chat', { method: 'POST', bodyData: { message } }),

  // Reportes por Email
  enviarReportePorEmail: (tipoReporte: string, registroId: number, destinatarios: string[]) =>
    request<{ message: string }>('/reportes/enviar-email', {
      method: 'POST',
      bodyData: { tipoReporte, registroId, destinatarios }
    }),

  // Documentos por equipo (SOAT, Revisión Técnica, etc.)
  getDocumentos: (placa: string) => request<any[]>(`/equipos/${placa}/documentos`),
  createDocumento: (placa: string, doc: any) => request<any>(`/equipos/${placa}/documentos`, { method: 'POST', bodyData: doc }),
  deleteDocumento: (placa: string, id: number) => request<any>(`/equipos/${placa}/documentos/${id}`, { method: 'DELETE' }),
  uploadDocumento: (placa: string, formData: FormData) => request<any>(`/equipos/${placa}/documentos/upload`, { method: 'POST', bodyData: formData }),

  // Proyectos
  getProyectos: () => request<any[]>('/equipos/proyectos'),
  createProyecto: (proyecto: any) => request<any>('/equipos/proyectos', { method: 'POST', bodyData: proyecto }),

  // Permisos de rol
  getRolPermisos: (rolId: number) => request<any>(`/usuarios/roles/${rolId}/permisos`),
  updateRolPermisos: (rolId: number, permisos: string) => request<any>(`/usuarios/roles/${rolId}/permisos`, { method: 'PUT', bodyData: { permisos } }),

  // Permisos de usuario
  getUsuarioPermisos: (userId: number) => request<any>(`/usuarios/${userId}/permisos`),
  updateUsuarioPermisos: (userId: number, permisos: string) => request<any>(`/usuarios/${userId}/permisos`, { method: 'PUT', bodyData: { permisos } }),

  // Envío automático manual (para testing)
  enviarReporteDiarioManual: (destinatarios: string[]) =>
    request<{ message: string }>('/reportes/enviar-email', {
      method: 'POST',
      bodyData: { tipoReporte: 'resumen-diario', registroId: 0, destinatarios }
    }),
};
