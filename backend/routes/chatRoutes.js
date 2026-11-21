// Chat assistant. The Groq key stays on the server, the browser only talks to this route.
import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'You are sending messages too quickly. Please wait a moment.' },
});

const SYSTEM_PROMPT =
  "You are a friendly assistant for a website called Voltora. Only answer simple general greetings or questions about mobiles, laptops, accessories, repair, warranty, and services. If asked about anything else, respond with: 'I'm here to assist only with Voltora's electronics and services 😊'. Keep answers short and plain.";

// POST /api/chat   { message: "..." }  ->  { reply: "..." }
router.post('/', limiter, async (req, res, next) => {
  try {
    const message = String(req.body?.message ?? '').trim().slice(0, 500);
    if (!message) return res.status(400).json({ message: 'Type a message first' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ message: "The assistant isn't set up on this server yet." });

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });
    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content;
    if (!r.ok || !reply) {
      console.error('Groq error:', r.status, data?.error?.message);
      return res.status(502).json({ message: "Sorry, I couldn't reach the assistant. Please try again." });
    }
    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

export default router;
