import { useEffect, useState } from 'react';
import { AnimatedSection } from '../components/AnimatedSection';
import { ImageReveal } from '../components/ImageReveal';
import { supabase } from '../lib/supabase';
import { Project, ProjectImage } from '../lib/types';
import { MapPin, Home, Calendar, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { convertGoogleDriveUrl } from '../lib/utils';

interface ProjectDetailProps {
  projectSlug: string;
  onNavigate: (page: string) => void;
}

export function ProjectDetail({ projectSlug, onNavigate }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProjectData();
  }, [projectSlug]);

  async function fetchProjectData() {
    const projectResult = await supabase
      .from('projects')
      .select('*')
      .eq('slug', projectSlug)
      .maybeSingle();

    if (projectResult.data) {
      setProject(projectResult.data);

      const imagesResult = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', projectResult.data.id)
        .order('display_order', { ascending: true });

      if (imagesResult.data) {
        setImages(imagesResult.data);
      }
    }
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-[#2F6F6B]/60">Loading...</p>
      </div>
    );
  }

  const groupedImages = {
    exterior: images.filter((img) => img.category === 'exterior'),
    interior: images.filter((img) => img.category === 'interior'),
    common_areas: images.filter((img) => img.category === 'common_areas'),
    location: images.filter((img) => img.category === 'location'),
    uncategorized: images.filter((img) => !img.category),
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src={convertGoogleDriveUrl(project.hero_image_url)}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>

        <button
          onClick={() => onNavigate('projects')}
          className="absolute top-8 left-6 md:left-12 text-white hover:text-[#D4A24C] transition-colors duration-200 flex items-center space-x-2 z-10"
        >
          <ArrowLeft size={20} />
          <span className="text-sm md:text-base font-medium tracking-wider uppercase">
            Back to Projects
          </span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="container-custom">
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-4">
              {project.name}
            </h1>
            {project.tagline && (
              <p className="text-lg md:text-2xl text-white/90 font-light italic">{project.tagline}</p>
            )}
          </div>
        </div>
      </section>

      <AnimatedSection className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <MapPin className="text-[#2DB6E8] flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-sm uppercase tracking-wider text-[#2F6F6B]/60 mb-1">Location</p>
                <p className="text-base md:text-lg font-medium text-[#2F6F6B]">
                  {project.location}
                </p>
              </div>
            </div>

            {project.total_units && (
              <div className="flex items-start space-x-4">
                <Home className="text-[#2DB6E8] flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-sm uppercase tracking-wider text-[#2F6F6B]/60 mb-1">
                    Total Units
                  </p>
                  <p className="text-base md:text-lg font-medium text-[#2F6F6B]">
                    {project.total_units}
                  </p>
                </div>
              </div>
            )}

            {project.year_completed && (
              <div className="flex items-start space-x-4">
                <Calendar className="text-[#2DB6E8] flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-sm uppercase tracking-wider text-[#2F6F6B]/60 mb-1">
                    Completed
                  </p>
                  <p className="text-base md:text-lg font-medium text-[#2F6F6B]">
                    {project.year_completed}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>

      {project.description && (
        <AnimatedSection className="py-20 md:py-32">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-8">
                About This Project
              </h2>
              <div className="w-24 h-px bg-[#D4A24C] mb-8"></div>
              {project.description.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-lg md:text-xl leading-relaxed mb-6 text-[#2F6F6B]/80">
                  {paragraph}
                </p>
              ))}
              {project.external_url && (
                <div className="mt-8 pt-6 border-t border-[#D4A24C]/30">
                  <p className="text-lg text-[#2F6F6B]/80">
                    For more details,{' '}
                    <a
                      href={project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2DB6E8] hover:text-[#2F6F6B] underline font-medium transition-colors duration-200"
                    >
                      visit this link
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      )}

      {images.length > 0 && (
        <AnimatedSection className="py-20 md:py-32 bg-white">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-4">
                Gallery
              </h2>
              <div className="w-24 h-px bg-[#D4A24C] mx-auto"></div>
            </div>

            {Object.entries(groupedImages).map(([category, categoryImages]) => {
              if (categoryImages.length === 0) return null;

              const categoryTitles: Record<string, string> = {
                exterior: 'Exterior Views',
                interior: 'Interior Spaces',
                common_areas: 'Common Areas',
                location: 'Location & Surroundings',
                uncategorized: 'Project Gallery',
              };

              return (
                <div key={category} className="mb-16 last:mb-0">
                  <h3 className="font-serif text-2xl md:text-3xl font-normal mb-8 text-center">
                    {categoryTitles[category]}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {categoryImages.map((image, index) => (
                      <ImageReveal key={image.id}>
                        <button
                          onClick={() => openLightbox(images.indexOf(image))}
                          className="image-hover block w-full"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                            <img
                              src={convertGoogleDriveUrl(image.image_url)}
                              alt={image.caption || project.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLDivElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div
                              className="absolute inset-0 items-center justify-center text-[#2F6F6B]/40 text-sm hidden"
                              style={{ display: 'none' }}
                            >
                              Image not available
                            </div>
                            <div className="overlay"></div>
                          </div>
                          {image.caption && (
                            <p className="mt-3 text-sm md:text-base text-[#2F6F6B]/70 text-center">
                              {image.caption}
                            </p>
                          )}
                        </button>
                      </ImageReveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      )}

      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-[#D4A24C] transition-colors duration-200 z-10"
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 text-white hover:text-[#D4A24C] transition-colors duration-200 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={48} />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-6 text-white hover:text-[#D4A24C] transition-colors duration-200 z-10"
                aria-label="Next image"
              >
                <ChevronRight size={48} />
              </button>
            </>
          )}

          <div className="max-w-7xl max-h-[90vh] px-6 md:px-12">
            <img
              src={convertGoogleDriveUrl(images[currentImageIndex].image_url)}
              alt={images[currentImageIndex].caption || project.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {images[currentImageIndex].caption && (
              <p className="text-white text-center mt-4 text-sm md:text-base">
                {images[currentImageIndex].caption}
              </p>
            )}
          </div>

          <div className="absolute bottom-6 left-0 right-0 text-center text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
