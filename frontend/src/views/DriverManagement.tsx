import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, Trash2, Edit, Check, ShieldCheck } from 'lucide-react';

export const DriverManagement: React.FC = () => {
  const [conductores, setConductores] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [tareos, setTareos] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    licencia: '',
    categoriaLicencia: 'A-IIIc',
    dni: '',
    telefono: ''
  });

  const [selectedTipos, setSelectedTipos] = useState<string[]>(['Volquete']);
  const [editingConductor, setEditingConductor] = useState<any | null>(null);

  const defaultTipos = ['Volquete', 'Excavadora', 'Camioneta', 'Tracto Oruga', 'Cargador Frontal', 'Cisterna', 'Rodillo'];

  const availableTipos = Array.from(
    new Set([...defaultTipos, ...equipos.map(e => e.tipo).filter(Boolean)])
  );

  const fetchConductores = async () => {
    try {
      const data = await api.getConductoresTodos();
      setConductores(data || []);
      const eqData = await api.getEquipos().catch(() => []);
      setEquipos(eqData || []);
      const tData = await api.getTareos().catch(() => []);
      setTareos(tData || []);
      const cData = await api.getCheckLists().catch(() => []);
      setChecklists(cData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductores();
  }, []);

  const toggleTipo = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const getConductorHours = (conductorId: number) => {
    const tHours = tareos
      .filter((t: any) => t.conductorId === conductorId)
      .reduce((sum: number, t: any) => sum + Number(t.horasNormales || 0) + Number(t.horasExtras || 0), 0);

    const cHours = checklists
      .filter((c: any) => c.conductorId === conductorId)
      .reduce((sum: number, c: any) => {
        if (c.horometroFinal && c.horometroInicial) {
          const diff = Number(c.horometroFinal) - Number(c.horometroInicial);
          return sum + (diff > 0 ? diff : 0);
        }
        return sum;
      }, 0);

    return tHours > 0 ? tHours : cHours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tipoEquipoAutorizado: selectedTipos.join(', '),
        equipoPlacaAsignada: '',
        activo: true
      };

      if (editingConductor) {
        await api.updateConductor(editingConductor.id, payload);
        alert(`Conductor ${formData.nombre} ${formData.apellido} actualizado exitosamente.`);
        setEditingConductor(null);
      } else {
        await api.createConductor(payload);
      }

      setFormData({
        nombre: '', apellido: '', licencia: '', categoriaLicencia: 'A-IIIc', dni: '', telefono: ''
      });
      setSelectedTipos(['Volquete']);
      fetchConductores();
    } catch (error) {
      alert("Error al guardar el conductor.");
    }
  };

  const startEdit = (c: any) => {
    setEditingConductor(c);
    setFormData({
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      licencia: c.licencia || '',
      categoriaLicencia: c.categoriaLicencia || 'A-IIIc',
      dni: c.dni || '',
      telefono: c.telefono || ''
    });
    const tipos = (c.tipoEquipoAutorizado || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
    setSelectedTipos(tipos.length > 0 ? tipos : ['Volquete']);
  };

  const cancelEdit = () => {
    setEditingConductor(null);
    setFormData({
      nombre: '', apellido: '', licencia: '', categoriaLicencia: 'A-IIIc', dni: '', telefono: ''
    });
    setSelectedTipos(['Volquete']);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que desea eliminar este conductor?")) return;
    try {
      await api.deleteConductor(id);
      fetchConductores();
    } catch (error) {
      alert("Error al eliminar el conductor.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestión de Personal y Conductores</h3>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Administra conductores, asignándoles licencias y los tipos de equipos que están autorizados a operar.</p>
          </div>
        </div>

        {editingConductor && (
          <button onClick={cancelEdit} className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            Cancelar Edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> {editingConductor ? `Modificar Conductor: ${editingConductor.nombre} ${editingConductor.apellido}` : 'Registrar Nuevo Conductor'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">Nombre</label>
            <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="e.g. Manuel" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">Apellido</label>
            <input required type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} placeholder="e.g. Pérez" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">DNI</label>
            <input required type="text" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} placeholder="8 dígitos" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">Licencia de Conducir</label>
            <input required type="text" value={formData.licencia} onChange={e => setFormData({...formData, licencia: e.target.value})} placeholder="Nº Licencia" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">Categoría Licencia</label>
            <input required type="text" value={formData.categoriaLicencia} onChange={e => setFormData({...formData, categoriaLicencia: e.target.value})} placeholder="e.g. A-IIIc" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1 text-xs uppercase">Teléfono</label>
            <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="999 888 777" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
          </div>
        </div>

        {/* Multi-select check pills for authorized equipment types */}
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
            Tipos de Equipos Autorizados para Operar (Marcar varios):
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTipos.map(tipo => {
              const isChecked = selectedTipos.includes(tipo);
              return (
                <button
                  type="button"
                  key={tipo}
                  onClick={() => toggleTipo(tipo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                  {tipo}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="py-2.5 px-6 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/10 transition-colors flex items-center gap-2 text-xs">
            <UserPlus className="h-4 w-4" /> {editingConductor ? 'Guardar Cambios de Conductor' : 'Agregar Conductor y Asignar Aptitudes'}
          </button>
          {editingConductor && (
            <button type="button" onClick={cancelEdit} className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 mt-6">
        <table className="w-full border-collapse text-left text-xs font-semibold">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Nombre Completo</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Licencia</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Equipos Autorizados</th>
              <th className="p-3 text-emerald-600">Horas Trabajadas</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {conductores.map(c => (
              <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 ${!c.activo ? 'opacity-50' : ''}`}>
                <td className="p-3 font-bold text-slate-900 dark:text-white">{c.nombre} {c.apellido}</td>
                <td className="p-3 font-mono">{c.dni}</td>
                <td className="p-3 font-mono">{c.licencia}</td>
                <td className="p-3 font-mono">{c.categoriaLicencia}</td>
                <td className="p-3">
                  {c.tipoEquipoAutorizado ? (
                    <div className="flex flex-wrap gap-1">
                      {c.tipoEquipoAutorizado.split(',').map((t: string, idx: number) => (
                        <span key={idx} className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{getConductorHours(c.id).toFixed(1)} Hrs</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => startEdit(c)} className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-all" title="Editar Conductor">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all" title="Eliminar Conductor">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {conductores.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">No hay conductores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
