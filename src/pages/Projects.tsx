import { useEffect, useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { ImageReveal } from '../components/ImageReveal';
import { supabase } from '../lib/supabase';
import { Project } from '../lib/types';
import { convertGoogleDriveUrl } from '../lib/utils';

interface ProjectsProps {
  onNavigate: (page: string, projectSlug?: string) => void;
}

export function Projects({ onNavigate }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) setProjects(data);
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const handleProjectClick = (project: Project) => {
    onNavigate('project', project.slug);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="py-20 md:py-32">
        <div className="container-custom">
          <AnimatedSection className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light mb-6">
              Our Projects
            </h1>
            <div className="w-24 h-px bg-[#D4A24C] mx-auto mb-8"></div>
            <p className="text-lg md:text-xl text-[#2F6F6B]/70 max-w-3xl mx-auto leading-relaxed">
              Each project represents our commitment to quality, design excellence, and creating
              lasting value for families and communities.
            </p>
          </AnimatedSection>

          <div className="flex justify-center space-x-6 mb-16">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm md:text-base font-medium tracking-wider uppercase transition-all duration-300 pb-2 ${
                filter === 'all'
                  ? 'text-[#2DB6E8] border-b-2 border-[#D4A24C]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`text-sm md:text-base font-medium tracking-wider uppercase transition-all duration-300 pb-2 ${
                filter === 'completed'
                  ? 'text-[#2DB6E8] border-b-2 border-[#D4A24C]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`text-sm md:text-base font-medium tracking-wider uppercase transition-all duration-300 pb-2 ${
                filter === 'ongoing'
                  ? 'text-[#2DB6E8] border-b-2 border-[#D4A24C]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Ongoing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {filteredProjects.map((project) => (
              <ImageReveal key={project.id}>
                <button
                  onClick={() => handleProjectClick(project)}
                  className="image-hover group block w-full text-left"
                >
                  <div className="aspect-[3/4] overflow-hidden mb-6 relative">
                    <img
                      src={convertGoogleDriveUrl(project.hero_image_url)}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="overlay flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-serif text-3xl md:text-4xl font-light text-white text-center px-6">
                          {project.name}
                        </h3>
                        <div className="w-16 h-px bg-[#D4A24C] mx-auto mt-4"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl md:text-3xl font-normal group-hover:text-[#2DB6E8] transition-colors duration-300">
                      {project.name}
                    </h3>
                    <p className="text-sm md:text-base text-[#2F6F6B]/70">{project.location}</p>
                    {project.status === 'ongoing' && (
                      <span className="inline-block px-3 py-1 bg-[#2DB6E8]/10 text-[#2DB6E8] text-xs font-medium tracking-wider uppercase">
                        Ongoing
                      </span>
                    )}
                    {project.year_completed && (
                      <p className="text-sm text-[#2F6F6B]/60">
                        Completed in {project.year_completed}
                      </p>
                    )}
                  </div>
                </button>
              </ImageReveal>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-[#2F6F6B]/60">No projects found in this category.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
