import React from 'react';
import { Plus, Minus, Check, Trash2, Globe, Shield, IndianRupee } from 'lucide-react';
import { Player, SelectedPlayerPick } from '../types';

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  selectedPick?: SelectedPlayerPick;
  onSelect: (player: Player) => void;
  onRemove: (playerId: number) => void;
  onUpdatePrice: (playerId: number, newPrice: number) => void;
  canSelect: boolean;
  disabledReason?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isSelected,
  selectedPick,
  onSelect,
  onRemove,
  onUpdatePrice,
  canSelect,
  disabledReason,
}) => {
  const predictedPrice = selectedPick ? selectedPick.predictedPriceLakh : player.basePriceLakh;

  const handleStepPrice = (delta: number) => {
    const nextPrice = Math.max(player.basePriceLakh, predictedPrice + delta);
    onUpdatePrice(player.id, nextPrice);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'BATTER':
        return 'bg-blue-950/80 border-blue-500/40 text-blue-400';
      case 'ALL-ROUNDER':
        return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
      case 'WICKETKEEPER':
        return 'bg-amber-950/80 border-amber-500/40 text-amber-300';
      case 'BOWLER':
        return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400';
      default:
        return 'bg-gray-800 border-gray-600 text-gray-300';
    }
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-200 border overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'bg-rcb-cardElevated border-rcb-red shadow-red-glow ring-1 ring-rcb-red'
          : 'bg-rcb-card border-rcb-border hover:border-rcb-borderLight hover:bg-rcb-cardElevated/70'
      }`}
    >
      {/* Top Details Header */}
      <div className="p-3.5 sm:p-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Role and Classification Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRoleBadgeColor(player.specialism)}`}>
              {player.specialism}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rcb-charcoal border border-rcb-border text-rcb-muted">
              {player.classification}
            </span>
            {player.previousWplTeam && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                player.previousWplTeam === 'RCB' 
                  ? 'bg-rcb-red/20 text-rcb-redBright border-rcb-red/40' 
                  : 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30'
              }`}>
                {player.previousWplTeam === 'RCB' ? '★ EX-RCB' : player.previousWplTeam}
              </span>
            )}
          </div>

          {/* Country Flag / Tag */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rcb-muted shrink-0">
            {player.isOverseas ? (
              <span className="flex items-center gap-1 text-rcb-gold">
                <Globe className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{player.country}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-white">
                <span>🇮🇳</span>
                <span>{player.stateAssociation || 'India'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Player Name */}
        <h4 className="text-base font-heading font-black text-white leading-tight mb-1 truncate">
          {player.fullName}
        </h4>

        {/* Player Attributes / Style */}
        <div className="text-[11px] text-rcb-muted line-clamp-1 flex items-center gap-2 mb-2 font-mono">
          <span>{player.battingHand || 'Bat'}</span>
          {player.bowlingStyle && (
            <>
              <span>•</span>
              <span className="truncate">{player.bowlingStyle}</span>
            </>
          )}
          <span>• Age {player.age}</span>
        </div>

        {/* Base Price Label */}
        <div className="flex items-baseline justify-between py-1 border-t border-rcb-border/40 text-xs">
          <span className="text-rcb-muted uppercase font-bold text-[10px]">Base Price</span>
          <span className="font-mono font-bold text-rcb-gold text-sm">
            ₹{player.basePriceLakh} Lakh
          </span>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="p-3.5 sm:p-4 pt-2 bg-rcb-charcoal/40 border-t border-rcb-border/60">
        {isSelected ? (
          <div className="space-y-2.5">
            {/* Price Prediction Control */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Predicted Buy Price
              </span>
              <span className="text-xs font-mono font-black text-emerald-400">
                ₹{predictedPrice} Lakh
              </span>
            </div>

            {/* Price Stepper */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepPrice(-5)}
                disabled={predictedPrice <= player.basePriceLakh}
                className="px-2 py-1.5 rounded-lg bg-rcb-card border border-rcb-border hover:bg-rcb-border text-[11px] font-mono font-bold text-rcb-muted disabled:opacity-30 disabled:cursor-not-allowed"
                title="Decrease by ₹5 Lakh"
              >
                -5L
              </button>
              <button
                type="button"
                onClick={() => handleStepPrice(-1)}
                disabled={predictedPrice <= player.basePriceLakh}
                className="p-1.5 rounded-lg bg-rcb-card border border-rcb-border hover:bg-rcb-border text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Decrease by ₹1 Lakh"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 text-center font-mono font-black text-sm bg-rcb-dark border border-rcb-border rounded-lg py-1 text-white">
                ₹{predictedPrice}L
              </div>

              <button
                type="button"
                onClick={() => handleStepPrice(1)}
                className="p-1.5 rounded-lg bg-rcb-card border border-rcb-border hover:bg-rcb-border text-white"
                title="Increase by ₹1 Lakh"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStepPrice(5)}
                className="px-2 py-1.5 rounded-lg bg-rcb-card border border-rcb-border hover:bg-rcb-border text-[11px] font-mono font-bold text-rcb-gold"
                title="Increase by ₹5 Lakh"
              >
                +5L
              </button>
            </div>

            {/* Remove from Squad Button */}
            <button
              type="button"
              onClick={() => onRemove(player.id)}
              className="w-full py-1.5 rounded-lg bg-rcb-red/15 hover:bg-rcb-red/25 border border-rcb-red/40 text-rcb-redBright text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Squad</span>
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              disabled={!canSelect}
              onClick={() => onSelect(player)}
              className={`w-full py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                canSelect
                  ? 'bg-rcb-cardElevated hover:bg-rcb-red hover:text-white text-white border border-rcb-border hover:border-rcb-red shadow-sm'
                  : 'bg-rcb-card/40 border border-rcb-border/40 text-rcb-muted/50 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Select Player</span>
            </button>
            {!canSelect && disabledReason && (
              <span className="text-[10px] text-rcb-redBright/80 text-center block mt-1">
                {disabledReason}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
