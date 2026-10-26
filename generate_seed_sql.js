import fs from 'fs';

const players = JSON.parse(fs.readFileSync('./players.json', 'utf-8'));

const lines = [
  '-- Seed all 146 players from official TATA WPL 2027 Auction PDF',
  'INSERT INTO players (id, list_sr_no, set_no, set_code, first_name, surname, full_name, country, is_overseas, state_association, dob, age, specialism, batting_hand, bowling_style, previous_wpl_team, previous_wpl_matches, classification, base_price_lakh) VALUES'
];

const values = players.map(p => {
  const esc = (s) => (s ? `'${s.replace(/'/g, "''")}'` : 'NULL');
  return `(${p.id}, ${p.listSrNo}, ${p.setNo}, ${esc(p.setCode)}, ${esc(p.firstName)}, ${esc(p.surname)}, ${esc(p.fullName)}, ${esc(p.country)}, ${p.isOverseas}, ${esc(p.stateAssociation)}, ${esc(p.dob)}, ${p.age}, ${esc(p.specialism)}, ${esc(p.battingHand)}, ${esc(p.bowlingStyle)}, ${esc(p.previousWplTeam)}, ${p.previousWplMatches === null ? 'NULL' : p.previousWplMatches}, ${esc(p.classification)}, ${p.basePriceLakh})`;
});

lines.push(values.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n');
fs.writeFileSync('./migrations/002_seed_players.sql', lines.join('\n'), 'utf-8');
console.log('Successfully generated migrations/002_seed_players.sql for', players.length, 'players.');
