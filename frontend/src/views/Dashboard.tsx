import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { signalRService } from '../services/signalr';
import { DashboardKpis, Alerta } from '../types';
import { 
  Truck, ShieldAlert, CheckSquare, Wrench, Fuel, Calendar, 
  MapPin, RefreshCw, AlertTriangle, AlertCircle, ArrowUpRight, TrendingUp, Download 
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string, data?: any) => void;
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [kpis, setKpis] = useState<DashboardKpis>({
    total: 0, disponible: 0, operativo: 0, mantenimientoPrev: 0, mantenimientoCorr: 0, bloqueado: 0, fueraServicio: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const kpiData = await api.getKpis();
      setKpis(kpiData);

      // Fetch checklists or alerts to display
      const allChecklists = await api.getCheckLists();
      // Compile recent alarms from actual DB checks or alert list
      // For presentation, let's fetch actual equipments or simulate some alert lists
      const equipments = await api.getEquipos();
      
      const compiledAlerts: Alerta[] = [];
      equipments.forEach((eq, idx) => {
        if (eq.estado === "Bloqueado por SSOMA") {
          compiledAlerts.push({
            id: idx,
            equipoPlaca: eq.placa,
            tipo: "FallaCritica",
            mensaje: `Equipo bloqueado por SSOMA. Requiere inspección correctiva inmediata.`,
            fechaCreacion: new Date().toISOString(),
            resuelta: false
          });
        }
        // SOAT expired
        if (eq.soatVencimiento && new Date(eq.soatVencimiento) < new Date()) {
          compiledAlerts.push({
            id: idx + 100,
            equipoPlaca: eq.placa,
            tipo: "VencimientoSOAT",
            mensaje: `SOAT vencido para el vehículo ${eq.placa} (${eq.codigoInterno}).`,
            fechaCreacion: eq.soatVencimiento,
            resuelta: false
          });
        }
      });
      setRecentAlerts(compiledAlerts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Hook up real-time notifications
    const handleNewGps = (data: any) => {
      // Re-trigger KPI update on position shifts if necessary
    };

    signalRService.on('GpsUpdated', handleNewGps);

    return () => {
      signalRService.off('GpsUpdated', handleNewGps);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('dashboard-container');
    if (!element) return;
    const opt = {
      margin:       10,
      filename:     `Reporte_Gerencial_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 1.5 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      alert('La librería PDF no está lista, por favor recargue la página.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate percentages for SVG Donut
  const totalStates = kpis.disponible + kpis.operativo + kpis.mantenimientoPrev + kpis.mantenimientoCorr + kpis.bloqueado + kpis.fueraServicio;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  const getStrokeDash = (value: number) => {
    if (totalStates === 0) return `0 ${circumference}`;
    const pct = (value / totalStates) * circumference;
    return `${pct} ${circumference - pct}`;
  };

  return (
    <div id="dashboard-container" className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Panel Ejecutivo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bienvenido de nuevo, <span className="font-semibold text-emerald-600 dark:text-emerald-400">{user.nombre} {user.apellido}</span>. Rol: {user.rol}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full hidden md:flex items-center gap-1.5 font-medium animate-pulse">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Conectado
          </span>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all"
          >
            <Download className="h-4 w-4" /> PDF Gerencial
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('equipos')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Total Equipos</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{kpis.total}</h3>
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('equipos', { estado: 'Operativo' })}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">En Operación</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{kpis.operativo + kpis.disponible}</h3>
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('ssoma')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Bloqueados SSOMA</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{kpis.bloqueado}</h3>
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('mantenimientos')}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">En Taller</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{kpis.mantenimientoPrev + kpis.mantenimientoCorr}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Alertas Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* SVG Charts Box (Left 2 cols) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold">Consumo de Combustible e Indicadores</h2>
            <span className="text-xs text-slate-400">Últimas 5 Cargas (Gal)</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 flex items-end justify-around gap-4 px-4">
              {[
                { label: 'EGS-123', val: 45.5, fill: 'bg-emerald-500' },
                { label: 'EGS-456', val: 52.0, fill: 'bg-emerald-600' },
                { label: 'RET-101', val: 28.5, fill: 'bg-emerald-400' },
                { label: 'CAR-202', val: 65.0, fill: 'bg-emerald-700' },
                { label: 'VOL-03', val: 49.0, fill: 'bg-emerald-500' },
              ].map((item, idx) => {
                const heightPercentage = `${(item.val / 80) * 100}%`;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white px-2 py-0.5 rounded shadow absolute -translate-y-8">
                      {item.val} G
                    </span>
                    <div 
                      style={{ height: heightPercentage }} 
                      className={`w-full rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm ${item.fill}`}
                    />
                    <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-2 flex items-center justify-between text-xs text-slate-400 px-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" /> Consumo por Carga</span>
              <span>Total Mes: 240 Galones</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Double Grid for metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Fuel className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-500">Costo Promedio Galón</h4>
                <p className="text-lg font-bold text-slate-900 dark:text-white">S/. 16.85 <span className="text-xs text-rose-500 font-semibold">+2.1%</span></p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-500">Checklists de la Semana</h4>
                <p className="text-lg font-bold text-slate-900 dark:text-white">12 Registrados <span className="text-xs text-emerald-500 font-semibold">100%</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Donut & Alertas (Right 1 col) */}
        <div className="space-y-6">
          
          {/* Status Donut */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6 text-center">Estado General de Flota</h2>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(156,163,175,0.1)" strokeWidth="12" />
                {kpis.disponible > 0 && (
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgb(16,185,129)" strokeWidth="12" 
                    strokeDasharray={getStrokeDash(kpis.disponible)} 
                  />
                )}
                {kpis.operativo > 0 && (
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgb(16,185,129)" strokeWidth="12" 
                    strokeDasharray={getStrokeDash(kpis.operativo)} 
                    strokeDashoffset={-((kpis.disponible / totalStates) * circumference)}
                  />
                )}
                {kpis.bloqueado > 0 && (
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgb(244,63,94)" strokeWidth="12" 
                    strokeDasharray={getStrokeDash(kpis.bloqueado)} 
                    strokeDashoffset={-(((kpis.disponible + kpis.operativo) / totalStates) * circumference)}
                  />
                )}
                {kpis.mantenimientoPrev + kpis.mantenimientoCorr > 0 && (
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgb(245,158,11)" strokeWidth="12" 
                    strokeDasharray={getStrokeDash(kpis.mantenimientoPrev + kpis.mantenimientoCorr)} 
                    strokeDashoffset={-(((kpis.disponible + kpis.operativo + kpis.bloqueado) / totalStates) * circumference)}
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis.total}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Vehículos</span>
              </div>
            </div>

            <div className="grid grid-cols-2 w-full gap-2 mt-6 text-xs font-medium">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible ({kpis.disponible})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-700" /> Operativo ({kpis.operativo})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Bloqueado ({kpis.bloqueado})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> En Taller ({kpis.mantenimientoPrev + kpis.mantenimientoCorr})</div>
            </div>
          </div>

          {/* Active Alerts Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <h3 className="text-md font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Alertas Críticas Activas
            </h3>
            
            {recentAlerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay alertas críticas en este momento.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {recentAlerts.map((al, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onNavigate('equipos', { placa: al.equipoPlaca })}
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl cursor-pointer transition-colors flex items-start gap-2.5"
                  >
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Vehículo {al.equipoPlaca}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{al.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="bg-gradient-to-tr from-slate-900 to-emerald-950 p-6 rounded-3xl border border-slate-800 shadow-xl text-white">
        <h3 className="font-bold text-lg mb-4">Acceso Rápido y Operaciones</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate('checklist')}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:scale-102 transition-all gap-2 active:scale-98"
          >
            <CheckSquare className="h-6 w-6 text-emerald-400" />
            <span className="text-xs font-semibold">Checklist Digital</span>
          </button>
          <button 
            onClick={() => onNavigate('tareo')}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:scale-102 transition-all gap-2 active:scale-98"
          >
            <Calendar className="h-6 w-6 text-emerald-400" />
            <span className="text-xs font-semibold">Registrar Tareo</span>
          </button>
          <button 
            onClick={() => onNavigate('combustible')}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:scale-102 transition-all gap-2 active:scale-98"
          >
            <Fuel className="h-6 w-6 text-amber-400" />
            <span className="text-xs font-semibold">Abastecimiento</span>
          </button>
          <button 
            onClick={() => onNavigate('equipos')}
            className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:scale-102 transition-all gap-2 active:scale-98"
          >
            <Truck className="h-6 w-6 text-teal-400" />
            <span className="text-xs font-semibold">Ver Flota Completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
