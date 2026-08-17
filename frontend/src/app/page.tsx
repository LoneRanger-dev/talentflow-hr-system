'use client';

import React, { useState, useEffect } from 'react';
import { CandidateEvaluation, SystemAnalytics, HealthResponse } from '../types';
import { fetchHealth, fetchCandidates, fetchAnalytics, deleteCandidate, MOCK_CANDIDATES, MOCK_ANALYTICS } from '../services/api';
import { Header } from '../components/Header';
import { OverviewStats } from '../components/OverviewStats';
import { CandidateTable } from '../components/CandidateTable';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { JobConfigModal } from '../components/JobConfigModal';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { EmailModal } from '../components/EmailModal';

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<CandidateEvaluation[]>(MOCK_CANDIDATES);
  const [analytics, setAnalytics] = useState<SystemAnalytics>(MOCK_ANALYTICS);
  const [llmProvider, setLlmProvider] = useState<string>('Google Gemini 1.5 Flash API (Active)');
  const [activeJdTitle, setActiveJdTitle] = useState<string>('Senior Full Stack Engineer - AI & Web Applications');
  const [activeJdImage, setActiveJdImage] = useState<string>('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modals & Drawers state
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluation | null>(null);
  const [emailCandidate, setEmailCandidate] = useState<CandidateEvaluation | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Load API data
  const loadData = async () => {
    setIsProcessing(true);
    try {
      const healthData = await fetchHealth();
      if (healthData.llm_provider) setLlmProvider(healthData.llm_provider);
      if (healthData.active_jd_title) setActiveJdTitle(healthData.active_jd_title);
      if (healthData.active_jd_image) setActiveJdImage(healthData.active_jd_image);

      const candData = await fetchCandidates();
      if (candData.candidates && candData.candidates.length > 0) {
        setCandidates(candData.candidates);
      }
      if (candData.active_jd_title) setActiveJdTitle(candData.active_jd_title);
      if (candData.active_jd_image) setActiveJdImage(candData.active_jd_image);

      const analyticsData = await fetchAnalytics();
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (e) {
      console.warn('Using fallback state');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (geminiKey: string, provider: string, advanceThreshold: number, maybeThreshold: number) => {
    setIsProcessing(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_key: geminiKey,
          provider: provider,
          advance_threshold: advanceThreshold,
          maybe_threshold: maybeThreshold
        })
      });
      await loadData();
    } catch (e) {
      console.warn('Offline config update applied to client state');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCandidate = async (candidate: CandidateEvaluation) => {
    if (confirm(`Are you sure you want to delete ${candidate.candidate_name}'s resume evaluation?`)) {
      setIsProcessing(true);
      try {
        await deleteCandidate(candidate.candidate_id);
        setCandidates(prev => prev.filter(c => c.candidate_id !== candidate.candidate_id && c.candidate_name !== candidate.candidate_name));
        if (selectedCandidate?.candidate_id === candidate.candidate_id) {
          setSelectedCandidate(null);
        }
        await loadData();
      } catch (e) {
        setCandidates(prev => prev.filter(c => c.candidate_id !== candidate.candidate_id));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNewCandidateUpload = (newCandidate: any) => {
    if (newCandidate && newCandidate.candidate_name) {
      loadData();
    }
  };

  return (
    <div className="min-h-screen flex flex-col space-y-6 pb-12">
      
      {/* Top Header */}
      <Header
        llmProvider={llmProvider}
        activeJdTitle={activeJdTitle}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onRefresh={loadData}
        isProcessing={isProcessing}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-6 space-y-6 flex-1">
        
        {/* Executive Overview Analytics */}
        <OverviewStats analytics={analytics} />

        {/* Candidate Evaluation Grid & Table */}
        <CandidateTable
          candidates={candidates}
          activeJdTitle={activeJdTitle}
          onSelectCandidate={candidate => setSelectedCandidate(candidate)}
          onOpenEmail={candidate => setEmailCandidate(candidate)}
          onDeleteCandidate={handleDeleteCandidate}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>TalentFlow Autonomous HR System &copy; 2026 • Enterprise SaaS AI Engine powered by Google Gemini API & LangChain</p>
      </footer>

      {/* Modals & Drawers */}
      <CandidateDrawer
        candidate={selectedCandidate}
        activeJdTitle={activeJdTitle}
        activeJdImage={activeJdImage}
        onClose={() => setSelectedCandidate(null)}
        onOpenEmail={candidate => {
          setSelectedCandidate(null);
          setEmailCandidate(candidate);
        }}
        onDeleteCandidate={handleDeleteCandidate}
      />

      <JobConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaveConfig={handleSaveConfig}
        onJobDescriptionUpdated={(newTitle, newImage) => {
          setActiveJdTitle(newTitle);
          if (newImage) setActiveJdImage(newImage);
          loadData();
        }}
        currentProvider={llmProvider}
      />

      <ResumeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleNewCandidateUpload}
      />

      <EmailModal
        candidate={emailCandidate}
        onClose={() => setEmailCandidate(null)}
      />

    </div>
  );
}
