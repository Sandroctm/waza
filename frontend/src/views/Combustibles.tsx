import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo, Combustible } from '../types';
import { Fuel, RefreshCw, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';

export const Combustibles: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [logs, setLogs] = useState<Combustible[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [placa, setPlaca] = useState('');
  const [proveedor, setProveedor] = useState('Primax');
  const [grifo, setGrifo] = useState('Central Ecosem');
  const [galones, setGalones] = useState(0);
  const [precio, setPrecio] = useState(16.5);
  const [horometro, setHorometro] = useState(0);
  const [conductorId, setConductorId] = useState('');
  const [conductorNombre, setConductorNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const rawEq = await api.getEquipos().catch(() => []);
      const eqData = Array.isArray(rawEq) ? rawEq : [];
      
      const rawFuel = await api.getCombustibles().catch(() => []);
      const fuelLogs = Array.isArray(rawFuel) ? rawFuel : [];

      const rawCond = await api.getConductores().catch(() => []);
      const condData = Array.isArray(rawCond) ? rawCond : [];
      setConductores(condData);
      if (condData.length > 0) {
        setConductorId(condData[0].id.toString());
        setConductorNombre(`${condData[0].nombre} ${condData[0].apellido}`);
      }
      
      setEquipos(eqData);
      setLogs(fuelLogs);
      if (eqData.length > 0) setPlaca(eqData[0].placa || '');
    } catch (err) {
      console.error('Error fetching fuels data:', err);
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

    if (galones <= 0 || precio <= 0) {
      setAlert({ type: 'error', message: 'Galones y precio por galón deben ser mayores a cero.' });
      return;
    }

    const matched = conductores.find(c => `${c.nombre} ${c.apellido}`.toLowerCase() === conductorNombre.trim().toLowerCase());
    const finalCondId = matched ? matched.id : (parseInt(conductorId) || 1);

    const payload = {
      equipoPlaca: placa,
      proveedor,
      grifo,
      galones,
      precioGalon: precio,
      horometroVal: horometro,
      fecha,
      operadorId: 1, // Seed Admin or Operator id
      conductorId: finalCondId
    };

    try {
      await api.createCombustible(payload);
      setAlert({
        type: 'success',
        message: `Combustible registrado correctamente. Costo total: S/. ${(galones * precio).toFixed(2)}.`
      });
      setGalones(0);
      setHorometro(0);
      fetchData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al registrar combustible.'
      });
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Fuel className="h-8 w-8 text-amber-500" /> Control de Combustible
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre abastecimientos, costos de grifo, rendimiento y galonajes para cada unidad.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-indigo-500" /> Registrar Carga
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Equipo (Placa)</label>
              <input
                type="text"
                list="combustibles-equipos-list"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Escriba o seleccione placa"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold uppercase"
                required
              />
              <datalist id="combustibles-equipos-list">
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
                list="combustibles-conductores-list"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                placeholder="Escriba o seleccione conductor"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold"
                required
              />
              <datalist id="combustibles-conductores-list">
                {conductores.map((c) => (
                  <option key={c.id} value={`${c.nombre} ${c.apellido}`}>
                    {c.nombre} {c.apellido}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Proveedor / Grifo</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Proveedor"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  required
                />
                <input
                  type="text"
                  value={grifo}
                  onChange={(e) => setGrifo(e.target.value)}
                  placeholder="Grifo"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Galones</label>
                <input
                  type="number"
                  step="0.01"
                  value={galones}
                  onChange={(e) => setGalones(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Precio x Galón</label>
                <input
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Horómetro de Carga</label>
              <input
                type="number"
                step="0.1"
                value={horometro}
                onChange={(e) => setHorometro(Number(e.target.value))}
                placeholder="0.0"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                required
              />
            </div>

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

            {/* Calculated cost */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between">
              <span className="text-slate-400 text-xs">Costo Total:</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">S/. {(galones * precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
            >
              Registrar Abasto
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Últimos Registros</h3>
          
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No hay registros de combustible en el sistema.</p>
          ) : (
            <div className="overflow-x-auto text-xs font-semibold max-h-[460px] overflow-y-auto pr-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px]">
                    <th className="py-2.5">Fecha</th>
                    <th className="py-2.5">Equipo</th>
                    <th className="py-2.5">Conductor</th>
                    <th className="py-2.5">Estación / Grifo</th>
                    <th className="py-2.5">Galones</th>
                    <th className="py-2.5">Precio x Galón</th>
                    <th className="py-2.5">Total Costo</th>
                    <th className="py-2.5">Horómetro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {logs.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-2">{new Date(c.fecha).toLocaleDateString()}</td>
                      <td className="py-2 font-bold text-slate-900 dark:text-white">{c.equipoPlaca}</td>
                      <td className="py-2">{c.conductor ? `${c.conductor.nombre} ${c.conductor.apellido}` : '—'}</td>
                      <td className="py-2">{c.proveedor} ({c.grifo})</td>
                      <td className="py-2">{c.galones} G</td>
                      <td className="py-2 font-mono">S/. {c.precioGalon?.toFixed(2) || '16.50'}</td>
                      <td className="py-2 text-emerald-600 dark:text-emerald-400">S/. {c.costoTotal.toLocaleString()}</td>
                      <td className="py-2 font-mono">{c.horometroVal}</td>
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
