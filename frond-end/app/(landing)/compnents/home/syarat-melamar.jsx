'use client';

import {
  GraduationCap,
  IdCard,
  FileText,
  Clock3,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

const syarat = [
  {
    icon: GraduationCap,
    title: 'Mahasiswa Aktif',
    desc: 'Terdaftar sebagai mahasiswa aktif minimal semester 5, D3/D4/S1 dari semua jurusan.',
  },
  {
    icon: IdCard,
    title: 'KTP & KTM',
    desc: 'Memiliki KTP yang masih berlaku dan Kartu Tanda Mahasiswa (KTM) aktif.',
  },
  {
    icon: FileText,
    title: 'CV & Portofolio',
    desc: 'Menyertakan CV terbaru, dan portofolio (jika posisi yang dilamar membutuhkan).',
  },
  {
    icon: Clock3,
    title: 'Komitmen Waktu',
    desc: 'Sanggup magang minimal 3 bulan dengan jadwal full-time atau part-time sesuai posisi.',
  },
  {
    icon: Laptop,
    title: 'Perangkat Sendiri',
    desc: 'Memiliki laptop/perangkat pribadi untuk mendukung pekerjaan selama magang.',
  },
  {
    icon: CheckCircle2,
    title: 'Surat Pengantar Kampus',
    desc: 'Menyediakan surat pengantar magang resmi dari kampus (untuk posisi tertentu).',
  },
];

export default function SyaratMelamar() {
  return (
    <section id="syarat" className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-xl">
          <h2 className="font-[Sora] text-3xl font-bold">Syarat & Ketentuan Melamar</h2>
          <p className="mt-2 text-[#14162B]/60">
            Sebelum mendaftar, pastikan kamu memenuhi kriteria umum berikut ini.
            Setiap perusahaan bisa saja punya syarat tambahan sesuai posisi yang dibuka.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {syarat.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#E4E6F1] bg-white p-6 transition hover:-translate-y-1 hover:border-[#3D3BFF] hover:shadow-lg"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D3BFF]/10 text-[#3D3BFF]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-[Sora] font-semibold">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#14162B]/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}