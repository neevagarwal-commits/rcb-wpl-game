import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../server/db';

describe('Squad & Participant Validation Unit Tests', () => {
  beforeEach(() => {
    // Reset contest to OPEN
    db.updateContestSettings({ status: 'OPEN', maxPurseLakh: 115, minPicks: 2, maxPicks: 5, maxOverseas: 2 });
  });

  it('normalizes various Indian phone formats to 10 digits', () => {
    expect(db.normalizePhone('+919876543210')).toBe('9876543210');
    expect(db.normalizePhone('09876543210')).toBe('9876543210');
    expect(db.normalizePhone('98765 43210')).toBe('9876543210');
    expect(db.normalizePhone('+91-98765-43210')).toBe('9876543210');
  });

  it('validates authentic 10-digit Indian mobile numbers (starts with 6-9)', () => {
    expect(db.isValidIndianPhone('9876543210')).toBe(true);
    expect(db.isValidIndianPhone('8876543210')).toBe(true);
    expect(db.isValidIndianPhone('7876543210')).toBe(true);
    expect(db.isValidIndianPhone('6876543210')).toBe(true);
    // Invalid cases:
    expect(db.isValidIndianPhone('5876543210')).toBe(false); // starts with 5
    expect(db.isValidIndianPhone('987654321')).toBe(false);  // 9 digits
    expect(db.isValidIndianPhone('98765432100')).toBe(false); // 11 digits
  });

  it('allows registration and retrieves existing participant with matching name', () => {
    const phone = '9999988888';
    const name = 'Virat Fan';

    const first = db.getOrCreateParticipant(phone, name);
    expect(first.participant.displayName).toBe(name);

    // Second login with same phone & name returns same participant
    const second = db.getOrCreateParticipant(phone, name);
    expect(second.isNew).toBe(false);
    expect(second.participant.id).toBe(first.participant.id);
  });

  it('rejects login when phone number exists with a different name (privacy preservation)', () => {
    const phone = '9999977777';
    db.getOrCreateParticipant(phone, 'Smriti Fan');

    expect(() => {
      db.getOrCreateParticipant(phone, 'Different Person');
    }).toThrow(/already registered/i);
  });

  it('rejects squad with fewer than 2 players', () => {
    const { participant } = db.getOrCreateParticipant('9999966666', 'Test User 1');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 1, predictedPriceLakh: 30 }
      ]);
    }).toThrow(/between 2 and 5 players/i);
  });

  it('rejects squad with more than 5 players', () => {
    const { participant } = db.getOrCreateParticipant('9999955555', 'Test User 2');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 1, predictedPriceLakh: 30 },
        { playerId: 3, predictedPriceLakh: 30 },
        { playerId: 4, predictedPriceLakh: 40 },
        { playerId: 6, predictedPriceLakh: 30 },
        { playerId: 11, predictedPriceLakh: 30 },
        { playerId: 12, predictedPriceLakh: 30 },
      ]);
    }).toThrow(/between 2 and 5 players/i);
  });

  it('rejects squad with more than 2 overseas players', () => {
    // Sophia Dunkley (2 - England), Grace Harris (8 - Australia), Sophie Molineux (9 - Australia)
    const { participant } = db.getOrCreateParticipant('9999944444', 'Test User 3');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 2, predictedPriceLakh: 50 },
        { playerId: 8, predictedPriceLakh: 30 },
        { playerId: 9, predictedPriceLakh: 50 },
      ]);
    }).toThrow(/Maximum 2 overseas players allowed/i);
  });

  it('rejects duplicate player selection in the same squad', () => {
    const { participant } = db.getOrCreateParticipant('9999933333', 'Test User 4');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 1, predictedPriceLakh: 30 },
        { playerId: 1, predictedPriceLakh: 35 },
      ]);
    }).toThrow(/Duplicate player selection/i);
  });

  it('rejects predicted price below listed base price', () => {
    // Player 1 has base price 30 Lakh
    const { participant } = db.getOrCreateParticipant('9999922222', 'Test User 5');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 1, predictedPriceLakh: 20 }, // 20 < 30
        { playerId: 25, predictedPriceLakh: 10 },
      ]);
    }).toThrow(/cannot be below base price/i);
  });

  it('rejects squad if total expenditure exceeds ₹115 Lakh purse', () => {
    // Player 2 (50L) + Player 9 (50L) + Player 1 (30L) = 130L > 115L
    const { participant } = db.getOrCreateParticipant('9999911111', 'Test User 6');
    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 2, predictedPriceLakh: 50 },
        { playerId: 9, predictedPriceLakh: 50 },
        { playerId: 1, predictedPriceLakh: 30 },
      ]);
    }).toThrow(/exceeds available purse/i);
  });

  it('accepts valid squad satisfying all constraints and allows edits while OPEN', () => {
    // Player 1 (Indian, 30L) + Player 25 (Indian, 10L) + Player 8 (Overseas, 30L) = 70L <= 115L
    const { participant } = db.getOrCreateParticipant('9999900000', 'Valid Predictor');
    const entry = db.saveEntry(participant.id, [
      { playerId: 1, predictedPriceLakh: 35 },
      { playerId: 25, predictedPriceLakh: 15 },
      { playerId: 8, predictedPriceLakh: 30 },
    ]);

    expect(entry.pickCount).toBe(3);
    expect(entry.overseasCount).toBe(1);
    expect(entry.totalSpendLakh).toBe(80);

    // Edit squad
    const updated = db.saveEntry(participant.id, [
      { playerId: 1, predictedPriceLakh: 40 },
      { playerId: 25, predictedPriceLakh: 20 },
    ]);
    expect(updated.pickCount).toBe(2);
    expect(updated.totalSpendLakh).toBe(60);
  });

  it('prevents saving or editing predictions when contest is LOCKED', () => {
    const { participant } = db.getOrCreateParticipant('9888877777', 'Locked User');
    db.updateContestSettings({ status: 'LOCKED' });

    expect(() => {
      db.saveEntry(participant.id, [
        { playerId: 1, predictedPriceLakh: 30 },
        { playerId: 25, predictedPriceLakh: 10 },
      ]);
    }).toThrow(/Predictions are currently locked/i);
  });
});
