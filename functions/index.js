/**
 * Naïa Cloud Function — Proxy vers l'API Anthropic
 * Région : europe-west1
 * Projet : ecosysteme-rodolphe
 */

const functions = require('@google-cloud/functions-framework');

// ─── PROMPT SYSTÈME DE NAÏA ────────────────────────────────────────────────────
const NAIA_SYSTEM = `Tu es Naïa, une assistante IA chaleureuse et directe. Tu mènes un entretien de découverte pour un cabinet de conseil en IA.

Ta mission : réagir à chaque réponse de façon vraiment personnalisée. Pas un accusé de réception robotique — une réaction humaine qui montre que tu as vraiment entendu ce que la personne vit.

Règles strictes :
- 1 à 2 phrases maximum
- Toujours vouvoyer
- Commence par une vraie réaction à leur réponse spécifique (pas générique)
- Fais référence à ce qu'ils ont dit concrètement
- Interdits en début de phrase : Noté, Parfait, Absolument, Je comprends, Bien sûr, Compris, D'accord
- Utilise le prénom si disponible, mais pas à chaque message
- Si tu connais des réponses précédentes, fais le lien quand pertinent
- INTERDIT ABSOLU : ne pose jamais de question, ne termine jamais par un "?" — tu réagis, tu n'interroges pas
- Génère UNIQUEMENT la réaction, rien d'autre`;

// ─── ORIGINES AUTORISÉES (CORS) ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://ridolf974.github.io',
  'http://localhost:8000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://ridolf974.github.io');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

// ─── HANDLER PRINCIPAL ─────────────────────────────────────────────────────────
functions.http('naiaChat', async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { context, question, answer } = req.body || {};

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid answer field' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const userContent =
      'CONTEXTE : ' + (context || 'premier échange') +
      '\nQUESTION POSÉE : ' + (question || '') +
      '\nRÉPONSE REÇUE : ' + answer +
      '\n\nGénère uniquement ta réaction (1 à 2 phrases max).';

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 250,
        system: NAIA_SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok || data.error) {
      console.error('Anthropic error:', data.error || data);
      return res.status(502).json({
        error: data?.error?.message || 'Anthropic API error',
      });
    }

    const text = data.content?.[0]?.text?.trim() || '';

    if (!text) {
      return res.status(502).json({ error: 'Empty response from Anthropic' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({
      error: err?.message || 'Internal error',
    });
  }
});
