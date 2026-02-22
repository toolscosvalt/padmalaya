import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems = [
    { label: 'Home', path: 'home' },
    { label: 'About', path: 'about' },
    { label: 'Projects', path: 'projects' },
    { label: 'Contact', path: 'contact' },
  ];

  const handleNavigation = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container-custom flex items-center justify-between">
        <button
          onClick={() => handleNavigation('home')}
          className="flex items-center space-x-3"
        >
          <img
            src="/logo-new.png"
            alt="Padmalaya Group"
            className="h-12 md:h-14 w-auto object-contain"
          />
        </button>

        <div className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`text-sm font-medium tracking-wider uppercase transition-colors duration-200 ${
                currentPage === item.path
                  ? 'text-[#2DB6E8]'
                  : 'text-[#2F6F6B] hover:text-[#2DB6E8]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-[#2F6F6B]"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg">
          <div className="container-custom py-6 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`block w-full text-left text-base font-medium tracking-wider uppercase transition-colors duration-200 py-2 ${
                  currentPage === item.path
                    ? 'text-[#2DB6E8]'
                    : 'text-[#2F6F6B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
