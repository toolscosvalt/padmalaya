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
              From Tirupati to Padmalaya: A Legacy Continued
            </h1>
            <div className="w-24 h-px bg-[#D4A24C] mx-auto mb-8"></div>
            <p className="text-xl md:text-2xl text-[#2F6F6B]/70 font-light">
              The name has changed, but what we stand for hasn't.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="max-w-4xl mx-auto space-y-6">
              <p className="text-lg md:text-xl leading-relaxed text-[#2F6F6B]/80">
                From Tirupati Developers to Padmalaya Group, everything that mattered continues exactly the same — our values, our commitment, and our belief in building with honesty, quality, and trust. Our roots remain deeply connected.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-[#2F6F6B]/80">
                Tirupati Developers was inspired by Lord Venkatesh (Tirupati Balaji), and Padmalaya carries that same blessing forward. <span className="font-medium">Padma</span> meaning lotus, <span className="font-medium">Alaya</span> meaning home — inspired by Padmavati Devi, the goddess of prosperity and the divine partner of Lord Venkatesh.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-[#2F6F6B]/80">
                Since 1982, we have been building more than structures. We create homes where families grow, businesses flourish, and communities thrive. Every project, from our first in 1982 to our ongoing developments, reflects our unwavering dedication to quality construction and timeless design.
              </p>
              <p className="text-lg md:text-xl leading-relaxed text-[#2F6F6B]/80">
                We are, and will always be, a client-focused company that believes in creating meaningful, lasting spaces — not just buildings. The legacy of Tirupati lives on in Padmalaya: same values, same faith, same dedication.
              </p>
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

      <AnimatedSection className="py-20 md:py-32 bg-[#F8FAFB]">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="border-l-4 border-[#D4A24C] pl-8 md:pl-12">
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#2F6F6B] mb-6 leading-relaxed italic">
                Real estate is not just about buildings — it is about creating spaces where families build their futures, where businesses grow, and where communities come together. Every project we undertake carries the weight of this responsibility. What began as Tirupati Developers over four decades ago continues today as Padmalaya Group, with the same principles that have always guided us: integrity, quality, and a deep respect for those who trust us with their dreams.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-px bg-[#D4A24C]"></div>
                <p className="text-base md:text-lg font-medium text-[#2F6F6B]">
                  Mr. Rakesh Saraff
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

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
