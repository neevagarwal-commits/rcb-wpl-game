import React from 'react';
import { IndianRupee, Users, Globe, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SelectedPlayerPick, Player } from '../types';

interface PurseSummaryProps {
  picks: SelectedPlayerPick[];
  playersMap: Map<number, Player>;
  maxPurseLakh: number;
  maxPicks: number;
  minPicks: number;
  maxOverseas: number;
}

export const PurseSummary: React.FC<PurseSummaryProps> = ({
  picks,
  playersMap,
  maxPurseLakh,
  maxPicks,
  minPicks,
  maxOverseas,
}) => {
  const totalSpend = picks.reduce((sum, p) => sum + p.predictedPriceLakh, 0);
  const remaining = maxPurseLakh - totalSpend;
  const overseasCount = picks.filter(p => playersMap.get(p.playerId)?.isOverseas).length;
  const indianCount = picks.filter(p => !playersMap.get(p.playerId)?.isOverseas).length;
  const isOverBudget = remaining < 0;
  const isReady = picks.length >= minPicks && !isOverBudget && overseasCount <= maxOverseas;

  const budgetPercent = Math.min(100, (totalSpend / maxPurseLakh) * 100);

  return (
    <div className={`sticky bottom-[64px] md:bottom-0 z-30 border-t transition-colors ${
      isOverBudget 
        ? 'bg-red-950/95 border-rcb-red' 
        : 'bg-rcb-charcoal/97 border-rcb-border'
    } backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.4)]`}>
      {/* Budget Bar */}
      <div className="h-1 bg-rcb-border relative overflow-hidden">
        <div
          className={`h-full absolute left-0 top-0 transition-all duration-300 rounded-r ${
            isOverBudget ? 'bg-rcb-red' : budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(budgetPercent, 100)}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Picks Counter */}
        <div className="flex items-center gap-1.5 bg-rcb-card/70 border border-rcb-border rounded-lg px-2.5 py-1.5 shrink-0">
          <Users className="w-3.5 h-3.5 text-rcb-muted" />
          <span className="text-xs font-mono font-bold text-white">{picks.length}/{maxPicks}</span>
          <span className="text-[10px] text-rcb-muted">PICKS</span>
        </div>

        {/* Indian / Overseas Split */}
        <div className="flex items-center gap-1.5 bg-rcb-card/70 border border-rcb-border rounded-lg px-2.5 py-1.5 shrink-0">
          <span className="text-xs">🇮🇳</span>
          <span className="text-xs font-mono font-bold text-white">{indianCount}</span>
          <Globe className={`w-3.5 h-3.5 ${overseasCount > maxOverseas ? 'text-rcb-red' : 'text-rcb-muted'}`} />
          <span className={`text-xs font-mono font-bold ${overseasCount > maxOverseas ? 'text-rcb-redBright' : 'text-white'}`}>
            {overseasCount}/{maxOverseas}
          </span>
          <span className="text-[10px] text-rcb-muted">OVERSEAS</span>
        </div>

        {/* Total Spend */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-rcb-muted uppercase font-bold">Spend:</span>
          <span className="text-sm font-mono font-black text-white">₹{totalSpend}L</span>
        </div>

        {/* Remaining Purse */}
        <div className={`flex items-center gap-1.5 ml-auto shrink-0 font-mono font-black text-sm px-3 py-1.5 rounded-lg border ${
          isOverBudget
            ? 'bg-rcb-red/20 border-rcb-red text-rcb-redBright'
            : remaining < 20
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
        }`}>
          {isOverBudget ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>OVER ₹{Math.abs(remaining)}L</span>
            </>
          ) : (
            <>
              <IndianRupee className="w-3.5 h-3.5" />
              <span>₹{remaining}L LEFT</span>
            </>
          )}
        </div>

        {/* Ready Indicator */}
        {isReady && (
          <div className="flex items-center gap-1 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold hidden sm:inline">READY</span>
          </div>
        )}
      </div>
    </div>
  );
};
