import { ScorePickBreakdown, LeaderboardEntry, SelectedPlayerPick, Player, AuctionResult } from '../src/types';

export interface ScoreCalculationInput {
  participantId: string;
  displayName: string;
  submittedAt: string;
  picks: SelectedPlayerPick[];
  playersMap: Map<number, Player>;
  resultsMap: Map<number, AuctionResult>;
}

export interface CalculatedParticipantScore {
  participantId: string;
  displayName: string;
  submittedAt: string;
  totalPoints: number;
  correctPicks: number;
  exactPriceHits: number;
  nearPriceHits: number;
  breakdown: ScorePickBreakdown[];
}

/**
 * Calculates the score for an individual participant's picks against official auction results.
 * Scoring Rules:
 * - Correct player bought by RCB: +100 points
 * - Exact price hit: +75 bonus points (Total: 175 points)
 * - Near price hit (within 10% of actual price, non-exact): +25 bonus points (Total: 125 points)
 * - Incorrect player / not bought by RCB: 0 points
 * - Price bonuses apply ONLY to correctly predicted players.
 * - Exact-price and within-10% bonuses do NOT stack (exact takes precedence).
 */
export function calculateEntryScore(input: ScoreCalculationInput): CalculatedParticipantScore {
  const { participantId, displayName, submittedAt, picks, playersMap, resultsMap } = input;

  let totalPoints = 0;
  let correctPicks = 0;
  let exactPriceHits = 0;
  let nearPriceHits = 0;
  const breakdown: ScorePickBreakdown[] = [];

  for (const pick of picks) {
    const player = playersMap.get(pick.playerId);
    const result = resultsMap.get(pick.playerId);

    const playerName = player ? player.fullName : `Player #${pick.playerId}`;
    const country = player ? player.country : 'Unknown';
    const isOverseas = player ? player.isOverseas : false;
    const specialism = player ? player.specialism : 'ALL-ROUNDER';
    const basePriceLakh = player ? player.basePriceLakh : 10;
    const predictedPriceLakh = pick.predictedPriceLakh;

    const isPurchasedByRcb = Boolean(result && result.purchasedByRcb);
    const actualPriceLakh = (isPurchasedByRcb && result && typeof result.actualPriceLakh === 'number') 
      ? result.actualPriceLakh 
      : null;

    let playerPoints = 0;
    let priceBonusPoints = 0;
    let outcome: ScorePickBreakdown['outcome'] = 'NOT_PURCHASED';

    if (isPurchasedByRcb && actualPriceLakh !== null) {
      // Correct player picked
      playerPoints = 100;
      correctPicks += 1;

      if (predictedPriceLakh === actualPriceLakh) {
        // Exact price bonus (+75)
        priceBonusPoints = 75;
        exactPriceHits += 1;
        outcome = 'EXACT_HIT';
      } else {
        // Check 10% rule: |predicted - actual| <= 0.10 * actual
        const diff = Math.abs(predictedPriceLakh - actualPriceLakh);
        const tenPercentThreshold = 0.10 * actualPriceLakh;

        if (diff <= tenPercentThreshold) {
          priceBonusPoints = 25;
          nearPriceHits += 1;
          outcome = 'NEAR_HIT';
        } else {
          outcome = 'PLAYER_ONLY';
        }
      }
    } else {
      outcome = 'NOT_PURCHASED';
    }

    const pickTotal = playerPoints + priceBonusPoints;
    totalPoints += pickTotal;

    breakdown.push({
      playerId: pick.playerId,
      playerName,
      country,
      isOverseas,
      specialism,
      basePriceLakh,
      predictedPriceLakh,
      purchasedByRcb: isPurchasedByRcb,
      actualPriceLakh,
      playerPoints,
      priceBonusPoints,
      totalPoints: pickTotal,
      outcome,
    });
  }

  return {
    participantId,
    displayName,
    submittedAt,
    totalPoints,
    correctPicks,
    exactPriceHits,
    nearPriceHits,
    breakdown,
  };
}

/**
 * Deterministic tie-breaker comparator:
 * 1. Total points (DESC)
 * 2. Exact-price hits (DESC)
 * 3. Correct player picks (DESC)
 * 4. Submission timestamp (ASC - earlier is better)
 */
export function compareScores(a: CalculatedParticipantScore, b: CalculatedParticipantScore): number {
  if (b.totalPoints !== a.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }
  if (b.exactPriceHits !== a.exactPriceHits) {
    return b.exactPriceHits - a.exactPriceHits;
  }
  if (b.correctPicks !== a.correctPicks) {
    return b.correctPicks - a.correctPicks;
  }
  // Earliest submission wins
  const timeA = new Date(a.submittedAt).getTime() || 0;
  const timeB = new Date(b.submittedAt).getTime() || 0;
  return timeA - timeB;
}

/**
 * Builds ranked leaderboard entries with tie-breaking rules applied.
 */
export function buildRankedLeaderboard(scores: CalculatedParticipantScore[]): LeaderboardEntry[] {
  const sorted = [...scores].sort(compareScores);
  return sorted.map((item, idx) => ({
    rank: idx + 1,
    participantId: item.participantId,
    displayName: item.displayName,
    totalPoints: item.totalPoints,
    correctPicks: item.correctPicks,
    exactPriceHits: item.exactPriceHits,
    nearPriceHits: item.nearPriceHits,
    submittedAt: item.submittedAt,
    breakdown: item.breakdown,
  }));
}
