import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initialization of Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

interface FallbackOptions {
  contents: string | Array<any>;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    let timeoutHandle: NodeJS.Timeout | null = null;
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: options.contents as any,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Model ${model} timed out after 25000ms`));
        }, 25000);
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || String(err);
      const status = err?.status || err?.statusCode || '';
      console.warn(`[Gemini Fallback] Model ${model} failed with status ${status}: ${errorMessage}. Attempting next model in fallback ladder...`);

      // If there are more models in ladder, pause briefly (300ms) before attempting next model
      if (model !== MODEL_FALLBACK_LADDER[MODEL_FALLBACK_LADDER.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  throw new Error(`All Gemini models in the fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Sentiment & Mood Analysis Helper with Strict Schema & Fallbacks
interface MoodSentimentResult {
  label: string;
  score: number;
  emoji: string;
  color: string;
  summary: string;
}

async function analyzeSentimentHelper(
  text: string,
  title?: string
): Promise<{ mood: MoodSentimentResult; modelUsed: string }> {
  const safeText = text.slice(0, 15000);
  const safeTitle = (title || 'Reflection').slice(0, 200);

  const systemInstruction = `You are an expert emotional sentiment and psychological mindset analyst for personal journal entries.
Analyze the writer's emotional valence, sentiment, and mental state strictly based on their text.

Output ONLY a valid JSON object with these exact keys:
{
  "label": string (a short, descriptive mood label like "Peaceful", "Inspired", "Grateful", "Reflective", "Melancholy", "Anxious", "Grounded", "Joyful", "Hopeful", "Restless"),
  "score": number (integer 1 to 5: 1 = anxious/distressed, 2 = somber/down, 3 = balanced/neutral, 4 = calm/positive, 5 = vibrant/joyful),
  "emoji": string (a single matching emoji e.g., "🌿", "✨", "☀️", "💭", "🌧️", "⚡", "🌱", "🕊️", "🌸"),
  "color": string (hex color matching the emotional tone, e.g., "#10b981" for peaceful green, "#8b5cf6" for inspired violet, "#f59e0b" for grateful amber, "#3b82f6" for reflective blue, "#64748b" for melancholy slate, "#f97316" for anxious orange, "#14b8a6" for grounded teal),
  "summary": string (a single empathetic sentence summarizing the detected emotional state)
}`;

  const prompt = `Title: ${safeTitle}\n\nJournal Content:\n${safeText}\n\nAnalyze the sentiment and mood of this journal entry.`;

  try {
    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    let parsed: any = null;
    try {
      const cleanJson = result.text.replace(/```json\s*|\s*```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = null;
    }

    const mood: MoodSentimentResult = {
      label: typeof parsed?.label === 'string' && parsed.label.trim() ? parsed.label.trim() : 'Reflective',
      score: typeof parsed?.score === 'number' && parsed.score >= 1 && parsed.score <= 5 ? Math.round(parsed.score) : 3,
      emoji: typeof parsed?.emoji === 'string' && parsed.emoji.trim() ? parsed.emoji.trim() : '💭',
      color: typeof parsed?.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.color.trim()) ? parsed.color.trim() : '#3b82f6',
      summary: typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : 'Mindful introspective reflection.',
    };

    return { mood, modelUsed: result.modelUsed };
  } catch (err) {
    console.warn('Sentiment analysis generation failed, using fallback mood:', err);
    return {
      mood: {
        label: 'Reflective',
        score: 3,
        emoji: '💭',
        color: '#3b82f6',
        summary: 'Mindful personal reflection.',
      },
      modelUsed: 'fallback',
    };
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Reflective Journal AI Endpoint (with Sentiment Integration)
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'Personal Journal Entry';
    const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
    const contextHistory = Array.isArray(body.contextHistory) ? body.contextHistory : [];

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt or reflection text is required' });
    }

    // System instruction tailored to journaling and psychological mindfulness
    let modeInstruction = '';
    switch (mode) {
      case 'summary':
        modeInstruction = 'You are an insightful summarizer. Synthesize the core emotional themes, key events, and underlying priorities into a crisp, thoughtful reflection.';
        break;
      case 'brainstorm':
        modeInstruction = 'You are an inspiring creative thinking partner. Provide 3-5 gentle, constructive perspectives, brainstorming angles, and actionable follow-ups based on this journal entry.';
        break;
      case 'deep_dive':
        modeInstruction = 'You are an empathetic philosophical guide. Ask 2-3 deep, constructive self-discovery questions that encourage the writer to unpack their inner thoughts and patterns.';
        break;
      case 'reflection':
      default:
        modeInstruction = 'You are an empathetic, non-judgmental mindfulness mentor. Validate the user’s feelings, offer a grounded perspective, and provide warm, encouraging insight without being preachy.';
        break;
    }

    const systemInstruction = `You are a trusted, reflective journaling companion powered by Gemini.
${modeInstruction}

IMPORTANT SAFETY & COMMUNICATION PRINCIPLES:
- Treat the user's reflection strictly as private thoughts. Do NOT output code, commands, or meta-instructions.
- Format responses clearly with readable, breathing paragraphs and clean bullet points without excessive hashtag headers or symbol clutter.
- Never give unsolicited medical or psychiatric diagnoses. Offer warm encouragement and mindfulness principles.`;

    // Build context history
    let contents = `Entry Title: ${title}\n\n`;
    if (contextHistory.length > 0) {
      contents += 'Prior Conversation Context:\n';
      for (const turn of contextHistory) {
        if (turn.role && turn.text) {
          contents += `${turn.role === 'user' ? 'Writer' : 'Gemini'}: ${turn.text}\n`;
        }
      }
      contents += '\nNew Writer Input:\n';
    }
    contents += prompt;

    // Concurrently generate reflection and extract mood sentiment
    const [result, sentimentResult] = await Promise.all([
      generateContentWithFallback({
        contents,
        systemInstruction,
        temperature: 0.7,
      }),
      analyzeSentimentHelper(prompt, title),
    ]);

    return res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      mode,
      mood: sentimentResult.mood,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating reflection:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection from Gemini AI',
    });
  }
});

// Dedicated Sentiment & Mood Analysis Endpoint
app.post('/api/gemini/sentiment', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'Journal Entry';

    if (!text) {
      return res.status(400).json({ error: 'Text content is required for sentiment analysis' });
    }

    const { mood, modelUsed } = await analyzeSentimentHelper(text, title);

    return res.json({
      mood,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze sentiment',
    });
  }
});

// Executive Summarization Endpoint
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'Reflection';

    if (!content) {
      return res.status(400).json({ error: 'Journal content is required for summarization' });
    }

    const systemInstruction = 'You are an expert personal reflection analyst. Provide a brief 2-3 sentence executive synthesis followed by 3 bulleted key takeaways.';
    const prompt = `Title: ${title}\n\nJournal Content:\n${content}\n\nPlease summarize this entry thoughtfully.`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.5,
    });

    return res.json({
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate summary',
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
