// @ts-nocheck — ported from JS matcher; typed consumers use matchScoring.ts
/**
 * Category-aware matching for commission/catalog price lists.
 * Maps natural language to series, spa models, and related accessories (covers, etc.)
 */

export const SERIES_PREFIXES = ['Covana Evolution', 'Covana Legend', 'Custom', 'Classic', 'Core', 'AWP'];

export function parseQuantity(segment) {
  const WORD_QUANTITIES = {
    one: 1, a: 1, an: 1, single: 1,
    two: 2, pair: 2, couple: 2, double: 2,
    three: 3, few: 3, several: 4,
    four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    dozen: 12,
  };

  const numMatch = segment.match(/(\d+(?:\.\d+)?)\s*(?:x|×)?/);
  if (numMatch) {
    return { quantity: Math.max(1, Math.round(parseFloat(numMatch[1]))), text: segment.replace(numMatch[0], ' ') };
  }
  for (const [word, qty] of Object.entries(WORD_QUANTITIES)) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(segment)) {
      return { quantity: Math.max(1, Math.round(qty)), text: segment.replace(re, ' ') };
    }
  }
  return { quantity: 1, text: segment };
}

const SEPARATORS = /\s+(?:and|with|plus|also|including|along with|as well as|&)\s+|,\s*/gi;

export function splitSegments(userInput) {
  let normalized = userInput.replace(SEPARATORS, ', ');
  // "summit signature grey cover" → "summit signature, grey cover"
  normalized = normalized.replace(
    /^(.+?)\s+(grey|gray|charcoal|slate|mocha|black|white|platinum|latte)\s+cover\s*$/i,
    '$1, $2 cover'
  );
  const segments = normalized.split(',').map((s) => s.trim()).filter(Boolean);
  return segments.length ? segments : [userInput.trim()];
}

export function detectSeries(text) {
  const t = text.toLowerCase();
  if (/covana\s*evolution|evolution\s*cover/i.test(t)) return 'Covana Evolution';
  if (/covana\s*legend|\blegend\s*-\s*\d+/i.test(t)) return 'Covana Legend';
  if (/summit|arctic\s*fox|\bfox\b|\bcub\b|prestige\s*7|signature\s*7|prestige\s*8|signature\s*8|legend\s*select|select\s*8|custom\s*-/i.test(t)) return 'Custom';
  if (/timberwolf|whistler|\bclassic\b|7\s*ft\s*classic|8\s*ft\s*classic/i.test(t)) return 'Classic';
  if (/\bcore\b|lunar|orion|\bnova\b/i.test(t)) return 'Core';
  if (/ocean|columbia|okanagan|polar\s*bear|athabascan|all\s*weather|\bawp\b/i.test(t)) return 'AWP';
  return null;
}

