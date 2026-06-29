/**
 * Rule-based matching smoke test (no embeddings / API keys).
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  splitSegments,
  ruleBasedMatch,
  mergeContext,
} from '../backend/categoryMatcher.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const FALLBACK_ITEMS = JSON.parse(
  readFileSync(join(root, 'standalone', 'sample-price-list.json'), 'utf8')
);

async function loadPriceList() {
  const paths = [
    join(root, 'standalone', 'sample-price-list.json'),
    join(root, 'frontend', 'public', 'sample-price-list.json'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch {
      /* try next */
    }
  }
  console.warn('Using fallback price list (catalog not found)');
  return FALLBACK_ITEMS;
}

function matchQuoteRuleBased(input, priceList) {
  const segments = splitSegments(input);
  const results = [];
  const used = new Set();
  let context = { series: null, model: null, size: null, tier: null };

  for (const seg of segments) {
    const match = ruleBasedMatch(seg, priceList, context, used);
    if (match) {
      results.push(match);
      used.add(match.Item);
      context = mergeContext(context, match.Item);
    }
  }

  if (!results.length) {
    const match = ruleBasedMatch(input, priceList, context, used);
    if (match) results.push(match);
  }
  return results;
}

const EXPECTED = {
  'cub sig, spaboy, spaboy starter': [
    "Cub Signature 7'",
    'SpaBoy Salt Water System',
    'SpaBoy Starter Kit (Spa)',
  ],
  'summit signature with grey cover': [
    'Summit XL Signature',
    'Custom - Summit XL Cover',
  ],
  'arctic fox prestige with cover and onzen': [
    'Arctic Fox Prestige',
    'Custom - Fox Mylovac Cover',
    'Custom - Onzen',
  ],
};

const priceList = await loadPriceList();
let passed = 0;
let failed = 0;

for (const [input, expectedItems] of Object.entries(EXPECTED)) {
  const matched = matchQuoteRuleBased(input, priceList);
  const names = matched.map((m) => m.Item);
  const ok =
    names.length === expectedItems.length &&
    expectedItems.every((e, i) => names[i] === e);

  console.log(`\n--- ${input} ---`);
  names.forEach((n, i) => console.log(`  ${matched[i]?.Quantity ?? 1}x ${n}`));
  if (ok) {
    console.log('  PASS');
    passed++;
  } else {
    console.log('  FAIL');
    console.log('  Expected:', expectedItems.join(' | '));
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
