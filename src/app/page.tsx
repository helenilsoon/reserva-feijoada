import Link from "next/link";
import Header from "@/components/Header";
import ReservationForm from "@/components/ReservationForm";

export default function Home() {
  return (
    <main>
      <Header />

      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: 'url("/hero-bg.png")' }}>
        <div className="hero-content animate-fade">
          <h1 className="brand" style={{ fontSize: '1rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--primary)' }}>Legendário</h1>
          <h2 className="hero-title-main">FEIJOADA</h2>
          <h2 className="hero-title-sub">Solidária</h2>
          <p style={{ marginTop: '16px', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text)', letterSpacing: '2px' }}>
            RUMO AO LEGENDÁRIO!
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '28px' }}>
            <a href="#reservar" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '1rem', borderRadius: '12px', fontWeight: '700' }}>
              Fazer Meu Pedido
            </a>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section id="info" className="section-pad" style={{ textAlign: 'center' }}>
        <div className="glass-card animate-fade" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
              <h3 style={{ fontSize: '1rem' }}>Domingo, 08/03</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A partir das 11h</p>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏷️</div>
              <h3 style={{ fontSize: '1rem' }}>R$ 20,00</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Por marmita</p>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⛪</div>
              <h3 style={{ fontSize: '1rem' }}>Retirada na Igreja</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Local de entrega</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5592993914928?text=Olá! Gostaria de informações sobre a Feijoada Solidária."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '20px',
          backgroundColor: '#25d366',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          zIndex: 100,
          fontSize: '1.8rem',
          textDecoration: 'none'
        }}
      >
        💬
      </a>

      {/* Reservation Section */}
      <section id="reservar" className="section-pad" style={{ background: 'var(--surface)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '0 16px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Faça sua Reserva</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Garanta já sua marmita para o evento!
          </p>
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <ReservationForm />
          </div>
        </div>
      </section>

      <footer style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#0a0c10', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>© 2026 Sabor & Tradição - Todos os direitos reservados.</p>
        <Link href="/reservas" style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
          Reservas
        </Link>
      </footer>
    </main>
  );
}
