import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';

// Analyze resume by calling Groq AI (identical to Supabase function)
export const analyzeResume = async (req: Request, res: Response) => {
  try {
    // allow explicit dev fallback to avoid calling external AI services
    const useOffline = process.env.USE_OFFLINE_FALLBACK === 'true';
    if (useOffline) {
      console.warn('USE_OFFLINE_FALLBACK is enabled — returning offline analysis.');
      return res.json({ score: 75, feedback: 'Resume reviewed (forced offline fallback): external AI disabled.' });
    }
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

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    }, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    let content = '';
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) {
        content = choice.message.content;
      } else if (typeof choice === 'string') {
        content = choice;
      }
    }
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return res.json({ score: 75, feedback: content.slice(0,200) || 'Resume reviewed successfully' });
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json({ score: result.score, feedback: result.feedback });
  } catch (error: any) {
    console.error('Error in analyzeResume:', error.response?.data || error.message || error);
    // Handle DNS/network errors gracefully during local development
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('getaddrinfo ENOTFOUND'))) {
      const isProd = process.env.NODE_ENV === 'production';
      console.warn('Groq API unreachable (DNS lookup failed).');
      if (!isProd) {
        console.warn('Returning offline fallback analysis (development mode).');
        return res.json({ score: 75, feedback: 'Resume reviewed (offline fallback): could not contact external AI.' });
      }
      console.error('External AI service unreachable in production. Failing request.');
      return res.status(502).json({ error: 'External AI service unreachable' });
    }
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
    // allow explicit dev fallback to avoid calling external AI services
    const useOffline = process.env.USE_OFFLINE_FALLBACK === 'true';
    if (useOffline) {
      console.warn('USE_OFFLINE_FALLBACK is enabled — returning offline voice-interview responses.');
      if (req.body.action === 'transcribe') {
        return res.json({ transcript: 'Transcription unavailable (forced offline fallback).' });
      }
      if (req.body.action === 'generate') {
        return res.json({ message: 'This is a forced offline fallback AI response.' });
      }
      return res.status(400).json({ error: 'Invalid action' });
    }
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

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 200
      }, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
      });

      if (response.status !== 200) throw new Error('AI Gateway error');
      const data = response.data;
      let aiMessage = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        aiMessage = data.choices[0].message.content || '';
      }
      return res.json({ message: aiMessage });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('Voice interview error:', error.response?.data || error.message || error);
    // Handle DNS/network errors gracefully during local development
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('getaddrinfo ENOTFOUND'))) {
      const isProd = process.env.NODE_ENV === 'production';
      console.warn('External AI service unreachable (DNS lookup failed).');
      if (!isProd) {
        console.warn('Returning offline fallback response (development mode).');
        if (req.body.action === 'transcribe') {
          return res.json({ transcript: 'Transcription unavailable (offline fallback).' });
        }
        if (req.body.action === 'generate') {
          return res.json({ message: 'This is a fallback AI response because the external service is unreachable.' });
        }
        return res.status(500).json({ error: 'External service unreachable' });
      }
      console.error('External AI service unreachable in production. Failing request.');
      return res.status(502).json({ error: 'External AI service unreachable' });
    }
    if (error.response?.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
    res.status(500).json({ error: error.message || 'Internal error' });
  }
};

// Score interview performance based on conversation
export const scoreInterview = async (req: Request, res: Response) => {
  try {
    const useOffline = process.env.USE_OFFLINE_FALLBACK === 'true';
    if (useOffline) {
      console.warn('USE_OFFLINE_FALLBACK is enabled — returning offline interview score.');
      return res.json({ score: 75, feedback: 'Interview scored (forced offline fallback): external AI disabled.' });
    }
    
    const { conversationText, jobDescription } = req.body;
    
    if (!conversationText || conversationText.trim().length === 0) {
      return res.status(400).json({ error: 'conversationText is required and must not be empty' });
    }

    // Check if there's actual user participation (user: responses)
    const hasUserResponses = conversationText.includes('user:') && conversationText.length > 100;
    if (!hasUserResponses) {
      console.warn('Interview has no user responses or is too short. Returning low score.');
      return res.json({ score: 0, feedback: 'No valid interview responses recorded. Please answer at least one question.' });
    }
    
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || 'groq-1.0-mini';
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const cleanText = (text: string) => {
      return text
        .replace(/[^\x20-\x7E\n]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);
    };

    const cleanedConversation = cleanText(conversationText);
    const cleanedJobDesc = cleanText(jobDescription || '');

    const prompt = `You are an expert interview evaluator. Score the candidate's performance based on their responses in this interview for the position: ${cleanedJobDesc}\n\nInterview Conversation:\n${cleanedConversation}\n\nEvaluation Criteria:\n- 0-20: No responses or only AI greeting\n- 21-40: Very brief, unclear responses\n- 41-60: Basic responses, lacks depth\n- 61-80: Good responses, shows understanding\n- 81-100: Excellent responses, demonstrates expertise\n\nProvide:\n1. A performance score from 0-100 based STRICTLY on candidate responses quality and depth\n2. Brief feedback (2-3 sentences) highlighting strengths and areas for improvement\n\nRespond ONLY with valid JSON (no markdown): {"score": <number 0-100>, "feedback": "<string>"}`;

    console.log('Calling Groq for interview scoring...', {
      model: GROQ_MODEL,
      conversationLength: cleanedConversation.length,
      jobDescLength: cleanedJobDesc.length
    });

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: GROQ_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    }, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Groq response status:', response.status);
    const data = response.data;
    
    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected Groq response structure:', data);
      return res.status(500).json({ error: 'Unexpected API response structure' });
    }

    let content = '';
    if (data.choices[0].message && data.choices[0].message.content) {
      content = data.choices[0].message.content;
    } else if (typeof data.choices[0] === 'string') {
      content = data.choices[0];
    }

    console.log('Groq raw content:', content.substring(0, 200));

    // Try to extract JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not find JSON in response, attempting line-by-line parsing');
      // Fallback: try to parse the whole thing as JSON
      try {
        const result = JSON.parse(content);
        console.log('Successfully parsed JSON:', result);
        return res.json({ score: Math.min(100, Math.max(0, result.score || 75)), feedback: result.feedback || 'Interview completed' });
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        return res.json({ score: 75, feedback: content.slice(0, 200) || 'Interview scored' });
      }
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      console.log('Parsed interview score:', result);
      
      // Validate score is in range
      const validScore = Math.min(100, Math.max(0, result.score || 75));
      const validFeedback = result.feedback || 'Interview completed successfully';
      
      res.json({ score: validScore, feedback: validFeedback });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'on:', jsonMatch[0]);
      res.json({ score: 75, feedback: content.slice(0, 200) || 'Interview scored' });
    }

  } catch (error: any) {
    console.error('Error in scoreInterview:', error.response?.data || error.message || error);
    
    // Handle DNS/network errors gracefully
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('getaddrinfo ENOTFOUND'))) {
      const isProd = process.env.NODE_ENV === 'production';
      console.warn('Groq API unreachable (DNS lookup failed).');
      if (!isProd) {
        console.warn('Returning offline fallback score (development mode).');
        return res.json({ score: 75, feedback: 'Interview scored (offline fallback): could not contact external AI.' });
      }
      console.error('External AI service unreachable in production. Failing request.');
      return res.status(502).json({ error: 'External AI service unreachable' });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    if (error.response?.status === 402) {
      return res.status(402).json({ error: 'Payment required. Please add credits to continue.' });
    }
    
    res.status(500).json({ error: error.message || 'Internal error' });
  }
};

export default { analyzeResume, voiceInterview, scoreInterview };
