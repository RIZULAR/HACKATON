'use client';

import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#E4E6F1] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <a href="#" className="flex items-center gap-2 font-[Sora] text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D3BFF] text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            Magangin
          </a>
          <p className="mt-3 max-w-xs text-sm text-[#14162B]/60">
            Platform pencarian magang untuk mahasiswa Indonesia, menghubungkan
            talenta muda dengan perusahaan terpercaya.
          </p>
        </div>

        <div>
          <p className="mb-3 font-[Sora] font-semibold">Untuk Mahasiswa</p>
          <ul className="space-y-2 text-sm text-[#14162B]/60">
            <li><a href="#" className="hover:text-[#3D3BFF]">Cari Magang</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Kategori</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Tips Karier</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Komunitas</a></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-[Sora] font-semibold">Untuk Perusahaan</p>
          <ul className="space-y-2 text-sm text-[#14162B]/60">
            <li><a href="#" className="hover:text-[#3D3BFF]">Pasang Lowongan</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Harga</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Cari Talenta</a></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-[Sora] font-semibold">Perusahaan Kami</p>
          <ul className="space-y-2 text-sm text-[#14162B]/60">
            <li><a href="#" className="hover:text-[#3D3BFF]">Tentang Kami</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Kontak</a></li>
            <li><a href="#" className="hover:text-[#3D3BFF]">Kebijakan Privasi</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E4E6F1] px-6 py-6 text-center text-sm text-[#14162B]/50">
        © 2026 Magangin. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}