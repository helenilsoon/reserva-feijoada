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
          <h1 className="brand" style={{ fontSize: '1.2rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '4px' }}>Legendário</h1>
          <h2 style={{ fontSize: '4.5rem', fontFamily: 'Playfair Display', fontWeight: 900, marginBottom: '0' }}>FEIJOADA</h2>
          <h2 style={{ fontSize: '3.5rem', fontFamily: 'Playfair Display', fontStyle: 'italic', marginTop: '-10px', color: 'var(--primary)' }}>Solidária</h2>
          <p style={{ marginTop: '20px', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)' }}>
            RUMO AO LEGENDÁRIO!
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            <a href="#reservar" className="btn-primary" style={{ textDecoration: 'none', background: 'var(--primary)', padding: '15px 40px', fontSize: '1.1rem' }}>Fazer Meu Pedido</a>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section id="info" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-card animate-fade" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
              <h3>Domingo, 08/03</h3>
              <p style={{ color: 'var(--text-muted)' }}>A partir das 11h</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏷️</div>
              <h3>Valor: R$ 20,00</h3>
              <p style={{ color: 'var(--text-muted)' }}>Individual</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⛪</div>
              <h3>Retirada na Igreja</h3>
              <p style={{ color: 'var(--text-muted)' }}>Local de entrega</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5592993914928?text=Olá! Gostaria de informações sobre a Feijoada Solidária."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#25d366',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 100,
          fontSize: '2rem'
        }}
      >
        💬
      </a>

      {/* Reservation Placeholder */}
      <section id="reservar" style={{ padding: '100px 20px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Faça sua Reserva</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
            Selecione a data e o horário para garantir sua mesa.
          </p>
          <div className="glass-card" style={{ padding: '40px' }}>
            <ReservationForm />
          </div>
        </div>
      </section>

      <footer style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0a0c10', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>&copy; 2026 Sabor & Tradição - Todos os direitos reservados.</p>
        <Link href="/reservas" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', textDecoration: 'none', marginTop: '10px', display: 'inline-block' }}>
          Reservas
        </Link>
      </footer>
    </main>
  );
}
