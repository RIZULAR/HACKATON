const { supabaseAdmin } = require('../src/lib/supabaseAdmin');
const { ROLES } = require('../src/constants/roles');

/**
 * Script Pembuatan Akun Demo 5 Role (Mahasiswa, DPL, Fakultas, Kaprodi, Mitra)
 *
 * Persyaratan: SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY di .env
 */

const DEMO_ACCOUNTS = [
  {
    email: 'mahasiswa@demo.ac.id',
    password: 'Password123!',
    role: ROLES.MAHASISWA,
    fullName: 'Budi Santoso',
    nim: '220101001',
  },
  {
    email: 'dpl@demo.ac.id',
    password: 'Password123!',
    role: ROLES.DPL,
    fullName: 'Dr. Ahmad Dahlan, S.T., M.T.',
    nip: '198501012010121001',
  },
  {
    email: 'fakultas@demo.ac.id',
    password: 'Password123!',
    role: ROLES.FAKULTAS,
    fullName: 'Admin Fakultas Informatika',
  },
  {
    email: 'kaprodi@demo.ac.id',
    password: 'Password123!',
    role: ROLES.KAPRODI,
    fullName: 'Prof. Dr. Ir. Siti Aminah, M.Kom.',
  },
  {
    email: 'mitra@demo.com',
    password: 'Password123!',
    role: ROLES.MITRA,
    fullName: 'Mitra PT Teknologi Nusantara',
    companyName: 'PT Teknologi Nusantara',
  },
];

async function createDemoAccounts() {
  console.log('🚀 Memulai pembuatan akun demo untuk 5 Role Sistem...');

  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.');
    console.log('💡 Tambahkan SUPABASE_SECRET_KEY di .env Anda jika ingin mengeksekusi seeding akun demo via admin API.');
    return;
  }

  for (const account of DEMO_ACCOUNTS) {
    try {
      console.log(`⏳ Memproses akun: ${account.email} (${account.role})...`);

      const { data: userAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName,
          role: account.role,
        },
      });

      let userId = userAuth?.user?.id;

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`ℹ️ User ${account.email} sudah terdaftar di Supabase Auth.`);
          // Ambil user ID dari Auth List
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u) => u.email === account.email);
          userId = existingUser?.id;
        } else {
          console.error(`⚠️ Error Auth (${account.email}):`, authError.message);
          continue;
        }
      }

      if (userId) {
        // Upsert ke tabel profiles
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: userId,
          email: account.email,
          role: account.role,
          full_name: account.fullName,
          nim: account.nim || null,
          nip: account.nip || null,
          company_name: account.companyName || null,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.warn(`⚠️ Error Profile (${account.email}):`, profileError.message);
        } else {
          console.log(`✅ Berhasil setup akun & profil: ${account.email} [${account.role}]`);
        }
      }
    } catch (err) {
      console.error(`❌ Error (${account.email}):`, err.message);
    }
  }

  console.log('\n✨ Selesai mengumpulkan / seeding akun demo.');
}

createDemoAccounts();
