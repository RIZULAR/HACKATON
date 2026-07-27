import { supabaseAdmin, getAdminClient } from '../src/lib/supabaseAdmin.js';
import { validateEnv } from '../src/utils/validateEnv.js';

async function run() {
  console.log('==================================================');
  console.log('🧪 SMOKE TEST A: CONNECTION & ENVIRONMENT VERIFICATION');
  console.log('==================================================\n');

  // 1. Cek variabel environment
  console.log('1. Memeriksa ketersediaan variabel environment...');
  const isValidEnv = validateEnv(['SUPABASE_URL'], false);

  if (!isValidEnv) {
    console.error('❌ GAGAL: Variabel environment dasar belum lengkap.');
    process.exit(1);
  }
  console.log(`✅ SUPABASE_URL: ${process.env.SUPABASE_URL}`);

  // 2. Akses Supabase & Baca tabel profiles via Admin
  console.log('\n2. Menguji akses Supabase Admin & membaca tabel profiles...');
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.warn('ℹ️ STATUS: Koneksi Supabase berhasil, namun tabel profiles belum dibuat oleh migration SQL.');
        console.warn('💡 Dependency Belum Tersedia: Tabel profiles (Perlu eksekusi migration SQL tim)');
      } else {
        console.error(`❌ GAGAL: Supabase Admin error (${error.code}): ${error.message}`);
      }
    } else {
      console.log(`✅ KONEKSI BERHASIL: Tabel profiles dapat dibaca. (Ditemukan ${data?.length || 0} akun)`);
    }
  } catch (err) {
    console.error(`❌ ERROR KONEKSI: ${err.message}`);
    process.exit(1);
  }

  console.log('\n✨ Smoke Test Connection Selesai.\n');
}

run();
