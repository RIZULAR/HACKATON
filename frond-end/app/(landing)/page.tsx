import Hero from "./compnents/home/hero";
import Categories from "./compnents/home/kategori";
import CaraKerja from  "./compnents/home/carakerja";
import Statistik from "./compnents/home/statistik";
import SyaratMelamar from "./compnents/home/syarat-melamar";
export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <CaraKerja />
      <Statistik />
      <SyaratMelamar />

    </>
      
  );
}
