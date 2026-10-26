import React, { useState } from 'react';
import { CheckCircle2, Globe, Users, IndianRupee, Loader2, AlertCircle, AlertTriangle, Edit3, ArrowLeft } from 'lucide-react';
import { Player, SelectedPlayerPick, ContestSettings } from '../types';
import { api } from '../services/api';

interface SquadReviewProps {
  picks: SelectedPlayerPick[];
  playersMap: Map<number, Player>;
  participantId: string;
  contestSettings: ContestSettings;
  onSaveSuccess: () => void;
  onBack: () => void;
  existingEntryId?: string | null;
}

export const SquadReview: React.FC<SquadReviewProps> = ({
  picks,
  playersMap,
  participantId,
  contestSettings,
  onSaveSuccess,
  onBack,
  existingEntryId,
}) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const totalSpend = picks.reduce((s, p) => s + p.predictedPriceLakh, 0);
  const remaining = contestSettings.maxPurseLakh - totalSpend;
  const overseasPicks = picks.filter(p => playersMap.get(p.playerId)?.isOverseas);
  const indianPicks = picks.filter(p => !playersMap.get(p.playerId)?.isOverseas);

  const handleSave = async () => {
    if (existingEntryId && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await api.saveEntry(
        participantId,
        picks.map(p => ({ playerId: p.playerId, predictedPriceLakh: p.predictedPriceLakh }))
      );
      setSaved(true);
      onSaveSuccess();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save squad. Please try again.');
      setConfirmOverwrite(false);
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'BATTER': return 'text-blue-400';
      case 'ALL-ROUNDER': return 'text-purple-300';
      case 'WICKETKEEPER': return 'text-amber-300';
      case 'BOWLER': return 'text-emerald-400';
      default: return 'text-rcb-muted';
    }
  };

  if (saved) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center flex flex-col items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-emerald-900/60 border-2 border-emerald-400 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-heading font-black text-white">Squad Saved!</h2>
        <p className="text-rcb-muted text-sm">Your RCB predicted squad has been locked in. Come back to check the leaderboard once the auction results are live!</p>
        <div className="bg-rcb-card border border-rcb-border rounded-2xl p-4 w-full text-left">
          <p className="text-xs text-rcb-muted uppercase font-bold mb-2">Your Picks</p>
          {picks.map(pick => {
            const player = playersMap.get(pick.playerId);
            return (
              <div key={pick.playerId} className="flex items-center justify-between py-1.5 border-b border-rcb-border/50 last:border-0">
                <span className="text-sm text-white font-bold">{player?.fullName ?? `Player #${pick.playerId}`}</span>
                <span className="text-sm font-mono text-emerald-400 font-black">₹{pick.predictedPriceLakh}L</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-rcb-border">
            <span className="text-xs font-bold text-rcb-muted uppercase">Total Predicted Spend</span>
            <span className="text-sm font-mono font-black text-rcb-gold">₹{totalSpend}L</span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-rcb-red text-white font-heading font-black text-sm uppercase tracking-wider hover:bg-rcb-redBright transition-colors shadow-red-glow"
        >
          View Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-rcb-card border border-rcb-border text-rcb-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-heading font-black text-white uppercase">Review Your Squad</h2>
          <p className="text-xs text-rcb-muted">Check your picks before saving</p>
        </div>
      </div>

      {/* Budget Summary Card */}
      <div className="bg-rcb-card border border-rcb-border rounded-2xl p-5 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-[10px] text-rcb-muted uppercase font-bold block">Total Spend</span>
          <span className="text-base font-mono font-black text-rcb-gold">₹{totalSpend}L</span>
        </div>
        <div>
          <span className="text-[10px] text-rcb-muted uppercase font-bold block">Remaining Purse</span>
          <span className={`text-base font-mono font-black ${remaining < 0 ? 'text-rcb-redBright' : 'text-emerald-400'}`}>₹{remaining}L</span>
        </div>
        <div>
          <span className="text-[10px] text-rcb-muted uppercase font-bold block">🇮🇳 Indian Players</span>
          <span className="text-base font-mono font-black text-white">{indianPicks.length}</span>
        </div>
        <div>
          <span className="text-[10px] text-rcb-muted uppercase font-bold block">🌍 Overseas Players</span>
          <span className="text-base font-mono font-black text-white">{overseasPicks.length}</span>
        </div>
      </div>

      {/* Picks List */}
      <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-rcb-border flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase">Selected Players ({picks.length})</span>
          <button onClick={onBack} className="text-xs text-rcb-red font-bold flex items-center gap-1 hover:text-rcb-redBright">
            <Edit3 className="w-3 h-3" />
            Edit Squad
          </button>
        </div>

        {picks.map((pick, idx) => {
          const player = playersMap.get(pick.playerId);
          return (
            <div key={pick.playerId} className={`flex items-center gap-3 px-4 py-3.5 ${idx < picks.length - 1 ? 'border-b border-rcb-border/50' : ''}`}>
              {/* Player Number */}
              <span className="text-[11px] font-mono text-rcb-muted w-5 shrink-0">{idx + 1}</span>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">{player?.fullName}</span>
                  {player?.isOverseas && <Globe className="w-3.5 h-3.5 text-rcb-gold shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[11px] mt-0.5">
                  <span className={getRoleColor(player?.specialism)}>{player?.specialism}</span>
                  <span className="text-rcb-muted">•</span>
                  <span className="text-rcb-muted">{player?.country}</span>
                  <span className="text-rcb-muted">•</span>
                  <span className="text-rcb-muted">Base: ₹{player?.basePriceLakh}L</span>
                </div>
              </div>

              {/* Predicted Price */}
              <div className="text-right shrink-0">
                <span className="text-xs text-rcb-muted block mb-0.5">Predicted</span>
                <span className="text-sm font-mono font-black text-emerald-400">₹{pick.predictedPriceLakh}L</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {saveError && (
        <div className="p-3 rounded-xl bg-rcb-red/15 border border-rcb-red/40 flex items-start gap-2 text-sm text-red-200 mb-4">
          <AlertCircle className="w-4 h-4 text-rcb-redBright shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Existing Entry Warning */}
      {confirmOverwrite && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Replace existing squad?</span>
          </div>
          <p className="text-xs mb-3">This will overwrite your previously saved squad prediction. This action cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">
              Yes, Replace My Squad
            </button>
            <button onClick={() => setConfirmOverwrite(false)} className="flex-1 py-2 rounded-lg bg-rcb-card border border-rcb-border text-white font-bold text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      {!confirmOverwrite && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rcb-red to-rcb-redBright hover:from-rcb-redBright hover:to-rcb-red text-white font-heading font-black text-base uppercase tracking-wider shadow-red-glow transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving your squad...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{existingEntryId ? 'Update My Squad' : 'Save My Squad'}</span>
            </>
          )}
        </button>
      )}

      <p className="text-[11px] text-rcb-muted text-center mt-3">
        Only backend-confirmed saves are considered valid. Never report a save unless the server confirms it.
      </p>
    </div>
  );
};
