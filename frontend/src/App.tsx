import React, { useState, useEffect } from 'react';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Equipos } from './views/Equipos';
import { EquipoDetalle } from './views/EquipoDetalle';
import { CheckListDigital } from './views/CheckListDigital';
import { ReporteTonelada } from './views/ReporteTonelada';
import { Combustibles } from './views/Combustibles';
import { Mantenimientos } from './views/Mantenimientos';
import { Vigilancia } from './views/Vigilancia';
import { Ssoma } from './views/Ssoma';
import { Auditoria } from './views/Auditoria';
import { Configuracion } from './views/Configuracion';
import { CentroReportes } from './views/CentroReportes';
import { Gobernanza } from './views/Gobernanza';
import { EstructuraOrganica } from './views/EstructuraOrganica';
import { DriverManagement } from './views/DriverManagement';
import { Tareos } from './views/Tareos';
import { ThemeToggle } from './components/ThemeToggle';
import { signalRService } from './services/signalr';
import { api } from './services/api';
import { 
  Shield, Truck, CheckSquare, Calendar, Fuel, Wrench, ShieldAlert, 
  History, Settings, Eye, Menu, X, LogOut, Bell, User, LayoutDashboard,
  Folder, ShieldCheck, Network
} from 'lucide-react';

type ViewType = 
  | 'dashboard' 
  | 'equipos' 
  | 'equipo-detalle' 
  | 'checklist' 
  | 'reporte-tonelada' 
  | 'combustible' 
  | 'tareo'
  | 'mantenimiento' 
  | 'vigilancia' 
  | 'ssoma' 
  | 'auditoria' 
  | 'personal'
  | 'configuracion'
  | 'centro-reportes'
  | 'gobernanza'
  | 'estructura-organica';

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('sigecosem_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [viewData, setViewData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real-time alerts notification count
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      // Connect to SignalR WebSockets
      signalRService.startConnection();

      // Listen for GPS updates or new alerts
      const handleNewAlert = (alertData: any) => {
        setAlerts(prev => [alertData, ...prev]);
      };

      signalRService.on('NewAlert', handleNewAlert);

      // Fetch active alerts on init
      const fetchAlerts = async () => {
        try {
          const eqList = await api.getEquipos();
          const activeAlerts: any[] = [];
          eqList.forEach((eq, idx) => {
            if (eq.estado === 'Bloqueado por SSOMA') {
              activeAlerts.push({
                id: idx,
                equipoPlaca: eq.placa,
                mensaje: `Equipo bloqueado por SSOMA`
              });
            }
          });
          setAlerts(activeAlerts);
        } catch (err) {
          console.error(err);
        }
      };
      fetchAlerts();

      return () => {
        signalRService.stopConnection();
        signalRService.off('NewAlert', handleNewAlert);
      };
    }
  }, [user]);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    const defaultView = userData.rol === 'Conductor' || userData.rol === 'Vigilancia' ? 'equipos' : 'dashboard';
    setCurrentView(defaultView as ViewType);
  };

  const handleLogout = () => {
    localStorage.removeItem('sigecosem_token');
    localStorage.removeItem('sigecosem_user');
    setUser(null);
    signalRService.stopConnection();
  };

  const navigateTo = (view: string, data: any = null) => {
    setCurrentView(view as ViewType);
    setViewData(data);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Permission checks helper
  const hasPermission = (moduleName: string) => {
    if (!user) return false;
    
    // Main admin has access to everything
    const isAdmin = user.rol?.toLowerCase() === 'administrador' || 
                    user.username?.toLowerCase() === 'admin' || 
                    (typeof user.permisos === 'string' && user.permisos.toLowerCase().includes('admin:all'));
    if (isAdmin) {
      return true;
    }

    // Default modules for users if no specific permissions string was configured
    const defaultModules = ['dashboard', 'equipos', 'centro-reportes', 'checklist', 'reporte-tonelada', 'combustible', 'tareo', 'mantenimiento'];

    if (!user.permisos) {
      return defaultModules.includes(moduleName);
    }

    // Check array or string permissions
    if (Array.isArray(user.permisos)) {
      if (user.permisos.length === 0) return defaultModules.includes(moduleName);
      return user.permisos.some((p: string) => {
        const item = p.trim().toLowerCase();
        return item === moduleName.toLowerCase() || item.startsWith(moduleName.toLowerCase() + ':') || item === '*';
      });
    }

    if (typeof user.permisos === 'string') {
      if (user.permisos.trim() === '') return defaultModules.includes(moduleName);
      const list = user.permisos.split(',').map((p: string) => p.trim().toLowerCase());
      return list.some((p: string) => p === moduleName.toLowerCase() || p.startsWith(moduleName.toLowerCase() + ':') || p === '*');
    }

    return defaultModules.includes(moduleName);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'equipos', label: 'Flota Equipos', icon: Truck },
    { id: 'centro-reportes', label: 'Bandeja Reportes', icon: Folder },
    { id: 'checklist', label: 'Checklist Digital', icon: CheckSquare },
    { id: 'reporte-tonelada', label: 'Reporte Tonelada', icon: Truck },
    { id: 'combustible', label: 'Combustibles', icon: Fuel },
    { id: 'tareo', label: 'Tareos / Horas', icon: Calendar },
    { id: 'mantenimiento', label: 'Mantenimientos', icon: Wrench },
    { id: 'vigilancia', label: 'Control Garita', icon: Eye },
    { id: 'ssoma', label: 'Portal SSOMA', icon: ShieldAlert },
    { id: 'gobernanza', label: 'Gobernanza', icon: ShieldCheck },
    { id: 'estructura-organica', label: 'Estructura Orgánica', icon: Network },
    { id: 'auditoria', label: 'Auditoría Logs', icon: History },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  // Auto-redirect if currentView is not allowed for this user
  useEffect(() => {
    if (user) {
      if (!hasPermission(currentView)) {
        const firstAllowed = menuItems.find(item => hasPermission(item.id));
        if (firstAllowed) {
          setCurrentView(firstAllowed.id as ViewType);
        }
      }
    }
  }, [user, currentView]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden cherry-bg">
      {/* Nature-inspired background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-pink-300/20 dark:bg-pink-800/10 blur-3xl animate-pulse" style={{animationDuration:'8s'}} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-sky-300/25 dark:bg-sky-800/10 blur-3xl animate-pulse" style={{animationDuration:'11s',animationDelay:'2s'}} />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[500px] rounded-full bg-emerald-300/20 dark:bg-emerald-900/15 blur-3xl animate-pulse" style={{animationDuration:'9s',animationDelay:'4s'}} />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-300/15 dark:bg-teal-800/10 blur-3xl animate-pulse" style={{animationDuration:'12s',animationDelay:'1s'}} />
      </div>
      
      {/* Mobile top navigation */}
      <div className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/ecosem-logo.png" alt="ECOSEM Logo" className="h-6 w-6 object-contain" />
          <span className="font-extrabold text-md tracking-tight">SIGECOSEM</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Main Container Layout */}
      <div className="flex">
        
        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 z-20 w-64 glass-panel bg-white/70 dark:bg-slate-950/70 border-r border-slate-200/50 dark:border-slate-900/50 flex flex-col justify-between py-6 px-4 transition-transform duration-300 md:translate-x-0 md:static md:h-screen shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          
          <div className="space-y-8">
            {/* Logo */}
            <div className="hidden md:flex items-center gap-2.5 px-2">
              <div className="w-10 h-10 bg-white p-1 rounded-xl shadow-md shrink-0">
                <img src="/ecosem-logo.png" alt="ECOSEM Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight block">SIGECOSEM</span>
                <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest block">ECOSEM PUCARA</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isAvailable = hasPermission(item.id);
                if (!isAvailable) return null;

                const isActive = currentView === item.id || (item.id === 'equipos' && currentView === 'equipo-detalle');

                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3.5 py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-[0.98] ${
                      isActive 
                        ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/10'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile actions */}
          <div className="border-t border-slate-100 dark:border-slate-900 pt-4 px-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                {user.nombre[0]}
              </div>
              <div className="truncate">
                <p className="font-bold text-xs truncate leading-tight">{user.nombre} {user.apellido}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{user.rol}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" /> Cerrar Sesión
            </button>
          </div>

        </aside>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Top Navbar */}
          <header className="hidden md:flex items-center justify-between py-4 px-8 bg-white/40 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-900 relative z-10">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold">Ecosem Heavy Machinery</span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sede Principal - Operación Minera</h2>
            </div>

            <div className="flex items-center gap-4">
              
              {/* Notification alarms indicator */}
              <div className="relative">
                <button 
                  onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 relative focus:outline-none"
                >
                  <Bell className="h-5 w-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-bounce" />
                  )}
                </button>
                
                {showAlertsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 z-50 text-xs font-semibold">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-bold text-slate-400 uppercase text-[10px]">Alertas Activas</span>
                      <button onClick={() => setAlerts([])} className="text-[10px] text-rose-500 hover:underline">Limpiar</button>
                    </div>
                    {alerts.length === 0 ? (
                      <p className="text-center py-4 text-slate-400 text-[10px]">No hay notificaciones.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {alerts.map((al, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => { navigateTo('equipos', { placa: al.equipoPlaca }); setShowAlertsDropdown(false); }}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl cursor-pointer transition-colors text-[10px]"
                          >
                            <b>Vehículo {al.equipoPlaca}</b>: {al.mensaje}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              <div className="h-6 w-px bg-slate-100 dark:bg-slate-900" />

              {/* User details */}
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.nombre}</span>
              </div>
            </div>
          </header>

          {/* Scrolling Content Panel */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {currentView === 'dashboard' && (
              <Dashboard onNavigate={navigateTo} user={user} />
            )}

            {currentView === 'equipos' && (
              <Equipos onNavigate={navigateTo} initialFilters={viewData} user={user} />
            )}

            {currentView === 'centro-reportes' && (
              <CentroReportes user={user} />
            )}

            {currentView === 'equipo-detalle' && (
              <EquipoDetalle placa={viewData?.placa} onBack={() => navigateTo('equipos')} user={user} />
            )}

            {currentView === 'checklist' && (
              <CheckListDigital onNavigate={navigateTo} user={user} />
            )}

            {currentView === 'reporte-tonelada' && (
              <ReporteTonelada onNavigate={navigateTo} user={user} />
            )}

            {currentView === 'combustible' && (
              <Combustibles />
            )}

            {currentView === 'tareo' && (
              <Tareos />
            )}

            {currentView === 'mantenimiento' && (
              <Mantenimientos />
            )}

            {currentView === 'vigilancia' && (
              <Vigilancia />
            )}

            {currentView === 'ssoma' && (
              <Ssoma onNavigate={navigateTo} user={user} />
            )}

            {currentView === 'gobernanza' && (
              <Gobernanza />
            )}

            {currentView === 'estructura-organica' && (
              <EstructuraOrganica />
            )}

            {currentView === 'auditoria' && (
              <Auditoria />
            )}

            {currentView === 'personal' && (
              <DriverManagement />
            )}

            {currentView === 'configuracion' && (
              <Configuracion user={user} />
            )}

          </main>

        </div>

        {/* Global Floating Components */}

      </div>

    </div>
  );
};

export default App;
