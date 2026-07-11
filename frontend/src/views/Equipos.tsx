import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo } from '../types';
import { Truck, Plus, Search, Filter, ShieldAlert, Sparkles, MapPin, Badge } from 'lucide-react';

interface EquiposProps {
  onNavigate: (view: string, data?: any) => void;
  initialFilters?: { estado?: string };
  user?: any;
}

export const Equipos: React.FC<EquiposProps> = ({ onNavigate, initialFilters, user }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.estado || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding new equipment
  const [newPlaca, setNewPlaca] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newTipo, setNewTipo] = useState('Volquete');
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newValor, setNewValor] = useState(0);
  const [newEstado, setNewEstado] = useState('Disponible');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEquipos = async () => {
    try {
      const data = await api.getEquipos();
      setEquipos(data);
    } catch (err) {
      console.error('Error fetching equipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newPlaca || !newCodigo || !newMarca || !newModelo) {
      setFormError('Por favor llene todos los campos obligatorios.');
      return;
    }

    try {
      await api.createEquipo({
        placa: newPlaca,
        codigoInterno: newCodigo,
        tipo: newTipo,
        marca: newMarca,
        modelo: newModelo,
        valor: newValor,
        estado: newEstado,
        seguro: 'Rimac Base',
        fotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        gpsId: `GPS-${newPlaca}`
      });
      setShowAddModal(false);
      // Reset form
      setNewPlaca('');
      setNewCodigo('');
      setNewMarca('');
      setNewModelo('');
      setNewValor(0);
      fetchEquipos();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar equipo.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Operativo':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Bloqueado por SSOMA':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse';
      case 'En mantenimiento preventivo':
      case 'En mantenimiento correctivo':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const filteredEquipos = equipos.filter((eq) => {
    const matchesSearch = eq.placa.toLowerCase().includes(search.toLowerCase()) || 
                          eq.codigoInterno.toLowerCase().includes(search.toLowerCase()) ||
                          eq.marca.toLowerCase().includes(search.toLowerCase()) ||
                          eq.modelo.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === '' || eq.tipo.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === '' || eq.estado.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header view */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Flota de Equipos y Maquinaria</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administre expedientes, inspecciones and asignaciones de los vehículos.
          </p>
        </div>
        {(user?.rol === 'Administrador' || user?.rol === 'Planeamiento') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-150 active:scale-98 text-sm"
          >
            <Plus className="h-4 w-4" /> Registrar Equipo
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-400 w-5" />
          <input
            type="text"
            placeholder="Buscar por placa, código, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Filter className="h-4 w-4" /> FILTRAR:
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Todos los Tipos</option>
            <option value="Volquete">Volquetes</option>
            <option value="Excavadora">Excavadoras</option>
            <option value="Retroexcavadora">Retroexcavadoras</option>
            <option value="Cargador Frontal">Cargadores Frontales</option>
            <option value="Cisterna">Cisternas</option>
            <option value="Tracto Oruga">Tracto Oruga</option>
            <option value="Rodillo Compactador">Rodillo Compactador</option>
            <option value="Camioneta">Camioneta</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Todos los Estados</option>
            <option value="Disponible">Disponibles</option>
            <option value="Operativo">Operativos</option>
            <option value="Bloqueado por SSOMA">Bloqueados SSOMA</option>
            <option value="En mantenimiento preventivo">Mantenimiento Preventivo</option>
            <option value="En mantenimiento correctivo">Mantenimiento Correctivo</option>
          </select>
        </div>
      </div>

      {/* Grid of Equipos */}
      {filteredEquipos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 text-slate-400">
          <Truck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="font-medium text-sm">No se encontraron equipos para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipos.map((eq) => (
            <div
              key={eq.placa}
              onClick={() => onNavigate('equipo-detalle', { placa: eq.placa })}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all flex flex-col group"
            >
              {/* Photo Area */}
              <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                {eq.fotoUrl ? (
                  <img 
                    src={eq.fotoUrl} 
                    alt={eq.modelo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Truck className="h-16 w-16" />
                  </div>
                )}
                
                {/* Badge of status on photo */}
                <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${getStatusColor(eq.estado)}`}>
                  {eq.estado}
                </span>
                
                {/* Internal code overlay */}
                <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1 rounded-lg text-white text-xs font-bold">
                  {eq.codigoInterno}
                </div>
              </div>

              {/* Vehicle specs */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{eq.marca} {eq.modelo}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1 font-semibold">
                    <span>PLACA:</span>
                    <span className="text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {eq.placa}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 dark:border-slate-800/80 py-3 font-semibold text-slate-500">
                  <div>
                    <span className="text-slate-400 block font-normal">Tipo</span>
                    <span className="text-slate-700 dark:text-slate-300">{eq.tipo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Proyecto</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block">
                      {eq.proyecto?.nombre || 'Sede Central'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-1 font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> GPS Operativo</span>
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline">
                    Ver Expediente &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-100 dark:border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold mb-4">Registrar Nuevo Equipo en SIGECOSEM</h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddEquipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Placa (Requerido)</label>
                  <input
                    type="text"
                    value={newPlaca}
                    onChange={(e) => setNewPlaca(e.target.value.toUpperCase())}
                    placeholder="EGS-123"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código Interno (Requerido)</label>
                  <input
                    type="text"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="VOL-03"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo Equipo</label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="Volquete">Volquete</option>
                    <option value="Excavadora">Excavadora</option>
                    <option value="Retroexcavadora">Retroexcavadora</option>
                    <option value="Cargador Frontal">Cargador Frontal</option>
                    <option value="Cisterna">Cisterna</option>
                    <option value="Tracto Oruga">Tracto Oruga</option>
                    <option value="Rodillo Compactador">Rodillo Compactador</option>
                    <option value="Camioneta">Camioneta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Marca</label>
                  <input
                    type="text"
                    value={newMarca}
                    onChange={(e) => setNewMarca(e.target.value)}
                    placeholder="Volvo / CAT"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Modelo</label>
                  <input
                    type="text"
                    value={newModelo}
                    onChange={(e) => setNewModelo(e.target.value)}
                    placeholder="FMX 460 / 336"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor Unitario ($ USD)</label>
                  <input
                    type="number"
                    value={newValor}
                    onChange={(e) => setNewValor(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Estado Operativo Inicial</label>
                <select
                  value={newEstado}
                  onChange={(e) => setNewEstado(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Operativo">Operativo</option>
                  <option value="En mantenimiento preventivo">En mantenimiento preventivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
