import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle } from 'lucide-react';

interface MFAVerifyProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerify({ factorId, onSuccess, onCancel }: MFAVerifyProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      // Success!
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg p-8 max-w-md w-full">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-[#2DB6E8]/10 p-4 rounded-full">
          <Shield size={48} className="text-[#2DB6E8]" />
        </div>
      </div>

      <h2 className="font-serif text-3xl font-light mb-4 text-center">
        Two-Factor Authentication
      </h2>

      <p className="text-[#2F6F6B]/70 mb-6 text-center">
        Enter the 6-digit code from your authenticator app
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setCode(value);
            }}
            placeholder="000000"
            className="w-full px-4 py-3 border border-gray-300 rounded text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full btn-secondary py-3"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-[#2F6F6B]/60">
          <strong>Lost access to your authenticator?</strong><br />
          Contact the system administrator to reset your MFA settings.
        </p>
      </div>
    </div>
  );
}
