import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo, Mantenimiento } from '../types';
import { Wrench, PlusCircle, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export const Mantenimientos: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [logs, setLogs] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Preventivo');
  const [descripcion, setDescripcion] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [responsable, setResponsable] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Nested spare parts array state
  const [repuestos, setRepuestos] = useState<Array<{ nombre: string; cantidad: number; precio: number }>>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const rawEq = await api.getEquipos().catch(() => []);
      const eqData = Array.isArray(rawEq) ? rawEq : [];
      
      const rawMant = await api.getMantenimientos().catch(() => []);
      const mLogs = Array.isArray(rawMant) ? rawMant : [];
      
      setEquipos(eqData);
      setLogs(mLogs);
      if (eqData.length > 0) setPlaca(eqData[0].placa || '');
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addSparePart = () => {
    setRepuestos(prev => [...prev, { nombre: '', cantidad: 1, precio: 0 }]);
  };

  const removeSparePart = (idx: number) => {
    setRepuestos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSparePartChange = (idx: number, field: string, value: any) => {
    setRepuestos(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return repuestos.reduce((acc, curr) => acc + (curr.cantidad * curr.precio), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    const costTotal = calculateTotal();

    const payload = {
      equipoPlaca: placa,
      tipo,
      descripcion,
      repuestos: JSON.stringify(repuestos),
      costoTotal: costTotal,
      proveedor,
      responsable,
      fecha
    };

    try {
      await api.createMantenimiento(payload);
      setAlert({
        type: 'success',
        message: `Mantenimiento registrado. El estado del equipo ${placa} ha sido restaurado a Disponible.`
      });
      // Clear
      setDescripcion('');
      setProveedor('');
      setResponsable('');
      setRepuestos([]);
      fetchData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.message || 'Error al registrar mantenimiento.'
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
          <Wrench className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> Taller y Mantenimiento
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre intervenciones mecánicas, preventivas y correctivas, repuestos y costos de taller.
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400 flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-indigo-500" /> Nueva Reparación
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Equipo (Placa)</label>
              <input
                type="text"
                list="mantenimientos-equipos-list"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Escriba o seleccione placa"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold uppercase"
                required
              />
              <datalist id="mantenimientos-equipos-list">
                {equipos.map((eq) => (
                  <option key={eq.placa} value={eq.placa}>
                    {eq.placa} ({eq.codigoInterno} - {eq.tipo}) - {eq.estado}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Tipo Servicio</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="Preventivo">Preventivo</option>
                  <option value="Correctivo">Correctivo</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Descripción / Trabajos</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Cambio de fajas, rectificación de discos"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Taller / Proveedor"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                required
              />
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Mecánico Responsable"
                className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                required
              />
            </div>

            {/* SPARE PARTS DYNAMIC LIST */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 uppercase tracking-wider">Repuestos Utilizados</label>
                <button
                  type="button"
                  onClick={addSparePart}
                  className="text-indigo-500 hover:underline font-bold text-[10px]"
                >
                  + Añadir Repuesto
                </button>
              </div>

              {repuestos.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No hay repuestos añadidos.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {repuestos.map((rep, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border">
                      <input
                        type="text"
                        value={rep.nombre}
                        onChange={(e) => handleSparePartChange(idx, 'nombre', e.target.value)}
                        placeholder="Nombre Repuesto"
                        className="flex-1 p-1 bg-white dark:bg-slate-900 border rounded text-[11px]"
                        required
                      />
                      <input
                        type="number"
                        value={rep.cantidad}
                        onChange={(e) => handleSparePartChange(idx, 'cantidad', Number(e.target.value))}
                        placeholder="Cant"
                        className="w-12 p-1 bg-white dark:bg-slate-900 border rounded text-[11px] font-mono"
                        required
                      />
                      <input
                        type="number"
                        value={rep.precio}
                        onChange={(e) => handleSparePartChange(idx, 'precio', Number(e.target.value))}
                        placeholder="S/."
                        className="w-16 p-1 bg-white dark:bg-slate-900 border rounded text-[11px] font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeSparePart(idx)}
                        className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Cost */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between">
              <span className="text-slate-400 text-xs">Costo Total Estimado:</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">S/. {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
            >
              Registrar Mantenimiento
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Bitácora de Intervenciones</h3>
          
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No hay registros de taller en el sistema.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {logs.map((m) => (
                <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.tipo === 'Preventivo' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        Mantenimiento {m.tipo}
                      </span>
                      <h4 className="text-sm font-bold mt-1 text-slate-900 dark:text-white">{m.descripcion}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Equipo: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{m.equipoPlaca}</span> | Mecánico: {m.responsable}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-medium block">{new Date(m.fecha).toLocaleDateString()}</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">S/. {m.costoTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
