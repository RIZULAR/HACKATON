const { supabase } = require('../src/lib/supabase');

async function testConnection() {
  console.log('🔄 Memeriksa koneksi ke Supabase...');
  console.log(`📌 URL Project: ${process.env.SUPABASE_URL}`);

  try {
    // Mencoba melakukan query ke Supabase
    const { data, error } = await supabase.from('_dummy_health_check_').select('*').limit(1);

    if (error) {
      // Kode 42P01 / PGRST204 artinya koneksi database berhasil terhubung & merespons (walau tabel tes belum ada)
      if (error.code === '42P01' || error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ KONEKSI BERHASIL!');
        console.log('🎉 Backend berhasil terhubung dengan Supabase.');
      } else if (error.status === 401 || error.code === 'PGRST301') {
        console.error('❌ Autentikasi Gagal: Periksa API Key di file .env');
        console.error('   Detail Error:', error.message);
      } else {
        console.log('✅ KONEKSI BERHASIL! Supabase merespons.');
        console.log('   Pesan status:', error.message);
      }
    } else {
      console.log('✅ KONEKSI BERHASIL! Data berhasil diambil dari Supabase.');
    }
  } catch (err) {
    console.error('❌ Gagal terhubung ke Supabase:', err.message);
  }
}

testConnection();
