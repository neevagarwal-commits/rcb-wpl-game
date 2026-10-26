import { describe, it, expect } from 'vitest';
import { calculateEntryScore, compareScores, buildRankedLeaderboard } from '../server/scoring';
import { Player, AuctionResult, SelectedPlayerPick } from '../src/types';

// Mock Players
const mockPlayers: Player[] = [
  {
    id: 1,
    listSrNo: 1,
    setNo: 1,
    setCode: 'BA1',
    firstName: 'Raghvi',
    surname: 'Bist',
    fullName: 'Raghvi Bist',
    country: 'India',
    isOverseas: false,
    stateAssociation: 'CAU',
    dob: '11/10/2004',
    age: 22,
    specialism: 'BATTER',
    battingHand: 'RHB',
    bowlingStyle: null,
    previousWplTeam: null,
    previousWplMatches: null,
    classification: 'Capped',
    basePriceLakh: 30,
  },
  {
    id: 2,
    listSrNo: 2,
    setNo: 1,
    setCode: 'BA1',
    firstName: 'Sophia',
    surname: 'Dunkley',
    fullName: 'Sophia Dunkley',
    country: 'England',
    isOverseas: true,
    stateAssociation: null,
    dob: '16/07/1998',
    age: 28,
    specialism: 'BATTER',
    battingHand: 'RHB',
    bowlingStyle: 'RIGHT ARM Leg Spin',
    previousWplTeam: null,
    previousWplMatches: null,
    classification: 'Capped',
    basePriceLakh: 50,
  },
  {
    id: 8,
    listSrNo: 8,
    setNo: 2,
    setCode: 'AL1',
    firstName: 'Grace',
    surname: 'Harris',
    fullName: 'Grace Harris',
    country: 'Australia',
    isOverseas: true,
    stateAssociation: null,
    dob: '18/09/1993',
    age: 33,
    specialism: 'ALL-ROUNDER',
    battingHand: 'RHB',
    bowlingStyle: 'RIGHT ARM Off Spin',
    previousWplTeam: 'RCB',
    previousWplMatches: 9,
    classification: 'Capped',
    basePriceLakh: 30,
  },
  {
    id: 25,
    listSrNo: 25,
    setNo: 6,
    setCode: 'UBA1',
    firstName: 'Vrinda',
    surname: 'Dinesh',
    fullName: 'Vrinda Dinesh',
    country: 'India',
    isOverseas: false,
    stateAssociation: 'KSCA',
    dob: '02/03/2001',
    age: 25,
    specialism: 'BATTER',
    battingHand: 'RHB',
    bowlingStyle: 'RIGHT ARM Off Spin',
    previousWplTeam: null,
    previousWplMatches: null,
    classification: 'Uncapped',
    basePriceLakh: 10,
  },
];

const playersMap = new Map<number, Player>(mockPlayers.map(p => [p.id, p]));

describe('Scoring Engine Unit Tests', () => {
  it('awards +100 points for correct player pick with price outside 10%', () => {
    // Player 1 bought by RCB at 50 Lakh, predicted at 30 Lakh (diff = 20, 10% of 50 = 5 -> outside 10%)
    const resultsMap = new Map<number, AuctionResult>([
      [1, { playerId: 1, purchasedByRcb: true, actualPriceLakh: 50, notes: null, updatedAt: '' }]
    ]);

    const picks: SelectedPlayerPick[] = [
      { playerId: 1, predictedPriceLakh: 30 }
    ];

    const score = calculateEntryScore({
      participantId: 'p1',
      displayName: 'Fan One',
      submittedAt: '2026-10-26T10:00:00Z',
      picks,
      playersMap,
      resultsMap,
    });

    expect(score.totalPoints).toBe(100);
    expect(score.correctPicks).toBe(1);
    expect(score.exactPriceHits).toBe(0);
    expect(score.nearPriceHits).toBe(0);
    expect(score.breakdown[0].outcome).toBe('PLAYER_ONLY');
  });

  it('awards +100 and +75 bonus (175 total) for exact price prediction and does not stack 10% bonus', () => {
    // Player 2 bought at 50 Lakh, predicted at exactly 50 Lakh
    const resultsMap = new Map<number, AuctionResult>([
      [2, { playerId: 2, purchasedByRcb: true, actualPriceLakh: 50, notes: null, updatedAt: '' }]
    ]);

    const picks: SelectedPlayerPick[] = [
      { playerId: 2, predictedPriceLakh: 50 }
    ];

    const score = calculateEntryScore({
      participantId: 'p1',
      displayName: 'Fan One',
      submittedAt: '2026-10-26T10:00:00Z',
      picks,
      playersMap,
      resultsMap,
    });

    expect(score.totalPoints).toBe(175);
    expect(score.correctPicks).toBe(1);
    expect(score.exactPriceHits).toBe(1);
    expect(score.nearPriceHits).toBe(0); // Not counted in near hits because exact takes precedence
    expect(score.breakdown[0].priceBonusPoints).toBe(75);
    expect(score.breakdown[0].outcome).toBe('EXACT_HIT');
  });

  it('awards +100 and +25 bonus (125 total) for price within 10% of actual price', () => {
    // Player 8 bought at 40 Lakh. 10% of 40 = 4 Lakh.
    // Predicted at 44 Lakh (diff = 4 <= 4 -> qualifies for near hit)
    const resultsMap = new Map<number, AuctionResult>([
      [8, { playerId: 8, purchasedByRcb: true, actualPriceLakh: 40, notes: null, updatedAt: '' }]
    ]);

    const picks: SelectedPlayerPick[] = [
      { playerId: 8, predictedPriceLakh: 44 }
    ];

    const score = calculateEntryScore({
      participantId: 'p1',
      displayName: 'Fan One',
      submittedAt: '2026-10-26T10:00:00Z',
      picks,
      playersMap,
      resultsMap,
    });

    expect(score.totalPoints).toBe(125);
    expect(score.correctPicks).toBe(1);
    expect(score.exactPriceHits).toBe(0);
    expect(score.nearPriceHits).toBe(1);
    expect(score.breakdown[0].priceBonusPoints).toBe(25);
    expect(score.breakdown[0].outcome).toBe('NEAR_HIT');
  });

  it('awards 0 points for a player not purchased by RCB', () => {
    // Player 25 not bought by RCB
    const resultsMap = new Map<number, AuctionResult>([
      [25, { playerId: 25, purchasedByRcb: false, actualPriceLakh: null, notes: null, updatedAt: '' }]
    ]);

    const picks: SelectedPlayerPick[] = [
      { playerId: 25, predictedPriceLakh: 10 }
    ];

    const score = calculateEntryScore({
      participantId: 'p1',
      displayName: 'Fan One',
      submittedAt: '2026-10-26T10:00:00Z',
      picks,
      playersMap,
      resultsMap,
    });

    expect(score.totalPoints).toBe(0);
    expect(score.correctPicks).toBe(0);
    expect(score.exactPriceHits).toBe(0);
    expect(score.nearPriceHits).toBe(0);
    expect(score.breakdown[0].outcome).toBe('NOT_PURCHASED');
  });

  it('awards 0 points if player was purchased by RCB but not in participant picks', () => {
    const resultsMap = new Map<number, AuctionResult>([
      [1, { playerId: 1, purchasedByRcb: true, actualPriceLakh: 30, notes: null, updatedAt: '' }]
    ]);

    // Participant picked player 25 instead of 1
    const picks: SelectedPlayerPick[] = [
      { playerId: 25, predictedPriceLakh: 10 }
    ];

    const score = calculateEntryScore({
      participantId: 'p1',
      displayName: 'Fan One',
      submittedAt: '2026-10-26T10:00:00Z',
      picks,
      playersMap,
      resultsMap,
    });

    expect(score.totalPoints).toBe(0);
    expect(score.correctPicks).toBe(0);
  });
});

