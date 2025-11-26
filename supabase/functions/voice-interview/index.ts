import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, audioData, messages, jobDescription } = await req.json();

    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

    if (!ASSEMBLYAI_API_KEY || !GROQ_API_KEY) {
      throw new Error('API keys not configured');
    }

    // Transcribe audio using AssemblyAI
    if (action === 'transcribe') {
      console.log('Transcribing audio...');
      
      // Upload audio to AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/octet-stream',
        },
        body: Uint8Array.from(atob(audioData), c => c.charCodeAt(0)),
      });

      const { upload_url } = await uploadResponse.json();

      // Request transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: upload_url,
        }),
      });

      const { id } = await transcriptResponse.json();

      // Poll for transcription result
      let transcript;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: {
            'authorization': ASSEMBLYAI_API_KEY,
          },
        });

        transcript = await pollingResponse.json();

        if (transcript.status === 'completed') {
          console.log('Transcription completed:', transcript.text);
          return new Response(
            JSON.stringify({ transcript: transcript.text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (transcript.status === 'error') {
          throw new Error('Transcription failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      throw new Error('Transcription timeout');
    }

    // Generate AI response using Groq
    if (action === 'generate') {
      console.log('Generating AI response...');

      const systemPrompt = `You are an experienced interviewer conducting a professional job interview. 
Job Description: ${jobDescription}

Guidelines:
- Ask relevant questions based on the job description
- Provide constructive feedback
- Be professional and encouraging
- Keep responses concise (2-3 sentences)
- Ask follow-up questions when appropriate`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Groq API error:', error);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      console.log('AI response generated');

      return new Response(
        JSON.stringify({ message: aiMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in voice-interview:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