export function extractContext(itemName) {
  const ctx = { series: null, model: null, size: null, tier: null };

  for (const prefix of SERIES_PREFIXES) {
    if (itemName.startsWith(prefix + ' -')) {
      ctx.series = prefix;
      break;
    }
  }

  const lower = itemName.toLowerCase();
  if (!ctx.series) {
    if (/^cub\b|^(summit xl|arctic fox)\b/i.test(itemName)) ctx.series = 'Custom';
    else if (/^(ocean|columbia|okanagan|polar bear|athabascan|hudson|kingfisher|wolverine)\b/i.test(itemName)) ctx.series = 'AWP';
    else if (/^(nova|lunar)\b|^classic prestige|^classic signature|^timberwolf/i.test(itemName)) {
      ctx.series = /^classic|^timberwolf/i.test(itemName) ? 'Classic' : 'Core';
    }
  }

  if (/summit\s*xl/i.test(lower)) ctx.model = 'summit_xl';
  else if (/arctic\s*fox|\bfox\b/i.test(lower)) ctx.model = 'fox';
  else if (/\bcub\b/i.test(lower)) ctx.model = 'cub';
  else if (/\b7\s*'?ft\b|prestige\s*7|signature\s*7/i.test(lower)) ctx.size = '7';
  else if (/\b8\s*'?ft\b|prestige\s*8|signature\s*8|legend\s*select\s*8|select\s*8/i.test(lower)) ctx.size = '8';

  if (/legend\s*select/i.test(lower)) ctx.tier = 'legend_select';
  else if (/signature|signtaure/i.test(lower)) ctx.tier = 'signature';
  else if (/prestige/i.test(lower)) ctx.tier = 'prestige';
  else if (/\blegend\b/i.test(lower) && !/legend\s*select/i.test(lower)) ctx.tier = 'legend';

  return ctx;
}

export function mergeContext(existing, fromItem) {
  const itemCtx = extractContext(fromItem);
  return {
    series: existing.series || itemCtx.series,
    model: existing.model || itemCtx.model,
    size: existing.size || itemCtx.size,
    tier: existing.tier || itemCtx.tier,
  };
}

function findItem(name, priceList, usedItems) {
  const item = priceList.find((p) => p.Item === name && !usedItems.has(p.Item));
  return item ? { Item: item.Item, Quantity: 1 } : null;
}

function findItemFuzzy(pattern, priceList, usedItems, seriesFilter = null) {
  const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  const candidates = priceList.filter((p) => {
    if (usedItems.has(p.Item)) return false;
    if (seriesFilter && !p.Item.startsWith(seriesFilter + ' -')) return false;
    return re.test(p.Item);
  });
  return candidates[0] ? { Item: candidates[0].Item, Quantity: 1 } : null;
}

function isCoverSegment(text) {
  return /\bcover\b|mylovac|hot\s*tub\s*cover|spa\s*cover/i.test(text);
}

function isInstallSegment(text) {
  return /install|installation|delivery|setup/i.test(text);
}

/** Rule-based match for known catalog product patterns */
export function ruleBasedMatch(segment, priceList, context, usedItems) {
  const { quantity, text } = parseQuantity(segment);
  const t = text.toLowerCase().trim();
  if (!t) return null;

  const series = detectSeries(t) || context.series;

  // --- INSTALL segments (use context from prior spa/covana match) ---
  if (isInstallSegment(t)) {
    if (context.series === 'Covana Legend' || series === 'Covana Legend' || /legend\s*install/i.test(t)) {
      const m = findItem('Covana Legend - Legend Installation', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (context.series === 'Covana Evolution' || series === 'Covana Evolution' || /evolution\s*install/i.test(t)) {
      const m = findItem('Covana Evolution - Evolution Installation', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
  }

  // --- COVANA LEGEND (size + color) ---
  if (series === 'Covana Legend' || (/covana/i.test(t) && /legend/i.test(t)) || (/legend/i.test(t) && /\b\d{1,2}\s*'?ft/i.test(t))) {
    const sizeMatch = t.match(/\b(8|9|10|11|12|13|14|15|16|17|18|19|20)\s*'?ft/i) || t.match(/\b(8|9|10|11|12|13|14|15|16|17|18|19|20)\b/);
    const size = sizeMatch ? sizeMatch[1] : null;
    if (size) {
      const isPlatinum = /platinum|latte/i.test(t);
      const colorSuffix = isPlatinum ? 'Slate/Platinum or Mocha/Latte' : 'Slate/White or Mocha/White';
      const exact = `Covana Legend - LEGEND - ${size}' ${colorSuffix}`;
      let m = findItem(exact, priceList, usedItems);
      if (!m) m = findItemFuzzy(new RegExp(`LEGEND - ${size}'`), priceList, usedItems, 'Covana Legend');
      if (m) return { ...m, Quantity: quantity };
    }
  }

  // --- COVANA EVOLUTION (size + color) ---
  if (series === 'Covana Evolution' || (/covana/i.test(t) && /evolution/i.test(t)) || (/evolution/i.test(t) && /\b\d{1,2}\s*'?ft/i.test(t))) {
    const sizeMatch = t.match(/\b(8|9|10|11)\s*'?ft/i) || t.match(/\b(8|9|10|11)\b/);
    const size = sizeMatch ? sizeMatch[1] : null;
    if (size) {
      const isPlatinum = /platinum|latte/i.test(t);
      const colorSuffix = isPlatinum ? 'Slate/Platinum or Mocha/Latte' : 'Slate/White or Mocha/White';
      const exact = `Covana Evolution - EVOLUTION - ${size}' ${colorSuffix}`;
      let m = findItem(exact, priceList, usedItems);
      if (!m) m = findItemFuzzy(new RegExp(`EVOLUTION - ${size}'`), priceList, usedItems, 'Covana Evolution');
      if (m) return { ...m, Quantity: quantity };
    }
  }

  // --- CUB (Custom series compact spa) ---
  if (/\bcub\b/i.test(t)) {
    if (/legend\s*select/i.test(t)) {
      const m = findItem('Cub Legend Select 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/prestige/i.test(t) && /\b8\b|8\s*'?ft/i.test(t)) {
      const m = findItem('Cub Prestige 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/prestige/i.test(t)) {
      const m = findItem('Cub Prestige 7\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/signature/i.test(t) && /\b8\b|8\s*'?ft/i.test(t)) {
      const m = findItem('Cub Signature 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/sig/i.test(t)) {
      const m = findItem('Cub Signature 7\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    const m = findItemFuzzy(/^Cub /i, priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }

  // --- PURIFICATION & ACCESSORIES (Custom series) ---
  if (/\bonzen\b/i.test(t) && !/awp/i.test(t)) {
    const m = findItem('Custom - Onzen', priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }
  if (/spa\s*boy\s*starter|spaboy\s*starter/i.test(t)) {
    const m = findItemFuzzy(/SpaBoy Starter/i, priceList, usedItems)
      || findItem('Custom - SpaBoy Spa', priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }
  if (/spa\s*boy|spaboy/i.test(t)) {
    const m = findItemFuzzy(/SpaBoy Salt Water/i, priceList, usedItems)
      || findItemFuzzy(/SpaBoy System/i, priceList, usedItems)
      || findItem('Custom - Spa Boy', priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }
  if (/\bpeak\b/i.test(t) && !/step|week/i.test(t)) {
    const m = findItem('Custom - Peak', priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }
  if (/smart\s*ph/i.test(t)) {
    const m = findItem('Custom - Smart pH System', priceList, usedItems);
    if (m) return { ...m, Quantity: quantity };
  }

  // --- COVER segments (use spa context to pick correct cover) ---
  if (isCoverSegment(t)) {
    if (context.model === 'summit_xl' || (/summit/i.test(t) && !context.size)) {
      const m = findItem('Custom - Summit XL Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (context.model === 'fox' || /fox|arctic\s*fox/i.test(t)) {
      const m = findItem('Custom - Fox Mylovac Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (context.size === '7' || /\b7\s*'?ft\b|seven\s*foot/i.test(t)) {
      const m = findItem('Custom - 7ft Mylovac Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (context.size === '8' || /\b8\s*'?ft\b|eight\s*foot/i.test(t)) {
      const m = findItem('Custom - 8 ft Mylovac Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (series === 'Core' || /mylovac\s*upgrade/i.test(t)) {
      const m = findItem('Core - Mylovac Cover Upgrade', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    // Generic cover with context from tier+size
    if (context.tier && context.size === '8') {
      const m = findItem('Custom - 8 ft Mylovac Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (context.tier && context.size === '7') {
      const m = findItem('Custom - 7ft Mylovac Cover', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
  }

  // --- CUSTOM series spas (most specific first) ---
  if (!series || series === 'Custom') {
    if (/summit/i.test(t)) {
      if (/legend\s*select/i.test(t)) {
        const m = findItem('Summit XL Legend Select', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/signature|signtaure/i.test(t)) {
        const m = findItem('Summit XL Signature', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Summit XL Prestige', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      const m = findItemFuzzy(/^Summit XL /i, priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }

    if (/arctic\s*fox|\bfox\b/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Arctic Fox Signature', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Arctic Fox Prestige', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }

    if (/legend\s*select/i.test(t) && /\b8\b|8\s*'?ft/i.test(t)) {
      const m = findItem('Cub Legend Select 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }

    if (/signature/i.test(t) && /\b8\b|8\s*'?ft/i.test(t)) {
      const m = findItem('Cub Signature 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/signature/i.test(t) && /\b7\b|7\s*'?ft/i.test(t)) {
      const m = findItem('Cub Signature 7\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/prestige/i.test(t) && /\b8\b|8\s*'?ft/i.test(t)) {
      const m = findItem('Cub Prestige 8\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
    if (/prestige/i.test(t) && /\b7\b|7\s*'?ft/i.test(t)) {
      const m = findItem('Cub Prestige 7\'', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }

    if (/signature|signtaure/i.test(t) && context.model === 'summit_xl') {
      const m = findItem('Summit XL Signature', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
  }

  // --- CLASSIC ---
  if (series === 'Classic') {
    if (/timberwolf|whistler/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Timberwolf/Whistler Signature', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Timberwolf/Whistler Prestige', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }
    if (/\b7\b|7\s*ft/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Classic Signature 7\'', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Classic Prestige 7\'', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }
    if (/\b8\b|8\s*ft/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Classic Signature 8\'', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Classic Prestige 8\'', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }
  }

  // --- CORE ---
  if (series === 'Core') {
    if (/lunar|orion/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Lunar Orion Signature', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Lunar Orion Prestige', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }
    if (/nova/i.test(t)) {
      if (/signature/i.test(t)) {
        const m = findItem('Nova Signature', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
      if (/prestige/i.test(t)) {
        const m = findItem('Nova Prestige', priceList, usedItems);
        if (m) return { ...m, Quantity: quantity };
      }
    }
  }

  // --- AWP ---
  if (series === 'AWP') {
    const models = ['Ocean', 'Columbia', 'Okanagan', 'Polar Bear'];
    for (const model of models) {
      if (new RegExp(model, 'i').test(t)) {
        if (/legend\s*select/i.test(t)) {
          const m = findItem(`${model} Legend Select`, priceList, usedItems);
          if (m) return { ...m, Quantity: quantity };
        }
        if (/\blegend\b/i.test(t)) {
          const m = findItem(`${model} Legend`, priceList, usedItems);
          if (m) return { ...m, Quantity: quantity };
        }
        if (/signature/i.test(t)) {
          const m = findItem(`${model} Signature`, priceList, usedItems);
          if (m) return { ...m, Quantity: quantity };
        }
        if (/prestige/i.test(t)) {
          const m = findItem(`${model} Prestige`, priceList, usedItems);
          if (m) return { ...m, Quantity: quantity };
        }
      }
    }
    if (/athabascan/i.test(t)) {
      const m = findItem('Athabascan', priceList, usedItems);
      if (m) return { ...m, Quantity: quantity };
    }
  }

  return null;
}

/** Boost embedding scores using category context */
export function scoreBoost(baseScore, itemName, context, segment) {
  let score = baseScore;
  const itemCtx = extractContext(itemName);
  const segSeries = detectSeries(segment);

  if (context.series && itemCtx.series === context.series) score += 0.08;
  if (segSeries && itemCtx.series === segSeries) score += 0.1;
  if (context.model && itemCtx.model === context.model) score += 0.12;
  if (context.size && itemCtx.size === context.size) score += 0.08;
  if (context.tier && itemCtx.tier === context.tier) score += 0.1;

  // Penalize wrong category: cover query shouldn't match spas
  if (isCoverSegment(segment) && !/cover|mylovac/i.test(itemName.toLowerCase())) score -= 0.15;
  if (!isCoverSegment(segment) && /cover|mylovac/i.test(itemName.toLowerCase()) && !/spa|prestige|signature|legend|summit|fox|lunar|nova|ocean/i.test(segment.toLowerCase())) {
    score -= 0.1;
  }

  return score;
}

export function enrichEmbedText(itemName) {
  const ctx = extractContext(itemName);
  const parts = [itemName];
  if (ctx.series) parts.push(`series ${ctx.series}`);
  if (ctx.model === 'summit_xl') parts.push('summit xl spa hot tub');
  if (ctx.model === 'fox') parts.push('arctic fox spa hot tub');
  if (ctx.size) parts.push(`${ctx.size} foot spa`);
  if (ctx.tier) parts.push(ctx.tier.replace('_', ' '));
  if (/cover|mylovac/i.test(itemName)) parts.push('hot tub cover mylovac');
  return parts.join(' ');
}

export function enrichQueryText(segment) {
  const parts = [`Customer wants: ${segment}`];
  const series = detectSeries(segment);
  if (series) parts.push(`category ${series}`);
  if (isCoverSegment(segment)) parts.push('accessory cover for spa');
  if (/onzen|spa boy|peak|installation/i.test(segment)) parts.push('accessory add-on');
  if (/summit/i.test(segment)) parts.push('summit xl custom spa');
  if (/signature/i.test(segment)) parts.push('signature tier');
  if (/prestige/i.test(segment)) parts.push('prestige tier');
  return parts.join('. ');
}

/** Rule-based quote matching — no API keys or embedding models required */
export function matchQuoteItemsRuleBased(userInput, priceList) {
  const segments = splitSegments(userInput);
  const results = [];
  const usedItems = new Set();
  let context = { series: null, model: null, size: null, tier: null };

  for (const segment of segments) {
    const match = ruleBasedMatch(segment, priceList, context, usedItems);
    if (match) {
      results.push(match);
      usedItems.add(match.Item);
      context = mergeContext(context, match.Item);
    }
  }

  if (!results.length) {
    const match = ruleBasedMatch(userInput, priceList, context, usedItems);
    if (match) results.push(match);
  }

  return results;
}
