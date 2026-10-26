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
 * - Uses cachedBaseUrl immediately for sub-millisecond dispatch if known.
 * - Races relative path (/api) and direct backend (http://127.0.0.1:3001/api) with 200ms threshold for fastest response.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (cachedBaseUrl) {
    try {
      return await fetchWithValidation<T>(`${cachedBaseUrl}${cleanEndpoint}`, options);
    } catch (err: any) {
      // If error is an API error from server (e.g. 400 validation), throw directly
      if (err.message && !err.message.includes('fetch') && !err.message.includes('connection error')) {
        throw err;
      }
      cachedBaseUrl = null;
    }
  }

  // Fast racing: launch relative /api
  const controller = new AbortController();
  const primaryPromise = fetchWithValidation<T>(`/api${cleanEndpoint}`, {
    ...options,
    signal: controller.signal,
  });

  // Short 200ms timer to ensure near-zero latency
  let directPromise: Promise<T> | null = null;
  const timeoutId = setTimeout(() => {
    directPromise = fetchWithValidation<T>(`${DIRECT_BACKEND}${cleanEndpoint}`, options);
  }, 200);

  try {
    const result = await primaryPromise;
    clearTimeout(timeoutId);
    cachedBaseUrl = '/api';
    return result;
  } catch (primaryErr: any) {
    clearTimeout(timeoutId);

    // If it's a legitimate API validation error (e.g. name length or existing phone), throw it directly
    if (primaryErr.message && !primaryErr.message.includes('fetch') && !primaryErr.message.includes('connection error')) {
      throw primaryErr;
    }

    // Try direct backend
    try {
      const fallbackResult = directPromise ? await directPromise : await fetchWithValidation<T>(`${DIRECT_BACKEND}${cleanEndpoint}`, options);
      cachedBaseUrl = DIRECT_BACKEND;
      return fallbackResult;
    } catch {
      throw new Error('Unable to connect to RCB Predictor server. Please make sure the backend is running on port 3001.');
    }
  }
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
