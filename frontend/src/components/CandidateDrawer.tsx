'use client';

import React, { useEffect, useState } from 'react';
import { CandidateEvaluation, InterviewChatMessage, InterviewChatResponse } from '../types';
import { X, CheckCircle, AlertTriangle, Target, Brain, Mail, Trash2, Cpu, Send, BookOpen } from 'lucide-react';

interface CandidateDrawerProps {
  candidate: CandidateEvaluation | null;
  activeJdTitle?: string;
  activeJdImage?: string;
  onClose: () => void;
  onOpenEmail: (candidate: CandidateEvaluation) => void;
  onDeleteCandidate: (candidate: CandidateEvaluation) => void;
  onInterviewChat: (candidateId: string, messages: InterviewChatMessage[]) => Promise<InterviewChatResponse>;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate,
  activeJdTitle,
  activeJdImage,
  onClose,
  onOpenEmail,
  onDeleteCandidate,
  onInterviewChat
}) => {
  const [chatMessages, setChatMessages] = useState<InterviewChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
    setChatError('');
  }, [candidate?.candidate_id]);

  if (!candidate) return null;

  const { detailed_scores, score_explanations } = candidate;

  const sendChat = async () => {
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const nextMessages: InterviewChatMessage[] = [...chatMessages, { role: 'user', content }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError('');
    try {
      const response = await onInterviewChat(candidate.candidate_id, nextMessages);
      setChatMessages([...nextMessages, {
        role: 'assistant',
        content: JSON.stringify(response)
      }]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to reach interview assistant');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-slate-950 border-l border-slate-800 shadow-2xl overflow-y-auto">
        
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-glow-primary">
              {candidate.candidate_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{candidate.candidate_name}</h2>
              <p className="text-xs text-slate-400">{candidate.current_title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDeleteCandidate(candidate)}
              className="rounded-lg bg-rose-950/40 p-2 text-rose-300 border border-rose-500/30 hover:bg-rose-900 transition"
              title="Delete Candidate Resume Details"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onOpenEmail(candidate)}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-primary hover:bg-indigo-500 transition"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Draft Outreach Email</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 text-xs text-slate-300">

          {/* Multi-Agent Coordination Pipeline Badge */}
          <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span className="text-slate-400 font-medium">Evaluated against role:</span>
              <span className="text-white font-bold">{activeJdTitle || 'Senior Full Stack Engineer'}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              3 Agents Coordinated
            </span>
          </div>

          {activeJdImage && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden relative max-h-44">
              <img src={activeJdImage} alt="Project JD Diagram" className="w-full h-44 object-cover" />
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-semibold text-white">
                Project Architecture Diagram
              </div>
            </div>
          )}

          {/* Decision Summary Card */}
          <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Autonomous Hiring Decision</span>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`text-xl font-extrabold ${
                    candidate.decision === 'ADVANCE' ? 'text-emerald-400' :
                    candidate.decision === 'MAYBE' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {candidate.decision}
                  </span>
                  <span className="text-slate-400">• Action: {candidate.next_action}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-white">{candidate.total_score.toFixed(1)} <span className="text-xs text-slate-400 font-normal">/ 10</span></div>
                <div className="text-[10px] text-indigo-400 font-medium">Score Rating</div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="rounded-xl bg-slate-950/80 p-3.5 border border-indigo-500/20">
              <div className="flex items-center space-x-1.5 font-semibold text-indigo-300 mb-1">
                <Brain className="h-4 w-4 text-indigo-400" />
                <span>Decision Engine Agent Reasoning</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{candidate.reasoning}</p>
            </div>
          </div>

          {/* Detailed Category Score Breakdown */}
          <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">Detailed Scoring Criteria</h3>

            {/* Tech Skills */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Technical Skills Match</span>
                <span className="font-semibold text-white">{detailed_scores.technical_skills} / 3.5</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.technical_skills / 3.5) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{score_explanations?.technical_skills}</p>
            </div>

            {/* Experience */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Experience Level & Relevance</span>
                <span className="font-semibold text-white">{detailed_scores.experience} / 2.5</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.experience / 2.5) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{score_explanations?.experience}</p>
            </div>

            {/* Education */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Education & Qualifications</span>
                <span className="font-semibold text-white">{detailed_scores.education} / 1.5</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.education / 1.5) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{score_explanations?.education}</p>
            </div>

            {/* Fit */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Overall Fit & Potential</span>
                <span className="font-semibold text-white">{detailed_scores.overall_fit} / 2.5</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.overall_fit / 2.5) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{score_explanations?.overall_fit}</p>
            </div>
          </div>

          {/* Key Strengths */}
          <div className="rounded-2xl bg-emerald-950/20 p-5 border border-emerald-500/20 space-y-2">
            <h3 className="font-bold text-emerald-400 flex items-center text-xs">
              <CheckCircle className="mr-1.5 h-4 w-4 text-emerald-400" /> Candidate Key Strengths
            </h3>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {candidate.strengths.map((str, idx) => (
                <li key={idx} className="leading-relaxed">{str}</li>
              ))}
            </ul>
          </div>

          {/* Key Concerns */}
          <div className="rounded-2xl bg-amber-950/20 p-5 border border-amber-500/20 space-y-2">
            <h3 className="font-bold text-amber-400 flex items-center text-xs">
              <AlertTriangle className="mr-1.5 h-4 w-4 text-amber-400" /> Evaluated Concerns & Risk Gaps
            </h3>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {candidate.concerns.map((con, idx) => (
                <li key={idx} className="leading-relaxed">{con}</li>
              ))}
            </ul>
          </div>

          {/* Recommended Interview Focus Areas */}
          <div className="rounded-2xl bg-violet-950/20 p-5 border border-violet-500/20 space-y-2">
            <h3 className="font-bold text-violet-300 flex items-center text-xs">
              <Target className="mr-1.5 h-4 w-4 text-violet-400" /> Recommended Interview Focus Topics
            </h3>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {candidate.interview_focus.map((foc, idx) => (
                <li key={idx} className="leading-relaxed">{foc}</li>
              ))}
            </ul>
          </div>

          {/* JD-grounded interview chat */}
          <div className="rounded-2xl bg-cyan-950/20 p-5 border border-cyan-500/20 space-y-4">
            <h3 className="font-bold text-cyan-300 flex items-center text-xs">
              <BookOpen className="mr-1.5 h-4 w-4 text-cyan-400" /> Interview Research Chat
            </h3>
            <p className="text-[10px] text-slate-400">Give one or two sample questions. The assistant will create relevant follow-ups from this JD and resume.</p>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {chatMessages.map((message, index) => {
                if (message.role === 'user') return <div key={index} className="ml-6 rounded-xl bg-cyan-500/10 p-3 text-[11px] text-cyan-100">{message.content}</div>;
                let response: InterviewChatResponse | null = null;
                try { response = JSON.parse(message.content) as InterviewChatResponse; } catch { response = null; }
                return <div key={index} className="mr-2 space-y-2 rounded-xl bg-slate-950/70 p-3 border border-cyan-500/10">
                  <p className="text-[11px] leading-relaxed text-slate-300">{response?.reply || message.content}</p>
                  {response?.next_question && <article className="rounded-lg border border-cyan-500/10 p-2.5">
                    <div className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
                      <span>{response.next_question.category}</span>
                      <span className="text-slate-500">{response.next_question.difficulty}</span>
                    </div>
                    <p className="font-semibold text-slate-100">{response.next_question.question}</p>
                    <p className="mt-1 text-[10px] text-slate-500">Validating: {response.next_question.competency}</p>
                  </article>}
                </div>;
              })}
            </div>
            {chatError && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[10px] text-rose-300">{chatError}</p>}
            <div className="flex gap-2">
              <textarea value={chatInput} onChange={event => setChatInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChat(); } }} rows={2} placeholder="e.g. Ask a deeper follow-up on the candidate's AWS project..." className="flex-1 rounded-lg bg-slate-950 p-2.5 text-[11px] text-slate-200 border border-slate-800 focus:border-cyan-500 focus:outline-none" />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="self-end rounded-lg bg-cyan-600 p-2.5 text-white hover:bg-cyan-500 disabled:opacity-50" title="Send sample question">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {chatLoading && <p className="text-[10px] text-cyan-200">Researching the JD and candidate evidence...</p>}
          </div>

        </div>

      </div>
    </div>
  );
};
