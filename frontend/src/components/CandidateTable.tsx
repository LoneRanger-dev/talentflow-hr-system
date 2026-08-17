'use client';

import React, { useState } from 'react';
import { CandidateEvaluation, DecisionType } from '../types';
import { Search, Filter, ArrowUpDown, ChevronRight, Mail, Sparkles, Trash2, Target, Sparkle } from 'lucide-react';

interface CandidateTableProps {
  candidates: CandidateEvaluation[];
  activeJdTitle: string;
  onSelectCandidate: (candidate: CandidateEvaluation) => void;
  onOpenEmail: (candidate: CandidateEvaluation) => void;
  onDeleteCandidate: (candidate: CandidateEvaluation) => void;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  activeJdTitle,
  onSelectCandidate,
  onOpenEmail,
  onDeleteCandidate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | DecisionType>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'score-desc' | 'score-asc'>('newest');

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesFilter = activeFilter === 'ALL' || c.decision === activeFilter;
    const matchesSearch = 
      c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.current_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.key_skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Sort candidates (Newest first by default)
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortOrder === 'newest') {
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      return b.total_score - a.total_score;
    }
    if (sortOrder === 'score-desc') return b.total_score - a.total_score;
    return a.total_score - b.total_score;
  });

  const getDecisionBadge = (decision: DecisionType) => {
    switch (decision) {
      case 'ADVANCE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-glow-emerald">
            ADVANCE
          </span>
        );
      case 'MAYBE':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20 shadow-glow-amber">
            MAYBE
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20 shadow-glow-rose">
            REJECT
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7.0) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 5.0) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      
      {/* Target JD Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-indigo-950/30 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="text-slate-400 font-medium">Evaluated Against Role:</span>
          <span className="text-white font-bold">{activeJdTitle || 'Senior Full Stack Engineer'}</span>
        </div>
        <span className="text-[11px] text-indigo-300 font-medium">
          {candidates.length} Candidate Profiles Evaluated • Multi-Agent Pipeline Active
        </span>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-b border-slate-800/80 bg-slate-900/40">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, skill, title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 border border-slate-800 focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
          {(['ALL', 'ADVANCE', 'MAYBE', 'REJECT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`rounded-lg px-3 py-1.5 font-medium transition duration-150 ${
                activeFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as any)}
            className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-300 border border-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value="newest">Sort: Newly Uploaded First</option>
            <option value="score-desc">Sort: Highest Score</option>
            <option value="score-asc">Sort: Lowest Score</option>
          </select>
        </div>

      </div>

      {/* Candidate Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 uppercase text-[10px] font-bold tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Candidate Name & Title</th>
              <th className="px-6 py-3.5">Key Technical Skills</th>
              <th className="px-6 py-3.5 text-center">Score (0-10)</th>
              <th className="px-6 py-3.5 text-center">Decision</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedCandidates.map(candidate => (
              <tr 
                key={candidate.candidate_id}
                className={`hover:bg-slate-800/40 transition duration-150 group ${
                  candidate.is_new ? 'bg-indigo-950/20' : ''
                }`}
              >
                {/* Candidate Name & Title */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-glow-primary text-xs shrink-0">
                      {candidate.candidate_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white group-hover:text-indigo-300 transition">
                          {candidate.candidate_name}
                        </span>
                        {candidate.is_new && (
                          <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/40 shadow-glow-primary">
                            <Sparkle className="mr-0.5 h-2.5 w-2.5" /> NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{candidate.current_title}</div>
                    </div>
                  </div>
                </td>

                {/* Key Skills Tags */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {candidate.key_skills.slice(0, 4).map((skill, idx) => (
                      <span 
                        key={idx}
                        className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.key_skills.length > 4 && (
                      <span className="text-[10px] text-slate-500 self-center">+{candidate.key_skills.length - 4}</span>
                    )}
                  </div>
                </td>

                {/* Total Score */}
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-extrabold border ${getScoreColor(candidate.total_score)}`}>
                    {candidate.total_score.toFixed(1)} / 10
                  </span>
                </td>

                {/* Decision Badge */}
                <td className="px-6 py-4 text-center">
                  {getDecisionBadge(candidate.decision)}
                </td>

                {/* Action Buttons */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => onOpenEmail(candidate)}
                      className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Generate AI Outreach Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteCandidate(candidate)}
                      className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-rose-900/50 hover:text-rose-300 transition"
                      title="Delete Candidate Resume Details"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onSelectCandidate(candidate)}
                      className="flex items-center space-x-1 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition duration-150"
                    >
                      <span>AI Analysis</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {sortedCandidates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No candidates match your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
