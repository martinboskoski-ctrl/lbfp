import PizZip from 'pizzip';
import { PACKAGING_SECTORS } from '../models/PackagingCheck.js';
import { openaiAdapter } from './aiProviders/openai.js';

// AI review of packaging artwork against the product's ingredient list and the
// checklist rules. Everything except the provider call lives here; to connect a
// provider, register an adapter with registerAiProvider() and set in server/.env:
//   PACKAGING_AI_PROVIDER=<key in PROVIDERS>   (built in: openai)
//   PACKAGING_AI_API_KEY=...
//   PACKAGING_AI_MODEL=...            (must accept images)
//
// An adapter receives { apiKey, model, system, prompt, attachments } where each
// attachment is { mimeType, base64, label }, and resolves to the model's raw text.
const PROVIDERS = {};

export const registerAiProvider = (name, adapter) => { PROVIDERS[name] = adapter; };

registerAiProvider('openai', openaiAdapter);

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI provider is not configured');
    this.status = 503;
  }
}

const providerName = () => process.env.PACKAGING_AI_PROVIDER || '';

export const isAiConfigured = () =>
  Boolean(PROVIDERS[providerName()] && process.env.PACKAGING_AI_API_KEY);

const SECTOR_NAMES = {
  sales: 'Sales',
  r_and_d: 'R&D',
  nabavki: 'Purchasing',
  quality_assurance: 'Quality Assurance',
};

const SEVERITIES = ['critical', 'warning', 'info'];

// Remarks and the summary are always in English: they go to the client as-is.
const SYSTEM = `You are a food labelling compliance expert at LBFP DOO Bitola, a food manufacturer
producing private-label products (mainly for the EU market).
You review label / packaging artwork (image or PDF) sent by a client, against the product's
ingredient list and our checklist rules (EU food law: Regulation (EU) 1169/2011, 1924/2006,
1333/2008, the packaging regulation (EU) 2025/40 and related acts).

Write every remark and the summary in clear, professional ENGLISH, whatever language the
artwork, ingredient list or rules are in. Quote label text in its original language.
Report only real problems or points a person must verify — no praise, no generic advice.
Each remark: what is wrong, where on the artwork, and what it should say or how to fix it.
Reply ONLY with valid JSON, no other text.`;

const buildPrompt = ({ rules, ingredientsText, markets, clientMessage, history, artworkCount, artworkFromRound }) => {
  const ruleLines = rules.map((r) =>
    `- [${r._id}] (${SECTOR_NAMES[r.sector]}${r.category ? ` · ${r.category}` : ''}) ${r.text}`
  ).join('\n');

  return `TARGET MARKETS: ${markets?.trim() || 'EU (countries not specified — flag language requirements as something to confirm with the client)'}

CHECKLIST RULES (id in brackets, then the sector responsible for the rule):
${ruleLines || '(no active rules — check consistency with the ingredient list only)'}

PRODUCT INGREDIENT LIST / RECIPE:
${ingredientsText?.trim() || '(not provided — see an attached document if any, otherwise do not invent one)'}

CONVERSATION SO FAR WITH THE CLIENT:
${history?.trim() || '(this is the first round)'}

CLIENT'S MESSAGE IN THIS ROUND:
${clientMessage?.trim() || '(no message — the client only sent files)'}

ARTWORK: ${artworkCount
    ? `${artworkCount} file(s) attached${artworkFromRound ? ` — sent by the client in round ${artworkFromRound}; no new artwork in this round` : ', sent in this round'}. Treat multiple files as panels/versions of the same pack.`
    : 'none available — answer the client\'s message from the conversation, rules and your expertise; do not review artwork.'}

TASK:
- If the client asked something, answer it in "answer": a short, clear reply in English that Sales
  can paste into an email to the client (no greeting or signature). Otherwise leave "answer" empty.
- Do not repeat points from earlier rounds that our team dismissed, and only re-raise earlier
  confirmed points if they are still not fixed in the current artwork.
- If there is artwork, review it against the ingredient list and the rules:
- Raise one remark per distinct issue. Never raise the same issue twice under different rules.
- Mandatory information that is NOT VISIBLE on the artwork at all (e.g. no ingredient list, no
  nutrition table, no date, no lot space) goes ONLY into "missing", as short item names grouped
  by the responsible sector (each item in exactly one sector). Never also raise a remark for it,
  and never raise a remark about something being unverifiable because it is missing.
- "remarks" are for problems in what IS on the artwork: wrong, incomplete, misleading,
  misspelled, inconsistent or badly placed content, and points to confirm.
- Judge language requirements against the target markets above.
- Proofread ALL visible text in every language, even where no rule applies: spelling, grammar,
  punctuation, diacritics, typos, inconsistent names/numbers between panels and language
  versions, and mismatches with the ingredient list. For each error quote the exact wrong text
  in its original language and give the correction (e.g. 'Ingredents' → 'Ingredients').
  Group several small typos of the same panel into one remark.
- If a rule cannot be verified from the artwork and documents (e.g. supplier certificates,
  lab results), raise it only when it matters for this product, as severity "info", phrased as
  something to confirm.
- If the remark relates to a rule, give its id. Otherwise choose the sector:
  r_and_d = recipe, ingredients, additives, nutrition values, claims;
  quality_assurance = legal labelling, allergen emphasis, dates, legibility, language, proofreading;
  nabavki = packaging material, print specification and print-technical issues, food-contact and packaging compliance;
  sales = client agreements, markets, business operator details, barcode.
- severity: "critical" = non-compliant / must be fixed before printing; "warning" = should be
  fixed or confirmed; "info" = suggestion or point to confirm.

Format:
{"summary": "2-4 sentence overview in English for our team (state of the artwork and/or what the client asked)",
 "answer": "reply to the client's question in English, or empty string",
 "missing": [{"sector": "<sector>", "items": ["short name of missing particular", ...]}],
 "remarks": [{"ruleId": "<id or null>", "sector": "<sector>", "severity": "critical|warning|info", "text": "remark in English"}]}`;
};

