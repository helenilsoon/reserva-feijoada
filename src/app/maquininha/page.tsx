'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, CheckCircle2, ChevronLeft, CreditCard } from 'lucide-react';

export default function MaquininhaPage() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string } | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleGenerate = async () => {
        const val = parseFloat(amount.replace(',', '.'));
        if (isNaN(val) || val <= 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: val }),
            });
            const data = await res.json();
            if (res.ok && data.qr_code) {
                setPixData(data);
            } else {
                alert('Erro ao gerar PIX: ' + (data.error || 'Tente novamente'));
            }
        } catch (err) {
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (pixData) {
            navigator.clipboard.writeText(pixData.qr_code);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    return (
        <main className="pb-safe min-h-screen bg-[#1a0f0a]">
            <Header />

            <section style={{ paddingTop: '100px', paddingBottom: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 72px)' }}>
                <div style={{ maxWidth: '420px', width: '100%', padding: '0 16px' }}>

                    <AnimatePresence mode="wait">
                        {!pixData ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card"
                                style={{ padding: '40px 30px', textAlign: 'center' }}
                            >
                                <div style={{ background: 'rgba(212, 160, 23, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)' }}>
                                    <CreditCard size={32} />
                                </div>
                                <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'white' }}>Maquininha</h1>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>Digite o valor para gerar o QR Code</p>

                                <div style={{ position: 'relative', marginBottom: '32px' }}>
                                    <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '20px 20px 20px 60px',
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '2px solid var(--glass-border)',
                                            borderRadius: '20px',
                                            color: 'white',
                                            textAlign: 'left'
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !amount}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '20px', borderRadius: '18px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Processando...' : 'Gerar QR Code'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card"
                                style={{ padding: '40px 30px', textAlign: 'center' }}
                            >
                                <button
                                    onClick={() => setPixData(null)}
                                    style={{ position: 'absolute', left: '24px', top: '24px', color: 'var(--text-muted)', background: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                                >
                                    <ChevronLeft size={16} /> Voltar
                                </button>

                                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '24px', paddingTop: '10px' }}>QR Code Gerado</h2>

                                <div style={{ background: 'white', padding: '16px', borderRadius: '24px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 0 40px rgba(212, 160, 23, 0.2)' }}>
                                    <img
                                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                        alt="QR Code PIX"
                                        style={{ width: '220px', height: '220px' }}
                                    />
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Valor do Pagamento</p>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white' }}>R$ {parseFloat(amount.replace(',', '.')).toFixed(2)}</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={copyToClipboard}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {showSuccess ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                                        {showSuccess ? 'Copiado!' : 'Copiar Chave PIX'}
                                    </button>

                                    <button
                                        onClick={() => setPixData(null)}
                                        style={{ width: '100%', padding: '16px', color: 'var(--text-muted)', background: 'transparent', border: 'none', textDecoration: 'underline', fontSize: '0.9rem' }}
                                    >
                                        Novo Pagamento
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.5 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Sistema de Pagamento Seguro via Mercado Pago
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
