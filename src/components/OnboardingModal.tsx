import React, { useState } from 'react';
import { X, User, Phone, ShieldCheck, AlertCircle, Loader2, Lock } from 'lucide-react';
import { api } from '../services/api';
import { Participant, PredictionEntry } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (participant: Participant, entry: PredictionEntry | null) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = displayName.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter a display name (at least 2 characters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.enterParticipant(cleanPhone, cleanName);
      onSuccess(result.participant, result.entry);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-rcb-card border border-rcb-border rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-rcb-charcoal via-rcb-cardElevated to-rcb-charcoal p-5 border-b border-rcb-border relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-rcb-muted hover:text-white hover:bg-rcb-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-md bg-rcb-red flex items-center justify-center text-white font-black text-xs">
              RCB
            </div>
            <span className="text-xs font-bold text-rcb-gold uppercase tracking-wider">Fan Squad Entry</span>
          </div>
          <h2 className="text-xl font-heading font-black text-white">Join the Prediction Contest</h2>
          <p className="text-xs text-rcb-muted mt-1">
            No password or OTP needed. Return anytime using the same name and mobile number.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rcb-red/15 border border-rcb-red/40 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-rcb-redBright shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-rcb-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. ViratFan18 or Ananya"
                maxLength={40}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-rcb-charcoal border border-rcb-border focus:border-rcb-red focus:ring-1 focus:ring-rcb-red text-white text-sm outline-none transition-all placeholder:text-rcb-muted/60"
              />
            </div>
            <span className="text-[11px] text-rcb-muted mt-1 block">
              This name will be displayed publicly on the leaderboard.
            </span>
          </div>

          {/* Indian Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Indian Mobile Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 text-xs font-bold text-rcb-muted border-r border-rcb-border pr-2">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={14}
                required
                className="w-full pl-20 pr-4 py-3 rounded-xl bg-rcb-charcoal border border-rcb-border focus:border-rcb-red focus:ring-1 focus:ring-rcb-red text-white text-sm outline-none transition-all placeholder:text-rcb-muted/60 font-mono"
              />
            </div>
            <span className="text-[11px] text-rcb-muted mt-1 block">
              10-digit number. Used strictly to retrieve your saved squad prediction.
            </span>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-3 rounded-xl bg-rcb-cardElevated/80 border border-rcb-border text-[11px] text-rcb-muted space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Guarantee</span>
            </div>
            <p>
              Your phone number is completely private. It is never exposed on the public leaderboard or in API responses.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rcb-red to-rcb-redBright hover:from-rcb-redBright hover:to-rcb-red text-white font-heading font-black text-sm tracking-wider uppercase shadow-red-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>CONTINUE TO SQUAD BUILDER</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
