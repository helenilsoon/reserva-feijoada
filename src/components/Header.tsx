"use client";

import Link from 'next/link';

export default function Header() {
    return (
        <header style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 100,
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(15, 17, 21, 0.8), transparent)'
        }}>
            <div className="brand" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                Sabor & Tradição
            </div>
            <nav style={{ display: 'flex', gap: '40px' }}>
                <Link href="/" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Início</Link>
                <Link href="/#cardapio" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Cardápio</Link>
                <Link href="/#reservar" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Fazer Reserva</Link>
                <Link href="/reservas" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>📦 Consultar Pedidos</Link>
            </nav>
            <Link href="/#reservar" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.85rem' }}>
                Fazer Reserva
            </Link>
        </header>
    );
}
