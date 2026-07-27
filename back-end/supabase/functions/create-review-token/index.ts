import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL') || 'http://localhost:5173'

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { internshipId, reviewerType = 'mitra', expiryDays = 7 } = await req.json()

    if (!internshipId) {
      return new Response(
        JSON.stringify({ error: 'internshipId wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Generate Token acak minimal 32 byte (64 hex characters)
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    const rawTokenHex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const rawToken = `${reviewerType}_${rawTokenHex}`

    // 2. Hash SHA-256 token untuk disimpan di DB
    const tokenHash = await sha256(rawToken)

    // 3. Set expires_at
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 3600 * 1000).toISOString()

    // 4. Konstruksi URL berdasarkan jenis reviewer
    const cleanBase = appPublicUrl.replace(/\/+$/, '')
    const reviewUrl = `${cleanBase}/assessment?type=${encodeURIComponent(reviewerType)}&token=${encodeURIComponent(rawToken)}`

    // Log produksi HANYA mencetak hash/ID, tidak pernah mencetak token asli
    console.log(`🔑 Review Token generated for Internship: ${internshipId} | Type: ${reviewerType} | Expires: ${expiresAt}`)

    // 5. Simpan hash token ke database (asumsi tabel review_tokens atau assessment_tokens tersedia)
    const { error: dbError } = await supabaseAdmin.from('review_tokens').insert([
      {
        internship_id: internshipId,
        token_hash: tokenHash,
        role: reviewerType,
        is_used: false,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
    ])

    if (dbError) {
      console.warn(`⚠️ Catatan DB simpan token: ${dbError.message}`)
    }

    // Token asli dikembalikan HANYA SEKALI pada respon ini
    return new Response(
      JSON.stringify({
        success: true,
        rawToken,
        reviewUrl,
        expiresAt,
        reviewerType,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Gagal membuat review token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
