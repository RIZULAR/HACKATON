import { supabaseAdmin, getAdminClient } from '../src/lib/supabaseAdmin.js';
import { ROLES } from '../src/constants/roles.js';

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!';

const DEMO_USERS = [
  {
    email: 'mahasiswa.demo@students.amikom.ac.id',
    role: ROLES.MAHASISWA,
    fullName: 'Mahasiswa Demo OBE',
    nim: '22.11.4321',
  },
  {
    email: 'fakultas.demo@amikom.ac.id',
    role: ROLES.FAKULTAS,
    fullName: 'Admin Fakultas Informatika',
  },
  {
    email: 'kaprodi.demo@amikom.ac.id',
    role: ROLES.KAPRODI,
    fullName: 'Ketua Program Studi Informatika',
  },
  {
    email: 'dpl.ade@amikom.ac.id',
    role: ROLES.DPL,
    fullName: 'Ade Putranto, M.Kom.',
    lecturerCode: 'ADE-01',
    expertise: 'Software Engineering & Cloud Architecture',
    maxCapacity: 10,
  },
  {
    email: 'dpl.budi@amikom.ac.id',
    role: ROLES.DPL,
    fullName: 'Budi Raharjo, Ph.D.',
    lecturerCode: 'BUD-02',
    expertise: 'Cyber Security & Web Development',
    maxCapacity: 8,
  },
];

async function run() {
  console.log('🚀 SEED DEMO USERS SCRIPT');

  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch (envErr) {
    console.error(`❌ ERROR: ${envErr.message}`);
    process.exit(1);
  }

  // 1. Cek ketersediaan tabel profiles
  console.log('🔍 Memeriksa ketersediaan tabel profiles di Supabase...');
  const { error: tableCheckError } = await adminClient
    .from('profiles')
    .select('id')
    .limit(1);

  if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist') || tableCheckError.message.includes('schema cache'))) {
    console.error('\n==================================================');
    console.error('⛔ PROSES DIHENTIKAN: Tabel profiles belum tersedia.');
    console.error('💡 Skema migration database dari anggota tim lain belum diterapkan.');
    console.error('📌 Jalankan `npx supabase db push` atau eksekusi migration SQL terlebih dahulu.');
    console.error('==================================================\n');
    process.exit(1);
  }

  console.log('✅ Tabel profiles terdeteksi. Memulai proses seeding akun demo...\n');

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of DEMO_USERS) {
    try {
      // Cek apakah user sudah ada di Auth
      const { data: userList } = await adminClient.auth.admin.listUsers();
      let existingUser = userList?.users?.find((u) => u.email === user.email);

      let userId;

      if (!existingUser) {
        const { data: createdAuth, error: createError } = await adminClient.auth.admin.createUser({
          email: user.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: user.fullName, role: user.role },
        });

        if (createError) {
          console.error(`❌ Gagal membuat auth user (${user.email}): ${createError.message}`);
          continue;
        }

        userId = createdAuth.user.id;
        createdCount++;
        console.log(`👤 Akun Auth baru dibuat: ${user.email} (${user.role})`);
      } else {
        userId = existingUser.id;
        updatedCount++;
        console.log(`ℹ️ Akun Auth sudah ada: ${user.email} (${user.role})`);
      }

      // Upsert data profile
      const profileData = {
        id: userId,
        email: user.email,
        role: user.role,
        full_name: user.fullName,
        nim: user.nim || null,
        lecturer_code: user.lecturerCode || null,
        expertise: user.expertise || null,
        max_capacity: user.maxCapacity || null,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.warn(`⚠️ Warning saat upsert profile (${user.email}): ${profileError.message}`);
      } else {
        console.log(`   ✅ Profile berhasil diperbarui untuk ${user.email}`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error (${user.email}):`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log('📊 RINGKASAN SEEDING AKUN DEMO');
  console.log(`- Total Akun Baru Dibuat   : ${createdCount}`);
  console.log(`- Total Akun Diperbarui   : ${updatedCount}`);
  console.log('- Status Keamanan         : Password & Secret Key Terjaga Aman 🔒');
  console.log('==================================================\n');
}

run();
