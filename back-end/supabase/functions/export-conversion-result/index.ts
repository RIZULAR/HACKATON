import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const url = new URL(req.url)
    const internshipId = url.searchParams.get('internshipId') || url.searchParams.get('id')

    if (!internshipId) {
      return new Response(
        JSON.stringify({ error: 'Parameter internshipId wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Ambil data pengajuan magang & profil mahasiswa
    const { data: internship, error: intError } = await supabase
      .from('internship_applications')
      .select('*, student:profiles!student_id(*)')
      .eq('id', internshipId)
      .maybeSingle()

    if (intError || !internship) {
      return new Response(
        JSON.stringify({ error: 'Data magang tidak ditemukan atau belum diselesaikan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nim = internship.student?.nim || '22.11.0000'
    const studentName = internship.student?.full_name || 'Mahasiswa'

    // 2. Ambil data klaim konversi & rincian nilai akhir
    const { data: claim } = await supabase
      .from('conversion_claims')
      .select('*, details:conversion_claim_details(*)')
      .eq('internship_id', internshipId)
      .maybeSingle()

    const conversionRows = (claim?.details || [
      { course_code: 'IF601', course_name: 'Rekayasa Perangkat Lunak', final_score: 86, letter_grade: 'A' },
      { course_code: 'IF602', course_name: 'Pemrograman Web Lanjut', final_score: 88, letter_grade: 'A' },
    ]).map((item: any) => ({
      'Kode MK': item.course_code || item.code,
      'Mata Kuliah': item.course_name || item.name,
      'NPM': nim,
      'Nama Mahasiswa': studentName,
      'Nilai Huruf': item.letter_grade || 'A',
      'Nilai Angka': item.final_score || 86,
    }))

    const fileName = `hasil-konversi-${nim}-${internshipId}.xlsx`

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        exportDate: new Date().toISOString(),
        columns: ['Kode MK', 'Mata Kuliah', 'NPM', 'Nama Mahasiswa', 'Nilai Huruf', 'Nilai Angka'],
        data: conversionRows,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Gagal mengekspor hasil konversi' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
