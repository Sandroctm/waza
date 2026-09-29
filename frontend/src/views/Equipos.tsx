import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Equipo, Proyecto } from '../types';
import { Truck, Plus, Search, Filter, MapPin, Download, FolderOpen, LayoutGrid, List, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface EquiposProps {
  onNavigate: (view: string, data?: any) => void;
  initialFilters?: { estado?: string };
  user?: any;
}

export const Equipos: React.FC<EquiposProps> = ({ onNavigate, initialFilters, user }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.estado || '');
  const [proyectoFilter, setProyectoFilter] = useState('');
  const [groupByProject, setGroupByProject] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const importFileRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [newPlaca, setNewPlaca] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newTipo, setNewTipo] = useState('Volquete');
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newValor, setNewValor] = useState(0);
  const [newEstado, setNewEstado] = useState('Disponible');
  const [newProyectoId, setNewProyectoId] = useState<number | ''>('');
  const [newProyectoNombre, setNewProyectoNombre] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEquipos = async () => {
    let eqResult: any[] = [];
    let proyResult: any[] = [];
    
    try {
      const raw = await api.getEquipos();
      eqResult = Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.error('Error fetching equipos:', err);
      eqResult = [];
    }
    
    try {
      const raw = await api.getProyectos();
      proyResult = Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.error('Error fetching proyectos:', err);
      proyResult = [];
    }
    
    setEquipos(eqResult);
    setProyectos(proyResult);
    setLoading(false);
  };

  useEffect(() => { fetchEquipos(); }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newPlaca || !newCodigo || !newMarca || !newModelo) {
      setFormError('Por favor llene todos los campos obligatorios.');
      return;
    }
    try {
      // If user typed a new project name, create it first
      let finalProyectoId = newProyectoId || undefined;
      if (!finalProyectoId && newProyectoNombre.trim()) {
        try {
          const nuevoProyecto = await api.createProyecto({ nombre: newProyectoNombre.trim(), ubicacion: '', activo: true });
          finalProyectoId = nuevoProyecto.id;
        } catch (err: any) {
          // If project already exists, find it in the list
          const existing = proyectos.find(p => p.nombre.toLowerCase() === newProyectoNombre.trim().toLowerCase());
          if (existing) finalProyectoId = existing.id;
        }
      }
      await api.createEquipo({
        placa: newPlaca,
        codigoInterno: newCodigo,
        tipo: newTipo,
        marca: newMarca,
        modelo: newModelo,
        valor: newValor,
        estado: newEstado,
        proyectoId: finalProyectoId,
        seguro: 'Rimac Base',
        fotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        gpsId: `GPS-${newPlaca}`
      });
      setShowAddModal(false);
      setNewPlaca(''); setNewCodigo(''); setNewMarca(''); setNewModelo(''); setNewValor(0); setNewProyectoId(''); setNewProyectoNombre('');
      showToast('✅ Equipo registrado y guardado en el sistema');
      fetchEquipos();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar equipo.');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    setExportLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      // Agrupar por proyecto para múltiples hojas
      const byProject: Record<string, Equipo[]> = {};
      filteredEquipos.forEach(eq => {
        const proy = eq.proyecto?.nombre || 'Sin Proyecto';
        if (!byProject[proy]) byProject[proy] = [];
        byProject[proy].push(eq);
      });

      Object.entries(byProject).forEach(([proyNombre, eqs]) => {
        const rows = eqs.map(eq => ({
          'Placa': eq.placa,
          'Código Interno': eq.codigoInterno,
          'Tipo': eq.tipo,
          'Marca': eq.marca,
          'Modelo': eq.modelo,
          'Serie': eq.serie || '',
          'Motor': eq.motor || '',
          'Chasis': eq.chasis || '',
          'Color': eq.color || '',
          'Proyecto': eq.proyecto?.nombre || 'Sin Proyecto',
          'Área': eq.area?.nombre || '',
          'Estado': eq.estado,
          'Supervisor': eq.supervisor ? `${eq.supervisor.nombre} ${eq.supervisor.apellido}` : '',
          'Operador': eq.operador ? `${eq.operador.nombre} ${eq.operador.apellido}` : '',
          'Valor (USD)': eq.valor,
          'Seguro': eq.seguro || '',
          'SOAT Vence': eq.soatVencimiento || '',
          'Rev. Técnica Vence': eq.revisionTecnicaVencimiento || '',
          'Póliza Vence': eq.polizaVencimiento || '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        // Ancho de columnas
        ws['!cols'] = [
          { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 16 },
          { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 20 },
          { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
          { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, proyNombre.substring(0, 31));
      });

      // Hoja resumen general
      const resumenRows = filteredEquipos.map(eq => ({
        'Placa': eq.placa, 'Tipo': eq.tipo, 'Marca': eq.marca, 'Modelo': eq.modelo,
        'Proyecto': eq.proyecto?.nombre || 'Sin Proyecto', 'Estado': eq.estado,
        'SOAT Vence': eq.soatVencimiento || '', 'Valor (USD)': eq.valor,
      }));
      const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
      wsResumen['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'RESUMEN GENERAL');

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `SIGECOSEM_Flota_${fecha}.xlsx`);
      showToast('📊 Excel exportado con éxito — dividido por proyectos');
    } catch (err) {
      console.error('Error exporting Excel:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const parseExcelDate = (val: any): string | undefined => {
    if (!val) return undefined;
    
    // If it's already a JS Date object
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    
    // If it's a number (Excel serial date)
    if (typeof val === 'number' || !isNaN(Number(val))) {
      const num = Number(val);
      if (num > 25569) { // 25569 is 1970-01-01
        const date = new Date((num - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
    }
    
    // If it's a string, try parsing it
    const str = String(val).trim();
    if (!str) return undefined;
    
    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
      const year = parseInt(dmyMatch[3], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try standard JS Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    
    return undefined;
  };

  // Import from Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      let success = 0;
      let errors = 0;
      for (const row of rows) {
        try {
          const placa = String(row['Placa'] || row['placa'] || '').trim();
          const codigoInterno = String(row['Código Interno'] || row['Codigo Interno'] || row['codigoInterno'] || '').trim();
          if (!placa || !codigoInterno) {
            errors++;
            continue;
          }
          await api.createEquipo({
            placa,
            codigoInterno,
            tipo: String(row['Tipo'] || row['tipo'] || 'Volquete').trim(),
            marca: String(row['Marca'] || row['marca'] || 'Genérico').trim(),
            modelo: String(row['Modelo'] || row['modelo'] || 'Genérico').trim(),
            serie: String(row['Serie'] || row['serie'] || '').trim() || undefined,
            motor: String(row['Motor'] || row['motor'] || '').trim() || undefined,
            chasis: String(row['Chasis'] || row['chasis'] || '').trim() || undefined,
            color: String(row['Color'] || row['color'] || '').trim() || undefined,
            estado: String(row['Estado'] || row['estado'] || 'Disponible').trim(),
            valor: parseFloat(String(row['Valor (USD)'] || row['Valor'] || row['valor'] || 0)) || 0,
            seguro: String(row['Seguro'] || row['seguro'] || 'Sin seguro').trim(),
            soatVencimiento: parseExcelDate(row['SOAT Vence']),
            revisionTecnicaVencimiento: parseExcelDate(row['Rev. Técnica Vence']),
            polizaVencimiento: parseExcelDate(row['Póliza Vence']),
            fotoUrl: String(row['FotoUrl'] || row['fotoUrl'] || '').trim() || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
            gpsId: String(row['GPS ID'] || row['gpsId'] || `GPS-${row['Placa'] || 'NUEVO'}`).trim(),
          });
          success++;
        } catch (err) {
          console.error('Row import error:', err);
          errors++;
        }
      }
      fetchEquipos();
      showToast(`✅ Importación completa: ${success} equipos cargados${errors > 0 ? `, ${errors} errores` : ''}`);
    } catch (err) {
      showToast('❌ Error al leer el archivo Excel.');
      console.error(err);
    } finally {
      setImportLoading(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Operativo': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
      case 'Bloqueado por SSOMA': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse';
      case 'En mantenimiento preventivo':
      case 'En mantenimiento correctivo': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const getSoatColor = (fecha?: string) => {
    if (!fecha) return 'text-slate-400';
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = (d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-rose-600 font-bold';
    if (diff < 30) return 'text-amber-500 font-bold';
    return 'text-emerald-600';
  };

  const filteredEquipos = equipos.filter(eq => {
    const matchesSearch = 
      (eq.placa || '').toLowerCase().includes(search.toLowerCase()) ||
      (eq.codigoInterno || '').toLowerCase().includes(search.toLowerCase()) ||
      (eq.marca || '').toLowerCase().includes(search.toLowerCase()) ||
      (eq.modelo || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === '' || (eq.tipo || '').toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === '' || (eq.estado || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesProy = proyectoFilter === '' || String(eq.proyectoId || '') === proyectoFilter || 
      (proyectoFilter === 'none' && !eq.proyectoId);
    return matchesSearch && matchesType && matchesStatus && matchesProy;
  });

  // Agrupar por proyecto para la vista agrupada
  const equiposByProject: Record<string, Equipo[]> = {};
  filteredEquipos.forEach(eq => {
    const key = eq.proyecto?.nombre || 'Sin Proyecto Asignado';
    if (!equiposByProject[key]) equiposByProject[key] = [];
    equiposByProject[key].push(eq);
  });

  const renderEquipoCard = (eq: Equipo) => (
    <div
      key={eq.placa}
      onClick={() => onNavigate('equipo-detalle', { placa: eq.placa })}
      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-lg hover:scale-[1.01] hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition-all flex flex-col group"
    >
      <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
        {eq.fotoUrl ? (
          <img src={eq.fotoUrl} alt={eq.modelo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><Truck className="h-16 w-16" /></div>
        )}
        <span className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${getStatusColor(eq.estado)}`}>{eq.estado}</span>
        <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1 rounded-lg text-white text-xs font-bold">{eq.codigoInterno}</div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{eq.marca} {eq.modelo}</h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
            <span>PLACA:</span>
            <span className="text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{eq.placa}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800/80 py-3">
          <div><span className="text-slate-400 block">Tipo</span><span className="text-slate-700 dark:text-slate-300 font-semibold">{eq.tipo}</span></div>
          <div><span className="text-slate-400 block">Proyecto</span><span className="text-slate-700 dark:text-slate-300 font-semibold truncate block">{eq.proyecto?.nombre || 'Sede Central'}</span></div>
          <div><span className="text-slate-400 block">SOAT</span><span className={`text-xs font-semibold ${getSoatColor(eq.soatVencimiento)}`}>{eq.soatVencimiento ? new Date(eq.soatVencimiento).toLocaleDateString('es-PE') : '—'}</span></div>
          <div><span className="text-slate-400 block">Valor</span><span className="text-slate-700 dark:text-slate-300 font-semibold">$ {eq.valor?.toLocaleString()}</span></div>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> GPS Operativo</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Ver Expediente →</span>
        </div>
      </div>
    </div>
  );

  const renderEquipoRow = (eq: Equipo) => (
    <tr
      key={eq.placa}
      onClick={() => onNavigate('equipo-detalle', { placa: eq.placa })}
      className="hover:bg-indigo-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-xs">{eq.placa}</td>
      <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{eq.codigoInterno}</td>
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{eq.tipo}</td>
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{eq.marca} {eq.modelo}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{eq.proyecto?.nombre || '—'}</td>
      <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(eq.estado)}`}>{eq.estado}</span></td>
      <td className={`px-4 py-3 text-xs font-semibold ${getSoatColor(eq.soatVencimiento)}`}>{eq.soatVencimiento ? new Date(eq.soatVencimiento).toLocaleDateString('es-PE') : '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">$ {eq.valor?.toLocaleString()}</td>
    </tr>
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
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Flota de Equipos y Maquinaria</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filteredEquipos.length} equipo{filteredEquipos.length !== 1 ? 's' : ''} encontrado{filteredEquipos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Group by project toggle */}
          <button
            onClick={() => setGroupByProject(!groupByProject)}
            className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border transition-colors ${groupByProject ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <FolderOpen className="h-4 w-4" /> Agrupar por Proyecto
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportLoading ? 'Exportando...' : 'Exportar Excel'}
          </button>

          {/* Import Excel */}
          <input
            ref={importFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
          <button
            onClick={() => importFileRef.current?.click()}
            disabled={importLoading}
            title="Importar equipos desde un archivo Excel"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm"
          >
            <Download className="h-4 w-4" />
            {importLoading ? 'Importando...' : 'Importar Excel'}
          </button>

          {/* Add button */}
          {(user?.rol === 'Administrador' || user?.rol === 'Planeamiento') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm"
            >
              <Plus className="h-4 w-4" /> Registrar Equipo
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center h-full text-slate-400 w-5" />
          <input
            type="text"
            placeholder="Buscar por placa, código, modelo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Filter className="h-4 w-4" /> FILTRAR:
          </div>
          <select value={proyectoFilter} onChange={e => setProyectoFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">Todos los Proyectos</option>
            <option value="none">Sin Proyecto</option>
            {proyectos.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">Todos los Tipos</option>
            <option value="Volquete">Volquetes</option>
            <option value="Excavadora">Excavadoras</option>
            <option value="Retroexcavadora">Retroexcavadoras</option>
            <option value="Cargador Frontal">Cargadores Frontales</option>
            <option value="Cisterna">Cisternas</option>
            <option value="Tracto Oruga">Tracto Oruga</option>
            <option value="Rodillo Compactador">Rodillo Compactador</option>
            <option value="Camioneta">Camioneta</option>
            <option value="Encapsulado">Encapsulado</option>
            <option value="Tracto">Tracto</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">Todos los Estados</option>
            <option value="Disponible">Disponibles</option>
            <option value="Operativo">Operativos</option>
            <option value="Bloqueado por SSOMA">Bloqueados SSOMA</option>
            <option value="En mantenimiento preventivo">Mant. Preventivo</option>
            <option value="En mantenimiento correctivo">Mant. Correctivo</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredEquipos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800 text-slate-400">
          <Truck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="font-medium text-sm">No se encontraron equipos para los filtros seleccionados.</p>
        </div>
      ) : groupByProject ? (
        // Grouped by project
        <div className="space-y-8">
          {Object.entries(equiposByProject).map(([proyNombre, eqs]) => (
            <div key={proyNombre}>
              <div className="flex items-center gap-3 mb-4">
                <FolderOpen className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{proyNombre}</h2>
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {eqs.length} equipo{eqs.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {eqs.map(renderEquipoCard)}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <tr>{['Placa', 'Código', 'Tipo', 'Marca/Modelo', 'Proyecto', 'Estado', 'SOAT', 'Valor'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{eqs.map(renderEquipoRow)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipos.map(renderEquipoCard)}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>{['Placa', 'Código', 'Tipo', 'Marca/Modelo', 'Proyecto', 'Estado', 'SOAT', 'Valor'].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredEquipos.map(renderEquipoRow)}</tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-100 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Registrar Nuevo Equipo en SIGECOSEM</h3>
            {formError && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{formError}</div>}
            <form onSubmit={handleAddEquipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Placa (Requerido)</label>
                  <input type="text" value={newPlaca} onChange={e => setNewPlaca(e.target.value.toUpperCase())}
                    placeholder="EGS-123" required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código Interno (Requerido)</label>
                  <input type="text" value={newCodigo} onChange={e => setNewCodigo(e.target.value)}
                    placeholder="VOL-03" required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo Equipo</label>
                  <select value={newTipo} onChange={e => setNewTipo(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white">
                    {['Volquete', 'Excavadora', 'Retroexcavadora', 'Cargador Frontal', 'Cisterna', 'Tracto Oruga', 'Rodillo Compactador', 'Camioneta', 'Encapsulado', 'Tracto'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Marca</label>
                  <input type="text" value={newMarca} onChange={e => setNewMarca(e.target.value)}
                    placeholder="Volvo / CAT" required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Modelo</label>
                  <input type="text" value={newModelo} onChange={e => setNewModelo(e.target.value)}
                    placeholder="FMX 460" required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Valor ($ USD)</label>
                  <input type="number" value={newValor} onChange={e => setNewValor(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Proyecto</label>
                  <input
                    type="text"
                    list="proyectos-add-list"
                    value={newProyectoNombre}
                    onChange={e => {
                      const val = e.target.value;
                      setNewProyectoNombre(val);
                      const match = proyectos.find(p => p.nombre.toLowerCase() === val.toLowerCase());
                      setNewProyectoId(match ? match.id : '');
                    }}
                    placeholder="Elige o escribe un Proyecto"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  />
                  <datalist id="proyectos-add-list">
                    {proyectos.map(p => <option key={p.id} value={p.nombre} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Estado Inicial</label>
                  <select value={newEstado} onChange={e => setNewEstado(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white">
                    <option value="Disponible">Disponible</option>
                    <option value="Operativo">Operativo</option>
                    <option value="En mantenimiento preventivo">En mantenimiento preventivo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 font-bold">
                  Cancelar
                </button>
                <button type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20">
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
