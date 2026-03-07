"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, Info, MessageCircle, Package } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { id: "home", label: "Início", icon: Home, href: "/" },
        { id: "reservar", label: "Reservar", icon: Calendar, href: "/reservar" },
        { id: "pedidos", label: "Pedidos", icon: Package, href: "/reservas" },
        { id: "info", label: "Cardápio", icon: Info, href: "/menu" },
        { id: "contato", label: "WhatsApp", icon: MessageCircle, href: "https://wa.me/5592993914928" },
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
        </nav>
    );
}
