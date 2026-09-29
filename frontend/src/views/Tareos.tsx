import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo, Conductor, Tareo } from '../types';
import { Calendar, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';

export const Tareos: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [logs, setLogs] = useState<Tareo[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [placa, setPlaca] = useState('');
  const [conductorId, setConductorId] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');
  const [actividad, setActividad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('17:00');
  const [observaciones, setObservaciones] = useState('');

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const eqData = await api.getEquipos().catch(() => []);
      const condData = await api.getConductores().catch(() => []);
      const tareoData = await api.getTareos().catch(() => []);

      setEquipos(eqData);
      setConductores(condData);
      setLogs(tareoData);

      if (eqData.length > 0) setPlaca(eqData[0].placa);
      if (condData.length > 0) {
        setConductorId(condData[0].id.toString());
        setConductorNombre(`${condData[0].nombre} ${condData[0].apellido}`);
      }
    } catch (err) {
      console.error('Error fetching tareos data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const matched = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === conductorNombre.trim().toLowerCase());
    const finalCondId = matched ? matched.id : (parseInt(conductorId) || 1);

    const payload = {
      equipoPlaca: placa,
      conductorId: finalCondId,
      actividad,
      fecha,
      horaInicio: horaInicio + ':00',
      horaFin: horaFin + ':00',
      observaciones,
      operadorId: 1 // Fallback admin user id
    };

    try {
      await api.createTareo(payload);
      setAlert({
        type: 'success',
        message: 'Tareo (horas de trabajo) registrado correctamente.'
      });
      setActividad('');
      setObservaciones('');
      fetchData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al registrar tareo.'
      });
    }
  };

  const calculateHoursDiff = () => {
    try {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [h2, m2] = horaFin.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 24 * 60; // Shift crosses midnight
      const totalHours = diff / 60;
      const normales = Math.min(totalHours, 8.0);
      const extras = Math.max(0.0, totalHours - 8.0);
      return { totalHours, normales, extras };
    } catch {
      return { totalHours: 0, normales: 0, extras: 0 };
    }
  };

  const { totalHours, normales, extras } = calculateHoursDiff();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-8 w-8 text-emerald-500" /> Registro de Tareo Semanal / Horas Hombre
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre las horas de trabajo operativas de la flota y del personal para el cálculo de productividad y KPIs.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-200'
        }`}>
          <span>{alert.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-emerald-600" /> Registrar Horas
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Equipo / Unidad (Placa)</label>
              <input
                type="text"
                list="tareos-equipos-list"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Escriba o seleccione placa"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold uppercase"
                required
              />
              <datalist id="tareos-equipos-list">
                {equipos.map((eq) => (
                  <option key={eq.placa} value={eq.placa}>
                    {eq.placa} ({eq.codigoInterno} - {eq.tipo})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Conductor / Operario</label>
              <input
                type="text"
                list="tareos-conductores-list"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                placeholder="Escriba o seleccione conductor"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold"
                required
              />
              <datalist id="tareos-conductores-list">
                {conductores.map((c) => (
                  <option key={c.id} value={`${c.nombre} ${c.apellido}`}>
                    {c.nombre} {c.apellido} ({c.dni})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Actividad Realizada</label>
              <input
                type="text"
                value={actividad}
                onChange={(e) => setActividad(e.target.value)}
                placeholder="e.g. Traslado de lodos, nivelación de terreno"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">H. Inicio</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">H. Fin</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                rows={2}
              />
            </div>

            {/* Hours summary display */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Horas Normales:</span>
                <span className="font-bold text-slate-800 dark:text-white">{normales.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Horas Extras:</span>
                <span className="font-bold text-amber-500">{extras.toFixed(1)} hrs</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1 pt-1.5 flex justify-between font-bold text-sm">
                <span className="text-slate-500">Horas Totales:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{totalHours.toFixed(1)} hrs</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
            >
              Registrar Horas Hombre
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Últimos Tareos Registrados</h3>
          
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No hay tareos registrados en el sistema.</p>
          ) : (
            <div className="overflow-x-auto text-xs font-semibold max-h-[460px] overflow-y-auto pr-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px]">
                    <th className="py-2.5">Fecha</th>
                    <th className="py-2.5">Equipo</th>
                    <th className="py-2.5">Conductor</th>
                    <th className="py-2.5">Actividad</th>
                    <th className="py-2.5">Inicio / Fin</th>
                    <th className="py-2.5">Normales</th>
                    <th className="py-2.5">Extras</th>
                    <th className="py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {logs.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-2">{new Date(t.fecha).toLocaleDateString()}</td>
                      <td className="py-2 font-bold text-slate-900 dark:text-white">{t.equipoPlaca}</td>
                      <td className="py-2">{t.conductor ? `${t.conductor.nombre} ${t.conductor.apellido}` : '—'}</td>
                      <td className="py-2 max-w-[120px] truncate" title={t.actividad}>{t.actividad}</td>
                      <td className="py-2 font-mono text-[10px]">{t.horaInicio.substring(0,5)} - {t.horaFin.substring(0,5)}</td>
                      <td className="py-2">{t.horasNormales} hrs</td>
                      <td className="py-2 text-amber-500">{t.horasExtras} hrs</td>
                      <td className="py-2 font-bold text-emerald-600 dark:text-emerald-400">{Number(t.horasNormales) + Number(t.horasExtras)} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
