const { supabase } = require('../src/lib/supabase');
const { getAdminClient } = require('../src/lib/supabaseAdmin');

/**
 * Script Import Katalog Mata Kuliah & CPMK (Kurikulum OBE)
 */

const STANDARD_COURSES = [
  {
    code: 'IF601',
    name: 'Rekayasa Perangkat Lunak',
    credits: 3,
    cpmk: 'Mampu merancang dan mengembangkan perangkat lunak sesuai kebutuhan pengguna.',
    keywords: [
      'analisis kebutuhan',
      'dashboard',
      'antarmuka',
      'pengembangan aplikasi',
      'perangkat lunak',
      'desain sistem',
      'ui',
      'ux',
    ],
  },
  {
    code: 'IF602',
    name: 'Pemrograman Web Lanjut',
    credits: 3,
    cpmk: 'Mampu mengimplementasikan aplikasi web yang terintegrasi dengan layanan backend.',
    keywords: [
      'react',
      'rest api',
      'integrasi api',
      'frontend',
      'pengujian web',
      'website',
      'aplikasi web',
      'endpoint',
      'javascript',
    ],
  },
  {
    code: 'IF603',
    name: 'Manajemen Proyek Perangkat Lunak',
    credits: 2,
    cpmk: 'Mampu mengelola siklus hidup proyek pengembangan software dan kerja tim.',
    keywords: [
      'scrum',
      'agile',
      'manajemen proyek',
      'jira',
      'sprint',
      'perencanaan',
      'teamwork',
    ],
  },
  {
    code: 'IF604',
    name: 'Basis Data Terdistribusi',
    credits: 3,
    cpmk: 'Mampu merancang basis data dan mengelola query terdistribusi skala besar.',
    keywords: [
      'database',
      'sql',
      'postgresql',
      'supabase',
      'query',
      'normalisasi',
      'relasi data',
    ],
  },
];

async function importCourses() {
  console.log('🔄 Memulai import katalog mata kuliah & CPMK...');

  let client = supabase;
  try {
    const admin = getAdminClient();
    if (admin) client = admin;
  } catch (e) {
    // Fallback ke anon client jika secret key tidak ada
  }

  for (const course of STANDARD_COURSES) {
    try {
      console.log(`⏳ Importing mata kuliah: ${course.code} - ${course.name}...`);

      const { data, error } = await client.from('courses').upsert(
        {
          code: course.code,
          name: course.name,
          credits: course.credits,
          cpmk_description: course.cpmk,
          keywords: course.keywords,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'code' }
      );

      if (error) {
        console.warn(`⚠️ Warning (${course.code}):`, error.message);
      } else {
        console.log(`✅ Berhasil import: ${course.code}`);
      }
    } catch (err) {
      console.error(`❌ Error (${course.code}):`, err.message);
    }
  }

  console.log('\n✨ Import katalog mata kuliah selesai.');
}

importCourses();
