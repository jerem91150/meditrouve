import * as fs from 'fs';
import * as path from 'path';
import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';

// Load .env from bot directory
dotenv.config({ path: path.join(__dirname, '.env') });

const iconv = require('iconv-lite');

// --- Config ---
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TWEETED_FILE = path.join(__dirname, 'tweeted.json');
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_TWEETS = parseInt(process.env.MAX_TWEETS_PER_RUN || '5', 10);

// --- Types ---
interface Shortage {
  cisCode: string;
  level: number;
  status: string;
  startDate: string;
  endDate: string;
  url: string;
}

interface Medication {
  cisCode: string;
  name: string;
}

// --- File parsing (latin1 encoding like import-bdpm.ts) ---
function parseFile(filename: string): string[] {
  const filepath = path.join(DATA_DIR, filename);
  const buffer = fs.readFileSync(filepath);
  const content = iconv.decode(buffer, 'latin1') as string;
  return content.split('\n').filter((line: string) => line.trim());
}

function parseMedications(): Map<string, Medication> {
  const lines = parseFile('CIS_bdpm.txt');
  const meds = new Map<string, Medication>();
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const cisCode = parts[0].trim();
    const name = parts[1].trim();
    meds.set(cisCode, { cisCode, name });
  }
  return meds;
}

function parseShortages(): Shortage[] {
  const lines = parseFile('CIS_CIP_Dispo_Spec.txt');
  const shortages: Shortage[] = [];
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    shortages.push({
      cisCode: parts[0].trim(),
      level: parseInt(parts[2]) || 0,
      status: parts[3].trim(),
      startDate: parts[4].trim(),
      endDate: parts[5]?.trim() || '',
      url: parts[7]?.trim() || '',
    });
  }
  return shortages;
}

// --- Tracking (already tweeted) ---
function loadTweeted(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(TWEETED_FILE, 'utf-8'));
    return new Set(data.tweeted || []);
  } catch {
    return new Set();
  }
}

function saveTweeted(tweeted: Set<string>): void {
  fs.writeFileSync(TWEETED_FILE, JSON.stringify({
    tweeted: Array.from(tweeted),
    lastRun: new Date().toISOString(),
  }, null, 2));
}

// --- Tweet formatting ---
function formatDrugName(raw: string): string {
  // Take only the first part before comma for cleaner tweets
  const short = raw.split(',')[0].trim();
  // Capitalize nicely: first letter upper, rest as-is
  return short.length > 80 ? short.substring(0, 77) + '...' : short;
}

function buildTweet(drugName: string, status: string): string {
  const emoji = status.toLowerCase().includes('rupture') ? '🚨' : '⚠️';
  const statusLabel = status.toLowerCase().includes('rupture')
    ? 'Rupture de stock'
    : 'Tension d\'approvisionnement';

  const tweet = `${emoji} ${statusLabel} : ${drugName}\n\nSuivez les alertes en temps réel sur alertemedicaments.fr\n\n#RuptureMédicament #Santé #AlerteMedicaments`;

  // Twitter limit = 280 chars
  if (tweet.length > 280) {
    const maxName = 280 - (tweet.length - drugName.length);
    const truncated = drugName.substring(0, maxName - 3) + '...';
    return tweet.replace(drugName, truncated);
  }
  return tweet;
}

// --- Main ---
async function main() {
  console.log('🤖 AlerteMedicaments Twitter Bot');
  console.log(`   Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🚀 LIVE'}`);
  console.log(`   Max tweets/run: ${MAX_TWEETS}\n`);

  // Parse data
  const medications = parseMedications();
  const shortages = parseShortages();
  const tweeted = loadTweeted();

  console.log(`📊 ${medications.size} médicaments, ${shortages.length} ruptures/tensions`);
  console.log(`📝 ${tweeted.size} déjà tweetés\n`);

  // Find new shortages (not yet tweeted)
  // Use cisCode + startDate as unique key to detect new entries
  const newShortages: { shortage: Shortage; medication: Medication }[] = [];

  for (const shortage of shortages) {
    const key = `${shortage.cisCode}:${shortage.startDate}`;
    if (tweeted.has(key)) continue;

    const med = medications.get(shortage.cisCode);
    if (!med) continue;

    newShortages.push({ shortage, medication: med });
  }

  console.log(`🆕 ${newShortages.length} nouvelles ruptures à tweeter\n`);

  if (newShortages.length === 0) {
    console.log('✅ Rien de nouveau à poster.');
    return;
  }

  // Prioritize: ruptures first, then tensions
  newShortages.sort((a, b) => {
    const aRupture = a.shortage.status.toLowerCase().includes('rupture') ? 0 : 1;
    const bRupture = b.shortage.status.toLowerCase().includes('rupture') ? 0 : 1;
    return aRupture - bRupture;
  });

  // Init Twitter client (only if not dry run)
  let client: TwitterApi | null = null;
  if (!DRY_RUN) {
    const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } = process.env;
    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
      console.error('❌ Twitter credentials missing! Set them in .env');
      process.exit(1);
    }
    client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: TWITTER_ACCESS_TOKEN,
      accessSecret: TWITTER_ACCESS_SECRET,
    });
  }

  // Post tweets (limited)
  const toPost = newShortages.slice(0, MAX_TWEETS);
  let posted = 0;

  for (const { shortage, medication } of toPost) {
    const key = `${shortage.cisCode}:${shortage.startDate}`;
    const drugName = formatDrugName(medication.name);
    const tweet = buildTweet(drugName, shortage.status);

    console.log(`📤 Tweet (${tweet.length} chars):`);
    console.log(`   ${tweet.replace(/\n/g, '\n   ')}\n`);

    if (!DRY_RUN && client) {
      try {
        await client.v2.tweet(tweet);
        console.log('   ✅ Posté!\n');
      } catch (err: any) {
        console.error(`   ❌ Erreur: ${err.message}\n`);
        // Rate limit? Stop.
        if (err.code === 429) {
          console.log('⏳ Rate limit atteint, arrêt.');
          break;
        }
        continue; // Don't mark as tweeted if failed
      }
    } else {
      console.log('   🧪 (dry run, pas posté)\n');
    }

    tweeted.add(key);
    posted++;

    // Small delay between tweets
    if (!DRY_RUN && posted < toPost.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  saveTweeted(tweeted);
  console.log(`\n✅ Terminé: ${posted} tweets ${DRY_RUN ? '(simulés)' : 'postés'}`);
  console.log(`📝 ${tweeted.size} total dans le tracking`);
}

main().catch((err) => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
