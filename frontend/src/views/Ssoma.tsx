import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo, CheckList } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Wrench, Lock, Unlock } from 'lucide-react';

interface SsomaProps {
  onNavigate: (view: string, data?: any) => void;
  user: any;
}

export const Ssoma: React.FC<SsomaProps> = ({ onNavigate, user }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [checklists, setChecklists] = useState<CheckList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Block/Release States
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [modalType, setModalType] = useState<'block' | 'release' | null>(null);

  const fetchData = async () => {
    try {
      const eqData = await api.getEquipos();
      const chData = await api.getCheckLists();
      setEquipos(eqData);
      setChecklists(chData.filter(c => c.tieneFallasCriticas));
    } catch (err) {
      console.error('Error fetching SSOMA compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaca || !motivo) return;

    try {
      if (modalType === 'block') {
        await api.blockEquipo(selectedPlaca, motivo);
      } else {
        await api.releaseEquipo(selectedPlaca, motivo);
      }
      setModalType(null);
      setSelectedPlaca(null);
      setMotivo('');
      fetchData();
    } catch (err) {
      alert('Error al realizar acción de SSOMA');
    }
  };

  const filteredEquipos = equipos.filter(eq => 
    eq.placa.toLowerCase().includes(search.toLowerCase()) ||
    eq.codigoInterno.toLowerCase().includes(search.toLowerCase())
  );

  const blockedCount = equipos.filter(e => e.estado === 'Bloqueado por SSOMA').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-rose-500" /> Portal de SSOMA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisión e inspección de seguridad, salud ocupacional y medio ambiente de flota de equipos.
          </p>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Bloqueados por SSOMA</h4>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{blockedCount} Equipos</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Checklists con Fallas Críticas</h4>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{checklists.length} Registros</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Flota Operativa / Disponible</h4>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {equipos.filter(e => e.estado === 'Disponible' || e.estado === 'Operativo').length} de {equipos.length} Equipos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Fleet listing with block action */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-4">
            <h3 className="font-bold text-sm uppercase text-slate-400">Control de Bloqueo Flota</h3>
            <div className="relative max-w-xs w-full">
              <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-400 w-4.5" />
              <input
                type="text"
                placeholder="Buscar por placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredEquipos.map((eq) => (
              <div 
                key={eq.placa} 
                className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-semibold"
              >
                <div 
                  onClick={() => onNavigate('equipo-detalle', { placa: eq.placa })}
                  className="space-y-1 cursor-pointer hover:underline"
                >
                  <h4 className="font-bold text-slate-950 dark:text-white">{eq.marca} {eq.modelo} ({eq.codigoInterno})</h4>
                  <p className="text-[10px] text-slate-400">Placa: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-200/50 dark:bg-slate-800 px-1 py-0.5 rounded">{eq.placa}</span></p>
                  <p className="text-[10px] text-slate-400 font-medium">Estado: <span className={eq.estado === 'Bloqueado por SSOMA' ? 'text-rose-500' : 'text-slate-500'}>{eq.estado}</span></p>
                </div>

                <div className="flex gap-2">
                  {eq.estado === 'Bloqueado por SSOMA' ? (
                    <button 
                      onClick={() => { setSelectedPlaca(eq.placa); setModalType('release'); }}
                      className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-1 font-bold"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Liberar
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setSelectedPlaca(eq.placa); setModalType('block'); }}
                      className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-1 font-bold"
                    >
                      <Lock className="h-3.5 w-3.5" /> Bloquear
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed inspections history */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
          <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-4 mb-4">Inspecciones con Fallas Críticas</h3>
          
          {checklists.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No hay inspecciones fallidas en el registro.</p>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {checklists.map((ch) => (
                <div 
                  key={ch.id} 
                  onClick={() => onNavigate('equipo-detalle', { placa: ch.equipoPlaca })}
                  className="p-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-2xl cursor-pointer transition-colors flex items-start justify-between text-xs font-semibold"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-rose-900 dark:text-rose-200">Inspección Rechazada: {ch.equipoPlaca}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Operador: {ch.operador ? `${ch.operador.nombre} ${ch.operador.apellido}` : 'N/A'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Observación: {ch.observaciones}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">{new Date(ch.fechaHora).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Action Dialog */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              {modalType === 'block' ? <Lock className="h-6 w-6 text-rose-500" /> : <Unlock className="h-6 w-6 text-emerald-500" />}
              {modalType === 'block' ? 'Bloquear Equipo' : 'Liberar Equipo'} ({selectedPlaca})
            </h3>
            
            <form onSubmit={handleAction} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">
                  {modalType === 'block' ? 'Justificación del Bloqueo Crítico' : 'Justificación de la Habilitación Técnica'}
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={modalType === 'block' ? 'Describa el desperfecto que causó el bloqueo...' : 'Describa las correcciones de taller o de seguridad que permiten su liberación...'}
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalType(null); setSelectedPlaca(null); setMotivo(''); }}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`py-2 px-5 text-white rounded-xl font-bold ${
                    modalType === 'block' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
