import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditoriaLog } from '../types';
import { ShieldCheck, Search, ShieldAlert, Cpu } from 'lucide-react';

export const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditoria();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.accion.toLowerCase().includes(search.toLowerCase()) ||
    l.modulo.toLowerCase().includes(search.toLowerCase()) ||
    (l.usuario && l.usuario.username.toLowerCase().includes(search.toLowerCase())) ||
    l.detalles.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> Registro de Auditoría
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historial inalterable de transacciones, modificaciones de flota y accesos de usuarios al sistema.
          </p>
        </div>
        
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-400 w-4.5" />
          <input
            type="text"
            placeholder="Filtrar por acción, módulo, usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm">
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12">No hay logs de auditoría registrados que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto text-xs font-semibold max-h-[550px] overflow-y-auto pr-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="py-3">Fecha y Hora</th>
                  <th className="py-3">Usuario</th>
                  <th className="py-3">Módulo</th>
                  <th className="py-3">Acción</th>
                  <th className="py-3">Detalle</th>
                  <th className="py-3">IP / Computadora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="py-3 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.fechaHora).toLocaleString()}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {log.usuario ? log.usuario.username : 'Sistema'}
                    </td>
                    <td className="py-3">
                      <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-3 font-bold">{log.accion}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 font-medium max-w-xs truncate" title={log.detalles}>
                      {log.detalles}
                    </td>
                    <td className="py-3 text-slate-400 font-mono flex items-center gap-1">
                      <Cpu className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[120px]" title={`${log.ip} - ${log.computadora}`}>
                        {log.ip}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
