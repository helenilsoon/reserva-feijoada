"use client";

import { useState, useEffect } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import GlassPanel from "@/components/admin/GlassPanel";
import { TrendingUp, Users, DollarSign, Package, MapPin, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MetricsData {
    summary: {
        totalReservations: number;
        totalGuests: number;
        paidCount: number;
        pendingCount: number;
        deliveryCount: number;
        pickupCount: number;
        posCount: number;
        webCount: number;
    };
    financial: {
        pricePerUnit: number;
        deliveryFee: number;
        totalRevenue: number;
        pendingRevenue: number;
        potentialRevenue: number;
    }
}

export default function AdminReportsPage() {
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/metrics");
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            } else {
                toast.error("Erro ao carregar métricas");
            }
        } catch (error) {
            toast.error("Erro na conexão com o servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading && !metrics) {
        return (
            <AdminPageLayout title="Relatório de Vendas" subtitle="Carregando estatísticas..." backPath="/admin">
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            </AdminPageLayout>
        );
    }

    const cards = [
        {
            title: "Arrecadação (Paga)",
            value: formatCurrency(metrics?.financial.totalRevenue || 0),
            icon: <DollarSign size={24} />,
            color: "#25d366",
            description: "Valor total de pedidos confirmados"
        },
        {
            title: "Total de Marmitas",
            value: `${metrics?.summary.totalGuests || 0} unid.`,
            icon: <Package size={24} />,
            color: "var(--primary)",
            description: "Somatória de todos os pedidos"
        },
        {
            title: "Total de Reservas",
            value: metrics?.summary.totalReservations || 0,
            icon: <TrendingUp size={24} />,
            color: "#007bff",
            description: "Número total de pedidos feitos"
        },
        {
            title: "Pendente (A Receber)",
            value: formatCurrency(metrics?.financial.pendingRevenue || 0),
            icon: <AlertCircle size={24} />,
            color: "#ff9f43",
            description: `${metrics?.summary.pendingCount || 0} pedidos aguardando pagamento`
        }
    ];

    return (
        <AdminPageLayout 
            title="Relatório de Vendas" 
            subtitle="Resumo detalhado de arrecadação e volume de pedidos."
            backPath="/admin"
            actions={
                <button 
                    onClick={fetchMetrics} 
                    className="tap-feedback"
                    style={{ 
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                        color: "white", padding: "10px 20px", borderRadius: "12px", 
                        display: "flex", alignItems: "center", gap: "10px" 
                    }}
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    Atualizar
                </button>
            }
        >
            <div style={{ display: "grid", gap: "24px" }}>
                
                {/* Grid de Cards Principais */}
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
                    gap: "20px" 
                }}>
                    {cards.map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <GlassPanel style={{ height: "100%", padding: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                    <div style={{ 
                                        width: "48px", height: "48px", borderRadius: "14px", 
                                        background: `${card.color}15`, border: `1px solid ${card.color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: card.color
                                    }}>
                                        {card.icon}
                                    </div>
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 500 }}>
                                        {card.title}
                                    </span>
                                </div>
                                <h2 style={{ color: "white", fontSize: "1.8rem", margin: "0 0 8px 0", fontFamily: "Outfit, sans-serif" }}>
                                    {card.value}
                                </h2>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>
                                    {card.description}
                                </p>
                            </GlassPanel>
                        </motion.div>
                    ))}
                </div>

                {/* Detalhes e Distribuição */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                    
                    <GlassPanel>
                        <h3 className="title-sm" style={{ color: "white", marginBottom: "20px" }}>Origem das Vendas</h3>
                        <div style={{ padding: "10px 0" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Users size={16} color="var(--primary)" /> Reservas Online (Site)
                                    </span>
                                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>{metrics?.summary.webCount}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${(metrics?.summary.webCount || 0) / (metrics?.summary.totalReservations || 1) * 100}%`, 
                                        height: "100%", background: "var(--primary)" 
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <RefreshCw size={16} color="#25d366" /> Venda Direta (Maquininha)
                                    </span>
                                    <span style={{ color: "#25d366", fontWeight: 600 }}>{metrics?.summary.posCount}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${(metrics?.summary.posCount || 0) / (metrics?.summary.totalReservations || 1) * 100}%`, 
                                        height: "100%", background: "#25d366" 
                                    }} />
                                </div>
                            </div>
                        </div>
                    </GlassPanel>

                    <GlassPanel>
                        <h3 className="title-sm" style={{ color: "white", marginBottom: "20px" }}>Distribuição de Logística</h3>
                        <div style={{ padding: "10px 0" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <MapPin size={16} color="var(--primary)" /> Retirada no Local
                                    </span>
                                    <span style={{ color: "var(--primary)", fontWeight: 600 }}>{metrics?.summary.pickupCount}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${(metrics?.summary.pickupCount || 0) / (metrics?.summary.totalReservations || 1) * 100}%`, 
                                        height: "100%", background: "var(--primary)" 
                                    }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Package size={16} color="#007bff" /> Entrega em Casa
                                    </span>
                                    <span style={{ color: "#007bff", fontWeight: 600 }}>{metrics?.summary.deliveryCount}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ 
                                        width: `${(metrics?.summary.deliveryCount || 0) / (metrics?.summary.totalReservations || 1) * 100}%`, 
                                        height: "100%", background: "#007bff" 
                                    }} />
                                </div>
                            </div>
                        </div>
                    </GlassPanel>

                    <GlassPanel>
                        <h3 className="title-sm" style={{ color: "white", marginBottom: "20px" }}>Resumo Financeiro</h3>
                        <div style={{ display: "grid", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                                <span style={{ color: "var(--text-muted)" }}>Preço por Marmita</span>
                                <span style={{ color: "white" }}>{formatCurrency(metrics?.financial.pricePerUnit || 0)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                                <span style={{ color: "var(--text-muted)" }}>Taxa de Entrega</span>
                                <span style={{ color: "white" }}>{formatCurrency(metrics?.financial.deliveryFee || 0)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
                                <span style={{ color: "var(--text-muted)" }}>Receita Potencial</span>
                                <span style={{ color: "white" }}>{formatCurrency(metrics?.financial.potentialRevenue || 0)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                                <span style={{ color: "white", fontWeight: 700 }}>Total Líquido Estimado</span>
                                <span style={{ color: "#25d366", fontWeight: 700, fontSize: "1.2rem" }}>
                                    {formatCurrency(metrics?.financial.totalRevenue || 0)}
                                </span>
                            </div>
                        </div>
                    </GlassPanel>

                </div>

                <GlassPanel style={{ background: "rgba(212,160,23,0.03)", border: "1px dashed rgba(212,160,23,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Users size={20} color="var(--primary)" />
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                            Este relatório é baseado no valor fixo configurado na data do evento. Alterações no preço das configurações afetarão os cálculos de receita total.
                        </p>
                    </div>
                </GlassPanel>

            </div>
        </AdminPageLayout>
    );
}
