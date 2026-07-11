import React, { useState } from 'react';
import { api } from '../services/api';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.login({ username, password });
      localStorage.setItem('sigecosem_token', response.token);
      localStorage.setItem('sigecosem_user', JSON.stringify(response.usuario));
      onLoginSuccess(response.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(0,0,0,0))] px-4 relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative z-10 border border-slate-800/80 backdrop-blur-2xl bg-slate-900/40 text-slate-100 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white p-2 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 animate-scale-in">
            <img src="/ecosem-logo.png" alt="ECOSEM Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">SIGECOSEM</h1>
          <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mt-1">
            ECOSEM PUCARA - MOROCOCHA S.A.
          </p>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Sistema Integrado de Control de Flota y Operaciones Mineras
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
              />
              <span>Recordar cuenta</span>
            </label>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              ¿Olvidó su contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-800/80 pt-6">
          SIGECOSEM ERP v2.0.0 &copy; {new Date().getFullYear()} · Operaciones Mineras
        </div>
      </div>
    </div>
  );
};
