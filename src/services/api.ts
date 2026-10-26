import { 
  Player, 
  Participant, 
  PredictionEntry, 
  ContestSettings, 
  LeaderboardEntry,
  AdminStats 
} from '../types';

const API_BASE = '/api';

export const api = {
  // --- Public APIs ---
  async getContest(): Promise<ContestSettings> {
    const res = await fetch(`${API_BASE}/contest`);
    if (!res.ok) throw new Error('Failed to load contest status');
    return res.json();
  },

  async getPlayers(params?: { search?: string; role?: string; overseas?: boolean; sort?: string }): Promise<Player[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.overseas !== undefined) query.append('overseas', String(params.overseas));
    if (params?.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/players?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch player list');
    return res.json();
  },

  async enterParticipant(phone: string, displayName: string): Promise<{ participant: Participant; isNew: boolean; entry: PredictionEntry | null }> {
    const res = await fetch(`${API_BASE}/participants/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, displayName }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to enter contest');
    return data;
  },

  async getEntry(participantId: string): Promise<PredictionEntry | null> {
    const res = await fetch(`${API_BASE}/entries/${participantId}`);
    if (!res.ok) throw new Error('Failed to fetch squad prediction');
    const data = await res.json();
    return data.entry;
  },

  async saveEntry(participantId: string, picks: { playerId: number; predictedPriceLakh: number }[]): Promise<{ success: boolean; entry: PredictionEntry; message: string }> {
    const res = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, picks }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save squad prediction');
    return data;
  },

  async getLeaderboard(): Promise<{ status: string; totalParticipants: number; entries: LeaderboardEntry[] }> {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  // --- Protected Admin APIs ---
  async adminVerify(secret: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      headers: { 'x-admin-secret': secret },
    });
    return res.ok;
  },

  async adminGetOverview(secret: string): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Admin authorization failed');
    return res.json();
  },

  async adminGetPlayers(secret: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/players`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to fetch admin players');
    return res.json();
  },

  async adminSaveAuctionResults(secret: string, results: { playerId: number; purchasedByRcb: boolean; actualPriceLakh: number | null; notes?: string | null }[]): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/auction-results`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ results }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save auction outcomes');
    return data;
  },

  async adminUpdateSettings(secret: string, update: { status?: string; deadline?: string | null; maxPurseLakh?: number; notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/contest-settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update contest settings');
    return data;
  },

  async adminPreviewScores(secret: string): Promise<LeaderboardEntry[]> {
    const res = await fetch(`${API_BASE}/admin/preview-scores`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to preview scores');
    return res.json();
  },

  async adminPublishResults(secret: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/publish-results`, {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish results');
    return data;
  },

  async adminUnpublishResults(secret: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/unpublish-results`, {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unpublish results');
    return data;
  },

  async adminGetParticipants(secret: string, unmask = false): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/participants?unmask=${unmask}`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to fetch participants');
    return res.json();
  },

  async adminGetAuditLogs(secret: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};
