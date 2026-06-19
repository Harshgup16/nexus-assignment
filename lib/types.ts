export interface Feature {
  name: string;
  status: 'available' | 'missing' | 'partial';
  details?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: 'monthly' | 'yearly' | 'one-time' | 'custom' | 'free';
}

export interface Competitor {
  name: string;
  website: string;
  description: string;
  features: Feature[];
  pricing: PricingTier[];
  targetAudience: string;
  positioning: string;
  valueProposition: string;
  strengths: string[];
  weaknesses: string[];
  marketShare?: string;
  confidenceScore: number; // 0-100
  evidenceType: 'verified' | 'ai_inferred' | 'assumption';
  sources: string[];
}

export interface FeatureComparisonRow {
  featureName: string;
  ourProduct: boolean;
  competitors: { [competitorName: string]: boolean };
}

export interface FeatureComparison {
  rows: FeatureComparisonRow[];
  competitorNames: string[];
}

export interface MarketInsight {
  title: string;
  description: string;
  confidenceScore: number;
  evidenceType: 'verified' | 'ai_inferred' | 'assumption';
  sources: string[];
}

export interface Recommendation {
  id: string;
  category: 'product' | 'market' | 'sales';
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Lead {
  companyName: string;
  website: string;
  industry: string;
  employeeSize: string;
  location: string;
  contactPerson: string;
  jobTitle: string;
  linkedin?: string;
  email?: string;
  additionalInfo?: string;
  confidenceScore: number; // 0-100
  sources: string[];
}

export interface DashboardData {
  whatToBuildNext: {
    featureName: string;
    reasoning: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  biggestThreats: {
    competitorName: string;
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    reasoning: string;
  }[];
  leadsToContactFirst: {
    companyName: string;
    contactPerson: string;
    jobTitle: string;
    reasonToContact: string;
  }[];
  missingOpportunities: {
    title: string;
    description: string;
    potentialValue: string;
  }[];
  actionsToday: {
    task: string;
    priority: 'high' | 'medium' | 'low';
    context: string;
  }[];
}

export interface AnalysisResult {
  id: string;
  input: {
    productName: string;
    description: string;
    websiteUrl?: string;
    companyName?: string;
  };
  competitors: Competitor[];
  featureComparison: FeatureComparison;
  marketInsights: MarketInsight[];
  recommendations: Recommendation[];
  leads: Lead[];
  dashboard: DashboardData;
  createdAt: string;
}
