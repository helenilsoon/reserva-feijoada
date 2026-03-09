"use client";

import Header from "@/components/Header";
import { Calendar, Tag, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function MenuPage() {
    return (
        <main className="pb-safe min-h-screen bg-[#1a0f0a]">
            <Header />

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="section-pad"
                style={{ textAlign: 'center', paddingTop: '100px' }}
            >
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '0 16px', marginBottom: '40px' }}>
                    <h2 className="title-md" style={{ marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Nosso Cardápio</h2>
                    <p className="text-md" style={{ color: 'var(--text-muted)' }}>
                        Tradição e sabor em cada detalhe.
                    </p>
                </div>

                <div className="glass-card animate-fade stagger" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                    <div className="mobile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div className="info-card" style={{ padding: '24px' }}>
                            <Calendar className="w-12 h-12 text-[#d4a017] mb-3 mx-auto" />
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Data e Hora</h3>
                            <p style={{ color: 'var(--text)', fontSize: '1rem', marginTop: '8px' }}>Domingo, 08 de Março</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A partir das 11h</p>
                        </div>

                        <div className="info-card" style={{ padding: '24px' }}>
                            <Tag className="w-12 h-12 text-[#d4a017] mb-3 mx-auto" />
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Investimento</h3>
                            <p style={{ color: 'var(--text)', fontSize: '1rem', marginTop: '8px' }}>R$ 20,00 por marmita</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Feijoada Completa Premium</p>
                        </div>

                        <div className="info-card" style={{ padding: '24px' }}>
                            <MapPin className="w-12 h-12 text-[#d4a017] mb-3 mx-auto" />
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Local de Retirada</h3>
                            <p style={{ color: 'var(--text)', fontSize: '1rem', marginTop: '8px' }}>Na Igreja Local</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Rua Gourmet, 123 - Centro</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <footer style={{ padding: '36px 20px 100px 20px', textAlign: 'center', backgroundColor: '#0a0c10', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <p>© 2026 Sabor & Tradição - Todos os direitos reservados.</p>
            </footer>
        </main>
    );
}
