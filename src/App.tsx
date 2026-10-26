import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Hero } from './components/Hero';
import { OnboardingModal } from './components/OnboardingModal';
import { SquadBuilder } from './components/SquadBuilder';
import { SquadReview } from './components/SquadReview';
import { Leaderboard } from './components/Leaderboard';
import { MyEntry } from './components/MyEntry';
import { AdminDashboard } from './components/AdminDashboard';
import { Participant, PredictionEntry, SelectedPlayerPick, ContestSettings, Player } from './types';
import { api } from './services/api';

type AppTab = 'home' | 'builder' | 'leaderboard' | 'entry' | 'admin';

const defaultContest: ContestSettings = {
  status: 'OPEN',
  maxPurseLakh: 115,
  minPicks: 2,
  maxPicks: 5,
  maxOverseas: 2,
  deadline: null,
  resultsPublishedAt: null,
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [picks, setPicks] = useState<SelectedPlayerPick[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [contestSettings, setContestSettings] = useState<ContestSettings>(defaultContest);
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [savedEntry, setSavedEntry] = useState<PredictionEntry | null>(null);

  // Load contest settings and players on mount
  useEffect(() => {
    api.getContest().then(setContestSettings).catch(console.error);
    api.getPlayers().then(setAllPlayers).catch(console.error);
  }, []);

  // Build player map for components
  const playersMap = useMemo(() => {
    const m = new Map<number, Player>();
    allPlayers.forEach(p => m.set(p.id, p));
    return m;
  }, [allPlayers]);

  const handleAuthSuccess = (p: Participant, entry: PredictionEntry | null) => {
    setParticipant(p);
    if (entry) {
      setSavedEntry(entry);
      setExistingEntryId(entry.id);
      // Restore picks from existing entry
      const restoredPicks: SelectedPlayerPick[] = entry.picks.map(pick => ({
        playerId: pick.playerId,
        predictedPriceLakh: pick.predictedPriceLakh,
      }));
      setPicks(restoredPicks);
    }
  };

  const handleLogout = () => {
    setParticipant(null);
    setPicks([]);
    setExistingEntryId(null);
    setSavedEntry(null);
    setCurrentTab('home');
  };

  const handleSaveSuccess = () => {
    setShowReview(false);
    setCurrentTab('entry');
    // Refresh contest settings and entry
    if (participant) {
      api.getEntry(participant.id).then(entry => {
        if (entry) {
          setSavedEntry(entry);
          setExistingEntryId(entry.id);
        }
      });
    }
  };

  const navigateToBuilder = () => {
    setCurrentTab('builder');
    setShowReview(false);
  };

  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab);
    setShowReview(false);
  };

  return (
    <div className="min-h-screen bg-rcb-dark flex flex-col">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        contestStatus={contestSettings.status}
        participant={participant}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        selectedCount={picks.length}
      />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-8">
        {/* Home Tab */}
        {currentTab === 'home' && (
          <div>
            <Hero
              onBuildSquad={() => {
                if (!participant) {
                  setShowAuthModal(true);
                } else {
                  setCurrentTab('builder');
                }
              }}
              contestStatus={contestSettings.status}
              participant={participant}
              onOpenAuth={() => setShowAuthModal(true)}
              deadline={contestSettings.deadline}
            />

            {/* Quick actions */}
            <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => {
                    if (!participant) setShowAuthModal(true);
                    else setCurrentTab('builder');
                  }}
                  className="cursor-pointer p-6 rounded-2xl bg-rcb-card border border-rcb-border hover:border-rcb-red transition-all group text-center"
                >
                  <div className="text-3xl mb-3">🏏</div>
                  <h3 className="font-heading font-black text-white text-base mb-2 group-hover:text-rcb-redBright transition-colors">Build Squad</h3>
                  <p className="text-xs text-rcb-muted">Select 2–5 players from 146 official WPL 2027 auction candidates and predict their purchase prices.</p>
                </div>

                <div
                  onClick={() => setCurrentTab('leaderboard')}
                  className="cursor-pointer p-6 rounded-2xl bg-rcb-card border border-rcb-border hover:border-rcb-gold transition-all group text-center"
                >
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-heading font-black text-white text-base mb-2 group-hover:text-rcb-gold transition-colors">Leaderboard</h3>
                  <p className="text-xs text-rcb-muted">Rankings will go live once the admin publishes official WPL 2027 auction results.</p>
                </div>

                <div
                  onClick={() => participant ? setCurrentTab('entry') : setShowAuthModal(true)}
                  className="cursor-pointer p-6 rounded-2xl bg-rcb-card border border-rcb-border hover:border-emerald-500/60 transition-all group text-center"
                >
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="font-heading font-black text-white text-base mb-2 group-hover:text-emerald-400 transition-colors">My Entry</h3>
                  <p className="text-xs text-rcb-muted">{participant ? `View and manage your saved squad prediction.` : 'Sign in with your name and mobile number to see your entry.'}</p>
                </div>
              </div>

              {/* Scoring Rules Reminder */}
              <div className="mt-8 bg-rcb-card/50 border border-rcb-border rounded-2xl p-6">
                <h3 className="font-heading font-black text-white text-sm uppercase mb-4 flex items-center gap-2">
                  <span>📊</span> How Scoring Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">+100</span>
                    <span className="text-rcb-muted">for each player RCB actually buys at the auction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rcb-gold font-bold shrink-0">+75</span>
                    <span className="text-rcb-muted">bonus for predicting the exact final purchase price (175 pts total)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">+25</span>
                    <span className="text-rcb-muted">bonus for a price within ±10% of actual (not exact) — 125 pts total</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-rcb-muted/50 font-bold shrink-0">0</span>
                    <span className="text-rcb-muted">for players not bought by RCB, or RCB purchases you didn't predict</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Builder / Review Tab */}
        {currentTab === 'builder' && (
          showReview && participant ? (
            <SquadReview
              picks={picks}
              playersMap={playersMap}
              participantId={participant.id}
              contestSettings={contestSettings}
              onSaveSuccess={handleSaveSuccess}
              onBack={() => setShowReview(false)}
              existingEntryId={existingEntryId}
            />
          ) : (
            <SquadBuilder
              participantId={participant?.id ?? null}
              picks={picks}
              setPicks={setPicks}
              contestSettings={contestSettings}
              onSave={() => setShowReview(true)}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )
        )}

        {/* Leaderboard Tab */}
        {currentTab === 'leaderboard' && (
          <Leaderboard contestStatus={contestSettings.status} />
        )}

        {/* My Entry Tab */}
        {currentTab === 'entry' && (
          participant ? (
            <MyEntry
              participant={participant}
              contestSettings={contestSettings}
              onEditEntry={() => {
                setCurrentTab('builder');
                setShowReview(false);
              }}
            />
          ) : (
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-heading font-black text-white mb-2">Sign In First</h3>
              <p className="text-rcb-muted text-sm mb-6">Enter your name and mobile number to view your saved squad prediction.</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 rounded-xl bg-rcb-red hover:bg-rcb-redBright text-white font-heading font-black text-sm uppercase tracking-wider shadow-red-glow transition-colors"
              >
                Sign In Now
              </button>
            </div>
          )
        )}

        {/* Admin Tab */}
        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        selectedCount={picks.length}
        participant={participant}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(p, entry) => {
          handleAuthSuccess(p, entry);
          setShowAuthModal(false);
          setCurrentTab('builder');
        }}
      />
    </div>
  );
}
