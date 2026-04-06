"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, LogOut, Calendar, TrendingUp, Settings, Users, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import GlassPanel from "@/components/admin/GlassPanel";
import AdminButton from "@/components/admin/AdminButton";

interface CurrentUser {
    name: string;
    email: string;
    role: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [eventDate, setEventDate] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        // Carrega data do evento e dados do usuário em paralelo
        Promise.all([
            fetch('/api/admin/settings').then(r => r.ok ? r.json() : null),
            fetch('/api/admin/me').then(r => r.ok ? r.json() : null),
        ]).then(([settingsData, meData]) => {
            if (settingsData?.date) {
                const [year, month, day] = settingsData.date.split('-');
                setEventDate(`${day}/${month}/${year}`);
            }
            if (meData?.user) {
                setCurrentUser(meData.user);
            }
        }).catch(err => console.error('Erro ao carregar dados:', err));
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
        } finally {
            router.push("/admin/login");
        }
    };

    const isSuperadmin = currentUser?.role === 'superadmin';

    const modules = [
        {
            title: "Reservas",
            description: "Gerenciar pedidos, status e lista de clientes.",
            icon: <Calendar size={32} />,
            href: "/admin/reservas",
            color: "var(--primary)",
            rgb: "212, 160, 23",
        },
        {
            title: "Maquininha (POS)",
            description: "Venda rápida presencial e registro instantâneo.",
            icon: <CreditCard size={32} />,
            href: "/admin/maquininha",
            color: "#25d366",
            rgb: "37, 211, 102",
        },
        {
            title: "Cardápio",
            description: "Editar itens, categorias e fotos do menu digital.",
            icon: <Utensils size={32} />,
            href: "/admin/menu",
            color: "#ff9f43",
            rgb: "255, 159, 67",
        },
        {
            title: "Configurações",
            description: "Alterar data, local, preço e título do evento.",
            icon: <Settings size={32} />,
            href: "/admin/configuracoes",
            color: "#e74c3c",
            rgb: "231, 76, 60",
        },
        {
            title: "Relatórios",
            description: "Visualizar métricas de vendas e arrecadação.",
            icon: <TrendingUp size={32} />,
            href: "/admin/reservas",
            color: "#007bff",
            rgb: "0, 123, 255",
        },
        // Card de Usuários — visível apenas para superadmin
        ...(isSuperadmin ? [{
            title: "Usuários",
            description: "Gerenciar administradores e níveis de acesso.",
            icon: <Users size={32} />,
            href: "/admin/usuarios",
            color: "#9b59b6",
            rgb: "155, 89, 182",
        }] : []),
    ];

    const actions = (
        <AdminButton
            variant="danger"
            onClick={handleLogout}
            icon={LogOut}
            loading={loggingOut}
            style={{ padding: "10px 20px" }}
        >
            Sair
        </AdminButton>
    );

    const greeting = currentUser ? `Bem-vindo, ${currentUser.name.split(' ')[0]}! 👋` : "Bem-vindo de volta!";
    const subtitle = currentUser
        ? `Você está logado como ${currentUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}. O que deseja gerenciar hoje?`
        : "O que deseja gerenciar hoje?";

    return (
        <AdminPageLayout
            title="Painel Administrativo"
            subtitle={subtitle}
            actions={actions}
            backPath={null}
        >
            {currentUser && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: "32px" }}
                >
                    <GlassPanel style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        background: "linear-gradient(135deg, rgba(212,160,23,0.06) 0%, rgba(0,0,0,0) 100%)"
                    }}>
                        <div style={{
                            width: "52px", height: "52px", borderRadius: "16px",
                            background: "rgba(212,160,23,0.15)",
                            border: "1px solid rgba(212,160,23,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--primary)", fontSize: "1.3rem", fontWeight: 700,
                            flexShrink: 0
                        }}>
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ color: "white", fontWeight: 600, fontSize: "1rem", marginBottom: "2px" }}>
                                {greeting}
                            </p>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                {currentUser.email}
                            </p>
                        </div>
                    </GlassPanel>
                </motion.div>
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px"
            }}>
                {modules.map((mod, i) => (
                    <motion.div
                        key={mod.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <Link
                            href={mod.href}
                            style={{ textDecoration: "none", display: "block", height: "100%" }}
                            className="tap-feedback"
                        >
                            <GlassPanel className="admin-module-card" style={{ height: "100%", transition: "transform 0.3s ease" }}>
                                <div style={{
                                    width: "64px",
                                    height: "64px",
                                    background: `rgba(${mod.rgb}, 0.1)`,
                                    borderRadius: "18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "24px",
                                    color: mod.color,
                                    border: `1px solid rgba(${mod.rgb}, 0.2)`
                                }}>
                                    {mod.icon}
                                </div>
                                <h3 className="title-sm" style={{ color: "white", marginBottom: "12px", fontFamily: 'Outfit, sans-serif' }}>
                                    {mod.title}
                                </h3>
                                <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                                    {mod.description}
                                </p>
                            </GlassPanel>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <GlassPanel animate delay={0.5} style={{
                marginTop: "48px",
                background: "linear-gradient(135deg, rgba(212,160,23,0.05) 0%, rgba(0,0,0,0) 100%)",
                textAlign: "center"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#25d366", animation: "pulse-gold 2s infinite" }} />
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>Sistema Operacional</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                    Evento agendado para: <strong style={{ color: "white" }}>{eventDate || 'Carregando...'}</strong>
                </p>
            </GlassPanel>
        </AdminPageLayout>
    );
}
