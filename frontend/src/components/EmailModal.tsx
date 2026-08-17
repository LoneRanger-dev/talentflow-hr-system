'use client';

import React, { useState, useEffect } from 'react';
import { CandidateEvaluation, CandidateEmail } from '../types';
import { generateCandidateEmail } from '../services/api';
import { X, Mail, Copy, Check, Sparkles, Send } from 'lucide-react';

interface EmailModalProps {
  candidate: CandidateEvaluation | null;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ candidate, onClose }) => {
  const [emailData, setEmailData] = useState<CandidateEmail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (candidate) {
      setIsLoading(true);
      generateCandidateEmail(candidate.candidate_id)
        .then(data => {
          setEmailData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [candidate]);

  if (!candidate) return null;

  const handleCopy = () => {
    if (emailData) {
      const fullText = `Subject: ${emailData.subject}\n\n${emailData.body}`;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendSimulation = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Tailored Communication Outreach</h2>
              <p className="text-xs text-slate-400">Target: {candidate.candidate_name} ({candidate.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Sparkles className="h-8 w-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Communication Agent generating tailored email...</p>
          </div>
        ) : emailData ? (
          <div className="space-y-4 text-xs">
            
            {/* Subject line */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Subject Line</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-white font-semibold border border-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Email Body</label>
              <textarea
                rows={10}
                value={emailData.body}
                onChange={e => setEmailData({ ...emailData, body: e.target.value })}
                className="w-full rounded-xl bg-slate-900 p-4 text-slate-200 border border-slate-800 focus:border-indigo-500 focus:outline-none font-sans leading-relaxed text-xs"
              />
            </div>

          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleCopy}
            disabled={!emailData}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-indigo-400" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Email'}</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>

            <button
              onClick={handleSendSimulation}
              disabled={!emailData || isSent}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-glow-primary hover:opacity-95 transition"
            >
              {isSent ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Email Sent!</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Communication</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
