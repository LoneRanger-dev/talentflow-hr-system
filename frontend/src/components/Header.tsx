'use client';

import React from 'react';
import { Bot, Sparkles, Sliders, Upload, RefreshCw, ShieldCheck, Target, RotateCcw } from 'lucide-react';

interface HeaderProps {
  llmProvider: string;
  activeJdTitle: string;
  onOpenUpload: () => void;
  onOpenConfig: () => void;
  onRefresh: () => void;
  onResetAllData?: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  llmProvider,
  activeJdTitle,
  onOpenUpload,
  onOpenConfig,
  onRefresh,
  onResetAllData,
  isProcessing
}) => {
  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-800/80 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-glow-primary">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-outfit text-xl font-bold tracking-tight text-white">TalentFlow</h1>
              <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="mr-1 h-3 w-3" /> Autonomous Agent 2.1
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Resume Intelligence & Hiring Decision Engine</p>
          </div>
        </div>

        {/* System Status & Active JD Target */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800">
            <Target className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-400">Target Role:</span>
            <span className="text-white font-semibold line-clamp-1 max-w-[200px]">{activeJdTitle || 'Full Stack Engineer'}</span>
          </div>

          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Model:</span>
            <span className="text-indigo-300 font-semibold">{llmProvider}</span>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center space-x-2 border-slate-800">
          {onResetAllData && (
            <button
              onClick={() => {
                if (confirm('Reset system data to empty state? All current candidate resumes and metrics will be set to 0 so your manager can test fresh data ingestion.')) {
                  onResetAllData();
                }
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-300 border border-rose-500/30 hover:bg-rose-900/60 transition duration-200"
              title="Reset system data to 0 to test fresh resume ingestion"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Reset / Start Fresh</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isProcessing}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition duration-200 disabled:opacity-50"
            title="Re-run autonomous evaluation against active JD"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{isProcessing ? 'Evaluating...' : 'Re-Evaluate'}</span>
          </button>

          <button
            onClick={onOpenConfig}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition duration-200"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span>Job Requirements (JD)</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-glow-primary hover:opacity-95 transition duration-200"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Resume</span>
          </button>
        </div>

      </div>
    </header>
  );
};