// Pulls the first JSON object out of the reply and normalises every remark.
const parseResponse = (raw, rules) => {
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not contain JSON');
  const data = JSON.parse(match[0]);
  const byId = new Map(rules.map((r) => [String(r._id), r]));

  const remarks = (Array.isArray(data.remarks) ? data.remarks : [])
    .filter((r) => r && typeof r.text === 'string' && r.text.trim())
    .map((r) => {
      const rule = r.ruleId ? byId.get(String(r.ruleId)) : null;
      const sector = rule?.sector
        || (PACKAGING_SECTORS.includes(r.sector) ? r.sector : 'quality_assurance');
      return {
        text: r.text.trim(),
        severity: SEVERITIES.includes(r.severity) ? r.severity : 'warning',
        sector,
        rule: rule?._id,
        ruleText: rule?.text || '',
        source: 'ai',
      };
    });

  // Everything not visible on the artwork becomes ONE critical remark per sector.
  const missingRemarks = (Array.isArray(data.missing) ? data.missing : [])
    .map((m) => ({
      sector: PACKAGING_SECTORS.includes(m?.sector) ? m.sector : 'quality_assurance',
      items: [...new Set((Array.isArray(m?.items) ? m.items : []).map((i) => String(i).trim()).filter(Boolean))],
    }))
    .filter((m) => m.items.length)
    .reduce((acc, m) => {
      const existing = acc.find((a) => a.sector === m.sector);
      if (existing) existing.items.push(...m.items.filter((i) => !existing.items.includes(i)));
      else acc.push(m);
      return acc;
    }, [])
    .map((m) => ({
      text: `Not visible on the artwork: ${m.items.join('; ')}.`,
      severity: 'critical',
      sector: m.sector,
      ruleText: '',
      source: 'ai',
    }));

  return {
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
    answer: typeof data.answer === 'string' ? data.answer.trim() : '',
    remarks: [...missingRemarks, ...remarks],
  };
};

// Word ingredient lists are sent as text; images/PDFs are attached as-is.
export const docxToText = (buffer) => {
  const xml = new PizZip(buffer).file('word/document.xml')?.asText() || '';
  return xml
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * @param {{ attachments: Array<{buffer, mimeType, label}>, artworkFromRound?: number|null,
 *           ingredientsText: string, ingredientsFile?: {buffer, mimeType}, clientMessage?: string,
 *           history?: string, markets?: string, rules: Array }} input
 * @returns {Promise<{ summary: string, answer: string, remarks: Array, model: string }>}
 */
export const reviewArtwork = async ({
  attachments: artwork = [], artworkFromRound = null, ingredientsText, ingredientsFile,
  clientMessage = '', history = '', markets, rules,
}) => {
  if (!isAiConfigured()) throw new AiNotConfiguredError();

  const attachments = artwork.map((a) => ({ mimeType: a.mimeType, base64: a.buffer.toString('base64'), label: a.label }));
  if (ingredientsFile && /^(image\/|application\/pdf)/.test(ingredientsFile.mimeType)) {
    attachments.push({ mimeType: ingredientsFile.mimeType, base64: ingredientsFile.buffer.toString('base64'), label: 'ingredients' });
  }

  const model = process.env.PACKAGING_AI_MODEL || '';
  const raw = await PROVIDERS[providerName()]({
    apiKey: process.env.PACKAGING_AI_API_KEY,
    model,
    system: SYSTEM,
    prompt: buildPrompt({
      rules, ingredientsText, markets, clientMessage, history, artworkCount: artwork.length, artworkFromRound,
    }),
    attachments,
  });
  return { ...parseResponse(raw, rules), model };
};
