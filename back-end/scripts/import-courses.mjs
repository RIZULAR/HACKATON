import fs from 'fs';
import path from 'path';
import { supabaseClient } from '../src/lib/supabaseClient.js';
import { supabaseAdmin } from '../src/lib/supabaseAdmin.js';

async function run() {
  console.log('🚀 IMPORT COURSES & CPMK SCRIPT');

  const client = supabaseAdmin || supabaseClient;
  const jsonPath = process.env.COURSES_JSON_PATH || './data/courses.json';
  const resolvedPath = path.resolve(process.cwd(), jsonPath);

  // 1. Cek ketersediaan file JSON
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ ERROR: File JSON tidak ditemukan pada lokasi: ${resolvedPath}`);
    console.error('💡 Atur variabel COURSES_JSON_PATH pada .env atau sediakan file di data/courses.json');
    process.exit(1);
  }

  // 2. Membaca dan memverifikasi format JSON
  let rawContent;
  let coursesData;

  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf-8');
    coursesData = JSON.parse(rawContent);
  } catch (err) {
    console.error(`❌ ERROR: Gagal membaca atau me-parse file JSON: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(coursesData)) {
    console.error('❌ ERROR: Format JSON harus berupa array of course objects.');
    process.exit(1);
  }

  // 3. Memeriksa ketersediaan tabel courses di Supabase
  console.log('🔍 Memeriksa ketersediaan tabel courses di Supabase...');
  const { error: tableCheckError } = await client
    .from('courses')
    .select('id')
    .limit(1);

  if (
    tableCheckError &&
    (tableCheckError.code === '42P01' ||
      tableCheckError.message.includes('does not exist') ||
      tableCheckError.message.includes('schema cache'))
  ) {
    console.error('\n==================================================');
    console.error('⛔ PROSES DIHENTIKAN: Tabel courses belum tersedia.');
    console.error('💡 Skema migration database dari anggota tim lain belum diterapkan.');
    console.error('📌 Jalankan `npx supabase db push` atau eksekusi migration SQL terlebih dahulu.');
    console.error('==================================================\n');
    process.exit(1);
  }

  console.log('✅ Tabel courses terdeteksi. Memulai validasi dan import data...\n');

  let importedCoursesCount = 0;
  let importedCpmksCount = 0;

  for (const item of coursesData) {
    // Validasi atribut wajib
    const kode = String(item.kode || item.code || '').trim();
    const nama = String(item.nama || item.name || '').trim();
    const sks = Number(item.sks || item.credits);
    const cpmkList = item.cpmk || item.cpmks || [];

    if (!kode) {
      console.warn('⚠️ Warning: Melewati data karena kode mata kuliah kosong:', item);
      continue;
    }

    if (!nama) {
      console.warn(`⚠️ Warning: Melewati mata kuliah ${kode} karena nama kosong.`);
      continue;
    }

    if (isNaN(sks) || sks <= 0) {
      console.warn(`⚠️ Warning: Melewati mata kuliah ${kode} karena SKS tidak valid (${sks}).`);
      continue;
    }

    if (!Array.isArray(cpmkList)) {
      console.warn(`⚠️ Warning: Melewati CPMK untuk ${kode} karena format CPMK bukan array.`);
      continue;
    }

    // 4. Upsert data ke tabel courses
    try {
      const { data: courseRecord, error: courseError } = await client
        .from('courses')
        .upsert(
          {
            code: kode,
            name: nama,
            credits: sks,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'code' }
        )
        .select()
        .single();

      if (courseError) {
        console.error(`❌ Gagal upsert course ${kode}: ${courseError.message}`);
        continue;
      }

      importedCoursesCount++;
      const courseId = courseRecord.id;

      // 5. Upsert CPMK ke tabel course_cpmks (atau cpmks)
      for (let idx = 0; idx < cpmkList.length; idx++) {
        const cpmkText = String(cpmkList[idx]).trim();
        const cpmkCode = `CPMK-${idx + 1}`;

        if (!cpmkText) continue;

        const { error: cpmkError } = await client
          .from('course_cpmks')
          .upsert(
            {
              course_id: courseId,
              code: cpmkCode,
              description: cpmkText,
            },
            { onConflict: 'course_id,code' }
          );

        if (!cpmkError) {
          importedCpmksCount++;
        }
      }

      console.log(`✅ Sukses import: [${kode}] ${nama} (${sks} SKS, ${cpmkList.length} CPMK)`);
    } catch (err) {
      console.error(`❌ Error tidak terduga pada [${kode}]:`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log('📊 RINGKASAN IMPORT KATALOG MATA KULIAH');
  console.log(`- Total Mata Kuliah Berhasil Import : ${importedCoursesCount}`);
  console.log(`- Total CPMK Berhasil Import        : ${importedCpmksCount}`);
  console.log('==================================================\n');
}

run();
