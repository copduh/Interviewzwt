import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'groq-1.0-mini';
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    console.log('Analyzing resume for job:', jobTitle);

    // Clean and limit input length
    const cleanText = (text: string) => {
      return text
        .replace(/[^\x20-\x7E\n]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
    };

    const cleanedResume = cleanText(resumeText);
    const cleanedJobDesc = cleanText(jobDescription);

    const prompt = `Analyze this resume for the ${jobTitle} position and provide a match score (0-100) and brief feedback (2-3 sentences).

Job: ${cleanedJobDesc}

Resume: ${cleanedResume}

Respond with JSON: {"score": <number>, "feedback": "<text>"}`;

    const response = await fetch('https://api.groq.ai/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        input: prompt,
        temperature: 0.3,
        max_output_tokens: 300
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq AI error:', error);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = '';
    if (data.output && data.output[0]) {
      const out = data.output[0];
      if (typeof out === 'string') content = out;
      else if (out.text) content = out.text;
      else if (Array.isArray(out.content) && out.content[0] && out.content[0].text) content = out.content[0].text;
    }
    if (!content) content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.result || '';
    
    console.log('Raw AI response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      // Fallback if no JSON found
      return new Response(
        JSON.stringify({
          score: 75,
          feedback: content.slice(0, 200) || 'Resume reviewed successfully.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
