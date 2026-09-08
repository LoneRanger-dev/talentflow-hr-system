'use client';

import React, { useEffect, useState } from 'react';
import { CandidateEvaluation, InterviewQuestionPack } from '../types';
import { X, CheckCircle, AlertTriangle, Target, Brain, Mail, Trash2, Cpu, RefreshCw, BookOpen } from 'lucide-react';

interface CandidateDrawerProps {
  candidate: CandidateEvaluation | null;
  activeJdTitle?: string;
  activeJdImage?: string;
  onClose: () => void;
  onOpenEmail: (candidate: CandidateEvaluation) => void;
  onDeleteCandidate: (candidate: CandidateEvaluation) => void;
  onGenerateInterviewQuestions: (candidateId: string) => Promise<InterviewQuestionPack>;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate,
  activeJdTitle,
  activeJdImage,
  onClose,
  onOpenEmail,
  onDeleteCandidate,
  onGenerateInterviewQuestions
}) => {
  const [questionPack, setQuestionPack] = useState<InterviewQuestionPack | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');

  useEffect(() => {
    setQuestionPack(null);
    setQuestionsError('');
  }, [candidate?.candidate_id]);

  if (!candidate) return null;

  const { detailed_scores } = candidate;

  const refreshQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError('');
    try {
      setQuestionPack(await onGenerateInterviewQuestions(candidate.candidate_id));
    } catch (error) {
      setQuestionsError(error instanceof Error ? error.message : 'Unable to generate interview questions');
    } finally {
      setQuestionsLoading(false);
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
                <span className="font-semibold text-white">{detailed_scores.technical_skills} / 3.0</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.technical_skills / 3.0) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Experience Level & Relevance</span>
                <span className="font-semibold text-white">{detailed_scores.experience} / 3.0</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.experience / 3.0) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            {/* Education */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Education & Qualifications</span>
                <span className="font-semibold text-white">{detailed_scores.education} / 2.0</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.education / 2.0) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
            </div>

            {/* Fit */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Overall Fit & Potential</span>
                <span className="font-semibold text-white">{detailed_scores.overall_fit} / 2.0</span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                <div style={{ width: `${(detailed_scores.overall_fit / 2.0) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
              </div>
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

          {/* JD-grounded interview preparation */}
          <div className="rounded-2xl bg-cyan-950/20 p-5 border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-cyan-300 flex items-center text-xs">
                  <BookOpen className="mr-1.5 h-4 w-4 text-cyan-400" /> Interview Preparation Pack
                </h3>
                <p className="mt-1 text-[10px] text-slate-400">Ten questions researched from this JD and candidate resume, with answer guides.</p>
              </div>
              <button
                onClick={refreshQuestions}
                disabled={questionsLoading}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-cyan-600/20 px-3 py-2 text-[10px] font-semibold text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/30 disabled:opacity-50"
                title="Generate a new set of ten questions"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${questionsLoading ? 'animate-spin' : ''}`} />
                {questionPack ? 'Refresh 10' : 'Generate 10'}
              </button>
            </div>

            {questionsError && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[10px] text-rose-300">{questionsError}</p>}
            {questionsLoading && <p className="text-[10px] text-cyan-200">Analyzing the job requirements and candidate evidence...</p>}
            {questionPack && !questionsLoading && (
              <div className="space-y-3">
                {questionPack.questions.map(question => (
                  <article key={`${questionPack.generation_seed}-${question.question_number}`} className="rounded-xl bg-slate-950/70 p-3.5 border border-cyan-500/10">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold leading-relaxed text-slate-100">{question.question_number}. {question.question}</p>
                      <span className="shrink-0 rounded-md bg-cyan-500/10 px-2 py-1 text-[9px] font-semibold text-cyan-300">{question.category}</span>
                    </div>
                    <div className="mt-2 border-l-2 border-emerald-500/50 pl-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Answer guide</p>
                      <p className="mt-1 leading-relaxed text-slate-300">{question.answer}</p>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-slate-500"><span className="font-semibold text-slate-400">Evaluate:</span> {question.evaluation_focus}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
