import { useEffect, useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { supabase } from '../lib/supabase';
import { ContactSettings } from '../lib/types';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

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
      const phoneNumber = contactInfo.whatsapp.replace(/[^0-9]/g, '');
      const defaultMessage = encodeURIComponent('Hey, I am interested in learning more about Padmalaya Group properties. Could you please share more details?');
      window.open(`https://wa.me/${phoneNumber}?text=${defaultMessage}`, '_blank');
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

              <AnimatedSection delay={300} className="text-center bg-[#2F6F6B] text-white p-12 md:p-16 rounded-sm">
                <h2 className="font-serif text-3xl md:text-4xl font-light mb-4 text-white">
                  Ready to Build Your Future?
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Whether you are looking for your dream home or want to learn more about our
                  projects, we are here to help.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Call Now
                  </a>
                  <button
                    onClick={handleWhatsApp}
                    className="btn-secondary w-full sm:w-auto bg-white border-white text-[#2F6F6B] hover:bg-[#F8FAFB]"
                  >
                    WhatsApp Us
                  </button>
                </div>
              </AnimatedSection>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
