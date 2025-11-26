import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';

// Analyze resume by calling Groq AI (identical to Supabase function)
export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { resumeText, jobDescription, jobTitle } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'groq-1.0-mini';
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const cleanText = (text: string) => {
      return text
        .replace(/[^\x20-\x7E\n]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
    };

    const cleanedResume = cleanText(resumeText);
    const cleanedJobDesc = cleanText(jobDescription);

    const prompt = `Analyze this resume for the ${jobTitle} position and provide a match score (0-100) and brief feedback (2-3 sentences).\n\nJob: ${cleanedJobDesc}\n\nResume: ${cleanedResume}\n\nRespond with JSON: {"score": <number>, "feedback": "<text>"}`;

    const response = await axios.post('https://api.groq.ai/v1/completions', {
      model: GROQ_MODEL,
      input: prompt,
      temperature: 0.3,
      max_output_tokens: 300
    }, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    let content = '';
    if (data.output && data.output[0]) {
      const out = data.output[0];
      if (typeof out === 'string') content = out;
      else if (out.text) content = out.text;
      else if (Array.isArray(out.content) && out.content[0] && out.content[0].text) content = out.content[0].text;
    }
    if (!content) content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.result || '';
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return res.json({ score: 75, feedback: content.slice(0,200) || 'Resume reviewed successfully' });
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json({ score: result.score, feedback: result.feedback });
  } catch (error: any) {
    console.error('Error in analyzeResume:', error.response?.data || error.message || error);
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    if (error.response?.status === 402) {
      return res.status(402).json({ error: 'Payment required. Please add credits to continue.' });
    }
    res.status(500).json({ error: error.message || 'Internal error' });
  }
};

// Voice interview actions: transcribe and generate
export const voiceInterview = async (req: Request, res: Response) => {
  try {
    const { action, audioData, messages, jobDescription } = req.body;
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'groq-1.0-mini';
    if (!ASSEMBLYAI_API_KEY || !GROQ_API_KEY) return res.status(500).json({ error: 'API keys not configured' });

    if (action === 'transcribe') {
      // Upload audio to AssemblyAI
      const buffer = Buffer.from(audioData, 'base64');
      const uploadResp = await axios.post('https://api.assemblyai.com/v2/upload', buffer, {
        headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/octet-stream' }
      });
      const upload_url = uploadResp.data.upload_url;

      const transcriptResp = await axios.post('https://api.assemblyai.com/v2/transcript', { audio_url: upload_url }, {
        headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/json' }
      });
      const id = transcriptResp.data.id;

      // Poll
      let transcript;
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        const pollingResp = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, { headers: { authorization: ASSEMBLYAI_API_KEY } });
        transcript = pollingResp.data;
        if (transcript.status === 'completed') {
          return res.json({ transcript: transcript.text });
        } else if (transcript.status === 'error') {
          throw new Error('Transcription failed');
        }
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
      }

      throw new Error('Transcription timeout');
    }

    if (action === 'generate') {
      const systemPrompt = `You are an experienced interviewer conducting a professional job interview. \nJob Description: ${jobDescription}\n\nGuidelines:\n- Ask relevant questions based on the job description\n- Provide constructive feedback\n- Be professional and encouraging\n- Keep responses concise (2-3 sentences)\n- Ask follow-up questions when appropriate`;

      const conversationText = [systemPrompt, ...messages.map((m: any) => `${m.role}: ${m.content}`)].join('\n');
      const response = await axios.post('https://api.groq.ai/v1/completions', {
        model: GROQ_MODEL,
        input: conversationText,
        temperature: 0.8,
        max_output_tokens: 200
      }, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
      });

      if (response.status !== 200) throw new Error('AI Gateway error');
      const data = response.data;
      let aiMessage = '';
      if (data.output && data.output[0]) {
        const out = data.output[0];
        if (typeof out === 'string') aiMessage = out;
        else if (out.text) aiMessage = out.text;
        else if (Array.isArray(out.content) && out.content[0] && out.content[0].text) aiMessage = out.content[0].text;
      }
      if (!aiMessage) aiMessage = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.result || '';
      res.json({ message: aiMessage });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('Voice interview error:', error.response?.data || error.message || error);
    if (error.response?.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
    res.status(500).json({ error: error.message || 'Internal error' });
  }
};

export default { analyzeResume, voiceInterview };
