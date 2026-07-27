'use client';

const stats = [
  ['10.000+', 'Mahasiswa terbantu'],
  ['850+', 'Perusahaan mitra'],
  ['4.200+', 'Lowongan aktif'],
  ['92%', 'Tingkat kepuasan'],
];

export default function Statistik() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid grid-cols-2 gap-8 rounded-3xl bg-[#14162B] px-8 py-12 text-center text-white md:grid-cols-4">
        {stats.map(([n, l]) => (
          <div key={l}>
            <p className="font-[Sora] text-3xl font-bold text-[#FFB020]">{n}</p>
            <p className="mt-1 text-sm text-white/60">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}