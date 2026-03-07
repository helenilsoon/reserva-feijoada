"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    const linkStyle: React.CSSProperties = {
        color: 'var(--text)',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: 500,
        padding: '12px 0',
        borderBottom: '1px solid var(--glass-border)',
        display: 'block',
    };

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 200,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(15, 17, 21, 0.95), rgba(15,17,21,0.6))',
            backdropFilter: 'blur(8px)',
        }}>
            {/* Logo */}
            <Link href="/" onClick={closeMenu} className="brand" style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
                Sabor & Tradição
            </Link>

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="desktop-nav">
                <Link href="/" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Início</Link>
                <Link href="/#info" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Cardápio</Link>
                <Link href="/#reservar" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Fazer Reserva</Link>
                <Link href="/reservas" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>📦 Consultar Pedidos</Link>
            </nav>

            {/* Desktop CTA */}
            <Link href="/#reservar" className="btn-primary desktop-nav" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.85rem', borderRadius: '10px' }}>
                Fazer Reserva
            </Link>

            {/* Hamburger Button (mobile only) */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="hamburger-btn"
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'none',
                    flexDirection: 'column',
                    gap: '5px',
                    padding: '4px',
                    zIndex: 300,
                }}
            >
                <span style={{
                    display: 'block', width: '24px', height: '2px',
                    background: 'var(--primary)',
                    transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                    transition: 'all 0.3s ease',
                }} />
                <span style={{
                    display: 'block', width: '24px', height: '2px',
                    background: 'var(--primary)',
                    opacity: menuOpen ? 0 : 1,
                    transition: 'all 0.3s ease',
                }} />
                <span style={{
                    display: 'block', width: '24px', height: '2px',
                    background: 'var(--primary)',
                    transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                    transition: 'all 0.3s ease',
                }} />
            </button>

            {/* Mobile Drawer */}
            {menuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 150,
                    }}
                    onClick={closeMenu}
                />
            )}
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    right: menuOpen ? 0 : '-100%',
                    width: '75%',
                    maxWidth: '300px',
                    height: '100%',
                    background: '#150d08',
                    borderLeft: '1px solid var(--glass-border)',
                    boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
                    zIndex: 250,
                    padding: '80px 28px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
                className="mobile-drawer"
            >
                <Link href="/" style={linkStyle} onClick={closeMenu}>🏠 Início</Link>
                <Link href="/#info" style={linkStyle} onClick={closeMenu}>🍽️ Cardápio</Link>
                <Link href="/#reservar" style={linkStyle} onClick={closeMenu}>📋 Fazer Reserva</Link>
                <Link href="/reservas" style={{ ...linkStyle, color: 'var(--primary)', borderBottom: 'none' }} onClick={closeMenu}>📦 Consultar Pedidos</Link>

                <Link
                    href="/#reservar"
                    onClick={closeMenu}
                    style={{
                        marginTop: '24px',
                        background: 'var(--primary)',
                        color: '#1a1410',
                        textDecoration: 'none',
                        padding: '14px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        textAlign: 'center',
                        fontSize: '1rem',
                    }}
                >
                    Fazer Minha Reserva
                </Link>
            </nav>

            <style>{`
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .hamburger-btn { display: flex !important; }
                }
            `}</style>
        </header>
    );
}
