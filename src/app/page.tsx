import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

// Metadados para SEO (Server Side)
export const metadata = {
  title: "Reserva Feijoada - Sabor & Tradição",
  description: "A melhor feijoada solidária da região. Faça sua reserva online e garanta seu lugar no Legendário!",
};

export default function Home() {
  return (
    <main className="pb-safe bg-[#1a1410]">
      <Header />
      
      {/* Hero Section (RSC Optimized) */}
      <Hero />

      {/* Outras seções podem ser adicionadas aqui como RSCs */}
      
      <Footer />
    </main>
  );
}
