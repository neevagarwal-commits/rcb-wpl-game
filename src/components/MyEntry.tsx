import React, { useEffect, useState } from 'react';
import { Globe, Edit3, CheckCircle2, Lock, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { PredictionEntry, ContestSettings, Participant, Player } from '../types';
import { api } from '../services/api';

interface MyEntryProps {
  participant: Participant;
  contestSettings: ContestSettings;
  onEditEntry: () => void;
}

export const MyEntry: React.FC<MyEntryProps> = ({ participant, contestSettings, onEditEntry }) => {
  const [entry, setEntry] = useState<PredictionEntry | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [entryData, playerList] = await Promise.all([
          api.getEntry(participant.id),
          api.getPlayers(),
        ]);
        setEntry(entryData);
        setPlayers(playerList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [participant.id]);

  const playersMap = new Map<number, Player>(players.map(p => [p.id, p]));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-rcb-muted">
        <Loader2 className="w-8 h-8 animate-spin text-rcb-red" />
        <span className="text-sm font-bold">Loading your entry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-8 h-8 text-rcb-red" />
        <p className="text-sm text-rcb-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-black text-white uppercase">My Entry</h2>
          <p className="text-xs text-rcb-muted mt-0.5">
            Signed in as <span className="text-white font-bold">{participant.displayName}</span>
            <span className="ml-1 text-rcb-muted/70">({participant.phone})</span>
          </p>
        </div>

        {/* Edit or locked */}
        {contestSettings.status === 'OPEN' && entry && (
          <button
            onClick={onEditEntry}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rcb-card border border-rcb-border text-white text-xs font-bold hover:bg-rcb-red hover:border-rcb-red transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Squad
          </button>
        )}
      </div>

      {/* Contest Status Banner */}
      {contestSettings.status === 'LOCKED' && (
        <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center gap-2.5 text-amber-200 text-sm mb-5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-amber-300">Predictions are Locked</span>
            <span className="text-xs text-amber-200/70">You cannot edit your squad while the contest is locked.</span>
          </div>
        </div>
      )}

      {contestSettings.status === 'RESULTS_LIVE' && (
        <div className="p-3.5 rounded-xl bg-rcb-red/15 border border-rcb-red/40 flex items-center gap-2.5 text-red-200 text-sm mb-5">
          <CheckCircle2 className="w-4 h-4 text-rcb-redBright shrink-0" />
          <div>
            <span className="font-bold block text-rcb-redBright">Official Results Published!</span>
            <span className="text-xs">Check the leaderboard for your score and ranking.</span>
          </div>
        </div>
      )}

      {/* No Entry State */}
      {!entry ? (
        <div className="bg-rcb-card border border-rcb-border rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-rcb-charcoal border border-rcb-border flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-rcb-muted" />
          </div>
          <h3 className="text-lg font-heading font-black text-white mb-2">No Squad Saved Yet</h3>
          <p className="text-rcb-muted text-sm mb-6">
            {contestSettings.status === 'OPEN'
              ? 'Head to the Squad Builder to select your predicted RCB auction picks!'
              : 'Contest is no longer accepting new entries.'}
          </p>
          {contestSettings.status === 'OPEN' && (
            <button
              onClick={onEditEntry}
              className="px-6 py-3 rounded-xl bg-rcb-red hover:bg-rcb-redBright text-white font-heading font-black text-sm uppercase tracking-wider shadow-red-glow transition-colors"
            >
              Build My Squad →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Entry Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-rcb-card border border-rcb-border rounded-xl p-3 text-center">
              <span className="text-[10px] text-rcb-muted uppercase font-bold block">Picks</span>
              <span className="text-xl font-mono font-black text-white">{entry.pickCount}</span>
            </div>
            <div className="bg-rcb-card border border-rcb-border rounded-xl p-3 text-center">
              <span className="text-[10px] text-rcb-muted uppercase font-bold block">🌍 Overseas</span>
              <span className="text-xl font-mono font-black text-white">{entry.overseasCount}</span>
            </div>
            <div className="bg-rcb-card border border-rcb-border rounded-xl p-3 text-center">
              <span className="text-[10px] text-rcb-muted uppercase font-bold block">Total Spend</span>
              <span className="text-lg font-mono font-black text-rcb-gold">₹{entry.totalSpendLakh}L</span>
            </div>
            <div className="bg-rcb-card border border-rcb-border rounded-xl p-3 text-center">
              <span className="text-[10px] text-rcb-muted uppercase font-bold block">Saved</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {new Date(entry.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Picks List */}
          <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-rcb-border bg-rcb-charcoal/40">
              <h3 className="text-xs font-bold text-white uppercase">Your Predicted Picks</h3>
            </div>

            {entry.picks.map((pick, idx) => {
              const player = pick.player || playersMap.get(pick.playerId);
              const isOverseas = player?.isOverseas ?? false;

              return (
                <div key={pick.playerId} className={`flex items-center gap-3 px-4 py-4 ${idx < entry.picks.length - 1 ? 'border-b border-rcb-border/40' : ''}`}>
                  <span className="text-[11px] font-mono text-rcb-muted w-5 shrink-0">{idx + 1}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{player?.fullName ?? `Player #${pick.playerId}`}</span>
                      {isOverseas ? (
                        <Globe className="w-3.5 h-3.5 text-rcb-gold shrink-0" />
                      ) : (
                        <span className="text-xs">🇮🇳</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-rcb-muted mt-0.5">
                      <span>{player?.specialism}</span>
                      <span>•</span>
                      <span>{player?.country}</span>
                      <span>•</span>
                      <span>Base: ₹{player?.basePriceLakh}L</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-rcb-muted block">Predicted</span>
                    <span className="text-sm font-mono font-black text-emerald-400">₹{pick.predictedPriceLakh}L</span>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between px-4 py-3 bg-rcb-charcoal/40 border-t border-rcb-border">
              <span className="text-xs font-bold text-rcb-muted uppercase">Total Predicted Spend</span>
              <span className="font-mono font-black text-rcb-gold">₹{entry.totalSpendLakh}L / ₹{contestSettings.maxPurseLakh}L</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
