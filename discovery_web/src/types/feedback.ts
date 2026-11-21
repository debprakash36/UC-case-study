export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export type QueryType = 'branded_uc' | 'non_branded_home_service';

export type ServiceCategory =
  | 'Cleaning & Pest Control'
  | 'Salon & Spa at Home'
  | 'AC & Appliance Repair'
  | 'Plumbing, Electrician & Carpentry'
  | 'Painting & Renovation'
  | 'Customer Support & Policies'
  | 'App & Platform Experience'
  | 'Other / General Home Service';

export type OpportunityTheme =
  | 'Offline / Local Habit Fallback'
  | 'Post-Service Maintenance & Reminder Gap'
  | 'Cross-Category Discovery Gap'
  | 'Trust & Predictability Anxiety'
  | 'App & Booking Friction'
  | 'Service Quality / Partner Ops (Out of Scope)'
  | 'Pricing & Hidden Charges (Out of Scope)'
  | 'Positive / No Clear Friction';

export type WorkaroundMentioned =
  | 'Local Technician'
  | 'Competitor App'
  | 'Maid / Neighbour / WhatsApp'
  | 'DIY'
  | 'None';

export interface FeedbackRecord {
  id: string;
  source: string;
  query_type: QueryType;
  rating_or_upvotes: number;
  city_hint: string | null;
  date: string;
  text: string;
  sentiment: Sentiment;
  service_category: ServiceCategory;
  pain_point: string;
  summary: string;
  opportunity_theme: OpportunityTheme;
  workaround_mentioned: WorkaroundMentioned;
  consumer_growth_controllable: boolean;
}

export interface FeedbackStats {
  total: number;
  sentimentDistribution: Record<Sentiment, number>;
  sourceDistribution: Record<string, number>;
  queryTypeDistribution: Record<QueryType, number>;
  opportunityThemeDistribution: Record<OpportunityTheme, number>;
  workaroundDistribution: Record<WorkaroundMentioned, number>;
  controllableCount: number;
  controllablePct: number;
  topServiceCategories: { category: ServiceCategory; count: number }[];
  topPainPoints: { painPoint: string; count: number }[];
}
