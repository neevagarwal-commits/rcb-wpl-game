import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { ContestStatus } from '../src/types';

export const router = Router();

// Middleware: Admin Protection
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'rcb_admin_secret_2027';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized. Admin credentials missing or invalid.',
    });
  }
  next();
}

// -------------------------------------------------------------
// PUBLIC PARTICIPANT & GAME ROUTES
// -------------------------------------------------------------

// Contest status & settings
router.get('/contest', (req: Request, res: Response) => {
  try {
    const settings = db.getContestSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// All 146 Players with filters
router.get('/players', (req: Request, res: Response) => {
  try {
    let players = db.getPlayers();
    const { search, role, overseas, sort } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      players = players.filter(p => 
        p.fullName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        (p.stateAssociation && p.stateAssociation.toLowerCase().includes(q))
      );
    }

    if (role && typeof role === 'string' && role !== 'ALL') {
      players = players.filter(p => p.specialism.toLowerCase() === role.toLowerCase());
    }

    if (overseas !== undefined) {
      const isO = overseas === 'true';
      players = players.filter(p => p.isOverseas === isO);
    }

    if (sort === 'price-desc') {
      players.sort((a, b) => b.basePriceLakh - a.basePriceLakh || a.fullName.localeCompare(b.fullName));
    } else if (sort === 'price-asc') {
      players.sort((a, b) => a.basePriceLakh - b.basePriceLakh || a.fullName.localeCompare(b.fullName));
    } else if (sort === 'name-asc') {
      players.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sort === 'name-desc') {
      players.sort((a, b) => b.fullName.localeCompare(a.fullName));
    } else {
      // Default: set order (1 to 146)
      players.sort((a, b) => a.id - b.id);
    }

    res.json(players);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public Leaderboard
router.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const leaderboard = db.getLeaderboard();
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Participant Entry (No OTP)
router.post('/participants/enter', (req: Request, res: Response) => {
  try {
    const { phone, displayName } = req.body;
    if (!phone || !displayName) {
      return res.status(400).json({ error: 'Display name and Indian mobile number are required.' });
    }

    const { participant, isNew } = db.getOrCreateParticipant(phone, displayName);
    const existingEntry = db.getEntryByParticipantId(participant.id);

    // Return masked phone for privacy
    const maskedPhone = `******${participant.phone.slice(-4)}`;

    res.json({
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        phone: maskedPhone,
        createdAt: participant.createdAt,
      },
      isNew,
      entry: existingEntry,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get Participant's Entry
router.get('/entries/:participantId', (req: Request, res: Response) => {
  try {
    const participantId = req.params.participantId as string;
    const entry = db.getEntryByParticipantId(participantId);
    res.json({ entry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update Prediction Entry
router.post('/entries', (req: Request, res: Response) => {
  try {
    const { participantId, picks } = req.body;
    if (!participantId || !picks) {
      return res.status(400).json({ error: 'Participant ID and squad picks are required.' });
    }

    const savedEntry = db.saveEntry(participantId, picks);
    res.json({
      success: true,
      entry: savedEntry,
      message: 'Your RCB predicted squad has been saved successfully!',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Public Leaderboard
router.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const leaderboardData = db.getLeaderboard();
    res.json(leaderboardData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PROTECTED ADMIN ROUTES (/api/admin/*)
// -------------------------------------------------------------

// Admin verification check
router.get('/admin/verify', requireAdmin, (req: Request, res: Response) => {
  res.json({ valid: true });
});

// Admin Overview
router.get('/admin/overview', requireAdmin, (req: Request, res: Response) => {
  try {
    const stats = db.getAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Players & Auction Results
router.get('/admin/players', requireAdmin, (req: Request, res: Response) => {
  try {
    const players = db.getPlayers();
    const auctionResults = db.getAuctionResults();

    const merged = players.map(p => {
      const res = auctionResults[p.id];
      return {
        ...p,
        purchasedByRcb: res ? res.purchasedByRcb : false,
        actualPriceLakh: res ? res.actualPriceLakh : null,
        adminNotes: res ? res.notes : null,
        reviewed: Boolean(res),
      };
    });

    res.json(merged);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Auction Outcomes
router.post('/admin/auction-results', requireAdmin, (req: Request, res: Response) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required.' });
    }

    db.updateAuctionResults(results);
    res.json({ success: true, message: `Updated results for ${results.length} players.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Contest Settings (Status, Deadline, Purse)
router.post('/admin/contest-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, deadline, maxPurseLakh, notes } = req.body;
    const update: Partial<{ status: ContestStatus; deadline: string | null; maxPurseLakh: number }> = {};

    if (status) update.status = status;
    if (deadline !== undefined) update.deadline = deadline;
    if (maxPurseLakh && typeof maxPurseLakh === 'number') update.maxPurseLakh = maxPurseLakh;

    const updated = db.updateContestSettings(update, notes);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Preview Scores before publishing
router.get('/admin/preview-scores', requireAdmin, (req: Request, res: Response) => {
  try {
    const preview = db.calculateCurrentScores();
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Publish Results
router.post('/admin/publish-results', requireAdmin, (req: Request, res: Response) => {
  try {
    const published = db.publishResults();
    res.json({
      success: true,
      message: `Results published with ${published.length} ranked participants!`,
      leaderboard: published,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unpublish / Reset Results
router.post('/admin/unpublish-results', requireAdmin, (req: Request, res: Response) => {
  try {
    db.unpublishResults();
    res.json({ success: true, message: 'Results unpublished. Contest returned to LOCKED status.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Participants List
router.get('/admin/participants', requireAdmin, (req: Request, res: Response) => {
  try {
    const unmask = req.query.unmask === 'true';
    const participants = db.getAdminParticipants(!unmask);
    res.json(participants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete a single participant's squad prediction entry
router.delete('/admin/entries/:participantId', requireAdmin, (req: Request, res: Response) => {
  try {
    const participantId = req.params.participantId as string;
    const deleted = db.deleteEntry(participantId);
    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ success: true, message: 'Prediction entry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete a participant completely (and their entry)
router.delete('/admin/participants/:participantId', requireAdmin, (req: Request, res: Response) => {
  try {
    const participantId = req.params.participantId as string;
    const deleted = db.deleteParticipant(participantId);
    if (!deleted) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json({ success: true, message: 'Participant and all associated records deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Clear all entries / reset all fan entries
router.post('/admin/clear-all-entries', requireAdmin, (req: Request, res: Response) => {
  try {
    const { includeParticipants } = req.body;
    const stats = db.clearAllEntries(Boolean(includeParticipants));
    res.json({
      success: true,
      message: includeParticipants 
        ? `Cleared ${stats.deletedEntries} entries and ${stats.deletedParticipants} participants.`
        : `Cleared ${stats.deletedEntries} entries. Participants roster retained.`,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export CSV of Participants, Predictions and Scores
router.get('/admin/export-csv', requireAdmin, (req: Request, res: Response) => {
  try {
    const unmask = req.query.unmask === 'true';
    const participants = db.getAdminParticipants(!unmask);

    const headers = [
      'Participant ID',
      'Display Name',
      'Phone Number',
      'Registered At',
      'Has Entry',
      'Total Spend (Lakh)',
      'Total Points',
      'Exact Hits',
      'Correct Picks',
      'Picks Summary'
    ];

    const rows = [headers.join(',')];

    for (const p of participants) {
      const picksSummary = p.entry 
        ? p.entry.picks.map(pk => `${pk.player?.fullName || pk.playerId} (₹${pk.predictedPriceLakh}L)`).join('; ')
        : 'None';

      const row = [
        `"${p.id}"`,
        `"${p.displayName.replace(/"/g, '""')}"`,
        `"${p.phone}"`,
        `"${p.registeredAt}"`,
        p.hasEntry ? 'Yes' : 'No',
        p.entry ? p.entry.totalSpendLakh : 0,
        p.score ? p.score.totalPoints : 0,
        p.score ? p.score.exactPriceHits : 0,
        p.score ? p.score.correctPicks : 0,
        `"${picksSummary.replace(/"/g, '""')}"`
      ];

      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rcb_auction_predictor_entries.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Audit Logs
router.get('/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
