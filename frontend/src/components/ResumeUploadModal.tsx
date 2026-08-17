'use client';

import React, { useState, useRef } from 'react';
import { uploadResumeFile, uploadResumeText, uploadBatchResumeFiles } from '../services/api';
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, File, Trash2, FolderPlus, Layers } from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newCandidate: any) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'text'>('batch');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [candidateName, setCandidateName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [batchProgress, setBatchProgress] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setErrorMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...droppedFiles]);
      setErrorMessage('');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const handleProcessUpload = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsProcessing(true);

    try {
      if (activeTab === 'batch') {
        if (selectedFiles.length === 0) {
          setErrorMessage('Please select one or more resume files (PDF, Word DOCX, TXT, CSV).');
          setIsProcessing(false);
          return;
        }

        if (selectedFiles.length === 1) {
          setBatchProgress(`Processing candidate resume ${selectedFiles[0].name}...`);
          const res = await uploadResumeFile(selectedFiles[0], candidateName);
          setSuccessMessage(res.message || `Successfully evaluated candidate profile.`);
          onUploadSuccess(res.candidate);
        } else {
          setBatchProgress(`Batch processing ${selectedFiles.length} resumes simultaneously...`);
          const res = await uploadBatchResumeFiles(selectedFiles);
          setSuccessMessage(`Successfully batch evaluated ${res.processed_count} candidate resumes!`);
          onUploadSuccess(res.new_candidates);
        }

      } else {
        if (!resumeText.trim()) {
          setErrorMessage('Please paste the candidate resume text.');
          setIsProcessing(false);
          return;
        }
        setBatchProgress('Processing candidate resume text...');
        const res = await uploadResumeText(resumeText, candidateName);
        setSuccessMessage(res.message || `Successfully evaluated candidate profile.`);
        onUploadSuccess(res.candidate);
      }

      setIsProcessing(false);
      setTimeout(() => {
        setSelectedFiles([]);
        setResumeText('');
        setCandidateName('');
        setSuccessMessage('');
        onClose();
      }, 1200);

    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to process candidate resume.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch & Single Resume Upload</h2>
              <p className="text-xs text-slate-400">Select multiple PDF, Word (.docx), TXT, CSV, or Markdown files at once</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg py-2 font-semibold transition ${
              activeTab === 'batch' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderPlus className="h-4 w-4" />
            <span>Batch Multi-File Upload ({selectedFiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg py-2 font-semibold transition ${
              activeTab === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Paste Resume Text</span>
          </button>
        </div>

        {/* Optional Candidate Name (for single upload) */}
        {selectedFiles.length <= 1 && (
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-300">Candidate Full Name (Optional Override)</label>
            <input
              type="text"
              placeholder="e.g. Pachila Meenakshi"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-white placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {activeTab === 'batch' ? (
          <div className="space-y-4">
            
            {/* Multi-File Dropzone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-6 text-center hover:border-indigo-500 hover:bg-slate-900/80 transition duration-150"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={true}
                accept=".pdf,.docx,.doc,.txt,.csv,.md"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition duration-150">
                <FolderPlus className="h-6 w-6" />
              </div>

              <div className="mt-3 text-xs font-semibold text-slate-200">
                Click or Drag & Drop Multiple Resumes Here
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Select 5, 10, 20+ files at once (PDF, Word .docx, TXT, CSV, Markdown)
              </p>
            </div>

            {/* Selected Files Queue list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800">
                  <span className="flex items-center space-x-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Batch Queue: {selectedFiles.length} Resumes Ready for AI Evaluation</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-normal"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-xs border border-slate-800">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <File className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-200 truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-300">Paste Resume Text or Markdown</label>
            <textarea
              rows={8}
              placeholder="Paste candidate resume content here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              className="w-full rounded-xl bg-slate-900 p-3.5 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono text-xs leading-relaxed"
            />
          </div>
        )}

        {/* Banners */}
        {errorMessage && (
          <div className="flex items-center space-x-2 rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleProcessUpload}
            disabled={isProcessing}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-primary hover:opacity-95 transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-indigo-200" />
                <span>{batchProgress || 'Evaluating Batch Resumes...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  {activeTab === 'batch' && selectedFiles.length > 1
                    ? `Process & Evaluate ${selectedFiles.length} Resumes (Batch)`
                    : 'Process & Evaluate Resume'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
