'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, CheckCircle2, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import GlassPanel from '@/components/admin/GlassPanel';
import AdminButton from '@/components/admin/AdminButton';
import AdminInput from '@/components/admin/AdminInput';

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
                toast.success('QR Code gerado com sucesso!');
            } else {
                toast.error(data.error || 'Erro ao gerar PIX');
            }
        } catch (err) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (pixData) {
            navigator.clipboard.writeText(pixData.qr_code);
            toast.success('Chave PIX copiada!');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
    };

    return (
        <AdminPageLayout 
            title="Venda Rápida (POS)" 
            subtitle="Gere uma cobrança instantânea via QR Code PIX."
            backPath="/admin"
            maxWidth="600px"
        >
            <AnimatePresence mode="wait">
                {!pixData ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <GlassPanel className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <CreditCard size={32} />
                            </div>
                            
                            <h2 className="text-lg font-semibold text-white mb-2">Valor da Cobrança</h2>
                            <p className="text-sm text-slate-400 mb-8">
                                Digite o valor total para gerar o QR Code.
                            </p>

                            <div className="mb-8">
                                <AdminInput
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    icon={DollarSign}
                                    className="text-4xl font-bold h-auto py-6 pl-16"
                                />
                            </div>

                            <AdminButton
                                onClick={handleGenerate}
                                disabled={!amount}
                                loading={loading}
                                fullWidth
                                className="py-5 text-lg"
                            >
                                Gerar QR Code
                            </AdminButton>
                        </GlassPanel>
                    </motion.div>
                ) : (
                    <motion.div
                        key="qr"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <GlassPanel className="text-center">
                            <h2 className="text-xl font-semibold text-amber-500 mb-6">Cobrança Gerada</h2>

                            <div className="inline-block p-4 mb-6 bg-white rounded-3xl shadow-2xl shadow-amber-500/20 border-4 border-amber-500/10">
                                <img
                                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    className="w-56 h-56"
                                />
                            </div>

                            <div className="p-6 mb-8 rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-sm text-slate-400 mb-2">Pagar o valor de:</p>
                                <div className="text-3xl font-bold text-white">
                                    R$ {parseFloat(amount.replace(',', '.')).toFixed(2)}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <AdminButton
                                    onClick={copyToClipboard}
                                    icon={showSuccess ? CheckCircle2 : Copy}
                                    fullWidth
                                    className="py-4"
                                >
                                    {showSuccess ? 'Copiado!' : 'Copiar Chave PIX'}
                                </AdminButton>

                                <AdminButton
                                    variant="ghost"
                                    onClick={() => { setPixData(null); setAmount(''); }}
                                    fullWidth
                                    className="underline"
                                >
                                    Nova Cobrança
                                </AdminButton>
                            </div>
                        </GlassPanel>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminPageLayout>
    );
}
