import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';

interface MFASetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function MFASetup({ onComplete, onSkip }: MFASetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleStartSetup() {
    setIsLoading(true);
    setError('');

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Padmalaya Admin Account',
      });

      if (enrollError) throw enrollError;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('qr');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start MFA setup');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const challengeId = data.id;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // MFA successfully set up
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 'intro') {
    return (
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-[#2DB6E8]/10 p-4 rounded-full">
            <Shield size={48} className="text-[#2DB6E8]" />
          </div>
        </div>

        <h2 className="font-serif text-3xl font-light mb-4 text-center">
          Enable Two-Factor Authentication
        </h2>

        <p className="text-[#2F6F6B]/70 mb-6 text-center">
          Protect your admin account with an additional layer of security. You'll need an authenticator app like Google Authenticator or Authy.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important</p>
              <p>Make sure you have an authenticator app installed on your phone before proceeding.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleStartSetup}
            disabled={isLoading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting up...' : 'Set Up MFA'}
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full btn-secondary py-3"
            >
              Skip for Now
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="font-serif text-3xl font-light mb-4 text-center">
          Scan QR Code
        </h2>

        <p className="text-[#2F6F6B]/70 mb-6 text-center">
          Open your authenticator app and scan this QR code
        </p>

        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6 flex justify-center">
          <img src={qrCode} alt="QR Code for MFA setup" className="w-64 h-64" />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-[#2F6F6B] mb-2">
            Can't scan? Enter this code manually:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-gray-100 px-4 py-3 rounded font-mono text-sm break-all">
              {secret}
            </code>
            <button
              onClick={copySecret}
              className="p-3 hover:bg-gray-100 rounded transition-colors"
              title="Copy secret"
            >
              {copied ? (
                <Check size={20} className="text-green-600" />
              ) : (
                <Copy size={20} className="text-[#2F6F6B]" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setStep('verify')}
          className="w-full btn-primary py-3"
        >
          Continue to Verification
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 max-w-md w-full">
      <h2 className="font-serif text-3xl font-light mb-4 text-center">
        Verify Setup
      </h2>

      <p className="text-[#2F6F6B]/70 mb-6 text-center">
        Enter the 6-digit code from your authenticator app to complete setup
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Verification Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={verifyCode}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setVerifyCode(value);
          }}
          placeholder="000000"
          className="w-full px-4 py-3 border border-gray-300 rounded text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-[#2DB6E8] focus:border-transparent"
          autoFocus
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleVerifyCode}
          disabled={isLoading || verifyCode.length !== 6}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify and Enable MFA'}
        </button>

        <button
          onClick={() => setStep('qr')}
          className="w-full btn-secondary py-3"
        >
          Back to QR Code
        </button>
      </div>
    </div>
  );
}
