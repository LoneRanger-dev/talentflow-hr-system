export type DecisionType = 'ADVANCE' | 'MAYBE' | 'REJECT';

export interface ScoreBreakdown {
  technical_skills: number;
  experience: number;
  education: number;
  overall_fit: number;
}

export interface CandidateEvaluation {
  candidate_id: string;
  candidate_name: string;
  email: string;
  current_title: string;
  experience_years: string;
  key_skills: string[];
  total_score: number;
  decision: DecisionType;
  next_action: string;
  priority: string;
  evaluated_at: string;
  strengths: string[];
  concerns: string[];
  interview_focus: string[];
  reasoning: string;
  detailed_scores: ScoreBreakdown;
  processing_time: number;
  is_new?: boolean;
}

export interface ROIAnalytics {
  manual_hours_required: number;
  ai_hours_spent: number;
  hours_saved: number;
  cost_savings_usd: number;
  efficiency_gain_percentage: number;
  savings_per_hire: number;
}

export interface SystemAnalytics {
  total_candidates: number;
  decision_breakdown: Record<DecisionType, number>;
  average_score: number;
  total_processing_time_sec: number;
  avg_time_per_candidate_sec: number;
  roi_analytics: ROIAnalytics;
}

export interface PresetJD {
  title: string;
  category: string;
  content: string;
  image_url?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  llm_provider: string;
  llm_active: boolean;
  active_jd_title?: string;
  active_jd_image?: string;
  total_candidates: number;
  thresholds: {
    advance: number;
    maybe: number;
  };
}

export interface CandidateEmail {
  subject: string;
  body: string;
  type: DecisionType;
}
