import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Contact } from './pages/Contact';
import { Admin } from './pages/Admin';
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
    const hash = window.location.hash.slice(1) || '/';
    const [path, ...rest] = hash.split('/').filter(Boolean);

    if (!path || path === '') {
      setCurrentPage('home');
      setProjectSlug(null);
    } else if (path === 'project' && rest[0]) {
      setCurrentPage('project');
      setProjectSlug(rest[0]);
    } else {
      setCurrentPage(path);
      setProjectSlug(null);
    }
  }

  const handleNavigate = (page: string, slug?: string) => {
    if (page === 'project' && slug) {
      window.location.hash = `#/project/${slug}`;
    } else {
      window.location.hash = `#/${page === 'home' ? '' : page}`;
    }
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
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
      <Footer contactInfo={contactInfo} />
    </div>
  );
}

export default App;
