import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize shared Gemini client
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
  });

  // Deep SLA Audit with High Thinking
  app.post('/api/ai/audit', async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API Key is not configured in environment variables.',
        });
      }

      const { recordsSummary, recordsList } = req.body;

      const prompt = `You are an expert Chief Operations & Legal Branch Auditor for a Sri Lankan Finance and Leasing institution.
Analyze the following branch Deletion Document repository data and deliver a high-level executive audit and action plan.

METRICS & CONTEXT:
- Total Received Records: ${recordsSummary?.total || 0}
- Total Handed Over / Released: ${recordsSummary?.released || 0}
- Pending at Branch: ${recordsSummary?.pending || 0}
- Documents between 55-60 days at Branch: ${recordsSummary?.warningCount || 0}
- Documents over 60 days at Branch (Critical SLA Breach): ${recordsSummary?.breachedCount || 0}

SAMPLE RELEVANT RECORDS (Top Pending & Overdue):
${JSON.stringify(recordsList?.slice(0, 25) || [], null, 2)}

TASK:
1. Executive Assessment: State the branch SLA compliance health clearly.
2. 55-60 Day Immediate Danger: Highlight specific contracts approaching the 60-day cutoff and immediate actions for branch officers.
3. 60+ Day Critical Breach Escalation: Action required for overdue contracts (Legal Admin Dept LAD follow-up, Client verification, branch safe custody audit).
4. Procedural & Custody Recommendations: 3 key steps to improve release turnaround.
5. Provide bilingual advice (Sinhala notes / key terms where practical for Sri Lankan branch staff).

Keep output well structured with Markdown headings, concise bullets, and high-impact operational advice.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a senior banking/leasing branch operations specialist in Sri Lanka. Provide clear, professional, actionable audit insights with high reasoning.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      return res.json({ analysis: response.text || 'No response generated.' });
    } catch (err: unknown) {
      console.error('Error during AI branch audit:', err);
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      return res.status(500).json({ error: message });
    }
  });

  // Draft Client Reminder Notice (SMS / WhatsApp / Official Letter in Sinhala & English)
  app.post('/api/ai/draft-notice', async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API Key is not configured.',
        });
      }

      const { document, type } = req.body;

      const prompt = `You are a customer service officer at a Sri Lankan finance branch.
Draft a ${type || 'formal reminder letter and SMS'} for the following customer whose vehicle/lease deletion document is ready at the branch:

Customer Name: ${document?.clientName || 'Valued Customer'}
NIC: ${document?.clientNic || 'N/A'}
Contract No: ${document?.contractNo || 'N/A'}
Vehicle / Asset Reg No: ${document?.regNo || 'N/A'}
Received at Branch Date: ${document?.receivedBranchDate || 'N/A'}
Days at Branch: ${document?.daysPending || 'N/A'} days

REQUIREMENTS:
1. Short SMS / WhatsApp Message (in easy-to-read Sinhala + English version, including required documents for collection: original NIC, authority letter if proxy).
2. Formal Branch Notification Letter (official tone, branch collection instructions, safe custody notice).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a courteous, professional banking communications officer. Generate clear Sinhala and English notices with official banking phrasing.',
        },
      });

      return res.json({ draft: response.text || '' });
    } catch (err: unknown) {
      console.error('Error drafting notice:', err);
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      return res.status(500).json({ error: message });
    }
  });

  // Natural Language Assistant for querying branch deletion records
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API Key is not configured.',
        });
      }

      const { query, summaryData } = req.body;

      const prompt = `The user is asking a question in Sinhala or English about their branch deletion documents.
Current branch dataset context:
${JSON.stringify(summaryData, null, 2)}

User Question: "${query}"

Respond concisely and helpfully in the user's language (Sinhala or English or Singlish as asked). Be accurate and direct.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({ reply: response.text || '' });
    } catch (err: unknown) {
      console.error('Error in AI assistant query:', err);
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      return res.status(500).json({ error: message });
    }
  });

  // Serve static assets or mount Vite
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
