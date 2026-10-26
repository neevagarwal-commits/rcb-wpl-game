import React from 'react';
import { Trophy, Shield, User, LogOut, Lock, CheckCircle2, Clock } from 'lucide-react';
import { ContestStatus, Participant } from '../types';

interface NavbarProps {
  currentTab: 'home' | 'builder' | 'leaderboard' | 'entry' | 'admin';
  setCurrentTab: (tab: 'home' | 'builder' | 'leaderboard' | 'entry' | 'admin') => void;
  contestStatus: ContestStatus;
  participant: Participant | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  selectedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  contestStatus,
  participant,
  onOpenAuth,
  onLogout,
  selectedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-rcb-charcoal/95 backdrop-blur-md border-b border-rcb-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div 
          onClick={() => setCurrentTab('home')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rcb-red to-rcb-redDark flex items-center justify-center shadow-red-glow border border-rcb-redBright/30 group-hover:scale-105 transition-transform">
            <span className="font-heading font-black text-lg text-white tracking-tighter">RCB</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm tracking-wider text-white">AUCTION PREDICTOR</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rcb-gold/20 text-rcb-gold border border-rcb-gold/40">2027</span>
            </div>
            <span className="text-[10px] text-rcb-muted font-medium hidden sm:inline">TATA WPL FAN GAME</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {contestStatus === 'OPEN' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden xs:inline">PREDICTIONS</span> OPEN
            </div>
          )}
          {contestStatus === 'LOCKED' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-semibold">
              <Lock className="w-3 h-3" />
              <span>LOCKED</span>
            </div>
          )}
          {contestStatus === 'RESULTS_LIVE' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rcb-redDark/60 border border-rcb-redBright text-rcb-redBright text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESULTS LIVE</span>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentTab === 'home' ? 'bg-rcb-card text-white border border-rcb-border' : 'text-rcb-muted hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentTab('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors relative ${
                currentTab === 'builder' ? 'bg-rcb-red text-white' : 'text-rcb-muted hover:text-white'
              }`}
            >
              Build Squad
              {selectedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-white text-rcb-red rounded-full text-[10px] font-black">
                  {selectedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentTab === 'leaderboard' ? 'bg-rcb-card text-rcb-gold border border-rcb-gold/40' : 'text-rcb-muted hover:text-white'
              }`}
            >
              Leaderboard
            </button>
            {participant && (
              <button
                onClick={() => setCurrentTab('entry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentTab === 'entry' ? 'bg-rcb-card text-white border border-rcb-border' : 'text-rcb-muted hover:text-white'
                }`}
              >
                My Entry
              </button>
            )}
          </nav>

          {/* User Profile / Login */}
          <div className="flex items-center gap-2 ml-2">
            {participant ? (
              <div className="flex items-center gap-1.5 bg-rcb-card border border-rcb-border px-2.5 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-rcb-red/20 border border-rcb-red/40 flex items-center justify-center text-rcb-red text-[11px] font-bold">
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-white max-w-[90px] truncate hidden sm:inline">
                  {participant.displayName}
                </span>
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="text-rcb-muted hover:text-rcb-red transition-colors ml-1 p-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-rcb-red hover:bg-rcb-redBright text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Admin Dashboard Entry */}
            <button
              onClick={() => setCurrentTab('admin')}
              title="Admin Dashboard"
              className={`p-2 rounded-lg border transition-colors ${
                currentTab === 'admin' 
                  ? 'bg-rcb-gold text-rcb-dark border-rcb-gold font-bold' 
                  : 'bg-rcb-card border-rcb-border text-rcb-muted hover:text-rcb-gold hover:border-rcb-gold/40'
              }`}
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
