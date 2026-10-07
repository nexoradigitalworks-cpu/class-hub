import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { materialsAdapter, timetableAdapter } from '../services/adapters';
import { X, BookOpen, Upload, FileText, Image } from 'lucide-react';
import { FormSelect } from './ui/FormSelect';
import { FILE_FORMAT_OPTIONS, formatSubjectToOption } from '../utils/dropdownPresets';
import { SubjectItem } from '../types';
import { SelectOption } from './ui/CustomSelect';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateMaterialModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subject, setSubject] = useState('Matematica');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'PNG' | 'DOC' | 'SLIDES' | 'LINK'>('PDF');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [localFileSize, setLocalFileSize] = useState<string | null>(null);
  const [localFileData, setLocalFileData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      timetableAdapter.getSubjects(profile?.classId || '').then((classSubs) => {
        setSubjects(classSubs);
        if (classSubs.length > 0 && !classSubs.some(s => s.name === subject)) {
          setSubject(classSubs[0].name);
        }
      });
    }
  }, [isOpen, profile?.classId]);

  if (!isOpen || !profile) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    const detectedType = isPdf ? 'PDF' : isImage ? 'PNG' : 'DOC';
    setFileType(detectedType as any);
    setLocalFileName(file.name);

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    setLocalFileSize(sizeStr);

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setTitle(cleanName);
    }

    // Keep base64 only as local fallback
    const reader = new FileReader();
    reader.onload = () => {
      setLocalFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setLocalFileName(null);
    setLocalFileSize(null);
    setLocalFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setIsUploading(true);
      await materialsAdapter.uploadAndAddMaterial(
        {
          subject,
          title,
          description,
          url: url || undefined,
          fileData: localFileData || undefined,
          fileName: localFileName || undefined,
          fileSize: localFileSize || undefined,
          fileType,
          date: new Date().toISOString().split('T')[0],
          authorName: `${profile.firstName} ${profile.lastName}`,
          classId: profile.classId || undefined
        },
        selectedFile,
        profile.uid
      );

      setTitle('');
      setDescription('');
      setUrl('');
      handleClearFile();
      onCreated?.();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Errore nel salvataggio del materiale.');
    } finally {
      setIsUploading(false);
    }
  };

  const subjectOptions: SelectOption[] = subjects.map(formatSubjectToOption);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-600" />
              <span>Carica Dispensa o Materiale</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supporta caricamento locale di file PDF e immagini PNG/JPG o link online.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              File dal Dispositivo (PDF o Immagine PNG/JPG)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />

            {!localFileName ? (
              <label
                htmlFor="file-upload-input"
                className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-200 hover:border-cyan-400 rounded-2xl p-5 bg-cyan-50/30 hover:bg-cyan-50/60 cursor-pointer transition text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-cyan-900">
                  Clicca per selezionare un file locale
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  PDF, PNG, JPG fino a 10MB
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                    {fileType === 'PDF' ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[230px]">
                      {localFileName}
                    </p>
                    <p className="text-[11px] text-cyan-700 font-medium">
                      {fileType} · {localFileSize} {isUploading && '(Caricamento su Cloud...)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition cursor-pointer"
                  title="Rimuovi file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Grid: Materia & Formato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <FormSelect
                label="Materia"
                value={subject}
                onChange={(val) => setSubject(val)}
                options={subjectOptions}
                required
              />
            </div>

            <div>
              <FormSelect
                label="Formato / Tipo"
                value={fileType}
                onChange={(val) => setFileType(val as any)}
                options={FILE_FORMAT_OPTIONS}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Titolo del Materiale <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-2xs"
              placeholder="Es. Formulario Completo Limiti e Continuità"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Link Drive o Web alternativo (opzionale)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-2xs"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Descrizione o Argomenti trattati</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-2xs"
              placeholder="Spiegazione dei contenuti, pagine o formule..."
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? 'Caricamento...' : 'Pubblica Dispensa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
