import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Globe, Flag, SortAsc, X, ChevronDown, Users, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { Player, SelectedPlayerPick, ContestSettings } from '../types';
import { PlayerCard } from './PlayerCard';
import { PurseSummary } from './PurseSummary';
import { api } from '../services/api';

interface SquadBuilderProps {
  participantId: string | null;
  picks: SelectedPlayerPick[];
  setPicks: (picks: SelectedPlayerPick[]) => void;
  contestSettings: ContestSettings;
  onSave: () => void;
  onOpenAuth: () => void;
}

type RoleFilter = 'ALL' | 'BATTER' | 'ALL-ROUNDER' | 'WICKETKEEPER' | 'BOWLER';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
type PlayerTab = 'indian' | 'overseas';

export const SquadBuilder: React.FC<SquadBuilderProps> = ({
  participantId,
  picks,
  setPicks,
  contestSettings,
  onSave,
  onOpenAuth,
}) => {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PlayerTab>('indian');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const players = await api.getPlayers();
        setAllPlayers(players);
      } catch (err: any) {
        setError(err.message || 'Failed to load players');
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  // Build a player map for lookups
  const playersMap = useMemo(() => {
    const map = new Map<number, Player>();
    allPlayers.forEach(p => map.set(p.id, p));
    return map;
  }, [allPlayers]);

  // Filter and sort players for current tab
  const filteredPlayers = useMemo(() => {
    let list = allPlayers.filter(p => p.isOverseas === (activeTab === 'overseas'));

    if (roleFilter !== 'ALL') {
      list = list.filter(p => p.specialism === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        (p.stateAssociation?.toLowerCase().includes(q) ?? false)
      );
    }

    if (showSelectedOnly) {
      const selectedIds = new Set(picks.map(p => p.playerId));
      list = list.filter(p => selectedIds.has(p.id));
    }

    switch (sortOption) {
      case 'price-asc':
        list.sort((a, b) => a.basePriceLakh - b.basePriceLakh || a.fullName.localeCompare(b.fullName));
        break;
      case 'price-desc':
        list.sort((a, b) => b.basePriceLakh - a.basePriceLakh || a.fullName.localeCompare(b.fullName));
        break;
      case 'name-asc':
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      default:
        list.sort((a, b) => a.id - b.id);
    }

    return list;
  }, [allPlayers, activeTab, roleFilter, searchQuery, showSelectedOnly, picks, sortOption]);

  const selectedIds = useMemo(() => new Set(picks.map(p => p.playerId)), [picks]);
  const overseasSelected = useMemo(() => picks.filter(p => playersMap.get(p.playerId)?.isOverseas).length, [picks, playersMap]);
  const totalSpend = useMemo(() => picks.reduce((s, p) => s + p.predictedPriceLakh, 0), [picks]);

  const handleSelectPlayer = (player: Player) => {
    if (selectedIds.has(player.id)) return;
    if (picks.length >= contestSettings.maxPicks) return;
    if (player.isOverseas && overseasSelected >= contestSettings.maxOverseas) return;
    if (totalSpend + player.basePriceLakh > contestSettings.maxPurseLakh) return;

    setPicks([...picks, { playerId: player.id, predictedPriceLakh: player.basePriceLakh }]);
  };

  const handleRemovePlayer = (playerId: number) => {
    setPicks(picks.filter(p => p.playerId !== playerId));
  };

  const handleUpdatePrice = (playerId: number, newPrice: number) => {
    setPicks(picks.map(p => p.playerId === playerId ? { ...p, predictedPriceLakh: newPrice } : p));
  };

  const getDisabledReason = (player: Player): string | undefined => {
    if (isLocked) return `Contest is ${contestSettings.status === 'RESULTS_LIVE' ? 'Results Live' : 'Locked'}`;
    if (picks.length >= contestSettings.maxPicks) return `Max ${contestSettings.maxPicks} picks reached`;
    if (player.isOverseas && overseasSelected >= contestSettings.maxOverseas) return `Max ${contestSettings.maxOverseas} overseas players reached`;
    if (totalSpend + player.basePriceLakh > contestSettings.maxPurseLakh) return `Would exceed ₹${contestSettings.maxPurseLakh}L purse`;
    return undefined;
  };

  const isSubmittable = picks.length >= contestSettings.minPicks &&
    picks.length <= contestSettings.maxPicks &&
    overseasSelected <= contestSettings.maxOverseas &&
    totalSpend <= contestSettings.maxPurseLakh;

  const isLocked = contestSettings.status !== 'OPEN';

  const indianCount = allPlayers.filter(p => !p.isOverseas).length;
  const overseasCount = allPlayers.filter(p => p.isOverseas).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      {/* Builder Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-heading font-black text-white uppercase">Squad Builder</h2>
          <p className="text-xs text-rcb-muted mt-0.5">
            Select 2–5 players and predict their auction prices
          </p>
        </div>

        {isLocked ? (
          <div className="px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <span>🔒</span>
            <span>Predictions Locked</span>
          </div>
        ) : isSubmittable ? (
          <button
            onClick={participantId ? onSave : onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-rcb-red hover:bg-rcb-redBright text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-red-glow"
          >
            Review & Save →
          </button>
        ) : null}
      </div>

      {/* Indian vs Overseas Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('indian')}
          className={`flex-1 py-3 rounded-xl font-heading font-black text-sm uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
            activeTab === 'indian'
              ? 'bg-rcb-card border-rcb-border text-white shadow-sm'
              : 'bg-transparent border-rcb-border/40 text-rcb-muted hover:text-white hover:border-rcb-border'
          }`}
        >
          <span>🇮🇳</span>
          <span>Indian Players</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 bg-rcb-charcoal rounded text-rcb-muted">{indianCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('overseas')}
          className={`flex-1 py-3 rounded-xl font-heading font-black text-sm uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
            activeTab === 'overseas'
              ? 'bg-rcb-card border-rcb-border text-white shadow-sm'
              : 'bg-transparent border-rcb-border/40 text-rcb-muted hover:text-white hover:border-rcb-border'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Overseas Players</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 bg-rcb-charcoal rounded text-rcb-muted">{overseasCount}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-rcb-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-rcb-card border border-rcb-border text-sm text-white placeholder:text-rcb-muted/60 outline-none focus:border-rcb-red transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-rcb-muted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'BATTER', 'ALL-ROUNDER', 'WICKETKEEPER', 'BOWLER'] as RoleFilter[]).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
                roleFilter === role
                  ? 'bg-rcb-red text-white'
                  : 'bg-rcb-card border border-rcb-border text-rcb-muted hover:text-white'
              }`}
            >
              {role === 'ALL' ? 'All' : role === 'ALL-ROUNDER' ? 'AR' : role === 'WICKETKEEPER' ? 'WK' : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="pl-3 pr-8 py-2 rounded-xl bg-rcb-card border border-rcb-border text-xs text-rcb-muted outline-none focus:border-rcb-borderLight appearance-none cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="price-desc">Price ↓ High First</option>
            <option value="price-asc">Price ↑ Low First</option>
            <option value="name-asc">A–Z Name</option>
          </select>
          <ChevronDown className="w-3 h-3 text-rcb-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Show Selected Only Toggle */}
        {picks.length > 0 && (
          <button
            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
              showSelectedOnly
                ? 'bg-emerald-900/70 border border-emerald-500/50 text-emerald-400'
                : 'bg-rcb-card border border-rcb-border text-rcb-muted hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Selected ({picks.length})</span>
          </button>
        )}

        {/* Clear Filters */}
        {(roleFilter !== 'ALL' || searchQuery || showSelectedOnly || sortOption !== 'default') && (
          <button
            onClick={() => {
              setRoleFilter('ALL');
              setSearchQuery('');
              setShowSelectedOnly(false);
              setSortOption('default');
            }}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rcb-muted hover:text-rcb-red flex items-center gap-1 bg-rcb-card border border-rcb-border"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Player Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-rcb-muted gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rcb-red" />
          <p className="text-sm font-bold">Loading {activeTab === 'indian' ? 'Indian' : 'Overseas'} players...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-8 h-8 text-rcb-red" />
          <p className="text-sm text-rcb-muted">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-rcb-card border border-rcb-border text-white text-sm font-bold">
            Retry
          </button>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-rcb-muted">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-base font-bold">No players found</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); setShowSelectedOnly(false); }}
            className="mt-2 px-4 py-2 rounded-lg bg-rcb-card border border-rcb-border text-sm font-bold text-white hover:bg-rcb-cardElevated"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredPlayers.map(player => {
            const isSelected = selectedIds.has(player.id);
            const pick = picks.find(p => p.playerId === player.id);
            const disabledReason = !isSelected ? getDisabledReason(player) : undefined;

            return (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={isSelected}
                selectedPick={pick}
                onSelect={handleSelectPlayer}
                onRemove={handleRemovePlayer}
                onUpdatePrice={handleUpdatePrice}
                canSelect={!isLocked && !isSelected && !disabledReason}
                disabledReason={disabledReason}
              />
            );
          })}
        </div>
      )}

      {/* Sticky Purse Summary */}
      <PurseSummary
        picks={picks}
        playersMap={playersMap}
        maxPurseLakh={contestSettings.maxPurseLakh}
        maxPicks={contestSettings.maxPicks}
        minPicks={contestSettings.minPicks}
        maxOverseas={contestSettings.maxOverseas}
      />
    </div>
  );
};
