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
  sales: 'Продажба',
  r_and_d: 'Истражување и развој',
  nabavki: 'Набавки',
  quality_assurance: 'Обезбедување квалитет',
};

const SEVERITIES = ['critical', 'warning', 'info'];

const SYSTEM = `Ти си експерт за означување на прехранбени производи во ЛБФП ДОО Битола.
Проверуваш дизајн на етикета/амбалажа (слика или PDF) што го испратил клиент.
Го споредуваш со листата на состојки на производот и со правилата од чеклистата.
Пријави само реални проблеми или нејаснотии што треба човек да ги потврди — не пофалби.
Пишувај ги забелешките на македонски, кратко и конкретно (што е погрешно, каде, што треба да стои).
Одговори ИСКЛУЧИВО со валиден JSON, без друг текст.`;

const buildPrompt = (rules, ingredientsText) => {
  const ruleLines = rules.map((r) =>
    `- [${r._id}] (${SECTOR_NAMES[r.sector]}${r.category ? ` · ${r.category}` : ''}) ${r.text}`
  ).join('\n');

  return `ПРАВИЛА ЗА ПРОВЕРКА (id во загради, сектор одговорен за правилото):
${ruleLines || '(нема активни правила — провери само усогласеност со листата на состојки)'}

ЛИСТА НА СОСТОЈКИ НА ПРОИЗВОДОТ:
${ingredientsText?.trim() || '(види прикачен документ)'}

Задача: провери го прикачениот дизајн. За секоја прекршена или неможна за потврдување
точка врати забелешка. Ако забелешката се однесува на правило, наведи го неговиот id.
Ако не се однесува на правило, избери сектор: ${PACKAGING_SECTORS.join(', ')}
(r_and_d = рецептура/состојки/нутритивни вредности, quality_assurance = законско
означување/алергени/фонт/јазик, nabavki = амбалажен материјал/добавувач, sales = договор со клиент).

Формат:
{"summary": "краток преглед од 1-3 реченици",
 "remarks": [{"ruleId": "<id или null>", "sector": "<сектор>", "severity": "critical|warning|info", "text": "забелешка"}]}`;
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

  return { summary: typeof data.summary === 'string' ? data.summary.trim() : '', remarks };
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
 * @param {{ artwork: {buffer, mimeType}, ingredientsText: string,
 *           ingredientsFile?: {buffer, mimeType}, rules: Array }} input
 * @returns {Promise<{ summary: string, remarks: Array, model: string }>}
 */
export const reviewArtwork = async ({ artwork, ingredientsText, ingredientsFile, rules }) => {
  if (!isAiConfigured()) throw new AiNotConfiguredError();

  const attachments = [{ mimeType: artwork.mimeType, base64: artwork.buffer.toString('base64'), label: 'artwork' }];
  if (ingredientsFile && /^(image\/|application\/pdf)/.test(ingredientsFile.mimeType)) {
    attachments.push({ mimeType: ingredientsFile.mimeType, base64: ingredientsFile.buffer.toString('base64'), label: 'ingredients' });
  }

  const model = process.env.PACKAGING_AI_MODEL || '';
  const raw = await PROVIDERS[providerName()]({
    apiKey: process.env.PACKAGING_AI_API_KEY,
    model,
    system: SYSTEM,
    prompt: buildPrompt(rules, ingredientsText),
    attachments,
  });
  return { ...parseResponse(raw, rules), model };
};
