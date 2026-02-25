import { useEffect, useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { LeadForm } from '../components/LeadForm';
import { supabase } from '../lib/supabase';
import { ContactSettings } from '../lib/types';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../lib/utils';

export function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactSettings | null>(null);

  useEffect(() => {
    fetchContactData();
  }, []);

  async function fetchContactData() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'contact')
      .maybeSingle();

    if (data) setContactInfo(data.value);
  }

  const handleWhatsApp = () => {
    if (contactInfo?.whatsapp) {
      window.open(getWhatsAppUrl(contactInfo.whatsapp), '_blank');
    }
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="py-20 md:py-32">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-16 md:mb-20">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light mb-6">
              Get in Touch
            </h1>
            <div className="w-24 h-px bg-[#D4A24C] mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-[#2F6F6B]/70 max-w-3xl mx-auto leading-relaxed">
              We would be delighted to discuss your requirements and answer any questions you may
              have about our projects.
            </p>
          </AnimatedSection>

          {contactInfo && (
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-16">
                <AnimatedSection delay={100}>
                  <div className="bg-white p-8 md:p-10 rounded-sm shadow-sm">
                    <div className="flex items-start space-x-4 mb-8">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2DB6E8]/10 flex items-center justify-center">
                        <Phone className="text-[#2DB6E8]" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-2">Call Us</h3>
                        <a
                          href={`tel:${contactInfo.phone}`}
                          className="text-lg text-[#2F6F6B]/80 hover:text-[#2DB6E8] transition-colors duration-200"
                        >
                          {contactInfo.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2DB6E8]/10 flex items-center justify-center">
                        <MessageCircle className="text-[#2DB6E8]" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-3">WhatsApp</h3>
                        <button
                          onClick={handleWhatsApp}
                          className="btn-primary text-sm md:text-base"
                        >
                          Start a Conversation
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                  <div className="bg-white p-8 md:p-10 rounded-sm shadow-sm">
                    <div className="flex items-start space-x-4 mb-8">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2DB6E8]/10 flex items-center justify-center">
                        <Mail className="text-[#2DB6E8]" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-2">Email Us</h3>
                        <a
                          href={`mailto:${contactInfo.email}`}
                          className="text-lg text-[#2F6F6B]/80 hover:text-[#2DB6E8] transition-colors duration-200 break-all"
                        >
                          {contactInfo.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2DB6E8]/10 flex items-center justify-center">
                        <MapPin className="text-[#2DB6E8]" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-2">Visit Us</h3>
                        <p className="text-lg text-[#2F6F6B]/80 leading-relaxed">
                          {contactInfo.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          )}

          <div className="max-w-5xl mx-auto">
            <AnimatedSection delay={300}>
              <div className="bg-white rounded-sm shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-5">
                  <div className="lg:col-span-2 bg-[#2F6F6B] p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                        Request a Callback
                      </h2>
                      <div className="w-12 h-px bg-[#D4A24C] mb-6"></div>
                      <p className="text-white/70 leading-relaxed mb-8">
                        Tell us about your requirements and our team will get back to you at the most convenient time.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Phone size={14} className="text-white/80" />
                        </div>
                        <span className="text-white/70 text-sm">Personal callback at your preferred time</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Mail size={14} className="text-white/80" />
                        </div>
                        <span className="text-white/70 text-sm">Detailed project information via email</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <MapPin size={14} className="text-white/80" />
                        </div>
                        <span className="text-white/70 text-sm">Site visit arrangements on request</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 p-8 md:p-10">
                    <LeadForm />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
