export interface Project {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  location: string;
  status: 'completed' | 'ongoing';
  external_url: string | null;
  hero_image_url: string;
  year_completed: number | null;
  total_units: number | null;
  total_area: string | null;
  rera_number: string | null;
  flat_config: string | null;
  builtup_area: string | null;
  towers: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  category: 'exterior' | 'interior' | 'common_areas' | 'location' | null;
  display_order: number;
  caption: string | null;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

export interface HeroSettings {
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
}

export interface MetricsSettings {
  years_of_experience: number;
  projects_completed: number;
  happy_families: number;
  sq_ft_developed: string;
}

export interface AboutSettings {
  title: string;
  content: string;
  ceo_name: string;
  ceo_message: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_contact_time: 'morning' | 'afternoon' | 'evening' | 'anytime';
  interest: 'ongoing_project' | 'completed_project' | 'investment' | 'general';
  heard_from: 'google_search' | 'social_media' | 'friend_family' | 'newspaper_magazine' | 'hoarding_banner' | 'site_visit' | 'existing_customer' | 'other' | null;
  message: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CustomerReview {
  id: string;
  customer_name: string;
  review_text: string;
  rating: number | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
