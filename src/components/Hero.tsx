import React from 'react';
import { Flame, Shield, Trophy, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ContestStatus, Participant } from '../types';

interface HeroProps {
  onBuildSquad: () => void;
  contestStatus: ContestStatus;
  participant: Participant | null;
  onOpenAuth: () => void;
  deadline: string | null;
}

export const Hero: React.FC<HeroProps> = ({
  onBuildSquad,
  contestStatus,
  participant,
  onOpenAuth,
  deadline,
}) => {
  return (
    <div className="relative overflow-hidden pt-6 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-rcb-charcoal via-rcb-dark to-rcb-dark border-b border-rcb-border">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rcb-red/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[200px] bg-rcb-gold/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        {/* Tournament & Authority Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rcb-card/90 border border-rcb-border mb-5 shadow-sm">
          <Flame className="w-4 h-4 text-rcb-redBright animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-rcb-gold">TATA WPL 2027 AUCTION SPECIAL</span>
          <span className="text-[10px] text-rcb-muted font-mono hidden xs:inline">• 146 OFFICIAL PLAYERS</span>
        </div>

        {/* Main Title & Tagline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight text-white mb-4 uppercase">
          RCB AUCTION <span className="text-rcb-redBright drop-shadow-sm">PREDICTOR</span> 2027
        </h1>

        <p className="text-lg sm:text-2xl font-heading font-extrabold text-rcb-gold mb-4 max-w-2xl mx-auto">
          Pick Your XI? No. Pick Your RCB Auction Winners.
        </p>

        <p className="text-sm sm:text-base text-rcb-muted max-w-xl mx-auto mb-8 font-normal leading-relaxed">
          Predict Royal Challengers Bengaluru's official WPL 2027 auction buys and purchase prices. 
          Manage your ₹115 Lakh purse, nail the exact bids, and climb the fan leaderboard!
        </p>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <button
            onClick={onBuildSquad}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-rcb-red to-rcb-redBright hover:from-rcb-redBright hover:to-rcb-red text-white font-heading font-black text-base sm:text-lg tracking-wider uppercase shadow-red-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <span>BUILD MY RCB SQUAD</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {!participant && (
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-rcb-card hover:bg-rcb-cardElevated border border-rcb-border text-white font-heading font-bold text-sm tracking-wide transition-all"
            >
              Sign In (Phone + Name)
            </button>
          )}
        </div>

        {/* Key Rules / Constraints Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto mb-12">
          <div className="p-3 rounded-xl bg-rcb-card/60 border border-rcb-border text-left">
            <span className="text-[11px] text-rcb-muted uppercase font-bold block mb-0.5">Auction Purse</span>
            <span className="text-base font-black text-rcb-gold font-mono">₹115 Lakh</span>
            <span className="text-[10px] text-rcb-muted block">(₹1.15 Crore)</span>
          </div>
          <div className="p-3 rounded-xl bg-rcb-card/60 border border-rcb-border text-left">
            <span className="text-[11px] text-rcb-muted uppercase font-bold block mb-0.5">Squad Size</span>
            <span className="text-base font-black text-white font-mono">2 to 5 Picks</span>
            <span className="text-[10px] text-rcb-muted block">Min 2, Max 5</span>
          </div>
          <div className="p-3 rounded-xl bg-rcb-card/60 border border-rcb-border text-left">
            <span className="text-[11px] text-rcb-muted uppercase font-bold block mb-0.5">Overseas Limit</span>
            <span className="text-base font-black text-white font-mono">Max 2 Players</span>
            <span className="text-[10px] text-rcb-muted block">🌍 Global stars</span>
          </div>
          <div className="p-3 rounded-xl bg-rcb-card/60 border border-rcb-border text-left">
            <span className="text-[11px] text-rcb-muted uppercase font-bold block mb-0.5">Player Pool</span>
            <span className="text-base font-black text-white font-mono">146 Players</span>
            <span className="text-[10px] text-rcb-muted block">Official WPL PDF</span>
          </div>
        </div>

        {/* Scoring Engine Breakdown Banner */}
        <div className="bg-rcb-card/80 border border-rcb-border rounded-2xl p-5 max-w-3xl mx-auto text-left shadow-card">
          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-rcb-border/60">
            <Trophy className="w-4 h-4 text-rcb-gold" />
            <h3 className="font-heading font-black text-sm text-white uppercase tracking-wider">
              Official Transparent Scoring System
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-rcb-charcoal/80 border border-rcb-border/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Correct Player</span>
                <span className="text-xs font-black text-emerald-400 font-mono">+100 PTS</span>
              </div>
              <p className="text-[11px] text-rcb-muted">Player actually bought by RCB at the auction.</p>
            </div>

            <div className="p-3 rounded-lg bg-rcb-charcoal/80 border border-rcb-gold/30 relative">
              <div className="absolute top-1 right-2">
                <Sparkles className="w-3 h-3 text-rcb-gold" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rcb-gold">Exact Price Hit</span>
                <span className="text-xs font-black text-rcb-gold font-mono">+75 BONUS</span>
              </div>
              <p className="text-[11px] text-rcb-muted">Nail the exact final auction purchase price (Total: 175 pts).</p>
            </div>

            <div className="p-3 rounded-lg bg-rcb-charcoal/80 border border-rcb-border/70">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Within 10% Price</span>
                <span className="text-xs font-black text-cyan-400 font-mono">+25 BONUS</span>
              </div>
              <p className="text-[11px] text-rcb-muted">Within 10% of final price, non-exact (Total: 125 pts).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
