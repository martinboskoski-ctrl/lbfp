import AssistantLog from '../models/AssistantLog.js';
import { askAssistant, isAssistantConfigured } from '../services/assistant/index.js';

// v1: top management only. Tools enforce per-user permissions, so widening this is safe.
export const canUseAssistant = (u) => u.department === 'top_management';

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

export const status = (req, res) => {
  res.json({ allowed: canUseAssistant(req.user), configured: isAssistantConfigured() });
};

export const chat = async (req, res) => {
  if (!canUseAssistant(req.user)) return res.status(403).json({ message: 'Асистентот засега е достапен само за топ менаџмент' });
  if (!isAssistantConfigured()) return res.status(503).json({ message: 'AI не е поврзан' });

  const messages = (Array.isArray(req.body.messages) ? req.body.messages : [])
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }));
  const question = messages.at(-1);
  if (!question || question.role !== 'user') return res.status(400).json({ message: 'Внесете прашање' });

  const started = Date.now();
  try {
    const result = await askAssistant(req.user, messages);
    await AssistantLog.create({
      user: req.user._id, question: question.content, answer: result.answer,
      tools: result.tools, tokens: result.tokens, ms: Date.now() - started,
    });
    res.json({ answer: result.answer, tools: result.tools.map((t) => t.name) });
  } catch (err) {
    console.error('Assistant failed:', err);
    await AssistantLog.create({ user: req.user._id, question: question.content, error: err.message, ms: Date.now() - started });
    res.status(502).json({ message: 'Асистентот не одговори. Обидете се повторно.' });
  }
};
