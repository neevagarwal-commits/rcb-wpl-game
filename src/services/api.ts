import { 
  Player, 
  Participant, 
  PredictionEntry, 
  ContestSettings, 
  LeaderboardEntry, 
  AdminStats 
} from '../types';

const DIRECT_BACKEND = 'http://127.0.0.1:3001/api';

// Cache the working base URL once verified so all subsequent requests are instant (<10ms)
let cachedBaseUrl: string | null = null;

async function fetchWithValidation<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Endpoint not found (${res.status}). Verify the server is running.`);
      }
      throw new Error(`Server connection error (${res.status}).`);
    }
    throw new Error('Unexpected non-JSON response from server.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

/**
 * Ultra-fast API requester:
 * - Automatically races direct backend (http://127.0.0.1:3001/api) and relative proxy (/api).
 * - Enforces a strict 3.5s maximum timeout so verification never hangs.
 * - Caches winning URL for sub-50ms subsequent calls.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (cachedBaseUrl) {
    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 3500);
      const res = await fetchWithValidation<T>(`${cachedBaseUrl}${cleanEndpoint}`, {
        ...options,
        signal: abortCtrl.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('aborted') && !err.message.includes('connection error')) {
        throw err;
      }
      cachedBaseUrl = null;
    }
  }

  // True parallel race with strict 3.5s limit
  const abortCtrl = new AbortController();

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let failedCount = 0;
    let lastError: any = null;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        abortCtrl.abort();
        reject(new Error('Verification timed out after 3 seconds. Please ensure the backend server is running.'));
      }
    }, 3500);

    const tryReq = async (url: string, isDirect: boolean) => {
      try {
        const data = await fetchWithValidation<T>(url, { ...options, signal: abortCtrl.signal });
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          cachedBaseUrl = isDirect ? DIRECT_BACKEND : '/api';
          resolve(data);
        }
      } catch (err: any) {
        lastError = err;
        failedCount++;

        // If it's a direct API validation failure (like existing number), reject immediately
        if (err.message && !err.message.includes('fetch') && !err.message.includes('aborted') && !err.message.includes('connection error')) {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(err);
            return;
          }
        }

        // If both failed, reject
        if (failedCount >= 2 && !settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(lastError || new Error('Verification timed out after 3 seconds. Please ensure the backend server is running.'));
        }
      }
    };

    // Launch both immediately in parallel
    tryReq(`${DIRECT_BACKEND}${cleanEndpoint}`, true);
    tryReq(`/api${cleanEndpoint}`, false);
  });
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

  async adminDeleteEntry(secret: string, participantId: string): Promise<any> {
    return apiRequest<any>(`/admin/entries/${participantId}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminDeleteParticipant(secret: string, participantId: string): Promise<any> {
    return apiRequest<any>(`/admin/participants/${participantId}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
  },

  async adminClearAllEntries(secret: string, includeParticipants = false): Promise<any> {
    return apiRequest<any>('/admin/clear-all-entries', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ includeParticipants }),
    });
  },
};
