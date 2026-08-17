'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchJobDescription, updateJobDescription } from '../services/api';
import { X, Sliders, Key, Save, Check, FileText, Sparkles, Layers, Image as ImageIcon, RotateCcw, Link } from 'lucide-react';

interface JobConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (geminiKey: string, provider: string, advanceThreshold: number, maybeThreshold: number) => void;
  onJobDescriptionUpdated: (activeTitle: string, activeImage?: string) => void;
  currentProvider: string;
}

export const JobConfigModal: React.FC<JobConfigModalProps> = ({
  isOpen,
  onClose,
  onSaveConfig,
  onJobDescriptionUpdated,
  currentProvider
}) => {
  const [activeTab, setActiveTab] = useState<'jd' | 'config'>('jd');
  const [jdContent, setJdContent] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('fullstack');
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [geminiKey, setGeminiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [advanceThreshold, setAdvanceThreshold] = useState(7.0);
  const [maybeThreshold, setMaybeThreshold] = useState(5.0);
  const [isApplying, setIsApplying] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchJobDescription().then(data => {
        if (data.content) setJdContent(data.content);
        if (data.active_title) setCustomTitle(data.active_title);
        if (data.active_image) setImageUrl(data.active_image);
        if (data.presets) setPresets(data.presets);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    if (presets[key]) {
      setJdContent(presets[key].content);
      setCustomTitle(presets[key].title);
      if (presets[key].image_url) {
        setImageUrl(presets[key].image_url);
      }
    }
  };

  const handleUnselectPreset = () => {
    setSelectedPreset('custom');
    setCustomTitle('Custom Project Role');
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
    }
  };

  const handleApplyAll = async () => {
    setIsApplying(true);
    try {
      // 1. Update JD & re-evaluate candidates against selected/custom JD
      const jdResult = await updateJobDescription(
        jdContent, 
        selectedPreset === 'custom' ? undefined : selectedPreset, 
        customTitle,
        imageUrl
      );
      
      // 2. Save threshold settings
      await onSaveConfig(geminiKey, provider, advanceThreshold, maybeThreshold);
      
      setIsApplying(false);
      setSavedSuccess(true);
      
      onJobDescriptionUpdated(jdResult.active_title || customTitle || 'Target Role JD', jdResult.active_image || imageUrl);

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Project Job Requirements & Tech Streams</h2>
              <p className="text-xs text-slate-400">Configure target project JD & score thresholds to re-evaluate candidates dynamically</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('jd')}
            className={`flex-1 rounded-lg py-2 font-semibold transition ${
              activeTab === 'jd' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Target Tech Stream & Job Description (JD)
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 rounded-lg py-2 font-semibold transition ${
              activeTab === 'config' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ AI Model & Score Thresholds
          </button>
        </div>

        {activeTab === 'jd' ? (
          <div className="space-y-4 text-xs">
            
            {/* Preset Role Selector Buttons */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-slate-300">1-Click Select Target Tech Stream / Project Role</label>
                <button
                  type="button"
                  onClick={handleUnselectPreset}
                  className="flex items-center space-x-1 text-[10px] text-amber-400 hover:text-amber-300 transition font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Unselect Preset (Enter Custom Role)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                
                <button
                  type="button"
                  onClick={() => handleSelectPreset('fullstack')}
                  className={`rounded-xl p-3 text-left border transition ${
                    selectedPreset === 'fullstack'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-primary'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white">Full Stack AI</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Python, React, LangChain</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('data_engineer')}
                  className={`rounded-xl p-3 text-left border transition ${
                    selectedPreset === 'data_engineer'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-primary'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white">Data & AI (Snowflake)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Snowflake, SQL, Python</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('devops')}
                  className={`rounded-xl p-3 text-left border transition ${
                    selectedPreset === 'devops'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-primary'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white">DevOps & Cloud</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">K8s, Docker, Terraform</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('frontend')}
                  className={`rounded-xl p-3 text-left border transition ${
                    selectedPreset === 'frontend'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-primary'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white">Frontend Lead</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">React, Next.js, Tailwind</div>
                </button>

              </div>
            </div>

            {/* Custom Target Role Title Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Target Role Title / Project Name</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Snowflake Data Warehouse Architect"
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-white placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Image Insertion for JD */}
            <div className="space-y-2 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center">
                  <ImageIcon className="mr-1.5 h-4 w-4 text-indigo-400" /> Attach Project Architecture / JD Poster Image
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Optional</span>
              </label>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Paste Image URL (e.g. https://images.unsplash.com/...)"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-white placeholder-slate-500 border border-slate-800 text-xs focus:border-indigo-500 focus:outline-none"
                />

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300 font-medium border border-slate-700 hover:bg-slate-700"
                >
                  Upload Image
                </button>
              </div>

              {imageUrl && (
                <div className="mt-2 rounded-xl border border-slate-800 overflow-hidden max-h-36 relative">
                  <img src={imageUrl} alt="JD Diagram Preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 rounded-lg bg-black/70 p-1 text-white hover:bg-rose-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Custom JD Editor */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-300">Active Job Description Markdown (Editable)</label>
                <span className="text-[10px] text-indigo-400 font-medium">All candidates will be re-evaluated against this JD</span>
              </div>
              <textarea
                rows={7}
                value={jdContent}
                onChange={e => {
                  setJdContent(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full rounded-xl bg-slate-900 p-3.5 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono text-[11px] leading-relaxed"
              />
            </div>

          </div>
        ) : (
          <div className="space-y-4 text-xs">
            
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center">
                <Key className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="Paste your GEMINI_API_KEY..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-white placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">Overrides local `.env`. Keys are kept in session memory.</p>
            </div>

            {/* Provider selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Select Active LLM Model Provider</label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-white border border-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="gemini">Google Gemini API (gemini-1.5-flash)</option>
                <option value="openai">OpenAI GPT-4o-mini</option>
                <option value="ollama">Local Ollama (llama3.2)</option>
                <option value="auto">Auto-Detect Best Available</option>
              </select>
            </div>

            {/* Threshold sliders */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <label className="font-semibold text-slate-300">ADVANCE Score Threshold (technical interview)</label>
                <span className="font-bold text-emerald-400">{advanceThreshold.toFixed(1)} / 10</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="9.0"
                step="0.5"
                value={advanceThreshold}
                onChange={e => setAdvanceThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="font-semibold text-slate-300">MAYBE Score Threshold (phone screening)</label>
                <span className="font-bold text-amber-400">{maybeThreshold.toFixed(1)} / 10</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.5"
                step="0.5"
                value={maybeThreshold}
                onChange={e => setMaybeThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyAll}
            disabled={isApplying}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-glow-primary hover:opacity-95 transition disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-indigo-200" />
                <span>Re-Evaluating Candidates Against New JD...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Re-Evaluation Complete!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Apply JD & Re-Evaluate Candidates</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
