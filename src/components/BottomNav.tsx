import React from 'react';
import { Home, Users, Trophy, UserCheck } from 'lucide-react';
import { Participant } from '../types';

interface BottomNavProps {
  currentTab: 'home' | 'builder' | 'leaderboard' | 'entry' | 'admin';
  setCurrentTab: (tab: 'home' | 'builder' | 'leaderboard' | 'entry' | 'admin') => void;
  selectedCount: number;
  participant: Participant | null;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  selectedCount,
  participant,
  onOpenAuth,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-rcb-charcoal/95 backdrop-blur-lg border-t border-rcb-border md:hidden safe-bottom">
      <div className="grid grid-cols-4 h-16">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'home' ? 'text-rcb-red' : 'text-rcb-muted hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('builder')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
            currentTab === 'builder' ? 'text-rcb-red' : 'text-rcb-muted hover:text-white'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {selectedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rcb-red text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-red-glow animate-bounce">
                {selectedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Build Squad</span>
        </button>

        <button
          onClick={() => setCurrentTab('leaderboard')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'leaderboard' ? 'text-rcb-gold' : 'text-rcb-muted hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-bold">Leaderboard</span>
        </button>

        <button
          onClick={() => {
            if (participant) {
              setCurrentTab('entry');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'entry' ? 'text-white' : 'text-rcb-muted hover:text-white'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-bold">{participant ? 'My Entry' : 'Sign In'}</span>
        </button>
      </div>
    </nav>
  );
};
