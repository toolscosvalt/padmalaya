import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Project, ProjectImage } from '../lib/types';
import { Plus, Edit2, Trash2, Save, X, Lock, LogOut } from 'lucide-react';
import { ReviewsManager } from '../components/ReviewsManager';
import MetricsManager from '../components/MetricsManager';

interface AdminProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

export function Admin({ isAuthenticated, onAuthChange }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'reviews' | 'settings' | 'metrics'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState<string | null>(null);
  const [projectImages, setProjectImages] = useState<Record<string, ProjectImage[]>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ceoImageUrl, setCeoImageUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchCeoImage();
    }
  }, [isAuthenticated]);

  async function fetchCeoImage() {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ceo_image')
      .maybeSingle();

    if (data && data.value) {
      setCeoImageUrl(data.value);
    }
  }

  async function handleSaveCeoImage(url: string) {
    if (!url || url.trim() === '') {
      showMessage('error', 'Please enter a valid URL');
      return;
    }

    console.log('Saving CEO image URL:', url);

    const { data, error } = await supabase
      .from('site_settings')
      .update({ value: url, updated_at: new Date().toISOString() })
      .eq('key', 'ceo_image')
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      showMessage('error', 'Error updating CEO image: ' + error.message);
    } else {
      showMessage('success', 'CEO image updated successfully!');
      setCeoImageUrl(url);
    }
  }

  function convertGoogleDriveUrl(url: string): string {
    if (!url) return '';

    // Extract file ID from various Google Drive URL formats
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      // Use thumbnail API with large size for better reliability
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }

    return url;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setIsLoading(false);

    if (error) {
      showMessage('error', 'Invalid credentials. Please try again.');
    } else {
      showMessage('success', 'Login successful!');
      onAuthChange();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onAuthChange();
    showMessage('success', 'Logged out successfully');
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) {
      setProjects(data);
      data.forEach((project) => fetchProjectImages(project.id));
    }
  }

  async function fetchProjectImages(projectId: string) {
    const { data } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (data) {
      setProjectImages((prev) => ({ ...prev, [projectId]: data }));
    }
  }

  async function handleSaveProject(formData: FormData) {
    const projectData = {
      name: formData.get('name') as string,
      slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
      tagline: formData.get('tagline') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      status: formData.get('status') as string,
      external_url: formData.get('external_url') as string || null,
      hero_image_url: formData.get('hero_image_url') as string,
      year_completed: formData.get('year_completed') ? parseInt(formData.get('year_completed') as string) : null,
      total_units: formData.get('total_units') ? parseInt(formData.get('total_units') as string) : null,
      total_area: formData.get('total_area') as string || null,
      display_order: formData.get('display_order') ? parseInt(formData.get('display_order') as string) : 0,
      is_featured: formData.get('is_featured') === 'true',
    };

    let result;
    if (editingProject) {
      result = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id);
    } else {
      result = await supabase.from('projects').insert([projectData]);
    }

    if (result.error) {
      showMessage('error', 'Error saving project: ' + result.error.message);
    } else {
      showMessage('success', editingProject ? 'Project updated successfully!' : 'Project created successfully!');
      setShowProjectForm(false);
      setEditingProject(null);
      fetchProjects();
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project? All associated images will also be deleted.')) {
      return;
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      showMessage('error', 'Error deleting project: ' + error.message);
    } else {
      showMessage('success', 'Project deleted successfully!');
      fetchProjects();
    }
  }

  async function handleSaveImage(projectId: string, formData: FormData) {
    const imageData = {
      project_id: projectId,
      image_url: formData.get('image_url') as string,
      category: formData.get('category') as string || null,
      display_order: formData.get('display_order') ? parseInt(formData.get('display_order') as string) : 0,
      caption: formData.get('caption') as string || null,
    };

    const { error } = await supabase.from('project_images').insert([imageData]);

    if (error) {
      showMessage('error', 'Error adding image: ' + error.message);
    } else {
      showMessage('success', 'Image added successfully!');
      setShowImageForm(null);
      fetchProjectImages(projectId);
    }
  }

  async function handleDeleteImage(imageId: string, projectId: string) {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    const { error } = await supabase.from('project_images').delete().eq('id', imageId);

    if (error) {
      showMessage('error', 'Error deleting image: ' + error.message);
    } else {
      showMessage('success', 'Image deleted successfully!');
      fetchProjectImages(projectId);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 md:pt-24 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-8">
              <Lock size={48} className="text-[#2F6F6B]" />
            </div>
            <h1 className="font-serif text-3xl font-light mb-2 text-center">Admin Login</h1>
            <p className="text-[#2F6F6B]/70 text-center mb-8">
              Enter your credentials to access the admin panel
            </p>

            {message && (
              <div
                className={`mb-6 p-4 rounded ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
                  placeholder="admin@padmalaya.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-20">
      <div className="container-custom">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">Admin Panel</h1>
              <p className="text-lg text-[#2F6F6B]/70">Manage projects, reviews, and content</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'text-[#2DB6E8] border-b-2 border-[#2DB6E8]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-[#2DB6E8] border-b-2 border-[#2DB6E8]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Customer Reviews
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'text-[#2DB6E8] border-b-2 border-[#2DB6E8]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-[#2DB6E8] border-b-2 border-[#2DB6E8]'
                  : 'text-[#2F6F6B]/60 hover:text-[#2F6F6B]'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {activeTab === 'reviews' ? (
          <ReviewsManager onMessage={showMessage} />
        ) : activeTab === 'metrics' ? (
          <div className="max-w-2xl">
            <MetricsManager />
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl font-light mb-6">Site Settings</h2>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-medium text-lg mb-4">CEO Image</h3>
              <p className="text-sm text-[#2F6F6B]/70 mb-4">
                Update the CEO image displayed on the About page. Paste a Google Drive share link and it will be automatically converted.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveCeoImage(formData.get('ceo_image_url') as string);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">CEO Image URL</label>
                  <input
                    type="url"
                    name="ceo_image_url"
                    value={ceoImageUrl}
                    onChange={(e) => setCeoImageUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
                  />
                  <p className="text-xs text-[#2F6F6B]/60 mt-1">
                    Paste Google Drive link (make sure file is set to "Anyone with the link can view")
                  </p>
                  <p className="text-xs text-[#2F6F6B]/60 mt-1">
                    Example: https://drive.google.com/file/d/1EPOlvSObX806hDYAtGNT9fbV7NjHUp0U/view?usp=sharing
                  </p>
                </div>

                {ceoImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current Image Preview:</p>
                    <img
                      src={convertGoogleDriveUrl(ceoImageUrl)}
                      alt="CEO Preview"
                      className="w-48 h-64 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.border = '2px solid red';
                        target.alt = 'Failed to load image. Make sure the Google Drive file is shared publicly (Anyone with the link can view)';
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.border = '1px solid #e5e7eb';
                      }}
                    />
                    <p className="text-xs text-red-600 mt-2">
                      If image doesn't show, ensure Google Drive file sharing is set to "Anyone with the link can view"
                    </p>
                  </div>
                )}

                <button type="submit" className="btn-primary">
                  <Save size={20} className="inline mr-2" />
                  Update CEO Image
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add New Project</span>
              </button>
            </div>

        {showProjectForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl md:text-3xl font-light">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button
                  onClick={() => {
                    setShowProjectForm(false);
                    setEditingProject(null);
                  }}
                  className="text-[#2F6F6B] hover:text-[#2DB6E8]"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProject(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProject?.name}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    defaultValue={editingProject?.tagline}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingProject?.description}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingProject?.location}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status *</label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status || 'completed'}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="completed">Completed</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    External URL (for ongoing projects)
                  </label>
                  <input
                    type="url"
                    name="external_url"
                    defaultValue={editingProject?.external_url || ''}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If set, clicking this project will redirect to this URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hero Image URL *</label>
                  <input
                    type="url"
                    name="hero_image_url"
                    defaultValue={editingProject?.hero_image_url}
                    required
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Year Completed</label>
                    <input
                      type="number"
                      name="year_completed"
                      defaultValue={editingProject?.year_completed || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Total Units</label>
                    <input
                      type="number"
                      name="total_units"
                      defaultValue={editingProject?.total_units || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Area</label>
                  <input
                    type="text"
                    name="total_area"
                    defaultValue={editingProject?.total_area || ''}
                    placeholder="e.g., 1,10,000 sq ft (40 cottah)"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      name="display_order"
                      defaultValue={editingProject?.display_order || 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Featured</label>
                    <select
                      name="is_featured"
                      defaultValue={editingProject?.is_featured ? 'true' : 'false'}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Save Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProject(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showImageForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 md:p-8 max-w-xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl font-light">Add Image</h2>
                <button
                  onClick={() => setShowImageForm(null)}
                  className="text-[#2F6F6B] hover:text-[#2DB6E8]"
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveImage(showImageForm, new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL *</label>
                  <input
                    type="url"
                    name="image_url"
                    required
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Uncategorized</option>
                    <option value="exterior">Exterior</option>
                    <option value="interior">Interior</option>
                    <option value="common_areas">Common Areas</option>
                    <option value="location">Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Caption</label>
                  <input
                    type="text"
                    name="caption"
                    placeholder="Optional caption for the image"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    <Save size={20} className="inline mr-2" />
                    Add Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImageForm(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-serif text-2xl font-normal mb-2">{project.name}</h3>
                  <p className="text-sm text-[#2F6F6B]/70">{project.location}</p>
                  {project.status === 'ongoing' && (
                    <span className="inline-block px-3 py-1 bg-[#2DB6E8]/10 text-[#2DB6E8] text-xs font-medium tracking-wider uppercase mt-2">
                      Ongoing
                    </span>
                  )}
                  {project.external_url && (
                    <p className="text-xs text-[#2F6F6B]/60 mt-1">
                      Redirects to: {project.external_url}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setShowProjectForm(true);
                    }}
                    className="p-2 text-[#2DB6E8] hover:bg-[#2DB6E8]/10 rounded"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-[#2F6F6B]">
                    Images ({projectImages[project.id]?.length || 0})
                  </h4>
                  <button
                    onClick={() => setShowImageForm(project.id)}
                    className="text-sm text-[#2DB6E8] hover:text-[#2F6F6B] inline-flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Add Image</span>
                  </button>
                </div>

                {projectImages[project.id]?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {projectImages[project.id].map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url}
                          alt={image.caption || project.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteImage(image.id, project.id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {image.category && (
                          <span className="absolute top-1 left-1 text-xs bg-white/90 px-2 py-0.5 rounded">
                            {image.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#2F6F6B]/60 italic">No images added yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
