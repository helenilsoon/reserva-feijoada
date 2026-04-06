"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Utensils, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface MenuItem {
    id: string;
    category: string;
    title: string;
    description: string | null;
    items: string[];
    price: number;
    active: boolean;
    order_index: number;
}

export default function MenuPage() {
    const [menuData, setMenuData] = useState<Record<string, MenuItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const response = await fetch("/api/menu");
                if (!response.ok) throw new Error("Falha ao carregar o cardápio");
                const data: MenuItem[] = await response.json();
                
                // Group by category
                const groups = data.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                }, {} as Record<string, MenuItem[]>);

                setMenuData(groups);

                // Auto-expand the first item of each category if any
                const initialExpanded = new Set<string>();
                Object.values(groups).forEach(items => {
                    if (items.length > 0) initialExpanded.add(items[0].id);
                });
                setExpandedIds(initialExpanded);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido");
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);

    const toggleItem = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <main className="pb-safe min-h-screen bg-[#1a0f0a]" style={{ 
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(212, 160, 23, 0.05) 0%, transparent 50%)',
            backgroundAttachment: 'fixed'
        }}>
            <Header />

            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="section-pad"
                style={{ paddingTop: '140px', paddingBottom: '60px' }}
            >
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '0 20px' }}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span style={{ 
                            color: 'var(--primary)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: '800',
                            display: 'block',
                            marginBottom: '16px',
                            opacity: 0.8
                        }}>Experiência Caseira</span>
                        <h1 className="title-lg premium-gradient" style={{ 
                            fontSize: 'clamp(2.8rem, 10vw, 4.5rem)', 
                            lineHeight: '1',
                            fontFamily: 'Playfair Display, serif',
                            marginBottom: '24px',
                            fontWeight: '900',
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                        }}>Nossas Opções</h1>
                        <p className="text-md" style={{ 
                            color: 'var(--text-muted)', 
                            maxWidth: '540px', 
                            margin: '0 auto',
                            fontSize: '1.1rem',
                            lineHeight: '1.6'
                        }}>
                            Sinta o aroma e o sabor de uma feijoada feita com carinho e tradição. 
                            {Object.keys(menuData).length > 1 && " Explore também nossas bebidas e acompanhamentos."}
                        </p>
                    </motion.div>
                </div>
            </motion.section>

            {/* Menu Content */}
            <section style={{ padding: '0 20px 40px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '100px 0' }}>
                            <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Preparando o cardápio...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '60px' }}>
                            {Object.entries(menuData).map(([category, items], catIdx) => (
                                <motion.div 
                                    key={category}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: catIdx * 0.1 }}
                                >
                                    <h2 style={{ 
                                        color: 'var(--primary)', 
                                        fontSize: '0.8rem', 
                                        fontWeight: '800', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '5px',
                                        marginBottom: '32px',
                                        textAlign: 'center',
                                        opacity: 0.9,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '20px'
                                    }}>
                                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--primary-low))' }}></div>
                                        {category}
                                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, var(--primary-low))' }}></div>
                                    </h2>

                                    <div style={{ display: 'grid', gap: '20px' }}>
                                        {items.sort((a, b) => a.order_index - b.order_index).map((menuItem, idx) => {
                                            const isExpanded = expandedIds.has(menuItem.id);
                                            
                                            return (
                                                <motion.div
                                                    key={menuItem.id}
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: (catIdx * 0.2) + (idx * 0.1) }}
                                                    className="glass-card overflow-hidden"
                                                    style={{ 
                                                        padding: '0',
                                                        border: isExpanded ? '1px solid var(--primary-active)' : '1px solid rgba(255,255,255,0.1)'
                                                    }}
                                                >
                                                    {/* Header / Toggle */}
                                                    <button
                                                        onClick={() => toggleItem(menuItem.id)}
                                                        style={{ 
                                                            width: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '24px 32px',
                                                            textAlign: 'left',
                                                            background: isExpanded ? 'rgba(212, 160, 23, 0.05)' : 'transparent',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                                                            <Utensils 
                                                                className="w-6 h-6 transition-colors" 
                                                                style={{ color: isExpanded ? 'var(--primary)' : 'var(--text-muted)' }}
                                                            />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, paddingRight: '20px' }}>
                                                                <h3 className="title-sm" style={{ 
                                                                    margin: '0', 
                                                                    fontSize: '1.25rem',
                                                                    color: isExpanded ? 'var(--primary)' : 'var(--text)',
                                                                    fontWeight: '700'
                                                                }}>{menuItem.title}</h3>
                                                                
                                                                {menuItem.price > 0 && (
                                                                    <span style={{ 
                                                                        color: isExpanded ? 'white' : 'var(--primary)',
                                                                        fontSize: '1.1rem',
                                                                        fontWeight: '700',
                                                                        background: isExpanded ? 'var(--primary)' : 'rgba(212, 160, 23, 0.1)',
                                                                        padding: '4px 12px',
                                                                        borderRadius: '8px',
                                                                        transition: 'all 0.3s ease'
                                                                    }}>
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(menuItem.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            style={{ color: isExpanded ? 'var(--primary)' : 'var(--text-muted)' }}
                                                        >
                                                            <ChevronRight className="w-6 h-6" />
                                                        </motion.div>
                                                    </button>

                                                    {/* Content Details */}
                                                    <AnimatePresence initial={false}>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                                            >
                                                                <div style={{ padding: '0 32px 32px 32px' }}>
                                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '24px' }}></div>
                                                                    
                                                                    {menuItem.description && (
                                                                        <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
                                                                            {menuItem.description}
                                                                        </p>
                                                                    )}

                                                                    <div style={{ 
                                                                        display: 'grid', 
                                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                                                        gap: '16px' 
                                                                    }}>
                                                                        {menuItem.items && menuItem.items.length > 0 && menuItem.items.map((item, i) => (
                                                                            <motion.div 
                                                                                key={i}
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: i * 0.05 }}
                                                                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                                                                            >
                                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                                                                                <span style={{ fontSize: '0.95rem', color: 'var(--text)', opacity: 0.9 }}>{item}</span>
                                                                            </motion.div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Info / CTA Section */}
            {!loading && !error && Object.keys(menuData).length > 0 && (
                <section style={{ padding: '40px 20px 100px 20px' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="glass-card animate-glow" style={{ 
                            padding: '40px 20px', 
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.1) 0%, rgba(26, 15, 10, 0.4) 100%)'
                        }}>
                            <div style={{ padding: '20px 0' }}>
                                <Link href="/reservar">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-primary"
                                        style={{ padding: '18px 48px', fontSize: '1.2rem', borderRadius: '16px', boxShadow: '0 10px 40px rgba(212, 160, 23, 0.4)' }}
                                    >
                                        Garanta a Sua Agora 🍲
                                    </motion.button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <footer style={{ padding: '36px 20px 120px 20px', textAlign: 'center', backgroundColor: '#0a1010', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p>© 2026 Feijoada Solidária - Sabor e Tradição.</p>
            </footer>
        </main>
    );
}

