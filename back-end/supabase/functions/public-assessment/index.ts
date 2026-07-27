import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssessmentPayload {
  token: string
  evaluatorName?: string
  evaluatorPosition?: string
  companyName?: string
  scores: Record<string, number>
  comments?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const url = new URL(req.url)

    // GET /public-assessment?token=xyz (Verifikasi Token Assessment tanpa login)
    if (req.method === 'GET') {
      const token = url.searchParams.get('token')
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token wajib diberikan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: tokenData, error: tokenError } = await supabase
        .from('assessment_tokens')
        .select('*, internship:internship_applications(*)')
        .eq('token', token)
        .eq('is_used', false)
        .maybeSingle()

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: 'Token penilaian tidak valid atau sudah kadaluarsa' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(JSON.stringify({ success: true, data: tokenData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /public-assessment (Submit Penilaian Mitra/DPL tanpa login)
    if (req.method === 'POST') {
      const body: AssessmentPayload = await req.json()
      const { token, evaluatorName, evaluatorPosition, companyName, scores, comments } = body

      if (!token || !scores) {
        return new Response(
          JSON.stringify({ error: 'Parameter token dan scores wajib diisi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 1. Verifikasi token
      const { data: tokenData, error: tokenError } = await supabase
        .from('assessment_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .maybeSingle()

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: 'Token penilaian tidak ditemukan atau telah digunakan' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 2. Simpan penilaian
      if (tokenData.role === 'mitra') {
        await supabase.from('partner_assessments').upsert({
          internship_id: tokenData.internship_id,
          evaluator_name: evaluatorName || 'Mitra Industri',
          evaluator_position: evaluatorPosition || '',
          company_name: companyName || '',
          scores,
          comments: comments || '',
          submitted_at: new Date().toISOString(),
        })
      } else if (tokenData.role === 'dpl') {
        await supabase.from('dpl_reviews').upsert({
          internship_id: tokenData.internship_id,
          scores,
          comments: comments || '',
          submitted_at: new Date().toISOString(),
        })
      }

      // 3. Tandai token sudah dipakai
      await supabase
        .from('assessment_tokens')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', tokenData.id)

      return new Response(
        JSON.stringify({ success: true, message: 'Penilaian berhasil disimpan!' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
