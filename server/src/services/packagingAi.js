import PizZip from 'pizzip';
import { EMAIL_SECTION_KEYS } from '../models/PackagingCheck.js';
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

// Which email paragraph a rule's remarks go to by default.
const RULE_SECTION = { r_and_d: 'rnd', nabavki: 'graphics', quality_assurance: 'quality', sales: 'quality' };

// Remarks and the summary are always in English: they go to the client as-is.
const SYSTEM = `You are a food labelling compliance expert at LBFP DOO Bitola, a food manufacturer
producing private-label products (mainly for the EU market).
You review label / packaging artwork (image or PDF) sent by a client, against the product's
ingredient list and our checklist rules (EU food law: Regulation (EU) 1169/2011, 1924/2006,
1333/2008, the packaging regulation (EU) 2025/40 and related acts).

Write every remark, the answer and the summary in clear, professional ENGLISH, whatever language the
artwork, ingredient list or rules are in. Quote label text in its original language.
Report only real problems or points a person must verify — no praise, no generic advice.
Each remark is ONE short, clear sentence (at most ~30 words) saying what is wrong and how to
fix it. The remarks go straight into an email to the client, grouped by our department.
Reply ONLY with valid JSON, no other text.`;

const buildPrompt = ({ rules, ingredientsText, markets, clientMessage, history, artworkCount, artworkFromRound }) => {
  const ruleLines = rules.map((r) =>
    `- (${RULE_SECTION[r.sector]}${r.category ? ` · ${r.category}` : ''}) ${r.text}`
  ).join('\n');

  return `TARGET MARKETS: ${markets?.trim() || 'EU (countries not specified — flag language requirements as something to confirm with the client)'}

CHECKLIST RULES (the email paragraph a remark under the rule normally goes to, in brackets):
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
- Points from the emails we already sent: re-raise one only if it is still not fixed in the current
  artwork.
- If there is artwork, review it against the ingredient list and the rules.
- One remark per distinct issue; never raise the same issue twice. Put each remark in exactly
  one paragraph, most important (must be fixed before printing) first:
  rnd      = nutrition facts and their values, recipe, ingredients and QUID, additives, claims;
  graphics = dimensions, sizes, x-height / font size, legibility and contrast, placement, print and
             technical issues, packaging material and recycling marks;
  quality  = legal labelling and compliance, mandatory particulars, allergens, dates, lot, language
             versions, business operator, wording that does not match the nutrition facts or recipe;
  general  = spelling, grammar, punctuation, typos, inconsistent terminology.
- Mandatory particulars that are NOT VISIBLE on the artwork at all go into ONE sentence in the
  right paragraph, e.g. "The nutrition declaration per 100 g is missing; please add it."
- Judge language requirements against the target markets above.
- Proofread ALL visible text in every language, even where no rule applies. Quote the wrong text
  in its original language with the correction (e.g. 'Ingredents' → 'Ingredients'); several small
  typos may share one sentence.
- If a rule cannot be verified from the artwork and documents (e.g. supplier certificates, lab
  results), raise it only when it matters for this product, phrased as "Please confirm that …".
- A paragraph with nothing to say is an empty list.

Format:
{"summary": "2-4 sentence overview in English for our team (state of the artwork and/or what the client asked)",
 "answer": "reply to the client's question in English, or empty string",
 "sections": {"rnd": ["sentence", ...], "graphics": [...], "quality": [...], "general": [...]}}`;
};

// Pulls the first JSON object out of the reply and normalises the paragraphs.
const parseResponse = (raw) => {
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not contain JSON');
  const data = JSON.parse(match[0]);
  const sections = Object.fromEntries(EMAIL_SECTION_KEYS.map((key) => {
    const items = Array.isArray(data.sections?.[key]) ? data.sections[key] : [];
    return [key, [...new Set(items.map((i) => String(i).trim()).filter(Boolean))]];
  }));
  return {
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
    answer: typeof data.answer === 'string' ? data.answer.trim() : '',
    sections,
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
 * @returns {Promise<{ summary: string, answer: string, sections: Record<string, string[]>, model: string }>}
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
  return { ...parseResponse(raw), model };
};
