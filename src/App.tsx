import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
import { NotFound } from './pages/NotFound';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { supabase } from './lib/supabase';
import { ContactSettings } from './lib/types';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactSettings | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    fetchContactInfo();
    checkAdminAuth();
    handleRouteChange();

    window.addEventListener('hashchange', handleRouteChange);

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminAuthenticated(!!session);
    });

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchContactInfo() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'contact')
      .maybeSingle();

    if (data) setContactInfo(data.value);
  }

  async function checkAdminAuth() {
    const { data } = await supabase.auth.getSession();
    setIsAdminAuthenticated(!!data.session);
  }

  function handleRouteChange() {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const pathname = window.location.pathname;
    if (pathname && pathname !== '/') {
      const converted = pathname.replace(/^\//, '');
      window.history.replaceState(null, '', '/');
      window.location.hash = `#/${converted}`;
      return;
    }

    const hash = window.location.hash.slice(1) || '/';
    const [path, ...rest] = hash.split('/').filter(Boolean);

    const validPages = ['home', 'about', 'projects', 'contact', 'admin', 'project'];

    if (!path || path === '') {
      setCurrentPage('home');
      setProjectSlug(null);
    } else if (path === 'project' && rest[0]) {
      setCurrentPage('project');
      setProjectSlug(rest[0]);
    } else if (validPages.includes(path)) {
      setCurrentPage(path);
      setProjectSlug(null);
    } else {
      setCurrentPage('404');
      setProjectSlug(null);
    }
  }

  const handleNavigate = (page: string, slug?: string) => {
    if (page === 'project' && slug) {
      window.location.hash = `#/project/${slug}`;
    } else {
      window.location.hash = `#/${page === 'home' ? '' : page}`;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'about':
        return <About />;
      case 'projects':
        return <Projects onNavigate={handleNavigate} />;
      case 'project':
        return projectSlug ? (
          <ProjectDetail projectSlug={projectSlug} onNavigate={handleNavigate} />
        ) : (
          <Projects onNavigate={handleNavigate} />
        );
      case 'contact':
        return <Contact />;
      case 'admin':
        return <Admin isAuthenticated={isAdminAuthenticated} onAuthChange={checkAdminAuth} />;
      case '404':
        return <NotFound onNavigate={handleNavigate} />;
      default:
        return <NotFound onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
      <Footer contactInfo={contactInfo} />
      {currentPage !== 'admin' && <WhatsAppFloat contactInfo={contactInfo} />}
    </div>
  );
}

export default App;
