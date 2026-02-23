import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Clock, Building2, MessageSquare, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  preferred_contact_time: string;
  interest: string;
  heard_from: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  preferred_contact_time?: string;
  interest?: string;
  heard_from?: string;
  message?: string;
}

const INTEREST_OPTIONS = [
  { value: 'ongoing_project', label: 'Ongoing Project' },
  { value: 'completed_project', label: 'Completed Project' },
  { value: 'investment', label: 'Investment Opportunity' },
  { value: 'general', label: 'General Enquiry' },
];

const CONTACT_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (9am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
  { value: 'anytime', label: 'Anytime' },
];

const HEARD_FROM_OPTIONS = [
  { value: 'google_search', label: 'Google Search' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend_family', label: 'Friend / Family' },
  { value: 'newspaper_magazine', label: 'Newspaper / Magazine' },
  { value: 'hoarding_banner', label: 'Hoarding / Banner' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'existing_customer', label: 'Existing Customer' },
  { value: 'other', label: 'Other' },
];

function validateEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email);
}

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  return /^[0-9]{7,15}$/.test(cleaned);
}

function validateForm(data: LeadFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!validateEmail(data.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!validatePhone(data.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (7-15 digits).';
  }

  if (!data.preferred_contact_time) {
    errors.preferred_contact_time = 'Please select a preferred contact time.';
  }

  if (!data.interest) {
    errors.interest = 'Please select your area of interest.';
  }

  if (data.message && data.message.length > 1000) {
    errors.message = 'Message must not exceed 1000 characters.';
  }

  return errors;
}

interface LeadFormProps {
  onSubmitSuccess?: () => void;
}

export function LeadForm({ onSubmitSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    preferred_contact_time: '',
    interest: '',
    heard_from: '',
    message: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  function startCooldown(seconds: number) {
    setCooldownSeconds(seconds);
    cooldownTimer.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitStatus('loading');
    setErrorMessage('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/submit-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          Apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          preferred_contact_time: formData.preferred_contact_time,
          interest: formData.interest,
          heard_from: formData.heard_from || null,
          message: formData.message.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed. Please try again.');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', preferred_contact_time: '', interest: '', heard_from: '', message: '' });
      setFieldErrors({});
      startCooldown(60);
      onSubmitSuccess?.();
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h3 className="font-serif text-2xl font-light mb-3 text-[#1A3D3B]">Thank You!</h3>
        <p className="text-[#2F6F6B]/70 leading-relaxed mb-6 max-w-sm">
          Your enquiry has been received. Our team will reach out to you at your preferred contact time.
        </p>
        {cooldownSeconds > 0 ? (
          <p className="text-sm text-[#2F6F6B]/50">
            You can submit again in {cooldownSeconds}s
          </p>
        ) : (
          <button
            onClick={() => setSubmitStatus('idle')}
            className="text-sm text-[#2DB6E8] hover:text-[#2F6F6B] transition-colors underline underline-offset-2"
          >
            Submit another enquiry
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#1A3D3B] mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              maxLength={100}
              className={`w-full pl-9 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                fieldErrors.name
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:border-[#2DB6E8] focus:ring-[#2DB6E8]/20'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A3D3B] mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={`w-full pl-9 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                fieldErrors.email
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:border-[#2DB6E8] focus:ring-[#2DB6E8]/20'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#1A3D3B] mb-1.5">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              maxLength={20}
              className={`w-full pl-9 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                fieldErrors.phone
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:border-[#2DB6E8] focus:ring-[#2DB6E8]/20'
              }`}
            />
          </div>
          {fieldErrors.phone && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A3D3B] mb-1.5">
            Best Time to Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2F6F6B]/40 pointer-events-none" />
            <select
              name="preferred_contact_time"
              value={formData.preferred_contact_time}
              onChange={handleChange}
              className={`w-full pl-9 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors appearance-none bg-white ${
                fieldErrors.preferred_contact_time
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:border-[#2DB6E8] focus:ring-[#2DB6E8]/20'
              } ${!formData.preferred_contact_time ? 'text-gray-400' : 'text-[#1A3D3B]'}`}
            >
              <option value="" disabled>Select time preference</option>
              {CONTACT_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {fieldErrors.preferred_contact_time && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {fieldErrors.preferred_contact_time}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A3D3B] mb-2">
          I am interested in <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INTEREST_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`relative flex items-center justify-center text-center cursor-pointer rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all select-none ${
                formData.interest === opt.value
                  ? 'border-[#2DB6E8] bg-[#2DB6E8]/5 text-[#1A3D3B]'
                  : 'border-gray-200 text-[#2F6F6B]/70 hover:border-[#2DB6E8]/40 hover:text-[#2F6F6B]'
              } ${fieldErrors.interest ? 'border-red-300' : ''}`}
            >
              <input
                type="radio"
                name="interest"
                value={opt.value}
                checked={formData.interest === opt.value}
                onChange={handleChange}
                className="sr-only"
              />
              <Building2 size={14} className={`mr-1.5 flex-shrink-0 ${formData.interest === opt.value ? 'text-[#2DB6E8]' : 'text-[#2F6F6B]/40'}`} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.interest && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={11} /> {fieldErrors.interest}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A3D3B] mb-2">
          How did you hear about us? <span className="text-[#2F6F6B]/40 font-normal">(Optional)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {HEARD_FROM_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`relative flex items-center gap-2 cursor-pointer rounded-lg border-2 px-3 py-2.5 text-sm transition-all select-none ${
                formData.heard_from === opt.value
                  ? 'border-[#2F6F6B] bg-[#2F6F6B]/5 text-[#1A3D3B]'
                  : 'border-gray-200 text-[#2F6F6B]/70 hover:border-[#2F6F6B]/30 hover:text-[#2F6F6B]'
              }`}
            >
              <input
                type="radio"
                name="heard_from"
                value={opt.value}
                checked={formData.heard_from === opt.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                formData.heard_from === opt.value ? 'border-[#2F6F6B] bg-[#2F6F6B]' : 'border-gray-300'
              }`}>
                {formData.heard_from === opt.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="text-xs font-medium leading-tight">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1A3D3B] mb-1.5">
          Message <span className="text-[#2F6F6B]/40 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <MessageSquare size={16} className="absolute left-3 top-3.5 text-[#2F6F6B]/40 pointer-events-none" />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Any specific requirements or questions..."
            rows={4}
            maxLength={1000}
            className={`w-full pl-9 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
              fieldErrors.message
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-200 focus:border-[#2DB6E8] focus:ring-[#2DB6E8]/20'
            }`}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          {fieldErrors.message ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> {fieldErrors.message}
            </p>
          ) : <span />}
          <span className={`text-xs ${formData.message.length > 900 ? 'text-amber-500' : 'text-[#2F6F6B]/40'}`}>
            {formData.message.length}/1000
          </span>
        </div>
      </div>

      {submitStatus === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitStatus === 'loading' || cooldownSeconds > 0}
        className="w-full btn-primary py-3.5 font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitStatus === 'loading' ? (
          <>
            <Loader size={18} className="animate-spin" />
            Submitting...
          </>
        ) : cooldownSeconds > 0 ? (
          `Please wait ${cooldownSeconds}s before submitting again`
        ) : (
          'Send Enquiry'
        )}
      </button>

      <p className="text-center text-xs text-[#2F6F6B]/50">
        We respect your privacy. Your information will never be shared with third parties.
      </p>
    </form>
  );
}
