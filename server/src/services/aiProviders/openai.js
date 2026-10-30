// OpenAI adapter for the packaging AI review — Responses API over plain fetch.
// Images go in as `input_image` data URLs, PDFs as `input_file` (vision models
// such as gpt-4o and later; 50 MB total per request). The reply is forced into
// the review schema with Structured Outputs.
import { EMAIL_SECTION_KEYS } from '../../models/PackagingCheck.js';

const ENDPOINT = 'https://api.openai.com/v1/responses';
const TIMEOUT_MS = 120_000;

const sentences = { type: 'array', items: { type: 'string' } };

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    summary:  { type: 'string' },
    answer:   { type: 'string' },
    sections: {
      type: 'object',
      properties: Object.fromEntries(EMAIL_SECTION_KEYS.map((k) => [k, sentences])),
      required: EMAIL_SECTION_KEYS,
      additionalProperties: false,
    },
  },
  required: ['summary', 'answer', 'sections'],
  additionalProperties: false,
};

const toContentPart = ({ mimeType, base64, label }) =>
  mimeType === 'application/pdf'
    ? { type: 'input_file', filename: `${label}.pdf`, file_data: `data:application/pdf;base64,${base64}` }
    : { type: 'input_image', image_url: `data:${mimeType};base64,${base64}`, detail: 'high' };

export const openaiAdapter = async ({ apiKey, model, system, prompt, attachments }) => {
  if (!model) throw new Error('PACKAGING_AI_MODEL is not set');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      temperature: 0.2, // consistent, repeatable reviews
      instructions: system,
      input: [{ role: 'user', content: [...attachments.map(toContentPart), { type: 'input_text', text: prompt }] }],
      text: { format: { type: 'json_schema', name: 'packaging_review', strict: true, schema: REVIEW_SCHEMA } },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${data.error?.message || res.statusText}`);
  if (data.status && data.status !== 'completed') {
    throw new Error(`OpenAI response ${data.status}${data.incomplete_details?.reason ? `: ${data.incomplete_details.reason}` : ''}`);
  }

  const parts = (data.output || [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content || []);
  const refusal = parts.find((p) => p.type === 'refusal');
  if (refusal) throw new Error(`OpenAI refused: ${refusal.refusal}`);
  const text = parts.filter((p) => p.type === 'output_text').map((p) => p.text).join('');
  if (!text) throw new Error('OpenAI returned no text');
  return text;
};
