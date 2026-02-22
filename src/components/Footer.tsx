import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { ContactSettings } from '../lib/types';
import { supabase } from '../lib/supabase';

interface FooterProps {
  contactInfo: ContactSettings | null;
}

export function Footer({ contactInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchLogoUrl();
  }, []);

  async function fetchLogoUrl() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'logo_url')
      .maybeSingle();

    if (data?.value) {
      setLogoUrl(data.value);
    }
  }

  return (
    <footer className="bg-[#2F6F6B] text-white py-16 md:py-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Padmalaya Group"
                  className="h-12 w-auto brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <h3 className="font-serif text-2xl md:text-3xl font-light text-white">
                PADMALAYA
              </h3>
            </div>
            <p className="text-[#F8FAFB]/80 leading-relaxed text-sm md:text-base">
              Building legacies of trust and quality since 1982. Creating spaces where families build their futures.
            </p>
          </div>

          {contactInfo && (
            <>
              <div>
                <h4 className="font-serif text-xl font-normal text-white mb-4">
                  Contact Us
                </h4>
                <div className="space-y-3">
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center space-x-3 text-[#F8FAFB]/80 hover:text-[#D4A24C] transition-colors duration-200"
                  >
                    <Phone size={18} />
                    <span className="text-sm md:text-base">{contactInfo.phone}</span>
                  </a>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center space-x-3 text-[#F8FAFB]/80 hover:text-[#D4A24C] transition-colors duration-200"
                  >
                    <Mail size={18} />
                    <span className="text-sm md:text-base">{contactInfo.email}</span>
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-serif text-xl font-normal text-white mb-4">
                  Visit Us
                </h4>
                <div className="flex items-start space-x-3 text-[#F8FAFB]/80">
                  <MapPin size={18} className="mt-1 flex-shrink-0" />
                  <span className="text-sm md:text-base leading-relaxed">
                    {contactInfo.address}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-[#F8FAFB]/60 text-sm">
              &copy; {currentYear} Padmalaya Group. All rights reserved.
            </p>
            <p className="text-[#F8FAFB]/60 text-sm italic">
              Moments Made Permanent
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
