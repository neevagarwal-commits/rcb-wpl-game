import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, AlertCircle, Loader2, Users, BarChart3,
  Settings, Download, Lock, Unlock, Eye, CheckCircle,
  Search, Edit2, Save, X, Globe, ChevronDown, RefreshCw,
  AlertTriangle, ClipboardList, FileText, Trash2, UserX
} from 'lucide-react';
import { api } from '../services/api';
import { AdminStats, ContestSettings } from '../types';

interface AdminDashboardProps {}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'players' | 'contest' | 'participants' | 'audit'>('overview');

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [contestSettings, setContestSettings] = useState<ContestSettings | null>(null);
  const [adminPlayers, setAdminPlayers] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [previewScores, setPreviewScores] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [pendingResults, setPendingResults] = useState<Record<number, { purchasedByRcb: boolean; actualPriceLakh: string; notes: string }>>({});
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [unpublishConfirm, setUnpublishConfirm] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'entry' | 'participant'>('entry');

  const handleVerify = async () => {
    setVerifying(true);
    setAuthError(null);
    try {
      const valid = await api.adminVerify(adminSecret);
      if (valid) {
        setIsAuthenticated(true);
        loadAllData();
      } else {
        setAuthError('Invalid admin secret. Access denied.');
      }
    } catch {
      setAuthError('Could not verify admin credentials. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, settings, playerList] = await Promise.all([
        api.adminGetOverview(adminSecret),
        api.getContest(),
        api.adminGetPlayers(adminSecret),
      ]);
      setStats(statsData);
      setContestSettings(settings);
      setAdminPlayers(playerList);

      // Initialize pending results from existing data
      const initialPending: typeof pendingResults = {};
      playerList.forEach((p: any) => {
        initialPending[p.id] = {
          purchasedByRcb: p.purchasedByRcb || false,
          actualPriceLakh: p.actualPriceLakh != null ? String(p.actualPriceLakh) : '',
          notes: p.adminNotes || '',
        };
      });
      setPendingResults(initialPending);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const data = await api.adminGetParticipants(adminSecret);
      setParticipants(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.adminGetAuditLogs(adminSecret);
      setAuditLogs(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    setError(null);
    setSuccessMsg(null);
    if (section === 'participants') loadParticipants();
    if (section === 'audit') loadAuditLogs();
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = Object.entries(pendingResults).map(([id, val]) => ({
        playerId: parseInt(id, 10),
        purchasedByRcb: val.purchasedByRcb,
        actualPriceLakh: val.purchasedByRcb && val.actualPriceLakh ? parseInt(val.actualPriceLakh, 10) : null,
        notes: val.notes || null,
      }));
      await api.adminSaveAuctionResults(adminSecret, results);
      showSuccess('Auction results saved successfully!');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContestStatusChange = async (status: string) => {
    try {
      await api.adminUpdateSettings(adminSecret, { status });
      showSuccess(`Contest status updated to ${status}`);
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePublishResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminPublishResults(adminSecret);
      setPreviewScores(data.leaderboard || []);
      showSuccess(`Results published! ${data.leaderboard?.length || 0} participants scored.`);
      setPublishConfirm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublishResults = async () => {
    setLoading(true);
    try {
      await api.adminUnpublishResults(adminSecret);
      showSuccess('Results unpublished. Contest returned to LOCKED status.');
      setUnpublishConfirm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewScores = async () => {
    try {
      const scores = await api.adminPreviewScores(adminSecret);
      setPreviewScores(scores);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEntry = async (participantId: string) => {
    try {
      setLoading(true);
      await api.adminDeleteEntry(adminSecret, participantId);
      showSuccess('Prediction entry removed successfully.');
      setConfirmDeleteId(null);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
      setLoading(true);
      await api.adminDeleteParticipant(adminSecret, participantId);
      showSuccess('Participant and all their records deleted successfully.');
      setConfirmDeleteId(null);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete participant');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async (includeParticipants = false) => {
    try {
      setLoading(true);
      const res = await api.adminClearAllEntries(adminSecret, includeParticipants);
      showSuccess(res.message || 'All entries cleared successfully.');
      setConfirmClearAll(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to clear entries');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) return adminPlayers;
    const q = playerSearch.toLowerCase();
    return adminPlayers.filter(p =>
      p.fullName.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      p.specialism.toLowerCase().includes(q)
    );
  }, [adminPlayers, playerSearch]);

  // ─── Auth Gate ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-start justify-center px-4 py-10 overflow-y-auto">
        <div className="w-full max-w-sm bg-rcb-card border border-rcb-border rounded-2xl p-7">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-rcb-gold/20 border border-rcb-gold/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rcb-gold" />
            </div>
            <div>
              <h2 className="font-heading font-black text-white text-lg">Admin Access</h2>
              <p className="text-[11px] text-rcb-muted">Protected administrator dashboard</p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rcb-red/15 border border-rcb-red/40 text-red-200 text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
            <div className="mb-4">
              <label className="text-xs font-bold text-white uppercase mb-1.5 block">Admin Secret</label>
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret..."
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-3 py-3 rounded-xl bg-rcb-charcoal border border-rcb-border text-white text-sm outline-none focus:border-rcb-gold transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !adminSecret}
              className="w-full py-3.5 rounded-xl bg-rcb-gold hover:bg-rcb-goldLight text-rcb-dark font-heading font-black text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verify &amp; Enter Dashboard
            </button>
          </form>

          <p className="text-[10px] text-rcb-muted text-center mt-3">
            ⚠️ Admin secret must be set via ADMIN_SECRET environment variable. Never hardcode secrets.
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rcb-gold" />
          <h2 className="font-heading font-black text-white text-xl uppercase">Admin Dashboard</h2>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rcb-card border border-rcb-border text-rcb-muted hover:text-white text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rcb-red/15 border border-rcb-red/40 text-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-rcb-border pb-4">
        {([
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'players', label: 'Players & Results', icon: Users },
          { id: 'contest', label: 'Contest Management', icon: Settings },
          { id: 'participants', label: 'Participants', icon: ClipboardList },
          { id: 'audit', label: 'Audit Log', icon: FileText },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSectionChange(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeSection === id
                ? 'bg-rcb-gold text-rcb-dark'
                : 'bg-rcb-card border border-rcb-border text-rcb-muted hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── SECTION: Overview ── */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Participants', value: stats.totalParticipants, color: 'text-white' },
              { label: 'Total Entries', value: stats.totalEntries, color: 'text-emerald-400' },
              { label: 'RCB Purchases Recorded', value: stats.rcbPurchasesCount, color: 'text-rcb-gold' },
              { label: 'Contest Status', value: stats.contestStatus, color: stats.contestStatus === 'OPEN' ? 'text-emerald-400' : stats.contestStatus === 'RESULTS_LIVE' ? 'text-rcb-redBright' : 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-rcb-card border border-rcb-border rounded-2xl p-4">
                <span className="text-[10px] text-rcb-muted uppercase font-bold block mb-1">{label}</span>
                <span className={`text-2xl font-mono font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {stats.resultsPublished && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300 text-sm">Results are live!</p>
                <p className="text-xs text-rcb-muted">Published at: {stats.resultsPublishedAt}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION: Players & Auction Results ── */}
      {activeSection === 'players' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-rcb-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search player, country, role..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-rcb-card border border-rcb-border text-sm text-white outline-none focus:border-rcb-gold placeholder:text-rcb-muted/60"
              />
            </div>

            <button
              onClick={handleSaveResults}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-rcb-gold hover:bg-rcb-goldLight text-rcb-dark font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save All Results
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-3 text-[11px] text-rcb-muted">
            <span className="flex items-center gap-1">⬜ Not Reviewed</span>
            <span className="flex items-center gap-1 text-emerald-400">✅ RCB Purchased</span>
            <span className="flex items-center gap-1 text-rcb-muted/60">❌ Not Purchased</span>
          </div>

          <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2.5 border-b border-rcb-border text-[10px] text-rcb-muted uppercase font-bold bg-rcb-charcoal/40">
              <span className="col-span-4">Player</span>
              <span className="col-span-2">Role</span>
              <span className="col-span-1 text-right">Base ₹</span>
              <span className="col-span-2 text-center">RCB Buy?</span>
              <span className="col-span-2 text-center">Actual ₹ (L)</span>
              <span className="col-span-1 text-center">Status</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredPlayers.map((player) => {
                const pending = pendingResults[player.id] || { purchasedByRcb: false, actualPriceLakh: '', notes: '' };
                const isReviewed = player.reviewed;
                const isPurchased = pending.purchasedByRcb;

                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-12 items-center px-4 py-3 border-b border-rcb-border/40 last:border-0 text-sm ${
                      isPurchased && isReviewed ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    <div className="col-span-4 min-w-0">
                      <div className="font-bold text-white truncate text-xs">{player.fullName}</div>
                      <div className="text-[10px] text-rcb-muted flex items-center gap-1">
                        {player.isOverseas ? <Globe className="w-2.5 h-2.5 text-rcb-gold" /> : '🇮🇳'}
                        <span className="truncate">{player.country}</span>
                      </div>
                    </div>

                    <div className="col-span-2 text-[11px] text-rcb-muted truncate">{player.specialism}</div>

                    <div className="col-span-1 text-right text-[11px] font-mono font-bold text-rcb-gold">
                      {player.basePriceLakh}L
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPurchased}
                          onChange={(e) =>
                            setPendingResults(prev => ({
                              ...prev,
                              [player.id]: { ...prev[player.id], purchasedByRcb: e.target.checked, actualPriceLakh: '' }
                            }))
                          }
                          className="w-4 h-4 accent-rcb-red rounded cursor-pointer"
                        />
                        <span className="text-[10px] text-rcb-muted">Yes</span>
                      </label>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {isPurchased ? (
                        <input
                          type="number"
                          min={player.basePriceLakh}
                          step={5}
                          value={pending.actualPriceLakh}
                          onChange={(e) =>
                            setPendingResults(prev => ({
                              ...prev,
                              [player.id]: { ...prev[player.id], actualPriceLakh: e.target.value }
                            }))
                          }
                          placeholder={`≥${player.basePriceLakh}`}
                          className="w-20 px-2 py-1 text-center rounded-lg bg-rcb-charcoal border border-rcb-border text-white text-xs outline-none focus:border-rcb-gold font-mono"
                        />
                      ) : (
                        <span className="text-[10px] text-rcb-muted/40">N/A</span>
                      )}
                    </div>

                    <div className="col-span-1 flex justify-center">
                      {!isReviewed ? (
                        <span className="text-[10px] text-rcb-muted">—</span>
                      ) : isPurchased ? (
                        <span className="text-emerald-400 text-sm">✅</span>
                      ) : (
                        <span className="text-rcb-muted/40 text-sm">❌</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: Contest Management ── */}
      {activeSection === 'contest' && contestSettings && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-rcb-card border border-rcb-border rounded-2xl p-5">
            <h3 className="font-heading font-black text-white text-sm uppercase mb-4">Contest Status Control</h3>
            <div className="flex gap-2 flex-wrap mb-4">
              {(['OPEN', 'LOCKED', 'RESULTS_LIVE'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => handleContestStatusChange(status)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    contestSettings.status === status
                      ? status === 'OPEN' ? 'bg-emerald-600 text-white'
                        : status === 'LOCKED' ? 'bg-amber-600 text-white'
                        : 'bg-rcb-red text-white'
                      : 'bg-rcb-charcoal border border-rcb-border text-rcb-muted hover:text-white'
                  }`}
                >
                  {status === 'OPEN' ? '🟢 Open' : status === 'LOCKED' ? '🔒 Lock' : '📣 Results Live'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-rcb-muted">Current status: <span className="text-white font-bold">{contestSettings.status}</span></p>
          </div>

          <div className="bg-rcb-card border border-rcb-border rounded-2xl p-5">
            <h3 className="font-heading font-black text-white text-sm uppercase mb-4">Publish / Unpublish Results</h3>

            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={handlePreviewScores}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rcb-charcoal border border-rcb-border text-white font-bold text-xs hover:bg-rcb-card transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Scores
              </button>

              {!publishConfirm ? (
                <button
                  onClick={() => setPublishConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rcb-red hover:bg-rcb-redBright text-white font-bold text-xs shadow-red-glow transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Publish Results
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200">Publish official results for all fans?</span>
                  <button onClick={handlePublishResults} className="px-3 py-1 rounded-lg bg-rcb-red text-white font-bold text-xs">Yes, Publish</button>
                  <button onClick={() => setPublishConfirm(false)} className="px-3 py-1 rounded-lg bg-rcb-charcoal border border-rcb-border text-white font-bold text-xs">Cancel</button>
                </div>
              )}

              {contestSettings.status === 'RESULTS_LIVE' && (
                !unpublishConfirm ? (
                  <button
                    onClick={() => setUnpublishConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rcb-charcoal border border-rcb-border text-rcb-muted hover:text-white font-bold text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Unpublish / Reset
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rcb-red/15 border border-rcb-red/40">
                    <AlertTriangle className="w-4 h-4 text-rcb-red shrink-0" />
                    <span className="text-xs text-red-200">Reset published results?</span>
                    <button onClick={handleUnpublishResults} className="px-3 py-1 rounded-lg bg-rcb-charcoal border border-rcb-border text-white font-bold text-xs">Yes</button>
                    <button onClick={() => setUnpublishConfirm(false)} className="px-3 py-1 rounded-lg bg-rcb-card border border-rcb-border text-white font-bold text-xs">Cancel</button>
                  </div>
                )
              )}
            </div>

            {/* Score Preview */}
            {previewScores.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-white mb-2 uppercase">Score Preview (Top 10)</h4>
                <div className="space-y-1.5">
                  {previewScores.slice(0, 10).map((entry: any) => (
                    <div key={entry.participantId} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-rcb-charcoal border border-rcb-border/50 text-xs">
                      <span className="text-rcb-muted w-5 text-center font-mono">#{entry.rank}</span>
                      <span className="flex-1 font-bold text-white truncate">{entry.displayName}</span>
                      <span className="font-mono text-rcb-gold font-black">{entry.totalPoints} pts</span>
                      <span className="text-rcb-muted text-[10px]">{entry.correctPicks}✓ {entry.exactPriceHits}⭐</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="bg-rcb-card border border-rcb-border rounded-2xl p-5">
            <h3 className="font-heading font-black text-white text-sm uppercase mb-3">Export</h3>
            <a
              href={`/api/admin/export-csv?unmask=false`}
              onClick={(e) => {
                e.preventDefault();
                const link = document.createElement('a');
                link.href = `/api/admin/export-csv`;
                const headers = new Headers({ 'x-admin-secret': adminSecret });
                fetch('/api/admin/export-csv', { headers }).then(r => r.blob()).then(blob => {
                  link.href = URL.createObjectURL(blob);
                  link.download = 'rcb_entries.csv';
                  link.click();
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rcb-charcoal border border-rcb-border text-white font-bold text-xs hover:bg-rcb-card transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Entries CSV
            </a>
          </div>
        </div>
      )}

      {/* ── SECTION: Participants ── */}
      {activeSection === 'participants' && (
        <div className="space-y-4">
          <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-rcb-border bg-rcb-charcoal/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Participants ({participants.length})
                </h3>
                <p className="text-[11px] text-rcb-muted mt-0.5">
                  Manage fan registrations and prediction squads.
                </p>
              </div>

              {/* Clear All Controls */}
              {participants.length > 0 && (
                <div>
                  {!confirmClearAll ? (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      className="px-3 py-1.5 rounded-lg bg-rcb-red/15 hover:bg-rcb-red/25 border border-rcb-red/40 text-rcb-redBright text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete All Test Entries</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-rcb-red/20 border border-rcb-red/50">
                      <span className="text-[11px] text-red-200 font-bold">Wipe all entries?</span>
                      <button
                        onClick={() => handleClearAll(true)}
                        className="px-2.5 py-1 rounded bg-rcb-red text-white text-[11px] font-black hover:bg-rcb-redBright"
                      >
                        Yes, Delete All
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2 py-1 rounded bg-rcb-card border border-rcb-border text-rcb-muted text-[11px] font-bold hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {participants.map((p: any) => (
                <div key={p.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 border-b border-rcb-border/40 last:border-0 text-xs">
                  <div className="col-span-3 font-bold text-white truncate" title={p.displayName}>
                    {p.displayName}
                  </div>
                  <div className="col-span-2 font-mono text-rcb-muted truncate">{p.phone}</div>
                  <div className="col-span-2 text-rcb-muted">{new Date(p.registeredAt).toLocaleDateString('en-IN')}</div>
                  <div className="col-span-2 text-center">
                    {p.hasEntry ? (
                      <span className="text-emerald-400 font-bold">✅ Saved</span>
                    ) : (
                      <span className="text-rcb-muted/60">No Entry</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right font-mono font-black text-rcb-gold">
                    {p.score ? `${p.score.totalPoints} pts` : '—'}
                  </div>

                  {/* Action Column */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {confirmDeleteId === p.id ? (
                      <div className="flex items-center gap-1 bg-rcb-dark border border-rcb-red/60 rounded-lg p-1">
                        <button
                          onClick={() => deleteMode === 'entry' ? handleDeleteEntry(p.id) : handleDeleteParticipant(p.id)}
                          className="px-1.5 py-0.5 rounded bg-rcb-red text-white text-[10px] font-bold"
                          title="Confirm Delete"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1 py-0.5 rounded text-rcb-muted hover:text-white text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {p.hasEntry && (
                          <button
                            onClick={() => { setConfirmDeleteId(p.id); setDeleteMode('entry'); }}
                            className="p-1.5 rounded-lg bg-rcb-charcoal hover:bg-rcb-red/20 text-rcb-muted hover:text-rcb-redBright border border-rcb-border transition-colors"
                            title="Delete Squad Entry only"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { setConfirmDeleteId(p.id); setDeleteMode('participant'); }}
                          className="p-1.5 rounded-lg bg-rcb-charcoal hover:bg-rcb-red/20 text-rcb-muted hover:text-rcb-redBright border border-rcb-border transition-colors"
                          title="Delete Participant and All Records"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="py-14 text-center text-rcb-muted text-sm">
                  No participants or entries yet. Clean slate!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: Audit Log ── */}
      {activeSection === 'audit' && (
        <div className="bg-rcb-card border border-rcb-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-rcb-border bg-rcb-charcoal/40">
            <h3 className="text-xs font-bold text-white uppercase">Audit Log ({auditLogs.length})</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-rcb-border/40 last:border-0 text-xs">
                <div className="text-rcb-muted font-mono shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-rcb-gold">{log.action}</span>
                  <span className="text-rcb-muted ml-2">{log.details}</span>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="py-12 text-center text-rcb-muted text-sm">No audit logs yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
