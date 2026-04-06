import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background Image Optimized with Next Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.png"
          alt="Feijoada Background"
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1410] opacity-90" />
      </div>

      <div className="hero-content relative z-10 text-center px-4 max-w-4xl animate-fade">
        <h1 className="brand text-primary uppercase tracking-[4px] text-sm mb-4">
          Legendário
        </h1>
        <h2 className="hero-title-main title-xl font-black mb-0">
          FEIJOADA
        </h2>
        <h2 className="hero-title-sub title-lg italic -mt-2 text-primary">
          Solidária
        </h2>
        <p className="text-lg font-bold tracking-[2px] text-[#f5e6d3]" style={{ marginTop: '24px', marginBottom: '40px' }}>
          RUMO AO LEGENDÁRIO!
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/reservar" 
            className="btn-primary no-underline px-10 py-4 text-base rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1"
          >
            Fazer Meu Pedido
          </Link>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-1" />
    </section>
  );
}
