import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';
import { ImageReveal } from '../components/ImageReveal';
import { supabase } from '../lib/supabase';
import { HeroSettings, MetricsSettings, Project, CustomerReview } from '../lib/types';
import { convertGoogleDriveUrl } from '../lib/utils';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface HomeProps {
  onNavigate: (page: string, projectSlug?: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [metricsSettings, setMetricsSettings] = useState<MetricsSettings | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    years: 0,
    projects: 0,
    families: 0,
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null);
  const isMetricsVisible = useIntersectionObserver(metricsRef, { threshold: 0.1 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (metricsSettings && isMetricsVisible && !hasAnimated) {
      console.log('Starting metrics animation with:', metricsSettings);
      setHasAnimated(true);
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;

      const yearsIncrement = metricsSettings.years_of_experience / steps;
      const projectsIncrement = metricsSettings.projects_completed / steps;
      const familiesIncrement = metricsSettings.happy_families / steps;

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setAnimatedMetrics({
            years: Math.round(yearsIncrement * currentStep),
            projects: Math.round(projectsIncrement * currentStep),
            families: Math.round(familiesIncrement * currentStep),
          });
        } else {
          clearInterval(timer);
          setAnimatedMetrics({
            years: metricsSettings.years_of_experience,
            projects: metricsSettings.projects_completed,
            families: metricsSettings.happy_families,
          });
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [metricsSettings, isMetricsVisible, hasAnimated]);

  useEffect(() => {
    console.log('Metrics visibility:', isMetricsVisible);
    console.log('Has animated:', hasAnimated);
    console.log('Metrics settings:', metricsSettings);
  }, [isMetricsVisible, hasAnimated, metricsSettings]);

  async function fetchData() {
    const [heroResult, metricsResult, projectsResult, reviewsResult] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'hero').maybeSingle(),
      supabase.from('site_settings').select('value').eq('key', 'metrics').maybeSingle(),
      supabase
        .from('projects')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(3),
      supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true }),
    ]);

    if (heroResult.data?.value) setHeroSettings(heroResult.data.value);
    if (metricsResult.data?.value) {
      console.log('Metrics data loaded:', metricsResult.data.value);
      setMetricsSettings(metricsResult.data.value);
    }
    if (projectsResult.data) setFeaturedProjects(projectsResult.data);
    if (reviewsResult.data) setCustomerReviews(reviewsResult.data);
  }

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
        </div>

        <div className="relative z-10 container-custom text-center text-white">
          <div className="fade-in">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light mb-6 text-white">
              {heroSettings?.headline || 'Moments Made Permanent'}
            </h1>
          </div>
          <div className="fade-in-delay-1">
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 max-w-3xl mx-auto font-light">
              {heroSettings?.subheadline || 'Building legacies of trust and quality since 1982'}
            </p>
          </div>
          <div className="fade-in-delay-2">
            <button
              onClick={() => onNavigate('projects')}
              className="btn-primary inline-flex items-center space-x-2 text-base md:text-lg"
            >
              <span>{heroSettings?.cta_text || 'Explore Our Projects'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <AnimatedSection className="py-20 md:py-32">
        <div className="container-custom" ref={metricsRef}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="text-center">
              <div className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-[#2DB6E8] mb-2">
                {(hasAnimated || !metricsSettings) ? `${animatedMetrics.years}+` : `${metricsSettings.years_of_experience}+`}
              </div>
              <div className="w-16 h-px bg-[#D4A24C] mx-auto mb-3"></div>
              <p className="text-sm md:text-base uppercase tracking-wider text-[#2F6F6B]">
                Years of Experience
              </p>
            </div>

            <div className="text-center">
              <div className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-[#2DB6E8] mb-2">
                {(hasAnimated || !metricsSettings) ? `${animatedMetrics.projects}+` : `${metricsSettings.projects_completed}+`}
              </div>
              <div className="w-16 h-px bg-[#D4A24C] mx-auto mb-3"></div>
              <p className="text-sm md:text-base uppercase tracking-wider text-[#2F6F6B]">
                Projects Completed
              </p>
            </div>

            <div className="text-center">
              <div className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-[#2DB6E8] mb-2">
                {(hasAnimated || !metricsSettings) ? `${animatedMetrics.families.toLocaleString()}+` : `${metricsSettings.happy_families.toLocaleString()}+`}
              </div>
              <div className="w-16 h-px bg-[#D4A24C] mx-auto mb-3"></div>
              <p className="text-sm md:text-base uppercase tracking-wider text-[#2F6F6B]">
                Happy Families
              </p>
            </div>

            <div className="text-center">
              <div className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-[#2DB6E8] mb-2">
                {metricsSettings?.sq_ft_developed || '2.5M'}
              </div>
              <div className="w-16 h-px bg-[#D4A24C] mx-auto mb-3"></div>
              <p className="text-sm md:text-base uppercase tracking-wider text-[#2F6F6B]">
                Sq Ft Developed
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {featuredProjects.length > 0 && (
        <AnimatedSection className="py-20 md:py-32 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4">
                Featured Projects
              </h2>
              <div className="w-24 h-px bg-[#D4A24C] mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {featuredProjects.map((project, index) => (
                <ImageReveal key={project.id}>
                  <button
                    onClick={() => {
                      if (project.status === 'ongoing' && project.external_url) {
                        window.open(project.external_url, '_blank');
                      } else {
                        onNavigate('project', project.slug);
                      }
                    }}
                    className="image-hover group block w-full text-left"
                  >
                    <div className="aspect-[3/4] overflow-hidden mb-6">
                      <img
                        src={convertGoogleDriveUrl(project.hero_image_url)}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="overlay"></div>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-normal mb-2 group-hover:text-[#2DB6E8] transition-colors duration-300">
                      {project.name}
                    </h3>
                    <p className="text-sm md:text-base text-[#2F6F6B]/70 mb-2">
                      {project.location}
                    </p>
                    {project.tagline && (
                      <p className="text-sm md:text-base text-[#2F6F6B]/60 italic">
                        {project.tagline}
                      </p>
                    )}
                  </button>
                </ImageReveal>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => onNavigate('projects')}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <span>View All Projects</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </AnimatedSection>
      )}

      {customerReviews.length > 0 && (
        <AnimatedSection className="py-20 md:py-32 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4">
                What Our Customers Say
              </h2>
              <div className="w-24 h-px bg-[#D4A24C] mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {customerReviews.map((review, index) => (
                <AnimatedSection key={review.id} delay={index * 100}>
                  <div className="bg-[#F8FAFB] p-8 md:p-10 rounded-sm h-full flex flex-col">
                    {review.rating && (
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={
                              i < review.rating!
                                ? 'fill-[#D4A24C] text-[#D4A24C]'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-base md:text-lg text-[#2F6F6B]/80 leading-relaxed mb-6 flex-grow italic">
                      "{review.review_text}"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-px bg-[#D4A24C]"></div>
                      <p className="text-sm md:text-base font-medium text-[#2F6F6B]">
                        {review.customer_name}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection className="py-20 md:py-32 bg-[#2F6F6B] text-white">
        <div className="container-custom text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6 text-white">
            Building Trust, One Home at a Time
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10 leading-relaxed">
            For four decades, we have been creating spaces where families grow, memories are made,
            and legacies are built.
          </p>
          <button
            onClick={() => onNavigate('about')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Learn More About Us</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </AnimatedSection>
    </div>
  );
}
