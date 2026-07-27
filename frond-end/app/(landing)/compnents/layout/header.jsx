'use client';

import { useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E4E6F1] bg-[#F6F7FB]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 font-[Sora] text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D3BFF] text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          Magangin
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[#14162B]/70 md:flex">
          <a href="#" className="text-[#14162B]">Beranda</a>
          <a href="#kategori" className="hover:text-[#3D3BFF]">Cari Magang</a>
          <a href="#cara-kerja" className="hover:text-[#3D3BFF]">Cara Kerja</a>
          <a href="#testimoni" className="hover:text-[#3D3BFF]">Testimoni</a>
          <a href="#" className="hover:text-[#3D3BFF]">Untuk Perusahaan</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="#" className="text-sm font-medium text-[#14162B]/70 hover:text-[#3D3BFF]">
            Masuk
          </a>
          <a
            href="#"
            className="rounded-full bg-[#FFB020] px-5 py-2.5 text-sm font-semibold text-[#14162B] transition hover:brightness-95"
          >
            Daftar Gratis
          </a>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Buka menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-[#E4E6F1] px-6 py-4 md:hidden">
          <a href="#">Beranda</a>
          <a href="#kategori">Cari Magang</a>
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#testimoni">Testimoni</a>
          <a href="#" className="rounded-full bg-[#FFB020] px-4 py-2 text-center font-semibold">
            Daftar Gratis
          </a>
        </div>
      )}
    </header>
  );
}