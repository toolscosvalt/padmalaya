import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MetricsSettings } from '../lib/types';
import { Save, RefreshCw } from 'lucide-react';

export default function MetricsManager() {
  const [metrics, setMetrics] = useState<MetricsSettings>({
    years_of_experience: 0,
    projects_completed: 0,
    happy_families: 0,
    sq_ft_developed: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'metrics')
      .maybeSingle();

    if (error) {
      setMessage('Error loading metrics: ' + error.message);
    } else if (data?.value) {
      setMetrics(data.value);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('site_settings')
      .update({ value: metrics, updated_at: new Date().toISOString() })
      .eq('key', 'metrics');

    if (error) {
      setMessage('Error saving metrics: ' + error.message);
    } else {
      setMessage('Metrics updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="animate-spin text-[#2DB6E8]" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-serif font-light text-[#2F6F6B] mb-6">Manage Metrics</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            value={metrics.years_of_experience}
            onChange={(e) =>
              setMetrics({ ...metrics, years_of_experience: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Projects Completed
          </label>
          <input
            type="number"
            value={metrics.projects_completed}
            onChange={(e) =>
              setMetrics({ ...metrics, projects_completed: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Happy Families
          </label>
          <input
            type="number"
            value={metrics.happy_families}
            onChange={(e) =>
              setMetrics({ ...metrics, happy_families: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sq Ft Developed
          </label>
          <input
            type="text"
            value={metrics.sq_ft_developed}
            onChange={(e) => setMetrics({ ...metrics, sq_ft_developed: e.target.value })}
            placeholder="e.g., 5.5 Lakh or 2.5M"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter in any format (e.g., "5.5 Lakh", "2.5M", "550,000")
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.includes('Error')
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#2DB6E8] text-white py-3 px-6 rounded-md hover:bg-[#2DB6E8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>{saving ? 'Saving...' : 'Save Metrics'}</span>
        </button>
      </div>
    </div>
  );
}
