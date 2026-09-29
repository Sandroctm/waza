import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Truck, Search, Plus, FileText, Download, Calendar, Filter } from 'lucide-react';

export const ReporteTonelada: React.FC<{ onNavigate: (view: string, data?: any) => void; user: any }> = ({ onNavigate, user }) => {
  const [reportes, setReportes] = useState<any[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('');
  
  // Filtros idénticos a la plantilla de la imagen
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [codBalanza, setCodBalanza] = useState('(Todas)');
  const [descMat, setDescMat] = useState('(Todas)');
  const [centroOrigen, setCentroOrigen] = useState('(Todas)');

  // Formulario completo
  const [formData, setFormData] = useState({
    descRuta: 'MAHR TUNEL - VICTORIA',
    regPesaje: '',
    placa: '', // VEHICULO (Escribir o Seleccionar)
    ruta: '3000120',
    centroOrigen: 'TICLIO', // w / Contratista
    conductor: '',
    empresaContratista: 'TICLIO',
    tipoMaterial: 'Mineral',
    pesoBruto: 0, // PESOENTRA
    tara: 0, // PESOSALID
    pesoNeto: 0, // PESONETO
    humedad: 0,
    tms: 0, // TMS_SECAS
    observaciones: 'T010-0002',
    codBalanza: 'Balanza 01'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repData, eqData, condData] = await Promise.all([
        api.getReportesTonelada({
          start: startDate,
          end: endDate,
          codBalanza,
          descMat,
          centroOrigen
        }),
        api.getEquipos(),
        api.getConductoresTodos()
      ]);
      setReportes(repData || []);
      setEquipos(eqData || []);
      setConductores(condData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, codBalanza, descMat, centroOrigen]);

  // Cálculos automáticos de Peso Neto y TMS
  useEffect(() => {
    const neto = formData.pesoBruto - formData.tara;
    const factorHumedad = (100 - formData.humedad) / 100;
    const calcTms = neto * factorHumedad;
    setFormData(prev => ({
      ...prev,
      pesoNeto: neto > 0 ? Number(neto.toFixed(2)) : 0,
      tms: calcTms > 0 ? Number(calcTms.toFixed(4)) : 0
    }));
  }, [formData.pesoBruto, formData.tara, formData.humedad]);

  // Autoseleccionar conductor si existe coincidencia de placa
  useEffect(() => {
    if (formData.placa) {
      const cond = conductores.find(c => c.equipoPlacaAsignada?.toLowerCase() === formData.placa.toLowerCase());
      if (cond) {
        setFormData(prev => ({ ...prev, conductor: `${cond.nombre} ${cond.apellido}` }));
      }
    }
  }, [formData.placa, conductores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReporteTonelada(formData);
      setShowForm(false);
      setSelectedTipo('');
      setFormData({
        descRuta: 'MAHR TUNEL - VICTORIA',
        regPesaje: '',
        placa: '',
        ruta: '3000120',
        centroOrigen: 'TICLIO',
        conductor: '',
        empresaContratista: 'TICLIO',
        tipoMaterial: 'Mineral',
        pesoBruto: 0,
        tara: 0,
        pesoNeto: 0,
        humedad: 0,
        tms: 0,
        observaciones: 'T010-0002',
        codBalanza: 'Balanza 01'
      });
      fetchData();
    } catch (error) {
      alert("Error al guardar el reporte.");
    }
  };

  const exportarExcel = () => {
    let url = `/api/reportetonelada/exportar-excel?access_token=${localStorage.getItem('sigecosem_token')}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    if (codBalanza) url += `&codBalanza=${encodeURIComponent(codBalanza)}`;
    if (descMat) url += `&descMat=${encodeURIComponent(descMat)}`;
    if (centroOrigen) url += `&centroOrigen=${encodeURIComponent(centroOrigen)}`;
    window.open(url, '_blank');
  };

  const tiposDeEquipo = Array.from(new Set(equipos.map(eq => eq.tipo))).filter(Boolean);
  const placasFiltradas = selectedTipo 
    ? equipos.filter(eq => eq.tipo === selectedTipo).map(eq => eq.placa)
    : equipos.map(eq => eq.placa);

  const conductoresAutorizados = conductores.filter(c => {
    if (!selectedTipo) return true;
    if (!c.tipoEquipoAutorizado || c.tipoEquipoAutorizado.trim() === '') return true;
    const tipos = c.tipoEquipoAutorizado.split(',').map((t: string) => t.trim().toLowerCase());
    return tipos.includes(selectedTipo.toLowerCase()) || tipos.includes('*');
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Title Header matching attached spreadsheet image */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
              REPORTE DE TONELAJE DE MATERIAL
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              DETALLE DE VIAJES POR CONTRATISTA
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={exportarExcel} 
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-600/20 text-xs"
            >
              <Download className="w-4 h-4" /> Exportar Excel Detallado
            </button>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 text-xs"
            >
              {showForm ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Ver Lista Detallada' : 'Nuevo Registro de Viaje'}
            </button>
          </div>
        </div>

        {/* Filter Control Header Area strictly matching attached image spreadsheet format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CODBALANZ</label>
            <input 
              type="text" 
              value={codBalanza} 
              onChange={e => setCodBalanza(e.target.value)} 
              placeholder="(Todas)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-semibold text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">DESCMAT</label>
            <input 
              type="text" 
              value={descMat} 
              onChange={e => setDescMat(e.target.value)} 
              placeholder="(Todas)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-semibold text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CENTROOR</label>
            <input 
              type="text" 
              value={centroOrigen} 
              onChange={e => setCentroOrigen(e.target.value)} 
              placeholder="(Todas)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-semibold text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">DESDE :</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-semibold text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">HASTA :</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-semibold text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden text-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
            <Truck className="text-emerald-500" /> Registrar Pesaje y Viaje por Contratista
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Cascaded Equipment Type and Plate selections */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Equipo</label>
                <select 
                  value={selectedTipo}
                  onChange={e => {
                    setSelectedTipo(e.target.value);
                    setFormData(prev => ({ ...prev, placa: '' }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-bold text-slate-800 dark:text-white"
                >
                  <option value="">-- Todos los Tipos --</option>
                  {tiposDeEquipo.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">VEHICULO (Placa)</label>
                <select 
                  required 
                  value={formData.placa} 
                  onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-bold uppercase text-slate-800 dark:text-white"
                >
                  <option value="">-- Seleccione Placa --</option>
                  {placasFiltradas.map(placa => {
                    const eq = equipos.find(x => x.placa === placa);
                    return (
                      <option key={placa} value={placa}>
                        {placa} {eq ? `(${eq.codigoInterno} - ${eq.marca})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">DESCRUTA (Descripción Ruta)</label>
                <select 
                  required 
                  value={formData.descRuta} 
                  onChange={e => setFormData({...formData, descRuta: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="MAHR TUNEL - VICTORIA">MAHR TUNEL - VICTORIA</option>
                  <option value="TICLIO-MAHR TUNEL">TICLIO-MAHR TUNEL</option>
                  <option value="TICLIO-VICTORIA">TICLIO-VICTORIA</option>
                  <option value="INTERNO">INTERNO</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">w (Centro Origen / Contratista)</label>
                <select 
                  required
                  value={formData.centroOrigen} 
                  onChange={e => setFormData({...formData, centroOrigen: e.target.value, empresaContratista: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="TICLIO">TICLIO</option>
                  <option value="MAHR TUNEL">MAHR TUNEL</option>
                  <option value="INTERNO">INTERNO</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Conductor / Operador</span>
                  {selectedTipo && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Aptos para {selectedTipo}
                    </span>
                  )}
                </label>
                <select 
                  required 
                  value={formData.conductor} 
                  onChange={e => setFormData({...formData, conductor: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="">-- Seleccione Conductor Autorizado --</option>
                  {conductoresAutorizados.map(c => {
                    const nombreCompleto = `${c.nombre} ${c.apellido}`;
                    return (
                      <option key={c.id || nombreCompleto} value={nombreCompleto}>
                        {nombreCompleto} {c.tipoEquipoAutorizado ? `[Autorizado: ${c.tipoEquipoAutorizado}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Peso Entrada (Ton)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.pesoBruto} 
                  onChange={e => setFormData({...formData, pesoBruto: parseFloat(e.target.value) || 0})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Peso Salida (Ton)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.tara} 
                  onChange={e => setFormData({...formData, tara: parseFloat(e.target.value) || 0})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase text-amber-600 dark:text-amber-400">Peso Neto (Ton)</label>
                <input 
                  disabled 
                  type="number" 
                  value={formData.pesoNeto} 
                  className="w-full bg-yellow-300 text-slate-900 border border-yellow-400 rounded-xl p-3 font-black text-lg shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">% Humedad</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.humedad} 
                  onChange={e => setFormData({...formData, humedad: parseFloat(e.target.value) || 0})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">TMS_SECAS (Ton. Métrica Seca)</label>
                <input 
                  disabled 
                  type="number" 
                  value={formData.tms} 
                  className="w-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 font-bold text-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Guía de Remisión</label>
                <input 
                  type="text" 
                  value={formData.observaciones} 
                  onChange={e => setFormData({...formData, observaciones: e.target.value})} 
                  placeholder="e.g. T010-0002" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-semibold text-slate-800 dark:text-white"
                />
              </div>

            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
              <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all">Registrar Viaje</button>
            </div>
          </form>
        </div>
      ) : (
        /* Main Spreadsheet Table Component Replica matching attached image */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Cargando datos de pesaje...</div>
          ) : reportes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">No hay registros de viajes para los filtros seleccionados.</p>
              <p className="text-sm">Haga clic en Nuevo Registro de Viaje para añadir uno.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">DESCRUTA</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">FECHASALID</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">REG_PESAJE</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">VEHICULO</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">RUTA</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">w</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800">OBSERVACI</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800 text-right">'PESOENTRA</th>
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800 text-right">'PESOSALID</th>
                    
                    {/* Highlighted PESONETO Header matching attached image yellow column */}
                    <th className="p-3 border-r border-slate-200 dark:border-slate-800 text-right bg-yellow-300 text-slate-900 dark:bg-yellow-400 font-black">
                      'PESONETO
                    </th>
                    
                    <th className="p-3 text-right">'TMS_SECAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
                  {reportes.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50">
                        {r.descRuta || r.ruta || 'MTIC - C. 6'}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 whitespace-nowrap">
                        {new Date(r.fecha).toLocaleDateString()}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 font-mono">
                        {r.regPesaje || (10699000 + r.id)}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 font-bold uppercase">
                        {r.placa}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 font-mono">
                        {r.ruta || '3000120'}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50">
                        {r.centroOrigen || r.empresaContratista || 'PUCARA'}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 font-mono">
                        {r.observaciones || 'T010-0002'}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 text-right font-mono">
                        {Number(r.pesoBruto).toFixed(2)}
                      </td>
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 text-right font-mono">
                        {Number(r.tara).toFixed(2)}
                      </td>
                      
                      {/* Highlighted PESONETO Cell in bright yellow strictly as shown in image */}
                      <td className="p-3 border-r border-slate-100 dark:border-slate-800/50 text-right font-mono font-black bg-yellow-300 text-slate-900 dark:bg-yellow-400">
                        {Number(r.pesoNeto).toFixed(2)}
                      </td>
                      
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {Number(r.tms).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-950 font-black text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-800 text-xs">
                  <tr>
                    <td colSpan={7} className="p-3 text-right uppercase tracking-wider">TOTALES GENERALES:</td>
                    <td className="p-3 text-right font-mono">
                      {reportes.reduce((sum, r) => sum + Number(r.pesoBruto || 0), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {reportes.reduce((sum, r) => sum + Number(r.tara || 0), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono bg-yellow-300 text-slate-900 dark:bg-yellow-400">
                      {reportes.reduce((sum, r) => sum + Number(r.pesoNeto || 0), 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {reportes.reduce((sum, r) => sum + Number(r.tms || 0), 0).toFixed(4)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

