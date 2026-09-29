import React, { useState } from 'react';
import { api } from '../services/api';
import { Settings, Download, Upload, AlertTriangle, ShieldCheck, UserPlus, Trash2, Users } from 'lucide-react';
import { DriverManagement } from './DriverManagement';

interface ConfiguracionProps {
  user?: any;
}

export const Configuracion: React.FC<ConfiguracionProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleBackupDownload = () => {
    // Open backup URL in a new window or trigger download link
    const backupUrl = api.getBackupUrl();
    window.open(backupUrl, '_blank');
  };

  const handleRestoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      '¡ADVERTENCIA CRÍTICA!\n\nRestaurar una copia de seguridad sobrescribirá COMPLETAMENTE todos los datos actuales del sistema. ¿Desea proceder?'
    );
    if (!confirmRestore) {
      e.target.value = ''; // Reset input
      return;
    }

    setLoading(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupJson = JSON.parse(text);
        
        // Post parsed payload to backend
        const res = await api.restoreBackup(backupJson);
        setStatus({
          type: 'success',
          message: res.message || 'La base de datos se ha restaurado correctamente desde la copia de seguridad.'
        });
      } catch (err: any) {
        setStatus({
          type: 'error',
          message: err.message || 'Error al restaurar archivo. Verifique el formato.'
        });
      } finally {
        setLoading(false);
        e.target.value = ''; // Reset input
      }
    };

    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Error al leer el archivo seleccionado.' });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  // --- User Management ---
  const [roles, setRoles] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({
    username: '', password: '', nombre: '', apellido: '', email: '', cargo: ''
  });
  const [rolInput, setRolInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([
    'dashboard', 'equipos', 'centro-reportes', 'checklist', 'reporte-tonelada', 'combustible', 'tareo', 'mantenimiento'
  ]);

  // Edit user state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingUserData, setEditingUserData] = useState({
    nombre: '', apellido: '', email: '', username: '', password: '', cargo: '', rol: '', area: ''
  });
  const [editingUserPermisos, setEditingUserPermisos] = useState<string[]>([]);

  const fetchUsuarios = async () => {
    try {
      const u = await api.getUsuarios();
      setUsuarios(u || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  React.useEffect(() => {
    api.getRoles().then(r => {
      const list = r || [];
      setRoles(list);
      if (list.length > 0) setRolInput(list[0].nombre);
    }).catch(console.error);
    api.getAreas().then(a => {
      const list = a || [];
      setAreas(list);
      if (list.length > 0) setAreaInput(list[0].nombre);
    }).catch(console.error);
    fetchUsuarios();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Password check: non-empty
    if (!newUser.password || newUser.password.trim() === '') {
      setStatus({ 
        type: 'error', 
        message: 'Debe ingresar una contraseña para el usuario.' 
      });
      setLoading(false);
      return;
    }

    try {
      const selectedRole = roles.find(r => r.nombre.toLowerCase() === rolInput.toLowerCase());
      const selectedArea = areas.find(a => a.nombre.toLowerCase() === areaInput.toLowerCase());

      const payload = {
        ...newUser,
        rolId: selectedRole ? selectedRole.id : null,
        nuevoRolNombre: selectedRole ? undefined : rolInput,
        areaId: selectedArea ? selectedArea.id : null,
        nuevaAreaNombre: selectedArea ? undefined : areaInput,
        permisos: selectedPermisos.join(',')
      };

      await api.createUsuario(payload);
      setStatus({ type: 'success', message: 'Usuario creado exitosamente con su cargo asignado.' });
      setNewUser({ username: '', password: '', nombre: '', apellido: '', email: '', cargo: '' });
      setRolInput(roles[0]?.nombre || '');
      setAreaInput(areas[0]?.nombre || '');
      setSelectedPermisos(['dashboard', 'equipos', 'centro-reportes', 'checklist', 'reporte-tonelada', 'combustible', 'tareo', 'mantenimiento']);
      fetchUsuarios();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error al crear usuario.' });
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditingUserData({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      username: u.username || '',
      password: '',
      cargo: u.cargo || '',
      rol: u.rol || '',
      area: u.area || ''
    });
    setEditingUserPermisos((u.permisos || '').split(',').map((p: string) => p.trim()).filter(Boolean));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setStatus(null);
    try {
      const selectedRole = roles.find(r => r.nombre.toLowerCase() === editingUserData.rol.toLowerCase());
      const selectedArea = areas.find(a => a.nombre.toLowerCase() === editingUserData.area.toLowerCase());

      const payload: any = {
        nombre: editingUserData.nombre,
        apellido: editingUserData.apellido,
        email: editingUserData.email,
        username: editingUserData.username,
        cargo: editingUserData.cargo,
        rolId: selectedRole ? selectedRole.id : null,
        nuevoRolNombre: selectedRole ? undefined : editingUserData.rol,
        areaId: selectedArea ? selectedArea.id : null,
        nuevaAreaNombre: selectedArea ? undefined : editingUserData.area,
        permisos: editingUserPermisos.join(',')
      };

      if (editingUserData.password && editingUserData.password.trim() !== '') {
        payload.password = editingUserData.password;
      }

      await api.updateUsuario(editingUser.id, payload);
      setStatus({ type: 'success', message: `Usuario '${editingUserData.username}' actualizado correctamente.` });
      setEditingUser(null);
      fetchUsuarios();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error al actualizar usuario.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: number) => {
    setStatus(null);
    try {
      const res = await api.toggleUsuarioActivo(id);
      setStatus({ type: 'success', message: res.message });
      fetchUsuarios();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error al cambiar estado del usuario.' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    const confirmDelete = window.confirm('¿Está seguro de que desea eliminar permanentemente este usuario?');
    if (!confirmDelete) return;

    setStatus(null);
    try {
      const res = await api.deleteUsuario(id);
      setStatus({ type: 'success', message: res.message });
      fetchUsuarios();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error al eliminar usuario.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-8 w-8 text-slate-600 dark:text-slate-400" /> Configuración de Sistemas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Administración central de base de datos, respaldos de información corporativa y utilidades de restauración.
        </p>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
          status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
        }`}>
          {status.type === 'success' ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Main utilities grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Backup Utility */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generar Copia de Seguridad</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Descarga un archivo JSON estructurado conteniendo la totalidad de la información almacenada en PostgreSQL (equipos, tareos, combustibles, auditorías, mantenimientos).
            </p>
          </div>
          <button
            onClick={handleBackupDownload}
            disabled={user?.rol !== 'Administrador'}
            className={`w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 transition-colors flex items-center justify-center gap-2 text-xs ${user?.rol !== 'Administrador' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Download className="h-4.5 w-4.5" /> Descargar Backup (.json)
          </button>
        </div>

        {/* Restore Utility */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl w-fit">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Restaurar Base de Datos</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Sube una copia de seguridad JSON previa. Esta acción restablecerá el estado exacto de las tablas en el momento en que se generó el respaldo.
            </p>
          </div>

          <div className="relative mt-4">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreUpload}
              disabled={loading || user?.rol !== 'Administrador'}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
            />
            <button
              type="button"
              disabled={loading || user?.rol !== 'Administrador'}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md shadow-rose-600/10 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="h-4.5 w-4.5" /> Cargar y Restaurar Backup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Excel DB Replica Utility */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Base de Datos en Excel</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Descarga la base de datos sincronizada en formato Excel (.xlsx), conteniendo hojas específicas para Checklists, Reportes de Toneladas, Conductores y Combustibles.
            </p>
          </div>
          <button
            onClick={() => window.open(api.getExcelDbUrl(), '_blank')}
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 transition-colors flex items-center justify-center gap-2 text-xs"
          >
            <Download className="h-4.5 w-4.5" /> Descargar BD Excel (.xlsx)
          </button>
        </div>

      </div>

      {/* User Management Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Crea nuevos accesos al sistema, incluyendo conductores y operadores.</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Nombre</label>
              <input type="text" required value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Apellido</label>
              <input type="text" required value={newUser.apellido} onChange={e => setNewUser({ ...newUser, apellido: e.target.value })} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Cargo / Puesto</label>
              <input 
                type="text" 
                list="cargos-list" 
                value={newUser.cargo} 
                onChange={e => setNewUser({ ...newUser, cargo: e.target.value })} 
                placeholder="Ej. Gerente Operativo, Operador"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold" 
              />
              <datalist id="cargos-list">
                <option value="Presidente del Directorio" />
                <option value="Gerente Operativo" />
                <option value="Gerente de Operaciones" />
                <option value="Jefe de Planeamiento" />
                <option value="Jefe de Equipos y Mantenimiento" />
                <option value="Jefe de SSOMA" />
                <option value="Jefe de RRHH" />
                <option value="Jefe de Administración y Finanzas" />
                <option value="Jefe de Logística" />
                <option value="Conductor / Operador" />
                <option value="Técnico Mecánico" />
                <option value="Vigilante de Garita" />
                <option value="Inspector SSOMA" />
              </datalist>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Usuario (Login)</label>
              <input type="text" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Contraseña</label>
              <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Rol</label>
              <input 
                type="text" 
                list="roles-list" 
                required 
                value={rolInput} 
                onChange={e => setRolInput(e.target.value)} 
                placeholder="Elige o escribe un Rol"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" 
              />
              <datalist id="roles-list">
                {roles.map(r => <option key={r.id} value={r.nombre} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1 text-xs">Área</label>
              <input 
                type="text" 
                list="areas-list" 
                value={areaInput} 
                onChange={e => setAreaInput(e.target.value)} 
                placeholder="Elige o escribe un Área"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" 
              />
              <datalist id="areas-list">
                {areas.map(a => <option key={a.id} value={a.nombre} />)}
              </datalist>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-2 text-xs">Acceso a Carpetas/Módulos</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'dashboard', label: 'Panel Control' },
                  { id: 'equipos', label: 'Flota Equipos' },
                  { id: 'centro-reportes', label: 'Bandeja Reportes' },
                  { id: 'checklist', label: 'Checklist Digital' },
                  { id: 'reporte-tonelada', label: 'Reporte Tonelada' },
                  { id: 'combustible', label: 'Combustibles' },
                  { id: 'tareo', label: 'Tareos / Horas' },
                  { id: 'mantenimiento', label: 'Mantenimientos' },
                  { id: 'vigilancia', label: 'Control Garita' },
                  { id: 'ssoma', label: 'Portal SSOMA' },
                  { id: 'gobernanza', label: 'Gobernanza' },
                  { id: 'estructura-organica', label: 'Estructura Orgánica' },
                  { id: 'personal', label: 'Personal' },
                  { id: 'auditoria', label: 'Auditoría Logs' },
                  { id: 'configuracion', label: 'Configuración' }
                ].map(m => (
                  <label key={m.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedPermisos.includes(m.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedPermisos(prev => [...prev, m.id]);
                        } else {
                          setSelectedPermisos(prev => prev.filter(p => p !== m.id));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading || user?.rol !== 'Administrador'} className={`w-full md:w-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 transition-colors flex items-center justify-center gap-2 text-xs mt-4 ${user?.rol !== 'Administrador' ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}>
            <UserPlus className="h-4 w-4" /> Crear Usuario y Designar Cargo
          </button>
        </form>
      </div>

      {/* Users List Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lista de Usuarios y Cargos</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Visualización y administración de cuentas corporativas de ECOSEM.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full border-collapse text-left text-xs font-semibold">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Nombre Completo</th>
                <th className="p-3">Cargo / Puesto</th>
                <th className="p-3">Usuario (Login)</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Área</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {u.nombre} {u.apellido}
                    {u.permisos && (
                      <div className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate max-w-[200px]" title={u.permisos}>
                        Acceso: {u.permisos}
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {u.cargo || '—'}
                  </td>
                  <td className="p-3 font-mono">{u.username}</td>
                  <td className="p-3">{u.rol || 'N/A'}</td>
                  <td className="p-3">{u.area || 'N/A'}</td>
                  <td className="p-3">
                    <button 
                       onClick={() => handleToggleActivo(u.id)}
                       disabled={user?.rol !== 'Administrador'}
                       className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold transition-all ${
                         u.activo ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                       } ${user?.rol !== 'Administrador' ? 'opacity-70 cursor-not-allowed' : ''}`}
                     >
                       {u.activo ? 'Activo' : 'Inactivo'}
                     </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {user?.rol === 'Administrador' && (
                        <>
                          <button
                            onClick={() => startEditUser(u)}
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                            title="Editar usuario y cargo"
                          >
                            <Settings className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm font-bold">No hay usuarios registrados</div>
          )}
        </div>

        {/* Modal de edición de usuario completo */}
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="p-5 border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" /> Modificar Datos y Cargo del Usuario: <span className="text-indigo-600 dark:text-indigo-400">{editingUser.username}</span>
              </h4>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-500 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Nombre</label>
                <input 
                  type="text" 
                  required 
                  value={editingUserData.nombre} 
                  onChange={e => setEditingUserData({...editingUserData, nombre: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Apellido</label>
                <input 
                  type="text" 
                  required 
                  value={editingUserData.apellido} 
                  onChange={e => setEditingUserData({...editingUserData, apellido: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Cargo / Puesto</label>
                <input 
                  type="text" 
                  list="cargos-list" 
                  value={editingUserData.cargo} 
                  onChange={e => setEditingUserData({...editingUserData, cargo: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Usuario (Login)</label>
                <input 
                  type="text" 
                  required 
                  value={editingUserData.username} 
                  onChange={e => setEditingUserData({...editingUserData, username: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Nueva Contraseña (Opcional)</label>
                <input 
                  type="password" 
                  value={editingUserData.password} 
                  onChange={e => setEditingUserData({...editingUserData, password: e.target.value})}
                  placeholder="Dejar blanco para conservar"
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Rol</label>
                <input 
                  type="text" 
                  list="roles-list" 
                  value={editingUserData.rol} 
                  onChange={e => setEditingUserData({...editingUserData, rol: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Área</label>
                <input 
                  type="text" 
                  list="areas-list" 
                  value={editingUserData.area} 
                  onChange={e => setEditingUserData({...editingUserData, area: e.target.value})}
                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1.5 text-xs">Acceso a Módulos</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                {[
                  { id: 'dashboard', label: 'Panel Control' },
                  { id: 'equipos', label: 'Flota Equipos' },
                  { id: 'centro-reportes', label: 'Bandeja Reportes' },
                  { id: 'checklist', label: 'Checklist Digital' },
                  { id: 'reporte-tonelada', label: 'Reporte Tonelada' },
                  { id: 'combustible', label: 'Combustibles' },
                  { id: 'tareo', label: 'Tareos / Horas' },
                  { id: 'mantenimiento', label: 'Mantenimientos' },
                  { id: 'vigilancia', label: 'Control Garita' },
                  { id: 'ssoma', label: 'Portal SSOMA' },
                  { id: 'gobernanza', label: 'Gobernanza' },
                  { id: 'estructura-organica', label: 'Estructura Orgánica' },
                  { id: 'personal', label: 'Personal' },
                  { id: 'auditoria', label: 'Auditoría Logs' },
                  { id: 'configuracion', label: 'Configuración' }
                ].map(m => (
                  <label key={m.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingUserPermisos.includes(m.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setEditingUserPermisos(prev => [...prev, m.id]);
                        } else {
                          setEditingUserPermisos(prev => prev.filter(p => p !== m.id));
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 text-xs transition-colors"
              >
                Guardar Cambios de Usuario
              </button>
            </div>
          </form>
        )}
      </div>

      <DriverManagement />

      {/* Database statistics details */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border text-xs text-slate-400 font-semibold space-y-2">
        <h4 className="text-slate-500 uppercase tracking-wider text-[10px]">Políticas de Respaldo Corporativo</h4>
        <p>• Los respaldos automáticos en caliente se ejecutan de manera diaria a las 00:00 Horas UTC y se almacenan en volúmenes Docker persistentes.</p>
        <p>• Los archivos de auditoría no son exportados ni borrados durante los procesos de restauración estándar para resguardar la trazabilidad.</p>
      </div>

    </div>
  );
};
