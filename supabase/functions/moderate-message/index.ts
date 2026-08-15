import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, message, is_class_2c } = await req.json()

    if (!name || !message) {
      return new Response(
        JSON.stringify({ error: 'Name and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- AI Moderation with Gemini ---
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    let aiProofread = null
    let aiFlagged = false
    let aiFlagReason = null

    if (GEMINI_API_KEY) {
      try {
        const prompt = `You are reviewing a condolence message submitted to a memorial card for someone who lost their father. 

Your job:
1. Check if the message is appropriate for a condolence card. Flag it if it contains: profanity, hate speech, spam, jokes, sarcasm, or anything disrespectful.
2. Fix any spelling or grammar mistakes. Keep the original tone and words — only fix clear errors.

Input message: "${message}"

Respond in this exact JSON format only, no other text:
{"flagged": false, "flag_reason": null, "proofread": "the corrected message"}

If flagged:
{"flagged": true, "flag_reason": "brief reason", "proofread": null}`

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 256,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        const geminiData = await geminiResponse.json()
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text

        if (text) {
          const parsed = JSON.parse(text)
          aiFlagged = parsed.flagged || false
          aiFlagReason = parsed.flag_reason || null
          aiProofread = parsed.proofread || null
        }
      } catch (aiError) {
        console.error('AI moderation error:', aiError)
        // Continue without AI — message still gets submitted as pending
      }
    }

    // --- Insert into database ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.from('messages').insert({
      name,
      message,
      is_class_2c: is_class_2c || false,
      status: 'pending',
      ai_proofread: aiProofread,
      ai_flagged: aiFlagged,
      ai_flag_reason: aiFlagReason,
    }).select().single()

    if (error) {
      console.error('Database insert error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        flagged: aiFlagged,
        message: 'Thank you. Your message will appear after review.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
