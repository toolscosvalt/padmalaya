import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, ShieldAlert, ShieldCheck, Trash2, Plus } from 'lucide-react';
import { MFASetup } from './MFASetup';

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

interface MFASettingsProps {
  onMessage: (type: 'success' | 'error', text: string) => void;
}

export function MFASettings({ onMessage }: MFASettingsProps) {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      if (data) {
        setFactors(data.all || []);
      }
    } catch (err: any) {
      onMessage('error', 'Failed to load MFA settings: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnenroll(factorId: string) {
    if (!confirm('Are you sure you want to remove this MFA method? Your account will be less secure.')) {
      return;
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      onMessage('success', 'MFA method removed successfully');
      loadFactors();
    } catch (err: any) {
      onMessage('error', 'Failed to remove MFA: ' + err.message);
    }
  }

  function handleSetupComplete() {
    setShowSetup(false);
    onMessage('success', 'MFA enabled successfully! Your account is now more secure.');
    loadFactors();
  }

  if (showSetup) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <MFASetup
          onComplete={handleSetupComplete}
          onSkip={() => setShowSetup(false)}
        />
      </div>
    );
  }

  const hasActiveMFA = factors.some(f => f.status === 'verified');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {hasActiveMFA ? (
            <ShieldCheck size={24} className="text-green-600" />
          ) : (
            <ShieldAlert size={24} className="text-amber-600" />
          )}
          <div>
            <h3 className="font-medium text-lg">Two-Factor Authentication</h3>
            <p className="text-sm text-[#2F6F6B]/70">
              {hasActiveMFA
                ? 'Your account is protected with MFA'
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>

        {!hasActiveMFA && (
          <button
            onClick={() => setShowSetup(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Enable MFA</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-[#2F6F6B]/60">
          Loading MFA settings...
        </div>
      ) : factors.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Shield size={24} className="text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-amber-900 mb-2">MFA Not Enabled</h4>
              <p className="text-sm text-amber-800 mb-4">
                Two-factor authentication is currently disabled. We strongly recommend enabling it to protect your admin account from unauthorized access.
              </p>
              <button
                onClick={() => setShowSetup(true)}
                className="btn-primary text-sm"
              >
                Enable MFA Now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {factors.map((factor) => (
            <div
              key={factor.id}
              className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  factor.status === 'verified'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                  <p className="text-sm text-[#2F6F6B]/60">
                    {factor.factor_type.toUpperCase()} •{' '}
                    {factor.status === 'verified' ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </p>
                  <p className="text-xs text-[#2F6F6B]/40 mt-1">
                    Added {new Date(factor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleUnenroll(factor.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove MFA method"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {hasActiveMFA && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Account Protected</p>
                  <p>Your account is secured with two-factor authentication. You'll need to enter a code from your authenticator app each time you log in.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
