// Chat assistant. The Groq key stays on the server, the browser only talks to this route.
import express from 'express';
import rateLimit from 'express-rate-limit';
import Product from '../models/productModel.js';
import { ORDER_SORT } from '../utils/productOrder.js';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'You are sending messages too quickly. Please wait a moment.' },
});

const lkr = (n) => `LKR ${Number(n).toLocaleString('en-US')}`;

// The assistant only knows what we tell it, so give it the live catalogue (cached for a minute).
let catalogue = { text: '', at: 0 };
const getCatalogue = async () => {
  if (catalogue.text && Date.now() - catalogue.at < 60_000) return catalogue.text;
  const products = await Product.find({}, 'title price discountPrice category description').sort(ORDER_SORT).lean();
  const text = products
    .map((p) => `- ${p.title} (${p.category}): ${lkr(p.discountPrice)}${p.discountPrice < p.price ? `, was ${lkr(p.price)}` : ''}. ${p.description || ''}`.trim())
    .join('\n');
  catalogue = { text, at: Date.now() };
  return text;
};

const systemPrompt = (products) => `You are the friendly shopping assistant for Voltora, an electronics store in Sri Lanka that sells phones, laptops and accessories, runs a repair centre and checks warranties.

Everything below is the COMPLETE list of products in the store right now. Every product listed is in stock. Prices are in Sri Lankan rupees (LKR).
${products || '(No products are listed right now.)'}

Rules:
- Answer product questions only from the list above. If a product is not on the list, say the store doesn't carry it and suggest the closest products that are listed. Never invent products, prices or specs.
- When asked about a product, give its name and price from the list.
- Repairs: customers can submit a repair request with a photo, and track its status (Pending, Approved, In progress, Resolved) in the Care & Repair section.
- Warranty: customers can check a warranty with the serial number in the Warranty section.
- For anything unrelated to Voltora's electronics and services (other than a simple greeting), reply: "I'm here to assist only with Voltora's electronics and services."
- Keep answers short and plain, 1 to 3 sentences. Do not use emojis.`;

// POST /api/chat   { message: "..." }  ->  { reply: "..." }
router.post('/', limiter, async (req, res, next) => {
  try {
    const message = String(req.body?.message ?? '').trim().slice(0, 500);
    if (!message) return res.status(400).json({ message: 'Type a message first' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ message: "The assistant isn't set up on this server yet." });

    // A few earlier turns so follow-up questions make sense.
    const history = (Array.isArray(req.body?.history) ? req.body.history : [])
      .slice(-6)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt(await getCatalogue()) },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.3,
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
