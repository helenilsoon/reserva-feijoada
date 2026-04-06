"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    Home, Calendar, UtensilsCrossed, Menu, X,
    Shield, Phone,
    ClipboardList, Settings, Users, CreditCard,
} from "lucide-react";

/* ─────────────────────────── ADMIN NAV ─────────────────────────── */
function AdminBottomNav() {
    const pathname = usePathname();

    const adminItems = [
        { id: "reservas",    label: "Reservas",    icon: ClipboardList, href: "/admin/reservas" },
        { id: "config",      label: "Config.",      icon: Settings,      href: "/admin/configuracoes" },
        { id: "usuarios",    label: "Usuários",    icon: Users,         href: "/admin/usuarios" },
        { id: "maquininha",  label: "Maquininha",  icon: CreditCard,    href: "/admin/maquininha" },
    ];

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <nav className="bottom-nav-container admin-nav">
            {adminItems.map((item) => (
                <Link
                    key={item.id}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}

/* ─────────────────────────── CLIENT NAV ─────────────────────────── */
function ClientBottomNav() {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navItems = [
        { id: "home",    label: "Início",   icon: Home,            href: "/" },
        { id: "reservar",label: "Reservar", icon: Calendar,        href: "/reservar" },
        { id: "cardapio",label: "Cardápio", icon: UtensilsCrossed, href: "/menu" },
    ];

    const handleHaptic = () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(12);
        }
    };

    const isActive = (href: string) => {
        if (href === "/" && pathname === "/") return true;
        if (href !== "/" && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <>
            {/* Overlay */}
            {drawerOpen && (
                <div
                    onClick={() => setDrawerOpen(false)}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 9990,
                        backdropFilter: "blur(4px)",
                    }}
                />
            )}

            {/* Drawer "Mais Opções" */}
            <div style={{
                position: "fixed",
                bottom: drawerOpen ? "72px" : "-100%",
                left: 0, right: 0,
                background: "rgb(21, 13, 8)",
                borderTop: "1px solid rgba(212,160,23,0.3)",
                borderRadius: "20px 20px 0 0",
                zIndex: 9995,
                padding: "24px 20px 32px",
                transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 -12px 40px rgba(0,0,0,0.8)",
            }}>
                <div style={{ width: 40, height: 4, background: "rgba(212,160,23,0.4)", borderRadius: 99, margin: "0 auto 24px" }} />
                <p style={{ color: "rgba(212,160,23,0.6)", fontSize: "0.7rem", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 16 }}>
                    MAIS OPÇÕES
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Link href="/admin/login" onClick={() => setDrawerOpen(false)} style={drawerLinkStyle}>
                        <Shield size={20} color="var(--primary)" />
                        <span>Painel Administrador</span>
                    </Link>
                    <a href="https://wa.me/5592999999999" target="_blank" rel="noreferrer"
                        onClick={() => setDrawerOpen(false)} style={drawerLinkStyle}>
                        <Phone size={20} color="#25D366" />
                        <span>Falar no WhatsApp</span>
                    </a>
                </div>
            </div>

            {/* Nav bar */}
            <nav className="bottom-nav-container">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        onClick={handleHaptic}
                        className={`nav-item tap-feedback ${isActive(item.href) ? "active" : ""}`}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                ))}

                <button
                    onClick={() => { handleHaptic(); setDrawerOpen(!drawerOpen); }}
                    className={`nav-item tap-feedback ${drawerOpen ? "active" : ""}`}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                    {drawerOpen ? <X /> : <Menu />}
                    <span>Menu</span>
                </button>
            </nav>
        </>
    );
}

/* ─────────────────────────── SWITCHER ─────────────────────────── */
export default function BottomNav() {
    const pathname = usePathname();

    // Na tela de login do admin: mostra só botão de voltar
    if (pathname === "/admin/login") {
        return (
            <nav className="bottom-nav-container" style={{ justifyContent: "center" }}>
                <Link href="/" className="nav-item" style={{ flex: "0 0 auto", gap: 8, flexDirection: "row", fontSize: "0.85rem" }}>
                    <Home size={20} />
                    <span>Voltar para o início</span>
                </Link>
            </nav>
        );
    }

    // Área admin → nav de admin
    if (pathname.startsWith("/admin")) return <AdminBottomNav />;

    // Resto → nav do cliente
    return <ClientBottomNav />;
}

const drawerLinkStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 14,
    color: "var(--text)", textDecoration: "none",
    fontSize: "1rem", fontWeight: 500,
    padding: "14px 12px", borderRadius: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    transition: "background 0.2s",
};
