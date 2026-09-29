import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { signalRService } from '../services/signalr';
import { Equipo, CheckList, Tareo, Horometro, Combustible, Mantenimiento, Documento, GpsData } from '../types';
import { 
  ArrowLeft, Truck, CheckSquare, Calendar, Fuel, Wrench, FileText, 
  MapPin, ShieldAlert, BadgeInfo, Layers, User, PlusCircle, AlertCircle, BarChart3, Download
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface EquipoDetalleProps {
  placa: string;
  onBack: () => void;
  user: any;
}

type TabType = 'info' | 'checklist' | 'tareo' | 'combustible' | 'mantenimiento' | 'documentos' | 'gps' | 'analytics';

export const EquipoDetalle: React.FC<EquipoDetalleProps> = ({ placa, onBack, user }) => {
  const [data, setData] = useState<{
    equipo: Equipo;
    checklists: CheckList[];
    tareos: Tareo[];
    horometros: Horometro[];
    combustibles: Combustible[];
    mantenimientos: Mantenimiento[];
    documentos: Documento[];
    gps: GpsData | null;
    alertas: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [selectedChecklist, setSelectedChecklist] = useState<CheckList | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showReleaseForm, setShowReleaseForm] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Equipo>>({});
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ nombre: '', tipo: 'SOAT', fechaVencimiento: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const fetchDetails = async () => {
    try {
      const response = await api.getEquipoByPlaca(placa);
      setData(response);
      if (response.checklists && response.checklists.length > 0) {
        setSelectedChecklist(response.checklists[0]);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [placa]);

  // Hook up SignalR GPS updates
  useEffect(() => {
    const handleGpsUpdate = (update: any) => {
      if (update.placa.toUpperCase() === placa.toUpperCase() && data) {
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            gps: {
              ...prev.gps!,
              latitud: update.latitud,
              longitud: update.longitud,
              velocidad: update.velocidad,
              motorEncendido: update.motorEncendido,
              tiempoDetenidoMinutos: update.tiempoDetenido,
              ultimaActualizacion: update.ultimaActualizacion
            }
          };
        });

        // Update live marker
        if (mapRef.current && markerRef.current) {
          const latLng = L.latLng(Number(update.latitud), Number(update.longitud));
          markerRef.current.setLatLng(latLng);
          mapRef.current.setView(latLng, mapRef.current.getZoom());
          markerRef.current.getPopup()?.setContent(`
            <div style="font-family: sans-serif; font-size: 11px;">
              <b>Equipo ${placa}</b><br/>
              Velocidad: ${update.velocidad} km/h<br/>
              Motor: ${update.motorEncendido ? 'Encendido' : 'Apagado'}
            </div>
          `);
        }
      }
    };

    signalRService.on('GpsUpdated', handleGpsUpdate);
    return () => {
      signalRService.off('GpsUpdated', handleGpsUpdate);
    };
  }, [data]);

  // Initialize Map when tab switches to 'gps'
  useEffect(() => {
    if (activeTab === 'gps' && data?.gps && mapContainerRef.current && !mapRef.current) {
      const lat = Number(data.gps.latitud);
      const lng = Number(data.gps.longitud);

      mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Custom icon
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
      });

      markerRef.current = L.marker([lat, lng], { icon: customIcon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <b>Equipo ${placa}</b><br/>
            Velocidad: ${data.gps.velocidad} km/h<br/>
            Motor: ${data.gps.motorEncendido ? 'Encendido' : 'Apagado'}
          </div>
        `)
        .openPopup();
    }

    return () => {
      if (activeTab !== 'gps' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab, data]);

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReason) return;
    try {
      await api.blockEquipo(placa, blockReason);
      setShowBlockForm(false);
      setBlockReason('');
      fetchDetails();
    } catch (err) {
      alert('Error al bloquear equipo');
    }
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseReason) return;
    try {
      await api.releaseEquipo(placa, releaseReason);
      setShowReleaseForm(false);
      setReleaseReason('');
      fetchDetails();
    } catch (err) {
      alert('Error al liberar equipo');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente el equipo ${placa}? Esta acción borrará también todo su historial (checklists, tareos, combustibles, etc.) y no se puede deshacer.`)) {
      try {
        await api.deleteEquipo(placa);
        alert('Equipo eliminado exitosamente.');
        onBack();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el equipo.');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateEquipo(placa, editFormData);
      setShowEditForm(false);
      alert('Equipo actualizado exitosamente.');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar equipo.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadData.file);
      fd.append('nombre', uploadData.nombre);
      fd.append('tipo', uploadData.tipo);
      if (uploadData.fechaVencimiento) {
        fd.append('fechaVencimiento', new Date(uploadData.fechaVencimiento).toISOString());
      }
      await api.uploadDocumento(placa, fd);
      setShowUploadModal(false);
      setUploadData({ nombre: '', tipo: 'SOAT', fechaVencimiento: '', file: null });
      alert('Documento subido exitosamente.');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Error al subir documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este documento?')) {
      try {
        await api.deleteDocumento(placa, id);
        alert('Documento eliminado.');
        fetchDetails();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar documento.');
      }
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { equipo } = data;
    const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Ficha Técnica - ${equipo.placa}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 0; }
        .header { background: linear-gradient(135deg, #065f46 0%, #10b981 100%); color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
        .header h1 { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
        .header .subtitle { font-size: 11px; opacity: 0.8; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase; }
        .header .badge { background: rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 16px; text-align: center; font-size: 13px; font-weight: bold; }
        .section { padding: 24px 40px; border-bottom: 1px solid #f1f5f9; }
        .section-title { font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .field label { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .field span { font-size: 14px; font-weight: 700; color: #0f172a; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; background: #d1fae5; color: #065f46; }
        .status-blocked { background: #fee2e2; color: #991b1b; }
        .status-mant { background: #fef3c7; color: #92400e; }
        .photo-box { width: 200px; height: 140px; object-fit: cover; border-radius: 12px; border: 2px solid #e2e8f0; }
        .footer { background: #f8fafc; padding: 16px 40px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      </head><body>
      <div class="header">
        <div>
          <div class="subtitle">SIGECOSEM &mdash; Sistema de Gestión de Equipos</div>
          <h1>Ficha Técnica del Equipo</h1>
          <div style="margin-top:8px;font-size:13px;opacity:0.9">${equipo.marca} ${equipo.modelo} &mdash; ${equipo.placa}</div>
        </div>
        <div style="text-align:right">
          <div class="badge">
            <div style="font-size:9px;opacity:0.8;margin-bottom:2px">ESTADO ACTUAL</div>
            <div>${equipo.estado}</div>
          </div>
          <div style="margin-top:8px;font-size:10px;opacity:0.7">${fecha}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Datos de Identificación</div>
        <div class="grid-3">
          <div class="field"><label>Placa</label><span>${equipo.placa}</span></div>
          <div class="field"><label>Código Interno</label><span>${equipo.codigoInterno}</span></div>
          <div class="field"><label>Tipo</label><span>${equipo.tipo}</span></div>
          <div class="field"><label>Marca</label><span>${equipo.marca}</span></div>
          <div class="field"><label>Modelo</label><span>${equipo.modelo}</span></div>
          <div class="field"><label>Año Fab.</label><span>${equipo.anioFabricacion || 'N/A'}</span></div>
          <div class="field"><label>Nº Serie</label><span>${equipo.serie || '—'}</span></div>
          <div class="field"><label>Nº Motor</label><span>${equipo.motor || '—'}</span></div>
          <div class="field"><label>Nº Chasis</label><span>${equipo.chasis || '—'}</span></div>
          <div class="field"><label>Color</label><span>${equipo.color || '—'}</span></div>
          <div class="field"><label>Valor (USD)</label><span>$ ${(equipo.valor || 0).toLocaleString()}</span></div>
          <div class="field"><label>Proyecto</label><span>${equipo.proyecto?.nombre || 'Sin asignar'}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Documentos y Seguros</div>
        <div class="grid-3">
          <div class="field"><label>SOAT Vence</label><span>${equipo.soatVencimiento ? new Date(equipo.soatVencimiento).toLocaleDateString('es-PE') : '—'}</span></div>
          <div class="field"><label>Rev. Técnica Vence</label><span>${equipo.revisionTecnicaVencimiento ? new Date(equipo.revisionTecnicaVencimiento).toLocaleDateString('es-PE') : '—'}</span></div>
          <div class="field"><label>Póliza Vence</label><span>${equipo.polizaVencimiento ? new Date(equipo.polizaVencimiento).toLocaleDateString('es-PE') : '—'}</span></div>
          <div class="field"><label>Seguro</label><span>${equipo.seguro || '—'}</span></div>
          <div class="field"><label>GPS ID</label><span>${equipo.gpsId || '—'}</span></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Asignación de Personal</div>
        <div class="grid-2">
          <div class="field"><label>Supervisor</label><span>${equipo.supervisor ? `${equipo.supervisor.nombre} ${equipo.supervisor.apellido}` : 'Sin asignar'}</span></div>
          <div class="field"><label>Operador Principal</label><span>${equipo.operador ? `${equipo.operador.nombre} ${equipo.operador.apellido}` : 'Sin asignar'}</span></div>
        </div>
      </div>
      <div class="footer">
        <span>SIGECOSEM © ${new Date().getFullYear()} &mdash; Documento generado automáticamente</span>
        <span>Placa: ${equipo.placa} | Generado: ${new Date().toLocaleString('es-PE')}</span>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { equipo, checklists, tareos, horometros, combustibles, mantenimientos, documentos, gps, alertas } = data;

  const isSsomaOrAdmin = user.rol === 'SSOMA' || user.rol === 'Administrador';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 pb-12">
      
      {/* Top breadcrumb */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a Flota
      </button>

      {/* Main Title Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{equipo.marca} {equipo.modelo}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                equipo.estado === 'Disponible' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                equipo.estado === 'Operativo' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                equipo.estado === 'Bloqueado por SSOMA' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}>
                {equipo.estado}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Placa: <span className="text-slate-700 dark:text-slate-200">{equipo.placa}</span> | Código Interno: <span className="text-slate-700 dark:text-slate-200">{equipo.codigoInterno}</span>
            </p>
          </div>
        </div>

        {/* Right side: SSOMA actions + PDF button */}
        <div className="flex items-center gap-3 flex-wrap">
          {isSsomaOrAdmin && (
            <>
              {equipo.estado === 'Bloqueado por SSOMA' ? (
                <button 
                  onClick={() => setShowReleaseForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md text-xs active:scale-98 transition-all"
                >
                  Liberar Equipo (SSOMA)
                </button>
              ) : (
                <button 
                  onClick={() => setShowBlockForm(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md text-xs active:scale-98 transition-all"
                >
                  Bloquear Equipo (SSOMA)
                </button>
              )}
              
              {user.rol === 'Administrador' && (
                <button 
                  onClick={handleDelete}
                  className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold py-2.5 px-4 rounded-xl shadow-md text-xs active:scale-98 transition-all border border-rose-200 dark:border-rose-500/30"
                >
                  Eliminar Equipo
                </button>
              )}
            </>
          )}
          
          {/* PDF export button - visible to all */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md text-xs transition-all"
            title="Descargar Ficha Técnica en PDF"
          >
            <Download className="h-4 w-4" />
            Ficha Técnica PDF
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-100 dark:border-slate-800 flex gap-4 overflow-x-auto pb-px">
        {[
          { id: 'info', label: 'Info General', icon: BadgeInfo },
          { id: 'checklist', label: 'CheckLists', icon: CheckSquare },
          { id: 'tareo', label: 'Tareo y Horas', icon: Calendar },
          { id: 'combustible', label: 'Combustible', icon: Fuel },
          { id: 'mantenimiento', label: 'Mantenimientos', icon: Wrench },
          { id: 'documentos', label: 'Expediente PDF', icon: FileText },
          { id: 'gps', label: 'Live GPS', icon: MapPin },
          { id: 'analytics', label: 'Analíticas Mineras', icon: BarChart3 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-semibold text-sm shrink-0 transition-colors ${
                activeTab === t.id
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm min-h-[300px]">
        
        {activeTab === 'info' && (() => {
          // ── Document Semaphore ──────────────────────────────────────────────
          const hoy = new Date();
          const diffDays = (dateStr: string | undefined | null): number | null => {
            if (!dateStr) return null;
            return Math.ceil((new Date(dateStr).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          };

          type SemaforoDoc = { label: string; vence: string | null; dias: number | null };
          const semaforo: SemaforoDoc[] = [
            { label: 'SOAT', vence: equipo.soatVencimiento ?? null, dias: diffDays(equipo.soatVencimiento) },
            { label: 'Rev. Técnica', vence: equipo.revisionTecnicaVencimiento ?? null, dias: diffDays(equipo.revisionTecnicaVencimiento) },
            { label: 'Permiso Circulación', vence: equipo.permisoCirculacionVencimiento ?? null, dias: diffDays(equipo.permisoCirculacionVencimiento) },
            { label: 'Póliza de Seguro', vence: equipo.polizaVencimiento ?? null, dias: diffDays(equipo.polizaVencimiento) },
          ];

          const semaforoColor = (dias: number | null) => {
            if (dias === null) return { dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Sin fecha' };
            if (dias < 0) return { dot: 'bg-rose-500 animate-pulse', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20', label: `Vencido hace ${Math.abs(dias)}d` };
            if (dias <= 30) return { dot: 'bg-red-500 animate-pulse', badge: 'bg-red-500/10 text-red-600 border-red-500/20', label: `Vence en ${dias}d` };
            if (dias <= 90) return { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: `Vence en ${dias}d` };
            return { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: `Vence en ${dias}d` };
          };

          // ── SUNAT Depreciation (Straight-line, 20%/yr for machinery) ───────
          const valorOrig = equipo.valor ?? 0;
          const anioAdq = equipo.anioFabricacion ? Number(equipo.anioFabricacion) : hoy.getFullYear();
          const anioActual = hoy.getFullYear();
          const vidaUtilAnios = 5; // SUNAT: maquinaria y equipos 20%/año
          const aniosTranscurridos = Math.max(0, anioActual - anioAdq);
          const depreciacionAnual = valorOrig * 0.20;
          const depAcumulada = Math.min(valorOrig, depreciacionAnual * aniosTranscurridos);
          const valorNeto = Math.max(0, valorOrig - depAcumulada);
          const aniosRestantes = Math.max(0, vidaUtilAnios - aniosTranscurridos);
          const pctDepreciado = valorOrig > 0 ? Math.min(100, (depAcumulada / valorOrig) * 100) : 0;

          const alertasDoc = semaforo.filter(d => d.dias !== null && d.dias <= 30);

          return (
            <div className="space-y-6 text-sm">

              {/* Document alert banner */}
              {alertasDoc.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-600 text-xs uppercase tracking-wide">
                      ⚠ {alertasDoc.length} Documento(s) por vencer o vencido(s)
                    </p>
                    <p className="text-rose-500/80 text-xs mt-0.5">
                      {alertasDoc.map(d => d.label).join(', ')} — Renovar urgentemente para evitar bloqueo operativo.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Column 1: Especificaciones */}
                <div className="space-y-4">
                  <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-400 uppercase text-xs tracking-widest">Especificaciones</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {[
                      ['Marca', equipo.marca],
                      ['Modelo', equipo.modelo],
                      ['Tipo', equipo.tipo],
                      ['Color', equipo.color],
                      ['Año Fabric.', equipo.anioFabricacion ?? 'N/A'],
                      ['Combustible', (equipo as any).tipoCombustible ?? 'Diesel'],
                      ['Potencia', (equipo as any).potenciaHP ? `${(equipo as any).potenciaHP} HP` : 'N/A'],
                      ['Capacidad', (equipo as any).capacidadM3 ? `${(equipo as any).capacidadM3} m³` : 'N/A'],
                      ['Peso (ton)', (equipo as any).pesoTon ? `${(equipo as any).pesoTon} t` : 'N/A'],
                    ].map(([k, v]) => (
                      <React.Fragment key={k as string}>
                        <span className="text-slate-400 font-medium text-xs">{k}:</span>
                        <span className="font-bold text-xs">{v as string}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Column 2: Registro y Asignación */}
                <div className="space-y-4">
                  <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-400 uppercase text-xs tracking-widest">Registro y Asignación</h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {[
                      ['Serie', equipo.serie || 'N/A'],
                      ['N° Motor', equipo.motor || 'N/A'],
                      ['Chasis', equipo.chasis || 'N/A'],
                      ['Código Int.', equipo.codigoInterno],
                      ['Proyecto', equipo.proyecto?.nombre || 'Sede Central'],
                      ['Área', equipo.area?.nombre || 'General'],
                      ['Supervisor', equipo.supervisor ? `${equipo.supervisor.nombre} ${equipo.supervisor.apellido}` : '—'],
                      ['Operador', equipo.operador ? `${equipo.operador.nombre} ${equipo.operador.apellido}` : '—'],
                    ].map(([k, v]) => (
                      <React.Fragment key={k as string}>
                        <span className="text-slate-400 font-medium text-xs">{k}:</span>
                        <span className="font-bold text-xs font-mono">{v as string}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Column 3: Depreciación SUNAT */}
                <div className="space-y-4">
                  <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-400 uppercase text-xs tracking-widest">Depreciación SUNAT (20%/año)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Valor Original</span>
                      <span className="font-bold text-xs">$ {valorOrig.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Dep. Anual</span>
                      <span className="font-bold text-xs text-amber-600">$ {depreciacionAnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Dep. Acumulada ({aniosTranscurridos} años)</span>
                      <span className="font-bold text-xs text-rose-500">$ {depAcumulada.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Depreciado: {pctDepreciado.toFixed(0)}%</span>
                        <span>Restante: {(100 - pctDepreciado).toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pctDepreciado >= 100 ? 'bg-rose-500' : pctDepreciado >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, pctDepreciado)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Valor Neto Contable</span>
                      <span className={`font-black text-base ${valorNeto <= 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        $ {valorNeto.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {aniosRestantes > 0 ? `Vida útil restante: ${aniosRestantes} año(s)` : 'Equipo totalmente depreciado.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Semaphore */}
              <div>
                <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-400 uppercase text-xs tracking-widest mb-4">
                  🚦 Semáforo de Documentos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {semaforo.map(doc => {
                    const cfg = semaforoColor(doc.dias);
                    return (
                      <div key={doc.label} className={`p-4 rounded-2xl border ${cfg.badge} relative overflow-hidden`}>
                        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${cfg.dot}`} />
                        <p className="font-bold text-xs">{doc.label}</p>
                        {doc.vence && (
                          <p className="text-[10px] mt-1 font-semibold opacity-80">
                            {new Date(doc.vence).toLocaleDateString('es-PE')}
                          </p>
                        )}
                        <p className="text-[11px] font-bold mt-2">{cfg.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}


        {/* PANEL: Checklists */}
        {activeTab === 'checklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border-r pr-4 space-y-3">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-4">Inspecciones Recientes</h3>
              {checklists.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay checklists cargados.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {checklists.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChecklist(ch)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedChecklist?.id === ch.id
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span>Semana {ch.semana} - {ch.anio}</span>
                        <span className={ch.tieneFallasCriticas ? 'text-rose-500' : 'text-emerald-500'}>
                          {ch.tieneFallasCriticas ? 'RECHAZADO' : 'APROBADO'}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 font-semibold">Fecha: {new Date(ch.fechaHora).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedChecklist ? (
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2 items-center">
                    <h3 className="font-bold">Detalles de Checklist (ID: {selectedChecklist.id})</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      selectedChecklist.estado === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {selectedChecklist.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
                    <div>Operador: <span className="text-slate-800 dark:text-slate-200">{selectedChecklist.operador ? `${selectedChecklist.operador.nombre} ${selectedChecklist.operador.apellido}` : 'Desconocido'}</span></div>
                    <div>Nivel Combustible: <span className="text-slate-800 dark:text-slate-200">{selectedChecklist.combustibleNivel}%</span></div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase text-slate-400">Elementos Inspeccionados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {Object.entries(JSON.parse(selectedChecklist.itemsJson)).map(([key, val]: [string, any]) => (
                        <div key={key} className="p-2.5 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-bold capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                              val.estado === 'Bueno' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {val.estado}
                            </span>
                            <span className="text-slate-400 truncate max-w-[120px]" title={val.observacion}>
                              {val.observacion || '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-400 block uppercase text-[10px]">Observaciones Generales</span>
                    <p className="text-slate-700 dark:text-slate-300 font-semibold">{selectedChecklist.observaciones || 'Sin observaciones registradas.'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-12 text-center">Seleccione un checklist para ver los detalles.</p>
              )}
            </div>
          </div>
        )}

        {/* PANEL: Tareos & Horometros */}
        {activeTab === 'tareo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold">
            
            {/* Hourmeter logs */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Historial de Horómetros</h3>
              {horometros.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Sin registros de horómetros.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="py-2">Fecha</th>
                        <th className="py-2">H. Inicial</th>
                        <th className="py-2">H. Final</th>
                        <th className="py-2">H. Trabajadas</th>
                        <th className="py-2">Servicio Mantenimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {horometros.map((h) => (
                        <tr key={h.id}>
                          <td className="py-2">{new Date(h.fecha).toLocaleDateString()}</td>
                          <td className="py-2">{h.inicial}</td>
                          <td className="py-2">{h.final}</td>
                          <td className="py-2 text-emerald-600 dark:text-emerald-400">{h.horasTrabajadas} hrs</td>
                          <td className="py-2">{h.proximoMantenimiento} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activities (Tareos) list */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Actividades y Tareo Semanal</h3>
              {tareos.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Sin registros de tareo.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {tareos.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white capitalize">{t.actividad}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Operador: {t.operador ? `${t.operador.nombre} ${t.operador.apellido}` : 'N/A'}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                          {t.horasNormales + t.horasExtras} hrs
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold">FECHA: {new Date(t.fecha).toLocaleDateString()} | EXTRAS: {t.horasExtras} hrs</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL: Fuel (Combustible) */}
        {activeTab === 'combustible' && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Registro de Carga de Combustible</h3>
            {combustibles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay abastos cargados.</p>
            ) : (
              <div className="overflow-x-auto text-xs font-semibold">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2">Fecha</th>
                      <th className="py-2">Proveedor / Estación</th>
                      <th className="py-2">Galones</th>
                      <th className="py-2">Precio Galón</th>
                      <th className="py-2">Costo Total</th>
                      <th className="py-2">Horómetro Carga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {combustibles.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2">{new Date(c.fecha).toLocaleDateString()}</td>
                        <td className="py-2">{c.proveedor} ({c.grifo})</td>
                        <td className="py-2 text-emerald-600 dark:text-emerald-400">{c.galones} G</td>
                        <td className="py-2">S/. {c.precioGalon}</td>
                        <td className="py-2 text-emerald-600 dark:text-emerald-400 font-bold">S/. {c.costoTotal.toLocaleString()}</td>
                        <td className="py-2">{c.horometroVal} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL: Maintenance */}
        {activeTab === 'mantenimiento' && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Bitácora de Mantenimientos Preventivos y Correctivos</h3>
            {mantenimientos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin registros de mantenimiento.</p>
            ) : (
              <div className="space-y-4">
                {mantenimientos.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          m.tipo === 'Preventivo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          Mantenimiento {m.tipo}
                        </span>
                        <h4 className="text-sm font-bold mt-1 text-slate-900 dark:text-white">{m.descripcion}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Responsable: {m.responsable} | Proveedor: {m.proveedor}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-semibold block">{new Date(m.fecha).toLocaleDateString()}</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">S/. {m.costoTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Spare parts detail */}
                    <div className="text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                      <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">Repuestos y Consumibles Utilizados</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {JSON.parse(m.repuestos).map((r: any, idx: number) => (
                          <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                            <p className="font-bold truncate text-[11px]">{r.nombre}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Cant: {r.cantidad} | P.U: S/. {r.precio}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL: Documents */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            <h3 className="font-bold text-sm uppercase text-slate-400 border-b pb-2">Expediente Documental</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Render SOAT / technical inspection placeholders */}
              {[
                { name: 'Seguro Obligatorio de Accidentes (SOAT)', type: 'SOAT', expiry: equipo.soatVencimiento },
                { name: 'Certificado Inspección Técnica Vehicular', type: 'Revision Tecnica', expiry: equipo.revisionTecnicaVencimiento }
              ].map((doc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-1 font-semibold">
                    <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                    <p className="text-slate-400">Tipo: {doc.type}</p>
                    <p className="text-slate-400">
                      Vencimiento:{' '}
                      <span className={doc.expiry && new Date(doc.expiry) < new Date() ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                        {doc.expiry ? new Date(doc.expiry).toLocaleDateString() : 'No Registrado'}
                      </span>
                    </p>
                  </div>
                  <button className="py-1 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold">
                    Ver PDF
                  </button>
                </div>
              ))}

              {documentos.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-1 font-semibold">
                    <p className="font-bold text-slate-900 dark:text-white">{doc.nombre}</p>
                    <p className="text-slate-400">Tipo: {doc.tipo}</p>
                    <p className="text-slate-400">Vencimiento: {doc.fechaVencimiento ? new Date(doc.fechaVencimiento).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <button className="py-1 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold">
                    Ver Archivo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL: live GPS */}
        {activeTab === 'gps' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-sm uppercase text-slate-400">Monitoreo GPS Satelital (Simulador Activo)</h3>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span>Lat: <span className="text-slate-700 dark:text-slate-300 font-bold">{gps?.latitud ? Number(gps.latitud).toFixed(5) : 'N/A'}</span></span>
                <span>Lng: <span className="text-slate-700 dark:text-slate-300 font-bold">{gps?.longitud ? Number(gps.longitud).toFixed(5) : 'N/A'}</span></span>
                <span>Velocidad: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{gps?.velocidad ?? 0} km/h</span></span>
                <span>Motor: <span className={`font-bold ${gps?.motorEncendido ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`}>{gps?.motorEncendido ? 'ENCENDIDO' : 'APAGADO'}</span></span>
              </div>
            </div>

            {/* Map wrapper */}
            <div 
              ref={mapContainerRef} 
              className="h-96 w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner relative z-10"
            />
          </div>
        )}

        {/* PANEL: Analytics & Reliability KPIs */}
        {activeTab === 'analytics' && (() => {
          // 1. Availability Calculation (DF%)
          let baseAvailability = 95.0;
          if (equipo.estado === 'Bloqueado por SSOMA') baseAvailability = 55.0;
          else if (equipo.estado === 'Fuera de servicio' || equipo.estado === 'En espera de repuestos') baseAvailability = 35.0;
          else if (equipo.estado.includes('mantenimiento')) baseAvailability = 70.0;
          const totalDaysInMaint = mantenimientos.length * 1.2; // Estimation of days down per maint event
          const finalAvailability = Math.max(30.0, baseAvailability - totalDaysInMaint);

          // 2. MTBF Calculation (Mean Time Between Failures)
          const totalOperatingHours = tareos.reduce((acc, curr) => acc + Number(curr.horasNormales) + Number(curr.horasExtras), 0);
          const failures = mantenimientos.filter(m => m.tipo === 'Correctivo').length;
          const mtbf = failures === 0 ? (totalOperatingHours || 320) : (totalOperatingHours / failures);

          // 3. MTTR Calculation (Mean Time to Repair)
          const downtimeHours = (mantenimientos.filter(m => m.tipo === 'Correctivo').length * 12) + (mantenimientos.filter(m => m.tipo === 'Preventivo').length * 3);
          const mttr = failures === 0 ? 1.5 : (downtimeHours / failures);

          // 4. Fuel Efficiency Calculation (G/Hr)
          const totalGalones = combustibles.reduce((acc, curr) => acc + Number(curr.galones), 0);
          // Estimated working hours using horometers or tareos
          const workingHours = horometros.reduce((acc, curr) => acc + Number(curr.horasTrabajadas), 0) || totalOperatingHours || 1;
          const gHr = totalGalones / workingHours;

          return (
            <div className="space-y-6 text-sm animate-fade-in">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Centro de Analítica y Confiabilidad de Flota</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Indicadores críticos del desempeño técnico y mecánico de la unidad {equipo.placa}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-lg">KPIs Mineros Estándar</span>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* DF% Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Disponibilidad Física (DF)</span>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{finalAvailability.toFixed(1)}%</p>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${finalAvailability}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">Meta operativa mínima: 85.0%</span>
                  </div>
                </div>

                {/* MTBF Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">T. Medio Entre Fallas (MTBF)</span>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{mtbf.toFixed(1)} hrs</p>
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] text-emerald-500 font-bold">✓ Tiempo óptimo de confiabilidad</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Total horas acumuladas: {totalOperatingHours.toFixed(1)} hrs</span>
                  </div>
                </div>

                {/* MTTR Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">T. Medio de Reparación (MTTR)</span>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{mttr.toFixed(1)} hrs</p>
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] text-amber-500 font-bold">⚠ {failures} fallas mecánicas registradas</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Tiempo total parado: {downtimeHours} hrs</span>
                  </div>
                </div>

                {/* Fuel Efficiency Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Eficiencia de Combustible</span>
                    <p className="text-2xl font-black text-emerald-600 mt-1.5">{totalGalones === 0 ? '0.00 G/Hr' : `${gHr.toFixed(2)} G/Hr`}</p>
                  </div>
                  <div className="mt-3">
                    <span className="text-[9px] text-slate-400 block">Total galones abastecidos: {totalGalones.toFixed(1)} gl</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">Horas de control: {workingHours.toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>

              {/* Detalle Horas Hombre por Personal */}
              <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Detalle Horas Hombre por Personal</h4>
                {(() => {
                  const conductorMap = new Map<string, { normal: number; extra: number }>();
                  tareos.forEach((t: any) => {
                    const name = t.conductor ? `${t.conductor.nombre} ${t.conductor.apellido}` : (t.conductorId ? `Conductor #${t.conductorId}` : 'Sin asignar');
                    const prev = conductorMap.get(name) || { normal: 0, extra: 0 };
                    conductorMap.set(name, {
                      normal: prev.normal + Number(t.horasNormales || 0),
                      extra: prev.extra + Number(t.horasExtras || 0),
                    });
                  });
                  const entries = Array.from(conductorMap.entries());
                  if (entries.length === 0) {
                    return <p className="text-xs text-slate-400 italic">No hay tareos registrados para este equipo.</p>;
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2 px-2 font-semibold">Personal</th>
                            <th className="py-2 px-2 font-semibold text-right">Horas Normales</th>
                            <th className="py-2 px-2 font-semibold text-right">Horas Extras</th>
                            <th className="py-2 px-2 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([name, hrs], idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-colors">
                              <td className="py-2 px-2 font-semibold text-slate-700 dark:text-slate-300">{name}</td>
                              <td className="py-2 px-2 text-right font-mono">{hrs.normal.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right font-mono text-amber-500">{hrs.extra.toFixed(1)}</td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600">{(hrs.normal + hrs.extra).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                            <td className="py-2 px-2">TOTAL</td>
                            <td className="py-2 px-2 text-right font-mono">{entries.reduce((s, [, h]) => s + h.normal, 0).toFixed(1)}</td>
                            <td className="py-2 px-2 text-right font-mono text-amber-500">{entries.reduce((s, [, h]) => s + h.extra, 0).toFixed(1)}</td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-600">{entries.reduce((s, [, h]) => s + h.normal + h.extra, 0).toFixed(1)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Costs Breakdown Chart Simulation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Distribución de Gastos Operativos</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Combustible Acumulado</span>
                        <span className="font-mono text-emerald-600">S/ {combustibles.reduce((acc, curr) => acc + Number(curr.costoTotal), 0).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (combustibles.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) / (combustibles.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) + mantenimientos.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) || 1)) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Mantenimiento y Taller</span>
                        <span className="font-mono text-rose-500">S/ {mantenimientos.reduce((acc, curr) => acc + Number(curr.costoTotal), 0).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, (mantenimientos.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) / (combustibles.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) + mantenimientos.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs flex justify-between font-bold">
                    <span>COSTO TOTAL OPERATIVO</span>
                    <span className="font-mono text-slate-900 dark:text-white">S/ {(combustibles.reduce((acc, curr) => acc + Number(curr.costoTotal), 0) + mantenimientos.reduce((acc, curr) => acc + Number(curr.costoTotal), 0)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">Anomalías y Estado de Alertas</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Estado de Operatividad</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg ${equipo.estado === 'Disponible' || equipo.estado === 'Operativo' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{equipo.estado}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Alertas del Sistema Activas</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg ${alertas.length === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{alertas.length} Alertas</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Inspecciones Checklists del Mes</span>
                      <span className="font-bold font-mono">{checklists.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* MODAL: SSOMA Block Form */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-500">
              <ShieldAlert className="h-6 w-6" /> Bloquear Equipo (SSOMA)
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">El bloqueo impedirá que este equipo sea asignado a tareos y cronogramas operativos.</p>

            <form onSubmit={handleBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Motivo / Justificación Crítica</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Describa la falla crítica (ej. rotura de palier, frenos inoperativos, falta de SOAT)"
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockForm(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SSOMA Release Form */}
      {showReleaseForm && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-emerald-500">
              <PlusCircle className="h-6 w-6" /> Liberar y Habilitar Equipo
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Habilitar el equipo permitirá asignarlo inmediatamente a la operación.</p>

            <form onSubmit={handleRelease} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Justificación de Liberación</label>
                <textarea
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="Detalle la reparación realizada o validación técnica aprobada."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReleaseForm(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Liberar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
