import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Clock, Star, ChevronDown, ChevronUp, Globe, Loader2, AlertCircle, Users } from 'lucide-react';
import { LeaderboardEntry, ScorePickBreakdown } from '../types';
import { api } from '../services/api';

interface LeaderboardProps {
  contestStatus: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ contestStatus }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getLeaderboard();
        setEntries(data.entries);
        setTotalParticipants(data.totalParticipants);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contestStatus]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-rcb-gold text-xl">🥇</span>;
    if (rank === 2) return <span className="text-slate-300 text-xl">🥈</span>;
    if (rank === 3) return <span className="text-amber-600 text-xl">🥉</span>;
    return <span className="text-rcb-muted font-mono font-bold text-sm w-7 text-center">#{rank}</span>;
  };

  const getOutcomeIcon = (outcome: ScorePickBreakdown['outcome']) => {
    switch (outcome) {
      case 'EXACT_HIT': return <span title="Exact price hit!">⭐</span>;
      case 'NEAR_HIT': return <span title="Within 10%">✅</span>;
      case 'PLAYER_ONLY': return <span title="Correct player, price off">🏏</span>;
      case 'NOT_PURCHASED': return <span title="Not purchased by RCB">❌</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-rcb-muted">
        <Loader2 className="w-8 h-8 animate-spin text-rcb-red" />
        <span className="text-sm font-bold">Loading leaderboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-8 h-8 text-rcb-red" />
        <p className="text-sm text-rcb-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <Trophy className="w-6 h-6 text-rcb-gold" />
          <h2 className="text-2xl font-heading font-black uppercase text-white">RCB Fan Leaderboard</h2>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-rcb-muted">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{totalParticipants} Participants</span>
          </div>
          {contestStatus === 'RESULTS_LIVE' && (
            <div className="flex items-center gap-1.5 text-rcb-redBright font-bold">
              <span className="w-2 h-2 rounded-full bg-rcb-redBright animate-pulse" />
              <span>OFFICIAL RESULTS LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Results State */}
      {contestStatus !== 'RESULTS_LIVE' && (
        <div className="bg-rcb-card border border-rcb-border rounded-2xl p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-rcb-cardElevated border border-rcb-border mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-8 h-8 text-rcb-muted" />
          </div>
          <h3 className="font-heading font-black text-white text-lg mb-2">
            {contestStatus === 'OPEN' ? 'Contest is Open' : 'Predictions are Locked'}
          </h3>
          <p className="text-sm text-rcb-muted max-w-xs mx-auto">
            {contestStatus === 'OPEN'
              ? 'Scores and rankings will be published here after the official WPL 2027 Auction results are recorded by the admin.'
              : 'Predictions have been locked. Scores and rankings will appear here once official results are published.'}
          </p>
          {totalParticipants > 0 && (
            <div className="mt-4 px-4 py-2 rounded-xl bg-rcb-cardElevated inline-block">
              <span className="text-rcb-gold font-black font-mono text-lg">{totalParticipants}</span>
              <span className="text-rcb-muted text-xs ml-1">participants in the running</span>
            </div>
          )}
        </div>
      )}

      {/* Podium (Top 3) */}
      {contestStatus === 'RESULTS_LIVE' && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-5 items-end">
          {/* Rank 2 */}
          <div className="bg-rcb-card border border-rcb-border rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🥈</div>
            <div className="w-10 h-10 rounded-full bg-slate-700/60 border-2 border-slate-400 flex items-center justify-center mx-auto mb-2 text-slate-300 font-black text-sm">
              {entries[1].displayName.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-xs text-white truncate">{entries[1].displayName}</p>
            <p className="font-black font-mono text-sm text-slate-300">{entries[1].totalPoints} pts</p>
          </div>

          {/* Rank 1 */}
          <div className="bg-rcb-cardElevated border border-rcb-gold/50 rounded-2xl p-4 text-center shadow-gold-glow -mt-4 relative z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
            <div className="text-2xl mb-1 mt-2">🥇</div>
            <div className="w-12 h-12 rounded-full bg-rcb-gold/20 border-2 border-rcb-gold flex items-center justify-center mx-auto mb-2 text-rcb-gold font-black text-base">
              {entries[0].displayName.charAt(0).toUpperCase()}
            </div>
            <p className="font-heading font-black text-sm text-white truncate">{entries[0].displayName}</p>
            <p className="font-black font-mono text-base text-rcb-gold">{entries[0].totalPoints} pts</p>
          </div>

          {/* Rank 3 */}
          <div className="bg-rcb-card border border-rcb-border rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🥉</div>
            <div className="w-10 h-10 rounded-full bg-amber-900/40 border-2 border-amber-600 flex items-center justify-center mx-auto mb-2 text-amber-400 font-black text-sm">
              {entries[2].displayName.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-xs text-white truncate">{entries[2].displayName}</p>
            <p className="font-black font-mono text-sm text-amber-400">{entries[2].totalPoints} pts</p>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      {contestStatus === 'RESULTS_LIVE' && entries.length > 0 && (
        <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-rcb-border bg-rcb-charcoal/60 grid grid-cols-12 text-[10px] text-rcb-muted uppercase font-bold tracking-wider">
            <span className="col-span-1">Rank</span>
            <span className="col-span-4">Player</span>
            <span className="col-span-2 text-center">Pts</span>
            <span className="col-span-2 text-center hidden sm:block">✅ Picks</span>
            <span className="col-span-2 text-center hidden sm:block">⭐ Exact</span>
            <span className="col-span-1 text-right">Details</span>
          </div>

          {entries.map((entry) => {
            const isExpanded = expandedId === entry.participantId;

            return (
              <div key={entry.participantId} className="border-b border-rcb-border/40 last:border-0">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.participantId)}
                  className={`grid grid-cols-12 items-center px-4 py-3.5 cursor-pointer transition-colors hover:bg-rcb-cardElevated ${
                    entry.rank <= 3 ? 'bg-rcb-charcoal/30' : ''
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      entry.rank === 1 ? 'bg-rcb-gold/20 border border-rcb-gold text-rcb-gold' :
                      entry.rank === 2 ? 'bg-slate-700/60 border border-slate-400 text-slate-300' :
                      entry.rank === 3 ? 'bg-amber-900/40 border border-amber-600 text-amber-400' :
                      'bg-rcb-charcoal border border-rcb-border text-rcb-muted'
                    }`}>
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white truncate">{entry.displayName}</span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className={`font-mono font-black text-sm ${
                      entry.rank === 1 ? 'text-rcb-gold' : entry.rank <= 3 ? 'text-white' : 'text-rcb-muted'
                    }`}>{entry.totalPoints}</span>
                  </div>

                  <div className="col-span-2 text-center hidden sm:block text-sm font-mono text-rcb-muted">{entry.correctPicks}</div>
                  <div className="col-span-2 text-center hidden sm:block text-sm font-mono text-rcb-gold">{entry.exactPriceHits}</div>

                  <div className="col-span-1 flex justify-end text-rcb-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-rcb-charcoal/40 border-t border-rcb-border/40">
                    <p className="text-[10px] text-rcb-muted uppercase font-bold mt-3 mb-2">Scoring Breakdown</p>
                    <div className="space-y-2">
                      {entry.breakdown.map((bd) => (
                        <div key={bd.playerId} className="flex items-center gap-2 text-xs rounded-lg bg-rcb-card/60 border border-rcb-border/60 p-2.5">
                          <span className="text-base w-6 shrink-0">{getOutcomeIcon(bd.outcome)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">{bd.playerName}</span>
                              {bd.isOverseas && <Globe className="w-3 h-3 text-rcb-gold shrink-0" />}
                            </div>
                            <div className="text-rcb-muted text-[10px] flex gap-2 mt-0.5">
                              <span>Predicted: ₹{bd.predictedPriceLakh}L</span>
                              {bd.purchasedByRcb && bd.actualPriceLakh && (
                                <span>• Actual: ₹{bd.actualPriceLakh}L</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-mono font-black text-sm ${
                              bd.totalPoints > 0 ? 'text-emerald-400' : 'text-rcb-muted/50'
                            }`}>{bd.totalPoints > 0 ? `+${bd.totalPoints}` : '0'}</span>
                            <span className="text-[10px] text-rcb-muted block">pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-rcb-border/60">
                      <span className="text-xs text-rcb-muted">Total Score</span>
                      <span className="font-mono font-black text-rcb-gold text-sm">{entry.totalPoints} pts</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {contestStatus === 'RESULTS_LIVE' && entries.length === 0 && (
        <div className="text-center py-12 text-rcb-muted">
          <p>No scored entries found.</p>
        </div>
      )}
    </div>
  );
};
