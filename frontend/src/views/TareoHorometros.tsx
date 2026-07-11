import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo } from '../types';
import { Calendar, Clock, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TareoHorometrosProps {
  onNavigate: (view: string) => void;
  user: any;
}

export const TareoHorometros: React.FC<TareoHorometrosProps> = ({ onNavigate, user }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'tareo' | 'horometro'>('tareo');

  // Form States - Tareo
  const [tPlaca, setTPlaca] = useState('');
  const [tActividad, setTActividad] = useState('');
  const [tFecha, setTFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tHoraInicio, setTHoraInicio] = useState('07:00');
  const [tHoraFin, setTHoraFin] = useState('17:00');
  const [tObs, setTObs] = useState('');

  // Form States - Horometro
  const [hPlaca, setHPlaca] = useState('');
  const [hInicial, setHInicial] = useState(0);
  const [hFinal, setHFinal] = useState(0);
  const [hFecha, setHFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hProximo, setHProximo] = useState(0);

  // Status Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const data = await api.getEquipos();
      setEquipos(data);
      if (data.length > 0) {
        setTPlaca(data[0].placa);
        setHPlaca(data[0].placa);
      }
    } catch (err) {
      console.error('Error fetching equipments for operations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTareoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    // Format times into TimeSpan formatted strings
    const tareoData = {
      equipoPlaca: tPlaca,
      operadorId: user.id,
      actividad: tActividad,
      fecha: tFecha,
      horaInicio: `${tHoraInicio}:00`,
      horaFin: `${tHoraFin}:00`,
      proyectoId: equipos.find(eq => eq.placa === tPlaca)?.proyectoId || null,
      areaId: equipos.find(eq => eq.placa === tPlaca)?.areaId || null,
      observaciones: tObs
    };

    try {
      await api.createTareo(tareoData);
      setAlert({
        type: 'success',
        message: `Tareo registrado correctamente para el equipo ${tPlaca}. Horas calculadas automáticamente.`
      });
      setTActividad('');
      setTObs('');
      fetchData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al guardar tareo. Verifique el estado del equipo.'
      });
    }
  };

  const handleHorometroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (hFinal <= hInicial) {
      setAlert({
        type: 'error',
        message: 'El horómetro final debe ser mayor que el inicial.'
      });
      return;
    }

    const horometroData = {
      equipoPlaca: hPlaca,
      fecha: hFecha,
      inicial: hInicial,
      final: hFinal,
      proximoMantenimiento: hProximo
    };

    try {
      const res = await api.createHorometro(horometroData);
      setAlert({
        type: 'success',
        message: `Horómetro registrado correctamente. Horas trabajadas: ${hFinal - hInicial} hrs. Faltan ${res.horasRestantes} horas para el siguiente mantenimiento.`
      });
      setHInicial(hFinal);
      setHFinal(0);
      fetchData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al guardar horómetro.'
      });
    }
  };

  const handlePlacaChange = (placa: string, isHorometro: boolean) => {
    if (isHorometro) {
      setHPlaca(placa);
    } else {
      setTPlaca(placa);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tareo y Control de Horómetros</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre horas de trabajo diarias, horas extras, y lecturas del horómetro acumulado.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Sub tabs switches */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => { setActiveSubTab('tareo'); setAlert(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'tareo' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="inline h-4 w-4 mr-1.5" /> Registrar Tareo Diario
        </button>
        <button
          onClick={() => { setActiveSubTab('horometro'); setAlert(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'horometro' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="inline h-4 w-4 mr-1.5" /> Lectura de Horómetro
        </button>
      </div>

      {/* Forms Panels */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        
        {/* TAREO FORM */}
        {activeSubTab === 'tareo' && (
          <form onSubmit={handleTareoSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Vehículo / Placa</label>
                <select
                  value={tPlaca}
                  onChange={(e) => handlePlacaChange(e.target.value, false)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                >
                  {equipos.map((eq) => (
                    <option key={eq.placa} value={eq.placa} disabled={eq.estado === 'Bloqueado por SSOMA'}>
                      {eq.placa} ({eq.codigoInterno}) {eq.estado === 'Bloqueado por SSOMA' ? ' - BLOQUEADO SSOMA' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Fecha Actividad</label>
                <input
                  type="date"
                  value={tFecha}
                  onChange={(e) => setTFecha(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Hora de Inicio</label>
                <input
                  type="time"
                  value={tHoraInicio}
                  onChange={(e) => setTHoraInicio(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Hora de Finalización</label>
                <input
                  type="time"
                  value={tHoraFin}
                  onChange={(e) => setTHoraFin(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-2">Actividad / Tarea Ejecutada</label>
              <input
                type="text"
                value={tActividad}
                onChange={(e) => setTActividad(e.target.value)}
                placeholder="Ej. Acarreo de mineral, Relleno de taludes, etc."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-2">Observaciones</label>
              <textarea
                value={tObs}
                onChange={(e) => setTObs(e.target.value)}
                placeholder="Detalle demoras operativas, esperas de camiones o fallas mecánicas menores..."
                rows={4}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Registrar Actividad
              </button>
            </div>
          </form>
        )}

        {/* HOROMETRO FORM */}
        {activeSubTab === 'horometro' && (
          <form onSubmit={handleHorometroSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Vehículo / Placa</label>
                <select
                  value={hPlaca}
                  onChange={(e) => handlePlacaChange(e.target.value, true)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                >
                  {equipos.map((eq) => (
                    <option key={eq.placa} value={eq.placa}>
                      {eq.placa} ({eq.codigoInterno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Fecha Registro</label>
                <input
                  type="date"
                  value={hFecha}
                  onChange={(e) => setHFecha(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Horómetro Inicial</label>
                <input
                  type="number"
                  step="0.1"
                  value={hInicial}
                  onChange={(e) => setHInicial(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Horómetro Final</label>
                <input
                  type="number"
                  step="0.1"
                  value={hFinal}
                  onChange={(e) => setHFinal(Number(e.target.value))}
                  placeholder="0.0"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-2">Próximo Mantenimiento</label>
                <input
                  type="number"
                  step="0.1"
                  value={hProximo}
                  onChange={(e) => setHProximo(Number(e.target.value))}
                  placeholder="H. Límite"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Registrar Horómetro
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
