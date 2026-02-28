import { Phone, Mail, MapPin } from 'lucide-react';
import { ContactSettings } from '../lib/types';

interface FooterProps {
  contactInfo: ContactSettings | null;
}

export function Footer({ contactInfo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2F6F6B] text-white py-16 md:py-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/company-logo.png"
                alt="Padmalaya Group"
                className="h-10 md:h-12 w-auto object-contain brightness-0 invert"
              />
              <img
                src="/padmalaya-text.png"
                alt="Padmalaya"
                className="h-5 md:h-6 w-auto object-contain brightness-0 invert"
              />
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
