'use client';

import React from 'react';
import { SystemAnalytics } from '../types';
import { Users, Clock, DollarSign, Award, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

interface OverviewStatsProps {
  analytics: SystemAnalytics;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ analytics }) => {
  const { decision_breakdown, total_candidates, average_score, roi_analytics } = analytics;
  
  const advanceCount = decision_breakdown?.ADVANCE || 0;
  const maybeCount = decision_breakdown?.MAYBE || 0;
  const rejectCount = decision_breakdown?.REJECT || 0;

  const advancePct = total_candidates > 0 ? Math.round((advanceCount / total_candidates) * 100) : 0;
  const maybePct = total_candidates > 0 ? Math.round((maybeCount / total_candidates) * 100) : 0;
  const rejectPct = total_candidates > 0 ? Math.round((rejectCount / total_candidates) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Total Processed */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Candidates</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{total_candidates}</span>
              <span className="text-xs font-semibold text-indigo-400">100% Processed</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Avg Candidate Score: <span className="font-semibold text-slate-200">{average_score}/10</span></p>
          </div>
        </div>

        {/* Card 2: Time Savings */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Time Reduction</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{roi_analytics?.efficiency_gain_percentage || 93.6}%</span>
              <span className="text-xs font-semibold text-emerald-400">Faster Screening</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{roi_analytics?.hours_saved || 3.5} hrs manual work saved</p>
          </div>
        </div>

        {/* Card 3: Cost Saved */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Recruitment ROI</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">${roi_analytics?.cost_savings_usd || 280}</span>
              <span className="text-xs font-semibold text-amber-400">Est. Savings</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">${roi_analytics?.savings_per_hire || 35} saved per evaluation</p>
          </div>
        </div>

        {/* Card 4: Top Tier Ratio */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Advance Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white">{advancePct}%</span>
              <span className="text-xs font-semibold text-violet-400">{advanceCount} Ready for Interview</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Score &ge; 7.0/10 Threshold</p>
          </div>
        </div>

      </div>

      {/* Hiring Funnel Breakdown Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center">
            Autonomous Decision Funnel
          </h3>
          <span className="text-xs text-slate-400">System Thresholds: ADVANCE &ge; 7.0 | MAYBE &ge; 5.0</span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex">
          <div style={{ width: `${advancePct}%` }} className="bg-emerald-500 transition-all duration-500 shadow-glow-emerald" title={`ADVANCE: ${advanceCount}`} />
          <div style={{ width: `${maybePct}%` }} className="bg-amber-500 transition-all duration-500 shadow-glow-amber" title={`MAYBE: ${maybeCount}`} />
          <div style={{ width: `${rejectPct}%` }} className="bg-rose-500 transition-all duration-500 shadow-glow-rose" title={`REJECT: ${rejectCount}`} />
        </div>

        {/* Funnel Segment Legend */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="font-semibold text-white">ADVANCE ({advanceCount})</div>
              <div className="text-slate-400">{advancePct}% - Technical Interview</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <div>
              <div className="font-semibold text-white">MAYBE ({maybeCount})</div>
              <div className="text-slate-400">{maybePct}% - Phone Screen Required</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
            <XCircle className="h-4 w-4 text-rose-400" />
            <div>
              <div className="font-semibold text-white">REJECT ({rejectCount})</div>
              <div className="text-slate-400">{rejectPct}% - Send Email Notice</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
