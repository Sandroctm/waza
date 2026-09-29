import React, { useState, useEffect } from 'react';
import { Search, Truck, CheckSquare, Fuel, Wrench, ShieldAlert, FileText, ArrowRight, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, data?: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [equipos, setEquipos] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getEquipos().then(data => setEquipos(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modules = [
    { id: 'dashboard', title: 'Panel de Control', category: 'Navegación', icon: Search },
    { id: 'equipos', title: 'Flota de Equipos y Maquinaria', category: 'Navegación', icon: Truck },
    { id: 'checklist', title: 'Checklist Digital F-CHK-006', category: 'Operaciones', icon: CheckSquare },
    { id: 'reporte-tonelada', title: 'Reportes de Tonelaje y Pesaje', category: 'Operaciones', icon: FileText },
    { id: 'combustible', title: 'Control de Combustible y Tanqueos', category: 'Operaciones', icon: Fuel },
    { id: 'mantenimiento', title: 'Gestión de Mantenimientos Preventivos', category: 'Mantenimiento', icon: Wrench },
    { id: 'ssoma', title: 'Portal SSOMA & Bloqueos de Seguridad', category: 'Seguridad', icon: ShieldAlert },
    { id: 'centro-reportes', title: 'Bandeja Central de Reportes PDF/Excel', category: 'Reportes', icon: FileText },
  ];

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(query.toLowerCase()) || 
    m.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEquipos = equipos.filter(e => 
    e.placa?.toLowerCase().includes(query.toLowerCase()) ||
    e.codigoInterno?.toLowerCase().includes(query.toLowerCase()) ||
    e.tipo?.toLowerCase().includes(query.toLowerCase()) ||
    e.marca?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar equipos (EGS-123), módulos o comandos (Ctrl + K)..."
            className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
            autoFocus
          />
          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">ESC</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          
          {/* Equipos Section */}
          {filteredEquipos.length > 0 && (
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 mb-2 px-3 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Equipos Coincidentes ({filteredEquipos.length})
              </div>
              <div className="space-y-1">
                {filteredEquipos.slice(0, 4).map((eq) => (
                  <button
                    key={eq.placa}
                    onClick={() => {
                      onNavigate('equipo-detalle', { placa: eq.placa });
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 text-left transition-colors group border border-transparent hover:border-emerald-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                        {eq.codigoInterno || eq.placa.substring(0,3)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{eq.placa}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {eq.tipo}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{eq.marca} {eq.modelo} · {eq.estado}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modules Section */}
          {filteredModules.length > 0 && (
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 mb-2 px-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Módulos y Secciones
              </div>
              <div className="space-y-1">
                {filteredModules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onNavigate(m.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/10 text-left transition-colors group border border-transparent hover:border-indigo-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{m.title}</p>
                          <p className="text-[10px] text-slate-400">{m.category}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredEquipos.length === 0 && filteredModules.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No se encontraron resultados para "<span className="text-emerald-500 font-bold">{query}</span>"
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>Presione <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[9px] text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[9px] text-slate-700 dark:text-slate-300">↓</kbd> para navegar</span>
          <span>SIGECOSEM Búsqueda Inteligente</span>
        </div>

      </div>
    </div>
  );
};
