'use client';

import { ChevronRight } from 'lucide-react';

const steps = [
  {
    n: '01',
    title: 'Lengkapi Profil',
    desc: 'Isi keahlian, portofolio, dan minat kariermu sekali saja — pakai berulang untuk semua lamaran.',
  },
  {
    n: '02',
    title: 'Temukan & Lamar',
    desc: 'Saring ribuan lowongan magang berdasarkan bidang, lokasi, dan durasi yang cocok denganmu.',
  },
  {
    n: '03',
    title: 'Mulai Magang',
    desc: 'Terima tawaran, atur jadwal onboarding, dan pantau progres magangmu dari satu dasbor.',
  },
];

export default function CaraKerja() {
  return (
    <section id="cara-kerja" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-center font-[Sora] text-3xl font-bold">
          Tiga Langkah Menuju Magang Impianmu
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-[#E4E6F1] p-6">
              <span className="font-[IBM_Plex_Mono] text-sm text-[#3D3BFF]/50">{s.n}</span>
              <h3 className="mt-3 font-[Sora] text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#14162B]/60">{s.desc}</p>
              {i < steps.length - 1 && (
                <ChevronRight className="absolute -right-6 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-[#E4E6F1] md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}