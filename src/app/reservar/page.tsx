"use client";

import Header from "@/components/Header";
import ReservationForm from "@/components/ReservationForm";
import { motion } from "framer-motion";

export default function ReservarPage() {
    return (
        <main className="pb-safe min-h-screen bg-[#1a0f0a]">
            <Header />

            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="section-pad"
                style={{ paddingTop: '100px' }}
            >
                <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '0 16px' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Fazer Reserva</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1rem' }}>
                        Garanta já sua marmita para o evento! O pagamento pode ser feito via PIX.
                    </p>
                    <div className="glass-card" style={{ padding: '28px 24px', textAlign: 'left' }}>
                        <ReservationForm />
                    </div>
                </div>
            </motion.section>

            <footer style={{ padding: '36px 20px 100px 20px', textAlign: 'center', backgroundColor: '#0a0c10', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <p>© 2026 Sabor & Tradição - Todos os direitos reservados.</p>
            </footer>
        </main>
    );
}
