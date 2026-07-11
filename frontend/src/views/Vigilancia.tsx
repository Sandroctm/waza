import React, { useState } from 'react';
import { Shield, ArrowRightLeft, UserCheck, AlertTriangle } from 'lucide-react';

export const Vigilancia: React.FC = () => {
  const [logs, setLogs] = useState<Array<{
    id: number;
    tipo: 'Vehículo' | 'Visitante';
    identificador: string;
    persona: string;
    motivo: string;
    fechaHora: string;
    sentido: 'Ingreso' | 'Salida';
  }>>([
    { id: 1, tipo: 'Vehículo', identificador: 'EGS-123', persona: 'Manuel Pérez', motivo: 'Inicio de turno acarreo', fechaHora: new Date().toISOString(), sentido: 'Ingreso' },
    { id: 2, tipo: 'Visitante', identificador: '45678912', persona: 'Carlos Soto (Rimac)', motivo: 'Inspección de riesgos', fechaHora: new Date().toISOString(), sentido: 'Ingreso' },
  ]);

  const [tipo, setTipo] = useState<'Vehículo' | 'Visitante'>('Vehículo');
  const [identificador, setIdentificador] = useState('');
  const [persona, setPersona] = useState('');
  const [motivo, setMotivo] = useState('');
  const [sentido, setSentido] = useState<'Ingreso' | 'Salida'>('Ingreso');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador || !persona || !motivo) return;

    const newLog = {
      id: Date.now(),
      tipo,
      identificador,
      persona,
      motivo,
      fechaHora: new Date().toISOString(),
      sentido
    };

    setLogs(prev => [newLog, ...prev]);
    setIdentificador('');
    setPersona('');
    setMotivo('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> Control de Garita (Vigilancia)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre el ingreso y salida de personal contratista, visitantes externos y equipos de flota pesada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400 flex items-center gap-1.5">
            <ArrowRightLeft className="h-4.5 w-4.5 text-indigo-500" /> Registrar Movimiento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
              {['Vehículo', 'Visitante'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t as any)}
                  className={`py-1.5 rounded-lg font-bold text-center ${
                    tipo === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">
                {tipo === 'Vehículo' ? 'Placa / Código' : 'DNI / Documento'}
              </label>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value.toUpperCase())}
                placeholder={tipo === 'Vehículo' ? 'EGS-123' : 'DNI / Pasaporte'}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
              <input
                type="text"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Nombre del conductor o visitante"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Motivo / Destino</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Visita SSOMA, Turno Guardia, etc."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase tracking-wider mb-1">Sentido de Tránsito</label>
              <select
                value={sentido}
                onChange={(e) => setSentido(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
              >
                <option value="Ingreso">Ingreso (Entrada a Planta)</option>
                <option value="Salida">Salida (Egreso de Planta)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
            >
              Registrar Tránsito
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm mb-4 uppercase text-slate-400">Bitácora de Garita de Control</h3>
          
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    log.sentido === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                  }`}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white">{log.persona}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Identificador: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{log.identificador}</span> | Tipo: {log.tipo}</p>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5">Motivo: {log.motivo}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    log.sentido === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'
                  }`}>
                    {log.sentido}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">{new Date(log.fechaHora).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
