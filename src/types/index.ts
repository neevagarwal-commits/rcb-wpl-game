export type Specialism = 'BATTER' | 'ALL-ROUNDER' | 'WICKETKEEPER' | 'BOWLER';
export type Classification = 'Capped' | 'Uncapped' | 'Associate';
export type ContestStatus = 'OPEN' | 'LOCKED' | 'RESULTS_LIVE';

export interface Player {
  id: number;
  listSrNo: number;
  setNo: number;
  setCode: string;
  firstName: string;
  surname: string;
  fullName: string;
  country: string;
  isOverseas: boolean;
  stateAssociation: string | null;
  dob: string;
  age: number;
  specialism: Specialism;
  battingHand: 'RHB' | 'LHB' | null;
  bowlingStyle: string | null;
  previousWplTeam: string | null;
  previousWplMatches: number | null;
  classification: Classification;
  basePriceLakh: number;
}

export interface Participant {
  id: string;
  phone: string; // masked in public responses
  displayName: string;
  createdAt: string;
}

export interface SelectedPlayerPick {
  playerId: number;
  predictedPriceLakh: number;
  player?: Player;
}

export interface PredictionEntry {
  id: string;
  participantId: string;
  displayName: string;
  picks: SelectedPlayerPick[];
  totalSpendLakh: number;
  pickCount: number;
  overseasCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContestSettings {
  status: ContestStatus;
  maxPurseLakh: number; // 115 lakh
  minPicks: number;     // 2
  maxPicks: number;     // 5
  maxOverseas: number;  // 2
  deadline: string | null;
  resultsPublishedAt: string | null;
}

export interface AuctionResult {
  playerId: number;
  purchasedByRcb: boolean;
  actualPriceLakh: number | null;
  notes: string | null;
  updatedAt: string;
}

export interface ScorePickBreakdown {
  playerId: number;
  playerName: string;
  country: string;
  isOverseas: boolean;
  specialism: Specialism;
  basePriceLakh: number;
  predictedPriceLakh: number;
  purchasedByRcb: boolean;
  actualPriceLakh: number | null;
  playerPoints: number;      // 100 or 0
  priceBonusPoints: number;  // 75 (exact), 25 (within 10%), or 0
  totalPoints: number;
  outcome: 'EXACT_HIT' | 'NEAR_HIT' | 'PLAYER_ONLY' | 'NOT_PURCHASED';
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  totalPoints: number;
  correctPicks: number;
  exactPriceHits: number;
  nearPriceHits: number;
  submittedAt: string;
  breakdown: ScorePickBreakdown[];
}

export interface AdminStats {
  totalParticipants: number;
  totalEntries: number;
  contestStatus: ContestStatus;
  rcbPurchasesCount: number;
  resultsPublished: boolean;
  resultsPublishedAt: string | null;
}
