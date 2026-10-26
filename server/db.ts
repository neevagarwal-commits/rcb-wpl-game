import fs from 'fs';
import path from 'path';
import { 
  Player, 
  Participant, 
  PredictionEntry, 
  SelectedPlayerPick, 
  ContestSettings, 
  AuctionResult, 
  LeaderboardEntry,
  ScorePickBreakdown
} from '../src/types';
import { calculateEntryScore, buildRankedLeaderboard, CalculatedParticipantScore } from './scoring';

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DbSchema {
  players: Player[];
  participants: Participant[];
  entries: PredictionEntry[];
  auctionResults: Record<number, AuctionResult>;
  contestSettings: ContestSettings;
  auditLogs: AuditLog[];
  publishedScores: LeaderboardEntry[] | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rcb_store.json');
const PLAYERS_SEED_FILE = path.resolve(process.cwd(), 'players.json');

class DatabaseService {
  private data: DbSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.data = this.loadData();
    this.ensureSeeded();
  }

  private loadData(): DbSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          players: parsed.players || [],
          participants: parsed.participants || [],
          entries: parsed.entries || [],
          auctionResults: parsed.auctionResults || {},
          contestSettings: parsed.contestSettings || {
            status: 'OPEN',
            maxPurseLakh: 115,
            minPicks: 2,
            maxPicks: 5,
            maxOverseas: 2,
            deadline: null,
            resultsPublishedAt: null,
          },
          auditLogs: parsed.auditLogs || [],
          publishedScores: parsed.publishedScores || null,
        };
      } catch (err) {
        console.error('Error reading database file, initializing default:', err);
      }
    }

    return {
      players: [],
      participants: [],
      entries: [],
      auctionResults: {},
      contestSettings: {
        status: 'OPEN',
        maxPurseLakh: 115,
        minPicks: 2,
        maxPicks: 5,
        maxOverseas: 2,
        deadline: null,
        resultsPublishedAt: null,
      },
      auditLogs: [],
      publishedScores: null,
    };
  }

  private persist(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  private ensureSeeded(): void {
    if (this.data.players.length === 0 && fs.existsSync(PLAYERS_SEED_FILE)) {
      try {
        const playersData: Player[] = JSON.parse(fs.readFileSync(PLAYERS_SEED_FILE, 'utf-8'));
        this.data.players = playersData;
        this.addAuditLog('SEED_PLAYERS', `Idempotently imported ${playersData.length} players from official PDF.`);
        this.persist();
        console.log(`[DB] Successfully seeded ${playersData.length} players into database.`);
      } catch (err) {
        console.error('[DB] Failed to seed players:', err);
      }
    }
  }

  public addAuditLog(action: string, details: string): void {
    this.data.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
  }

  // --- Players ---
  public getPlayers(): Player[] {
    return this.data.players;
  }

  public getPlayerById(id: number): Player | undefined {
    return this.data.players.find(p => p.id === id);
  }

  // --- Participants ---
  public normalizePhone(rawPhone: string): string {
    // Strip non-digits
    const digits = rawPhone.replace(/\D/g, '');
    // If starts with 91 and has 12 digits, strip 91
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    // If starts with 0 and has 11 digits, strip 0
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return digits;
  }

  public isValidIndianPhone(normalizedPhone: string): boolean {
    return /^[6-9]\d{9}$/.test(normalizedPhone);
  }

  public findParticipantByPhone(normalizedPhone: string): Participant | undefined {
    return this.data.participants.find(p => p.phone === normalizedPhone);
  }

  public getOrCreateParticipant(rawPhone: string, rawName: string): { participant: Participant; isNew: boolean } {
    const normalizedPhone = this.normalizePhone(rawPhone);
    const cleanName = rawName.trim();

    if (!this.isValidIndianPhone(normalizedPhone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }
    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter a valid display name (at least 2 characters).');
    }

    const existing = this.findParticipantByPhone(normalizedPhone);
    if (existing) {
      // Check if name matches (case-insensitive)
      if (existing.displayName.toLowerCase() === cleanName.toLowerCase()) {
        return { participant: existing, isNew: false };
      }
      // Phone exists but name does not match -> Generic message to prevent disclosure
      throw new Error('This mobile number is already registered. Please check the name or verify your number.');
    }

    // Create new participant
    const newParticipant: Participant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: normalizedPhone,
      displayName: cleanName,
      createdAt: new Date().toISOString(),
    };

    this.data.participants.push(newParticipant);
    this.addAuditLog('PARTICIPANT_REGISTERED', `Participant "${cleanName}" registered.`);
    this.persist();
    return { participant: newParticipant, isNew: true };
  }

  public getParticipantById(id: string): Participant | undefined {
    return this.data.participants.find(p => p.id === id);
  }

  // --- Predictions & Entries ---
  public getEntryByParticipantId(participantId: string): PredictionEntry | null {
    const entry = this.data.entries.find(e => e.participantId === participantId);
    if (!entry) return null;

    // Attach player details
    const populatedPicks: SelectedPlayerPick[] = entry.picks.map(pick => {
      const player = this.getPlayerById(pick.playerId);
      return {
        ...pick,
        player,
      };
    });

    return {
      ...entry,
      picks: populatedPicks,
    };
  }

  public saveEntry(participantId: string, picks: { playerId: number; predictedPriceLakh: number }[]): PredictionEntry {
    const settings = this.getContestSettings();

    if (settings.status !== 'OPEN') {
      throw new Error('Predictions are currently locked. Squad cannot be created or modified.');
    }

    const participant = this.getParticipantById(participantId);
    if (!participant) {
      throw new Error('Participant record not found. Please log in again.');
    }

    // Validation rules
    if (!Array.isArray(picks) || picks.length < settings.minPicks || picks.length > settings.maxPicks) {
      throw new Error(`Squad must contain between ${settings.minPicks} and ${settings.maxPicks} players.`);
    }

    // Check duplicate player IDs
    const playerIds = new Set<number>();
    let totalSpend = 0;
    let overseasCount = 0;

    for (const pick of picks) {
      if (playerIds.has(pick.playerId)) {
        throw new Error('Duplicate player selection is not permitted.');
      }
      playerIds.add(pick.playerId);

      const player = this.getPlayerById(pick.playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${pick.playerId}.`);
      }

      if (typeof pick.predictedPriceLakh !== 'number' || isNaN(pick.predictedPriceLakh)) {
        throw new Error(`Invalid predicted price for ${player.fullName}.`);
      }

      if (pick.predictedPriceLakh < player.basePriceLakh) {
        throw new Error(`Predicted price for ${player.fullName} (₹${pick.predictedPriceLakh}L) cannot be below base price (₹${player.basePriceLakh}L).`);
      }

      totalSpend += pick.predictedPriceLakh;
      if (player.isOverseas) {
        overseasCount += 1;
      }
    }

    if (overseasCount > settings.maxOverseas) {
      throw new Error(`Maximum ${settings.maxOverseas} overseas players allowed. You selected ${overseasCount}.`);
    }

    if (totalSpend > settings.maxPurseLakh) {
      throw new Error(`Total predicted squad spend (₹${totalSpend}L) exceeds available purse (₹${settings.maxPurseLakh}L / ₹1.15 Cr).`);
    }

    const existingIndex = this.data.entries.findIndex(e => e.participantId === participantId);
    const now = new Date().toISOString();

    let entry: PredictionEntry;
    if (existingIndex >= 0) {
      // Update existing
      entry = {
        ...this.data.entries[existingIndex],
        picks: picks.map(p => ({ playerId: p.playerId, predictedPriceLakh: p.predictedPriceLakh })),
        totalSpendLakh: totalSpend,
        pickCount: picks.length,
        overseasCount,
        updatedAt: now,
      };
      this.data.entries[existingIndex] = entry;
      this.addAuditLog('ENTRY_UPDATED', `Participant ${participant.displayName} updated their squad prediction (${picks.length} picks, ₹${totalSpend}L).`);
    } else {
      // Create new
      entry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        participantId,
        displayName: participant.displayName,
        picks: picks.map(p => ({ playerId: p.playerId, predictedPriceLakh: p.predictedPriceLakh })),
        totalSpendLakh: totalSpend,
        pickCount: picks.length,
        overseasCount,
        createdAt: now,
        updatedAt: now,
      };
      this.data.entries.push(entry);
      this.addAuditLog('ENTRY_CREATED', `Participant ${participant.displayName} saved their squad prediction (${picks.length} picks, ₹${totalSpend}L).`);
    }

    this.persist();

    // Return with populated players
    return this.getEntryByParticipantId(participantId)!;
  }

  // --- Contest Settings ---
  public getContestSettings(): ContestSettings {
    return this.data.contestSettings;
  }

  public updateContestSettings(newSettings: Partial<ContestSettings>, adminNotes?: string): ContestSettings {
    this.data.contestSettings = {
      ...this.data.contestSettings,
      ...newSettings,
    };
    this.addAuditLog('SETTINGS_UPDATED', `Contest status: ${this.data.contestSettings.status}. ${adminNotes || ''}`);
    this.persist();
    return this.data.contestSettings;
  }

  // --- Auction Results ---
  public getAuctionResults(): Record<number, AuctionResult> {
    return this.data.auctionResults;
  }

  public updateAuctionResults(results: { playerId: number; purchasedByRcb: boolean; actualPriceLakh: number | null; notes?: string | null }[]): void {
    const now = new Date().toISOString();
    for (const res of results) {
      const player = this.getPlayerById(res.playerId);
      if (!player) continue;

      if (res.purchasedByRcb) {
        if (typeof res.actualPriceLakh !== 'number' || res.actualPriceLakh < player.basePriceLakh) {
          throw new Error(`Actual price for ${player.fullName} must be at least the base price (₹${player.basePriceLakh}L).`);
        }
      } else {
        res.actualPriceLakh = null;
      }

      this.data.auctionResults[res.playerId] = {
        playerId: res.playerId,
        purchasedByRcb: res.purchasedByRcb,
        actualPriceLakh: res.actualPriceLakh,
        notes: res.notes || null,
        updatedAt: now,
      };
    }

    this.addAuditLog('AUCTION_RESULTS_UPDATED', `Updated auction results for ${results.length} player(s).`);
    this.persist();
  }

  // --- Scoring & Leaderboard ---
  public calculateCurrentScores(): LeaderboardEntry[] {
    const playersMap = new Map<number, Player>();
    for (const p of this.data.players) {
      playersMap.set(p.id, p);
    }

    const resultsMap = new Map<number, AuctionResult>();
    for (const idStr of Object.keys(this.data.auctionResults)) {
      const id = parseInt(idStr, 10);
      resultsMap.set(id, this.data.auctionResults[id]);
    }

    const scores: CalculatedParticipantScore[] = [];

    for (const entry of this.data.entries) {
      const calc = calculateEntryScore({
        participantId: entry.participantId,
        displayName: entry.displayName,
        submittedAt: entry.createdAt,
        picks: entry.picks,
        playersMap,
        resultsMap,
      });
      scores.push(calc);
    }

    return buildRankedLeaderboard(scores);
  }

  public publishResults(): LeaderboardEntry[] {
    const ranked = this.calculateCurrentScores();
    this.data.publishedScores = ranked;
    this.data.contestSettings.status = 'RESULTS_LIVE';
    this.data.contestSettings.resultsPublishedAt = new Date().toISOString();
    this.addAuditLog('RESULTS_PUBLISHED', `Official auction results published with ${ranked.length} ranked entries.`);
    this.persist();
    return ranked;
  }

  public unpublishResults(): void {
    this.data.publishedScores = null;
    this.data.contestSettings.status = 'LOCKED';
    this.data.contestSettings.resultsPublishedAt = null;
    this.addAuditLog('RESULTS_UNPUBLISHED', 'Auction results reset/unpublished to LOCKED state.');
    this.persist();
  }

  public getLeaderboard(): { status: string; totalParticipants: number; entries: LeaderboardEntry[] } {
    const settings = this.getContestSettings();
    if (settings.status !== 'RESULTS_LIVE' || !this.data.publishedScores) {
      return {
        status: settings.status,
        totalParticipants: this.data.entries.length,
        entries: [],
      };
    }
    return {
      status: settings.status,
      totalParticipants: this.data.entries.length,
      entries: this.data.publishedScores,
    };
  }

  // --- Admin Participants View ---
  public getAdminParticipants(maskPhone = true) {
    const entriesMap = new Map<string, PredictionEntry>();
    for (const e of this.data.entries) {
      entriesMap.set(e.participantId, e);
    }

    const previewScores = this.calculateCurrentScores();
    const scoresMap = new Map<string, LeaderboardEntry>();
    for (const s of previewScores) {
      scoresMap.set(s.participantId, s);
    }

    return this.data.participants.map(p => {
      const entry = entriesMap.get(p.id) || null;
      const score = scoresMap.get(p.id) || null;

      let displayPhone = p.phone;
      if (maskPhone && p.phone.length >= 10) {
        displayPhone = `******${p.phone.slice(-4)}`;
      }

      return {
        id: p.id,
        displayName: p.displayName,
        phone: displayPhone,
        registeredAt: p.createdAt,
        hasEntry: Boolean(entry),
        entry: entry ? this.getEntryByParticipantId(p.id) : null,
        score,
      };
    });
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public getAdminStats() {
    const rcbPurchasedCount = Object.values(this.data.auctionResults).filter(r => r.purchasedByRcb).length;
    return {
      totalParticipants: this.data.participants.length,
      totalEntries: this.data.entries.length,
      contestStatus: this.data.contestSettings.status,
      rcbPurchasesCount: rcbPurchasedCount,
      resultsPublished: this.data.contestSettings.status === 'RESULTS_LIVE',
      resultsPublishedAt: this.data.contestSettings.resultsPublishedAt,
    };
  }
}

export const db = new DatabaseService();
