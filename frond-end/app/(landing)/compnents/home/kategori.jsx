'use client';
import {
  ArrowUpRight,
  Code2,
  Megaphone,
  LineChart,
  Palette,
  HeartPulse,
  Building2,
} from 'lucide-react';

const categories = [
  { icon: Code2, name: 'Teknologi & IT', count: '1.240 lowongan' },
  { icon: Megaphone, name: 'Marketing', count: '860 lowongan' },
  { icon: LineChart, name: 'Finance & Bisnis', count: '540 lowongan' },
  { icon: Palette, name: 'Desain Kreatif', count: '410 lowongan' },
  { icon: HeartPulse, name: 'Kesehatan', count: '275 lowongan' },
  { icon: Building2, name: 'Administrasi', count: '690 lowongan' },
];

export default function Kategori() {
  return (
    <section id="kategori" className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-[Sora] text-3xl font-bold">Kategori Populer</h2>
            <p className="mt-2 text-[#14162B]/60">
              Pilih bidang magang yang paling sesuai dengan jurusanmu.
            </p>
          </div>
          <a href="#" className="hidden items-center gap-1 text-sm font-semibold text-[#3D3BFF] md:flex">
            Lihat semua kategori <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map(({ icon: Icon, name, count }) => (
            <div
              key={name}
              className="group cursor-pointer rounded-2xl border border-[#E4E6F1] bg-white p-6 transition hover:-translate-y-1 hover:border-[#3D3BFF] hover:shadow-lg"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D3BFF]/10 text-[#3D3BFF] transition group-hover:bg-[#3D3BFF] group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-[Sora] font-semibold">{name}</p>
              <p className="mt-1 font-[IBM_Plex_Mono] text-xs text-[#14162B]/50">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}