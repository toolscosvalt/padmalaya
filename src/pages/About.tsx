import { useEffect, useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { supabase } from '../lib/supabase';
import { AboutSettings } from '../lib/types';
import { Building2, Heart, Award, Users } from 'lucide-react';

export function About() {
  const [aboutSettings, setAboutSettings] = useState<AboutSettings | null>(null);

  useEffect(() => {
    fetchAboutData();
  }, []);

  async function fetchAboutData() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'about')
      .maybeSingle();

    if (data) setAboutSettings(data.value);
  }

  const values = [
    {
      icon: Building2,
      title: 'Quality Construction',
      description:
        'Every structure we build is designed to stand the test of time, with meticulous attention to detail and structural integrity.',
    },
    {
      icon: Heart,
      title: 'Legacy of Trust',
      description:
        'Our reputation is built on decades of transparent dealings and commitment to delivering on our promises.',
    },
    {
      icon: Award,
      title: 'Timeless Design',
      description:
        'We believe in creating spaces that remain elegant and functional for generations, avoiding trends that quickly fade.',
    },
    {
      icon: Users,
      title: 'Community First',
      description:
        'Beyond buildings, we create communities where families thrive and neighbors become lifelong friends.',
    },
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="py-20 md:py-32">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-16 md:mb-20">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light mb-6">
              {aboutSettings?.title || 'Four Decades of Building Trust'}
            </h1>
            <div className="w-24 h-px bg-[#D4A24C] mx-auto"></div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="max-w-4xl mx-auto">
              {aboutSettings?.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-lg md:text-xl leading-relaxed mb-6 text-[#2F6F6B]/80">
                  {paragraph}
                </p>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <AnimatedSection className="py-20 md:py-32 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-light mb-4">Our Values</h2>
            <div className="w-24 h-px bg-[#D4A24C] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
            {values.map((value, index) => (
              <AnimatedSection key={index} delay={index * 100}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2DB6E8]/10 mb-6">
                    <value.icon className="text-[#2DB6E8]" size={32} />
                  </div>
                  <h3 className="font-serif text-2xl font-normal mb-3">{value.title}</h3>
                  <p className="text-base text-[#2F6F6B]/70 leading-relaxed">{value.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {aboutSettings && (
        <AnimatedSection className="py-20 md:py-32 bg-[#F8FAFB]">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="border-l-4 border-[#D4A24C] pl-8 md:pl-12">
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#2F6F6B] mb-6 leading-relaxed italic">
                  {aboutSettings.ceo_message}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-px bg-[#D4A24C]"></div>
                  <p className="text-base md:text-lg font-medium text-[#2F6F6B]">
                    {aboutSettings.ceo_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection className="py-20 md:py-32 bg-[#2F6F6B] text-white">
        <div className="container-custom text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6 text-white">
            Building the Future, Honoring the Past
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Every project we undertake carries forward four decades of experience, trust, and
            commitment to excellence.
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
