import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  type: 'dpl_proposal_review' | 'mitra_assessment' | 'dpl_claim_review'
  recipientEmail: string
  recipientName?: string
  studentName?: string
  reviewUrl: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@amikom.ac.id'
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL') || 'http://localhost:5173'

    const body: EmailPayload = await req.json()
    const { type, recipientEmail, recipientName, studentName, reviewUrl } = body

    if (!recipientEmail || !reviewUrl) {
      return new Response(
        JSON.stringify({ error: 'recipientEmail dan reviewUrl wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let subject = 'Pemberitahuan Sistem Konversi Magang OBE'
    if (type === 'dpl_proposal_review') {
      subject = `[Permohonan Review Usulan Magang] Mahasiswa: ${studentName || 'Mahasiswa'}`
    } else if (type === 'mitra_assessment') {
      subject = `[Form Penilaian Magang Industri] Mahasiswa: ${studentName || 'Mahasiswa'}`
    } else if (type === 'dpl_claim_review') {
      subject = `[Review Akhir Klaim Konversi OBE] Mahasiswa: ${studentName || 'Mahasiswa'}`
    }

    // Jika RESEND_API_KEY belum tersedia, gunakan mode PREVIEW (fallback aman)
    if (!resendApiKey) {
      console.log(`ℹ️ [MODE PREVIEW EMAIL] Ke: ${recipientEmail} | Link: ${reviewUrl}`)
      return new Response(
        JSON.stringify({
          success: true,
          previewMode: true,
          message: 'RESEND_API_KEY belum diatur. Email berjalan dalam mode preview simulasional.',
          emailData: {
            from: emailFrom,
            to: recipientEmail,
            subject,
            reviewUrl,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Eksekusi pengiriman email riil menggunakan API Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipientEmail],
        subject,
        html: `<p>Halo ${recipientName || 'Bapak/Ibu'},</p>
               <p>Anda memiliki permintaan aksi pada Sistem Konversi Magang OBE.</p>
               <p><a href="${reviewUrl}">Klik di sini untuk membuka Form Penilaian/Review</a></p>`,
      }),
    })

    const resendData = await resendResponse.json()

    return new Response(
      JSON.stringify({ success: true, previewMode: false, data: resendData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    // Penanganan error tanpa membuat proses utama gagal
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Error pengiriman email' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
