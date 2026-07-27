'use client';

import { Search, MapPin, ChevronRight, Sparkles, Users, Briefcase } from 'lucide-react';

const popularSearches = [
  'Software Engineering',
  'Digital Marketing',
  'Data Analyst',
  'UI/UX Design',
  'Human Resources',
  'Content Writer',
];

function Chip({ children }) {
  return (
    <span className="rounded-full border border-[#E4E6F1] bg-white px-4 py-2 text-sm text-[#14162B]/70 transition hover:border-[#3D3BFF] hover:text-[#3D3BFF]">
      {children}
    </span>
  );
}

function TicketCard({ eyebrow, title, meta, className = '' }) {
  return (
    <div
      className={`relative w-64 rounded-2xl bg-white p-4 shadow-[0_20px_45px_-15px_rgba(20,22,43,0.25)] ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D3BFF]/10">
          <Briefcase className="h-5 w-5 text-[#3D3BFF]" />
        </div>
        <div>
          <p className="font-[Sora] text-sm font-semibold text-[#14162B]">{title}</p>
          <p className="text-xs text-[#14162B]/50">{eyebrow}</p>
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-[#E4E6F1]" />
      <div className="flex items-center justify-between font-[IBM_Plex_Mono] text-xs text-[#14162B]/60">
        {meta.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F6F7FB]" />
      <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F6F7FB]" />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E4E6F1] bg-white px-4 py-1.5 text-sm text-[#14162B]/70">
          <Sparkles className="h-4 w-4 text-[#FFB020]" />
          10.000+ mahasiswa sudah dapat magang
        </div>

        <h1 className="font-[Sora] text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
          Rintis Kariermu Lewat{' '}
          <span className="text-[#3D3BFF]">Magang yang Tepat</span>
        </h1>

        <p className="mt-5 max-w-md text-base leading-relaxed text-[#14162B]/60">
          Temukan program magang dari ratusan perusahaan terpercaya,
          sesuai jurusan dan minatmu — semua dalam satu platform.
        </p>

        <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-[#E4E6F1] bg-white p-2 shadow-sm sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-[#14162B]/40" />
            <input
              type="text"
              placeholder="Posisi magang"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#14162B]/40"
            />
          </div>
          <div className="hidden h-6 w-px bg-[#E4E6F1] sm:block" />
          <div className="flex flex-1 items-center gap-2 px-3 py-2">
            <MapPin className="h-4 w-4 text-[#14162B]/40" />
            <input
              type="text"
              placeholder="Lokasi"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#14162B]/40"
            />
          </div>
          <button className="flex items-center justify-center gap-1 rounded-xl bg-[#3D3BFF] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Cari Magang
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#14162B]/50">Pencarian populer:</span>
          {popularSearches.slice(0, 3).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </div>

      <div className="relative hidden min-h-[420px] items-center justify-center md:flex">
        <div className="absolute h-80 w-80 rounded-full bg-gradient-to-br from-[#3D3BFF] to-[#6C63FF]" />
        <TicketCard
          eyebrow="Full-time · 3 bulan"
          title="Software Engineer Intern"
          meta={['Rp 2–3jt/bln', 'Jakarta']}
          className="absolute -left-4 top-6 -rotate-6"
        />
        <TicketCard
          eyebrow="Remote · 6 bulan"
          title="Digital Marketing Intern"
          meta={['Rp 1.5–2jt/bln', 'Remote']}
          className="absolute bottom-4 right-0 rotate-3"
        />
        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-lg">
          <Users className="h-10 w-10 text-[#3D3BFF]" />
        </div>
      </div>
    </section>
  );
}