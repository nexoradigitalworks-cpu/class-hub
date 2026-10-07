import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, ExternalLink, FileText, 
  Trash2, Filter, Download, Image as ImageIcon,
  Search, Eye, X, HardDrive, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { materialsAdapter } from '../services/adapters';
import { MaterialItem } from '../types';
import { CreateMaterialModal } from '../components/CreateMaterialModal';
import { getSubjectStyle } from '../utils/theme';
import { FormSelect } from '../components/ui/FormSelect';
import { SelectOption } from '../components/ui/CustomSelect';
import { SUBJECT_OPTIONS } from '../utils/dropdownPresets';

export const MaterialsPage: React.FC = () => {
  const { profile, isController, isAdmin } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File preview modal state
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    if (!profile) return;
    try {
      const list = await materialsAdapter.getMaterials(profile.classId || '');
      setMaterials(list);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!isController && !isAdmin) return;
    if (confirm('Rimuovere questo materiale?')) {
      try {
        await materialsAdapter.deleteMaterial(id, profile?.classId || undefined);
        showToast('Materiale eliminato');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Errore durante l\'eliminazione');
      }
    }
  };

  const subjects = Array.from(new Set(materials.map(m => m.subject)));
  
  const subjectFilterOptions: SelectOption[] = [
    { value: 'ALL', label: `Tutte le materie (${materials.length})`, icon: <Filter className="w-3.5 h-3.5 text-slate-400" /> },
    ...subjects.map(s => {
      const preset = SUBJECT_OPTIONS.find(p => p.value === s);
      const count = materials.filter(m => m.subject === s).length;
      return {
        value: s,
        label: `${s} (${count})`,
        icon: preset?.icon,
        colorDot: preset?.colorDot,
        description: preset?.description
      };
    })
  ];
  
  const filtered = materials.filter(m => {
    const matchesSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
    const matchesSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.fileName && m.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const handleDownload = (material: MaterialItem) => {
    if (material.fileData) {
      const a = document.createElement('a');
      a.href = material.fileData;
      a.download = material.fileName || `${material.title}.${material.fileType.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Download avviato!');
    } else if (material.url) {
      window.open(material.url, '_blank');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 font-medium"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              Materiali & Dispense
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
              {materials.length} documenti
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Archivio file della classe con supporto upload locale di PDF, immagini PNG e dispense didattiche.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Carica File (PDF/PNG)</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="w-full">
            <FormSelect
              label="Filtra per Materia"
              value={selectedSubject}
              onChange={setSelectedSubject}
              options={subjectFilterOptions}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">
              Cerca nel Testo o File
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per titolo, argomento o nome file..."
                className="w-full h-11 pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const style = getSubjectStyle(item.subject);
          const hasLocalFile = Boolean(item.fileData);
          const isPdf = item.fileType === 'PDF';
          const isImage = item.fileType === 'PNG';

          return (
            <motion.div
              layout
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                    {item.subject}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider ${
                      isPdf 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : isImage 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isPdf && <FileText className="w-3 h-3" />}
                      {isImage && <ImageIcon className="w-3 h-3" />}
                      <span>{item.fileType}</span>
                    </span>

                    {(isController || isAdmin) && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Local file details if present */}
                {item.fileName && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-50/50 border border-cyan-100 text-xs text-cyan-900">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="truncate font-semibold">{item.fileName}</span>
                    {item.fileSize && (
                      <span className="text-[10px] text-cyan-600 font-normal ml-auto shrink-0">
                        {item.fileSize}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {item.date} {item.authorName && `· ${item.authorName}`}
                </span>

                <div className="flex items-center gap-1.5">
                  {hasLocalFile && (
                    <button
                      onClick={() => setPreviewMaterial(item)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                      title="Anteprima file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizza</span>
                    </button>
                  )}

                  {(hasLocalFile || item.url) && (
                    <button
                      onClick={() => handleDownload(item)}
                      className="flex items-center gap-1 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 transition"
                      title="Scarica o apri"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{hasLocalFile ? 'Scarica' : 'Apri Link'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Modal for PDF / Image */}
      <AnimatePresence>
        {previewMaterial && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    {previewMaterial.fileType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {previewMaterial.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(previewMaterial)}
                    className="flex items-center gap-1 text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 px-3 py-1.5 rounded-xl transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Scarica</span>
                  </button>
                  <button
                    onClick={() => setPreviewMaterial(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Render Image or PDF viewer */}
              <div className="flex-1 bg-slate-100 overflow-auto p-4 flex items-center justify-center">
                {previewMaterial.fileType === 'PNG' && previewMaterial.fileData ? (
                  <img
                    src={previewMaterial.fileData}
                    alt={previewMaterial.title}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-md bg-white"
                  />
                ) : previewMaterial.fileType === 'PDF' && previewMaterial.fileData ? (
                  <iframe
                    src={previewMaterial.fileData}
                    title={previewMaterial.title}
                    className="w-full h-full rounded-xl border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="text-center p-6 bg-white rounded-2xl shadow-sm">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">{previewMaterial.title}</p>
                    <p className="text-xs text-slate-400 mt-1">Anteprima non disponibile inline per questo formato.</p>
                    <button
                      onClick={() => handleDownload(previewMaterial)}
                      className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 transition"
                    >
                      Scarica o Apri File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => showToast('Nuova dispensa caricata!')}
      />
    </div>
  );
};
