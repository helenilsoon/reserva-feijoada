"use client";

import Link from "next/link";
import Header from "@/components/Header";
import ReservationForm from "@/components/ReservationForm";
import { Calendar, Tag, MapPin, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="pb-safe">
      <Header />

      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: 'url("/hero-bg.png")', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-content animate-fade">
          <h1 className="brand" style={{ fontSize: '1rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--primary)' }}>Legendário</h1>
          <h2 className="hero-title-main title-xl">FEIJOADA</h2>
          <h2 className="hero-title-sub title-lg">Solidária</h2>
          <p className="text-lg" style={{ marginTop: '16px', fontWeight: 'bold', color: 'var(--text)', letterSpacing: '2px' }}>
            RUMO AO LEGENDÁRIO!
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '32px' }}>
            <Link href="/reservar" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 42px', fontSize: '1rem', borderRadius: '12px', fontWeight: '700' }}>
              Fazer Meu Pedido
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: '36px 20px 100px 20px', textAlign: 'center', backgroundColor: '#0a0c10', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>© 2026 Sabor & Tradição - Todos os direitos reservados.</p>
        <Link href="/reservas" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
          Administração
        </Link>
      </footer>
    </main>
  );
}
