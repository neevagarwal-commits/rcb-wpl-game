import { 
  Player, 
  Participant, 
  PredictionEntry, 
  ContestSettings, 
  LeaderboardEntry, 
  AdminStats 
} from '../types';

const DIRECT_BACKEND = 'http://127.0.0.1:3001/api';

/**
 * Robust HTTP client that:
 * 1. Attempts relative /api first (works with Vite proxy or production unified host).
 * 2. Falls back to direct CORS request to backend (http://127.0.0.1:3001/api) if proxy returns HTML/502/504.
 * 3. Safely validates Content-Type to prevent "Unexpected token 'T' / JSON parse" crashes.
 * 4. Yields clean, informative error messages.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const isDirect = typeof window !== 'undefined' && window.location.port === '3001';

  const urlsToTry = isDirect 
    ? [`/api${cleanEndpoint}`]
    : [`/api${cleanEndpoint}`, `${DIRECT_BACKEND}${cleanEndpoint}`];

  let lastError: Error | null = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';

      // If response is not JSON, inspect status and handle gracefully
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        if (urlsToTry.indexOf(url) < urlsToTry.length - 1) {
          // Fall back to next URL (e.g. direct backend)
          continue;
        }

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Service endpoint not found (${res.status}). Verify the backend server is running.`);
          }
          throw new Error(`Server returned error (${res.status}). Please check your connection.`);
        }

        throw new Error('Server returned an unexpected non-JSON response. Please refresh.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      // If error is already a known API rejection (e.g. validation error 400), don't retry, throw directly
      if (err.message && !err.message.includes('fetch') && !err.message.includes('JSON') && !err.message.includes('Service endpoint')) {
        throw err;
      }
    }
  }

  throw new Error(
    lastError?.message || 
    'Unable to connect to RCB Predictor server. Please make sure the backend is running (`npm run server` or `npm run dev`).'
  );
}

export const api = {
  // --- Public APIs ---
  async getContest(): Promise<ContestSettings> {
    return apiRequest<ContestSettings>('/contest');
  },

  async getPlayers(params?: { search?: string; role?: string; overseas?: boolean; sort?: string }): Promise<Player[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.overseas !== undefined) query.append('overseas', String(params.overseas));
    if (params?.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    return apiRequest<Player[]>(queryString ? `/players?${queryString}` : '/players');
  },

  async enterParticipant(phone: string, displayName: string): Promise<{ participant: Participant; isNew: boolean; entry: PredictionEntry | null }> {
    return apiRequest<{ participant: Participant; isNew: boolean; entry: PredictionEntry | null }>('/participants/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, displayName }),
    });
  },

  async getEntry(participantId: string): Promise<PredictionEntry | null> {
    const data = await apiRequest<{ entry: PredictionEntry | null }>(`/entries/${participantId}`);
    return data.entry;
  },

  async saveEntry(participantId: string, picks: { playerId: number; predictedPriceLakh: number }[]): Promise<{ success: boolean; entry: PredictionEntry; message: string }> {
    return apiRequest<{ success: boolean; entry: PredictionEntry; message: string }>('/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, picks }),
    });
  },

  async getLeaderboard(): Promise<{ status: string; totalParticipants: number; entries: LeaderboardEntry[] }> {
    return apiRequest<{ status: string; totalParticipants: number; entries: LeaderboardEntry[] }>('/leaderboard');
  },

  // --- Protected Admin APIs ---
  async adminVerify(secret: string): Promise<boolean> {
    try {
      await apiRequest<{ valid: boolean }>('/admin/verify', {
        headers: { 'x-admin-secret': secret },
      });
      return true;
    } catch {
      return false;
    }
  },

  async adminGetOverview(secret: string): Promise<AdminStats> {
    return apiRequest<AdminStats>('/admin/overview', {
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminGetPlayers(secret: string): Promise<any[]> {
    return apiRequest<any[]>('/admin/players', {
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminSaveAuctionResults(secret: string, results: { playerId: number; purchasedByRcb: boolean; actualPriceLakh: number | null; notes?: string | null }[]): Promise<any> {
    return apiRequest<any>('/admin/auction-results', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ results }),
    });
  },

  async adminUpdateSettings(secret: string, update: { status?: string; deadline?: string | null; maxPurseLakh?: number; notes?: string }): Promise<any> {
    return apiRequest<any>('/admin/contest-settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify(update),
    });
  },

  async adminPreviewScores(secret: string): Promise<LeaderboardEntry[]> {
    return apiRequest<LeaderboardEntry[]>('/admin/preview-scores', {
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminPublishResults(secret: string): Promise<any> {
    return apiRequest<any>('/admin/publish-results', {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminUnpublishResults(secret: string): Promise<any> {
    return apiRequest<any>('/admin/unpublish-results', {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminGetParticipants(secret: string, unmask = false): Promise<any[]> {
    return apiRequest<any[]>(`/admin/participants?unmask=${unmask}`, {
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminGetAuditLogs(secret: string): Promise<any[]> {
    return apiRequest<any[]>('/admin/audit-logs', {
      headers: { 'x-admin-secret': secret },
    });
  },
};
