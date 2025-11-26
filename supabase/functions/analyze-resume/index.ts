import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, jobTitle } = await req.json();

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    console.log('Analyzing resume for job:', jobTitle);

    // Clean and truncate inputs - extract only readable text
    const cleanText = (text: string) => {
      return text
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable chars
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    const maxResumeLength = 1500;
    const maxJobDescLength = 500;
    const cleanedResume = cleanText(resumeText).slice(0, maxResumeLength);
    const cleanedJobDesc = cleanText(jobDescription).slice(0, maxJobDescLength);

    const prompt = `Rate resume for ${jobTitle}:

Job: ${cleanedJobDesc}

Resume: ${cleanedResume}

Return only: {"score": <0-100>, "feedback": "<2 sentence summary>"}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    console.log('Analysis complete. Score:', result.score);

    return new Response(
      JSON.stringify({
        score: result.score,
        feedback: result.feedback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-resume:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
