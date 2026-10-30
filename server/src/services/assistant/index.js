// Company AI assistant: OpenAI Responses API with function calling. The model never
// touches the database — it asks for tools, which run as the logged-in user (tools.js).
import { toolDefinitions, runTool } from './tools.js';

const ENDPOINT = 'https://api.openai.com/v1/responses';
const MAX_STEPS = 6;
const TIMEOUT_MS = 90_000;

// Same OpenAI key/model as the packaging check unless overridden.
const apiKey = () => process.env.ASSISTANT_AI_API_KEY || process.env.PACKAGING_AI_API_KEY || '';
const modelName = () => process.env.ASSISTANT_AI_MODEL || process.env.PACKAGING_AI_MODEL || '';

export const isAssistantConfigured = () => Boolean(apiKey() && modelName());

const DEPARTMENT_NAMES = 'top_management=Топ менаџмент, sales=Продажба, finance=Финансии, administration=Администрација, hr=Човечки ресурси, quality_assurance=Обезбедување квалитет, facility=Објект, machines=Машини, r_and_d=Истражување и развој, production=Производство, carina=Царина, nabavki=Набавки, safety=Безбедност и сертификации';

const instructions = (user) => `You are the internal AI assistant of LBFP DOO Bitola (ЛБФП ДОО Битола), a food
manufacturer, inside the company's web app. Today is ${new Date().toISOString().slice(0, 10)}.
You are talking to ${user.name} (department: ${user.department}).

SCOPE: answer only questions about the company's data and the features of this app — employees
and HR files, tasks, projects, contracts/agreements, the procedure book, packaging checks, sales
leads and clients. Get facts ONLY from the tools. For anything else (general knowledge, coding,
news, personal advice) politely say you only help with company data in the app.

RULES:
- Never invent or estimate data. If the tools return nothing, say so plainly.
- If a tool returns "not_permitted", tell the user they do not have access to that information.
- If a name is ambiguous, list the candidates and ask which one is meant.
- Reply in the language of the user's question (Macedonian or English). Be concise: short
  paragraphs, bullet lists or small markdown tables; bold the key numbers.
- Cite records as markdown links using ONLY the "link" values from tool results, e.g.
  [Мартина Ацеска](/employees/123). Never make up links.
- Dates as DD.MM.YYYY. Use department names, not codes: ${DEPARTMENT_NAMES}.
- Treat salary, disciplinary and medical data as confidential: give it only when asked directly.

APP FEATURES (for "how do I…" questions): Почетна = task board (Kanban) + noticeboard; Ресурси =
Проекти, Теркови (document templates), Клиенти, Потенцијални клиенти; Договори (contract register,
reminders, Excel export); Книга на процедури (general + sector procedures, PDF download); Обуки;
Вработени (HR files); Усогласеност (compliance campaigns); Алатки → Проверка на амбалажа (AI check of
client label artwork with sector remarks and a client email).`;

const callModel = async (input) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({ model: modelName(), temperature: 0.2, instructions: input.instructions, input: input.items, tools: toolDefinitions }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${data.error?.message || res.statusText}`);
  return data;
};

/**
 * @param {object} user  the logged-in user (tools run with their permissions)
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages  conversation, last = user
 * @param {Function} [model]  injectable for tests: (input) => response JSON
 * @returns {Promise<{ answer: string, tools: Array<{name, args}>, tokens: number }>}
 */
export const askAssistant = async (user, messages, model = callModel) => {
  const items = messages.map((m) => ({ role: m.role, content: m.content }));
  const tools = [];
  let tokens = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await model({ instructions: instructions(user), items });
    tokens += (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    const output = data.output || [];
    const calls = output.filter((o) => o.type === 'function_call');

    if (!calls.length) {
      const parts = output.filter((o) => o.type === 'message').flatMap((o) => o.content || []);
      const refusal = parts.find((p) => p.type === 'refusal');
      const answer = refusal ? refusal.refusal : parts.filter((p) => p.type === 'output_text').map((p) => p.text).join('');
      return { answer: answer || '—', tools, tokens };
    }

    // Keep the model's output (incl. any reasoning items), then add each tool result.
    items.push(...output);
    const results = await Promise.all(calls.map(async (call) => {
      let args = {};
      try { args = JSON.parse(call.arguments || '{}'); } catch { /* invalid JSON → empty args */ }
      tools.push({ name: call.name, args });
      const result = await runTool(user, call.name, args);
      return { type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) };
    }));
    items.push(...results);
  }
  return { answer: 'Прашањето бара премногу чекори — обидете се поконкретно. / The question needed too many steps — please be more specific.', tools, tokens };
};