describe('Tie-Breaking Logic Unit Tests', () => {
  it('correctly orders participants using deterministic tie-breakers', () => {
    // Case 1: Higher total points wins
    const p1 = {
      participantId: 'p1',
      displayName: 'Fan 1',
      submittedAt: '2026-10-26T12:00:00Z',
      totalPoints: 200,
      correctPicks: 2,
      exactPriceHits: 0,
      nearPriceHits: 0,
      breakdown: [],
    };

    const p2 = {
      participantId: 'p2',
      displayName: 'Fan 2',
      submittedAt: '2026-10-26T10:00:00Z',
      totalPoints: 175,
      correctPicks: 1,
      exactPriceHits: 1,
      nearPriceHits: 0,
      breakdown: [],
    };

    expect(compareScores(p1, p2)).toBeLessThan(0); // p1 comes before p2

    // Case 2: Equal points, higher exact price hits wins
    const p3 = {
      participantId: 'p3',
      displayName: 'Fan 3',
      submittedAt: '2026-10-26T12:00:00Z',
      totalPoints: 175,
      correctPicks: 1,
      exactPriceHits: 1, // 100 + 75
      nearPriceHits: 0,
      breakdown: [],
    };

    const p4 = {
      participantId: 'p4',
      displayName: 'Fan 4',
      submittedAt: '2026-10-26T10:00:00Z',
      totalPoints: 175,
      correctPicks: 1,
      exactPriceHits: 0,
      nearPriceHits: 3, // some theoretical combo
      breakdown: [],
    };

    expect(compareScores(p3, p4)).toBeLessThan(0); // p3 wins due to exact hit

    // Case 3: Equal points and exact hits, higher correct picks wins
    const p5 = {
      participantId: 'p5',
      displayName: 'Fan 5',
      submittedAt: '2026-10-26T12:00:00Z',
      totalPoints: 200,
      correctPicks: 2,
      exactPriceHits: 0,
      nearPriceHits: 0,
      breakdown: [],
    };

    const p6 = {
      participantId: 'p6',
      displayName: 'Fan 6',
      submittedAt: '2026-10-26T10:00:00Z',
      totalPoints: 200,
      correctPicks: 1,
      exactPriceHits: 0,
      nearPriceHits: 4,
      breakdown: [],
    };

    expect(compareScores(p5, p6)).toBeLessThan(0); // p5 wins due to 2 correct picks vs 1

    // Case 4: Everything identical, earlier submission timestamp wins
    const p7 = {
      participantId: 'p7',
      displayName: 'Early Fan',
      submittedAt: '2026-10-26T09:00:00Z',
      totalPoints: 175,
      correctPicks: 1,
      exactPriceHits: 1,
      nearPriceHits: 0,
      breakdown: [],
    };

    const p8 = {
      participantId: 'p8',
      displayName: 'Late Fan',
      submittedAt: '2026-10-26T14:00:00Z',
      totalPoints: 175,
      correctPicks: 1,
      exactPriceHits: 1,
      nearPriceHits: 0,
      breakdown: [],
    };

    expect(compareScores(p7, p8)).toBeLessThan(0); // Early Fan wins
    const leaderboard = buildRankedLeaderboard([p8, p7]);
    expect(leaderboard[0].participantId).toBe('p7');
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].participantId).toBe('p8');
    expect(leaderboard[1].rank).toBe(2);
  });
});
