import { Home, ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

export function NotFound({ onNavigate }: NotFoundProps) {
  return (
    <div className="min-h-screen pt-20 md:pt-24 flex items-center justify-center">
      <div className="container-custom text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-8xl md:text-9xl font-light text-[#2DB6E8] mb-6">
            404
          </h1>
          <div className="w-24 h-px bg-[#D4A24C] mx-auto mb-6"></div>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-4 text-[#2F6F6B]">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-[#2F6F6B]/70 mb-10 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('home')}
              className="btn-primary inline-flex items-center justify-center space-x-2"
            >
              <Home size={20} />
              <span>Go to Homepage</span>
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary inline-flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
