'use client';

import React, { useState, useEffect } from 'react';
import { 
  CandidateEvaluation, 
  SystemAnalytics, 
  HealthResponse, 
  CandidateEmail 
} from '../types';
import { 
  fetchHealth, 
  fetchCandidates, 
  fetchAnalytics, 
  deleteCandidate,
  bulkDeleteCandidates,
  clearAllCandidates,
  generateCandidateEmail 
} from '../services/api';

import { Header } from '../components/Header';
import { OverviewStats } from '../components/OverviewStats';
import { CandidateTable } from '../components/CandidateTable';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { JobConfigModal } from '../components/JobConfigModal';
import { EmailModal } from '../components/EmailModal';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [candidates, setCandidates] = useState<CandidateEvaluation[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reEvaluating, setReEvaluating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals & Drawer State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluation | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isJobConfigOpen, setIsJobConfigOpen] = useState<boolean>(false);
  const [emailCandidate, setEmailCandidate] = useState<{ candidate: CandidateEvaluation; email: CandidateEmail } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hData, cData, aData] = await Promise.all([
        fetchHealth(),
        fetchCandidates(),
        fetchAnalytics()
      ]);
      setHealth(hData);
      setCandidates(cData.candidates);
      setAnalytics(aData);
    } catch (e) {
      console.error('Failed loading system data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReEvaluate = async () => {
    setReEvaluating(true);
    try {
      const cData = await fetchCandidates();
      const aData = await fetchAnalytics();
      setCandidates(cData.candidates);
      setAnalytics(aData);
      triggerNotification('success', `Re-evaluated candidates against current target role: "${cData.active_jd_title || health?.active_jd_title}"`);
    } catch (e) {
      triggerNotification('error', 'Failed re-evaluating candidates');
    } finally {
      setReEvaluating(false);
    }
  };

  const handleDeleteCandidate = async (candidate: CandidateEvaluation) => {
    if (confirm(`Delete '${candidate.candidate_name}' from current dataset?`)) {
      try {
        const res = await deleteCandidate(candidate.candidate_id);
        const [cData, aData] = await Promise.all([fetchCandidates(), fetchAnalytics()]);
        setCandidates(cData.candidates);
        setAnalytics(aData);
        if (selectedCandidate?.candidate_id === candidate.candidate_id) {
          setSelectedCandidate(null);
        }
        triggerNotification('success', `Deleted candidate '${candidate.candidate_name}'`);
      } catch (e) {
        triggerNotification('error', 'Failed deleting candidate');
      }
    }
  };

  const handleBulkDeleteCandidates = async (candidateIds: string[]) => {
    try {
      const res = await bulkDeleteCandidates(candidateIds);
      const [cData, aData] = await Promise.all([fetchCandidates(), fetchAnalytics()]);
      setCandidates(cData.candidates);
      setAnalytics(aData);
      setSelectedCandidate(null);
      triggerNotification('success', `Deleted ${candidateIds.length} candidate profiles`);
    } catch (e) {
      triggerNotification('error', 'Failed deleting selected candidates');
    }
  };

  const handleClearAllCandidates = async () => {
    try {
      const res = await clearAllCandidates();
      setCandidates([]);
      const aData = await fetchAnalytics();
      setAnalytics(aData);
      setSelectedCandidate(null);
      triggerNotification('success', 'Cleared all candidate resumes. You can now start inserting fresh resumes!');
    } catch (e) {
      triggerNotification('error', 'Failed clearing candidate dataset');
    }
  };

  const handleOpenEmail = async (candidate: CandidateEvaluation) => {
    try {
      const email = await generateCandidateEmail(candidate.candidate_id);
      setEmailCandidate({ candidate, email });
    } catch (e) {
      triggerNotification('error', 'Failed generating outreach email');
    }
  };

  const handleResumeUploaded = async (newCandidates?: CandidateEvaluation[]) => {
    const [cData, aData] = await Promise.all([
      fetchCandidates(),
      fetchAnalytics()
    ]);
    setCandidates(cData.candidates);
    setAnalytics(aData);
    
    if (newCandidates && newCandidates.length > 0) {
      triggerNotification('success', `Successfully batch processed and evaluated ${newCandidates.length} resume(s)!`);
      setSelectedCandidate(newCandidates[0]);
    } else {
      triggerNotification('success', 'Resume processed and evaluated against active JD');
    }
  };

  const handleJobDescUpdated = async (activeTitle?: string) => {
    const [hData, cData, aData] = await Promise.all([
      fetchHealth(),
      fetchCandidates(),
      fetchAnalytics()
    ]);
    setHealth(hData);
    setCandidates(cData.candidates);
    setAnalytics(aData);
    triggerNotification('success', `Target Job Description switched to "${activeTitle || hData.active_jd_title}". All candidates re-evaluated!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-3 rounded-xl bg-slate-900 border border-slate-700 p-4 shadow-2xl animate-slideDown">
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-200">{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <Header
        activeJdTitle={health?.active_jd_title || 'Senior Full Stack Engineer'}
        llmProvider={health?.llm_provider || 'Google Gemini 1.5 Flash API'}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConfig={() => setIsJobConfigOpen(true)}
        onRefresh={handleReEvaluate}
        isProcessing={reEvaluating}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Analytics Summary */}
        <OverviewStats 
          analytics={analytics} 
          loading={loading} 
        />

        {/* Candidate Evaluation Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>Autonomous Candidate Evaluation Matrix</span>
            </h2>
            <button
              onClick={loadData}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition"
              title="Refresh Matrix"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Matrix</span>
            </button>
          </div>

          <CandidateTable
            candidates={candidates}
            activeJdTitle={health?.active_jd_title || 'Senior Full Stack Engineer'}
            onSelectCandidate={setSelectedCandidate}
            onOpenEmail={handleOpenEmail}
            onDeleteCandidate={handleDeleteCandidate}
            onBulkDeleteCandidates={handleBulkDeleteCandidates}
            onClearAllCandidates={handleClearAllCandidates}
          />
        </section>

      </main>

      {/* Candidate Deep-Dive Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        activeJdImage={health?.active_jd_image}
        onClose={() => setSelectedCandidate(null)}
        onOpenEmail={handleOpenEmail}
        onDeleteCandidate={handleDeleteCandidate}
      />

      {/* Modals */}
      <ResumeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleResumeUploaded}
      />

      <JobConfigModal
        isOpen={isJobConfigOpen}
        onClose={() => setIsJobConfigOpen(false)}
        onSaveConfig={async () => {}}
        onJobDescriptionUpdated={handleJobDescUpdated}
        currentProvider={health?.llm_provider || 'Google Gemini 1.5 Flash API'}
      />

      <EmailModal
        isOpen={!!emailCandidate}
        candidate={emailCandidate?.candidate || null}
        email={emailCandidate?.email || null}
        onClose={() => setEmailCandidate(null)}
      />

    </div>
  );
}
