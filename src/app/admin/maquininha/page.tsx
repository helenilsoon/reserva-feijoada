'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    QrCode, Copy, CheckCircle2, CreditCard, DollarSign, 
    RefreshCcw, ArrowLeft, PartyPopper, Delete, Trash2, 
    Maximize2, ChevronRight, Receipt, Printer, X, Sparkles,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import GlassPanel from '@/components/admin/GlassPanel';
import AdminButton from '@/components/admin/AdminButton';

export default function MaquininhaPage() {
    // Valor em centavos para facilitar a lógica do numpad
    const [amountCents, setAmountCents] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [pixData, setPixData] = useState<{ id: string, qr_code: string, qr_code_base64: string, ticket_url?: string } | null>(null);
    const [paid, setPaid] = useState(false);
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formattedAmount = (amountCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    // Lógica do Teclado Numérico
    const handleNumberClick = (num: number) => {
        if (amountCents.toString().length >= 8) return; // Limite de R$ 99.999,99
        setAmountCents(prev => (prev * 10) + num);
    };

    const handleClear = () => setAmountCents(0);
    const handleBackspace = () => setAmountCents(prev => Math.floor(prev / 10));

    // Polling do status do pagamento
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pixData && !paid) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/checkout/${pixData.id}/status`);
                    const data = await res.json();
                    if (data.status === 'Pago' || data.status === 'approved' || data.status === 'authorized') {
                        setPaid(true);
                        toast.success('PAGAMENTO CONFIRMADO! 🏆');
                    }
                } catch (err) {
                    console.error('Erro no polling do POS:', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [pixData, paid]);

    // Registrar no banco de dados quando marcado como pago
    useEffect(() => {
        const registerInDB = async () => {
            if (paid && pixData) {
                try {
                    await fetch('/api/admin/pos/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: amountCents / 100,
                            payment_id: pixData.id,
                            customer_name: 'Venda Direta (POS)',
                            source: 'pos'
                        })
                    });
                } catch (err) {
                    console.error('Erro ao persistir venda no banco:', err);
                }
            }
        };
        registerInDB();
    }, [paid, pixData, amountCents]);

    const handleGenerate = async () => {
        const val = amountCents / 100;
        if (val <= 0) {
            toast.error('Informe um valor maior que zero');
            return;
        }

        setLoading(true);
        setError(null);

        // MODO SIMULAÇÃO (Para desenvolvimento caso o token seja inválido)
        if (process.env.NODE_ENV === 'development' && (localStorage.getItem('pos_sim_mode') === 'true' || val === 0.01)) {
            await new Promise(r => setTimeout(r, 1500));
            setPixData({
                id: `sim_${Date.now()}`,
                qr_code: "00020101021226850014br.gov.bcb.pix0136e0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c5520400005303986540525.005802BR5915LEGENDARIO6008BRASILIA62070503***6304ABCD",
                qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                ticket_url: "#"
            });
            setPaid(false);
            toast.info('MODO SIMULAÇÃO ATIVO: Gerando QR Code de teste.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: val }),
            });
            const data = await res.json();
            if (res.ok && data.qr_code) {
                setPixData(data);
                setPaid(false);
                toast.success('PIX gerado! Mostre o QR Code ao cliente.');
            } else {
                const errMsg = data.error || 'Erro ao gerar PIX';
                setError(errMsg);
                toast.error(errMsg);
            }
        } catch (err) {
            setError('Erro de conexão com o servidor');
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const checkManual = async () => {
        if (!pixData || checking) return;
        setChecking(true);
        try {
            const res = await fetch(`/api/checkout/${pixData.id}/status`);
            const data = await res.json();
            if (data.status === 'Pago' || data.status === 'approved' || data.status === 'authorized') {
                setPaid(true);
                toast.success('Venda confirmada com sucesso!');
            } else {
                toast.info('Pagamento ainda não identificado.');
            }
        } catch (err) {
            toast.error('Erro ao verificar');
        } finally {
            setChecking(false);
        }
    };

    const copyToClipboard = () => {
        if (pixData) {
            navigator.clipboard.writeText(pixData.qr_code);
            toast.success('Copiado para o seu clipboard!');
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 2000);
        }
    };

    const reset = () => {
        setPixData(null);
        setAmountCents(0);
        setPaid(false);
    };

    return (
        <AdminPageLayout 
            title="Sabor & Tradição POS" 
            subtitle="Terminal de Pagamento Instantâneo"
            backPath="/admin"
            maxWidth="480px"
        >
            <div className="terminal-container relative w-full flex flex-col items-center">
                
                {/* O TERMINAL (KEYPAD/SCREEN) */}
                <GlassPanel className="w-full !p-0 overflow-hidden shadow-2xl border-white/10 relative">
                    {/* Detalhes Estéticos do Hardware */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
                    
                    <div className="p-6 pt-10">
                        <AnimatePresence mode="wait">
                            {/* ESTADO: SUCESSO (RECIBO) */}
                            {paid ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center"
                                >
                                    {/* O RECIBO */}
                                    <div className="receipt-paper bg-white text-slate-900 p-8 pt-10 rounded shadow-lg relative w-full mb-8 overflow-hidden font-mono">
                                        <div className="receipt-tear absolute -top-1 left-0 w-full flex justify-around opacity-20">
                                            {[...Array(20)].map((_, i) => (
                                                <div key={i} className="w-4 h-4 bg-slate-200 rotate-45 -translate-y-2 border border-slate-300" />
                                            ))}
                                        </div>

                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                                <CheckCircle2 size={32} className="text-white" />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-tighter text-slate-400">Sabor & Tradição Restuarante</p>
                                            <h3 className="text-xl font-black mt-1 uppercase">Venda Confirmada</h3>
                                        </div>

                                        <div className="border-y border-dashed border-slate-300 py-6 my-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500">VALOR TOTAL</span>
                                                <span className="text-2xl font-black">{formattedAmount}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span>DATA/HORA</span>
                                                <span className="text-right">
                                                    {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span>PAGAMENTO</span>
                                                <span>PIX DINÂMICO</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span>TRANSAÇÃO</span>
                                                <span className="truncate max-w-[120px]">{pixData?.id}</span>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-400 italic">Obrigado pela preferência!</p>
                                            <div className="mt-4 opacity-50 flex justify-center">
                                                {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-3 bg-slate-900 mx-0.5" />)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-3">
                                        <AdminButton onClick={reset} fullWidth className="py-4 text-lg font-black group">
                                            Nova Venda <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </AdminButton>
                                        <AdminButton variant="ghost" className="w-full text-slate-400 hover:text-white" onClick={() => window.print()}>
                                            <Printer size={16} className="mr-2" /> Imprimir Via do Cliente
                                        </AdminButton>
                                    </div>
                                </motion.div>
                            ) : !pixData ? (
                                /* ESTADO: ENTRADA DE VALOR */
                                <motion.div
                                    key="input"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex flex-col"
                                >
                                    {/* DISPLAY DIGITAL */}
                                    <div style={{
                                        backgroundColor: 'rgba(2, 6, 23, 0.9)',
                                        borderRadius: '24px',
                                        padding: '40px 20px',
                                        marginBottom: '32px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '180px'
                                    }}>
                                        {/* Glow effect */}
                                        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', backgroundColor: 'rgba(245, 158, 11, 0.1)', filter: 'blur(80px)', borderRadius: '50%' }} />
                                        
                                        {error ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px', fontWeight: '700' }}>
                                                    <AlertTriangle size={12} /> Erro no Terminal
                                                </div>
                                                <div style={{ color: '#f87171', fontSize: '14px', fontWeight: '500', lineHeight: '1.5', maxWidth: '240px' }}>
                                                    {error}
                                                </div>
                                                <button 
                                                    onClick={() => setError(null)}
                                                    style={{ marginTop: '16px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '9999px', cursor: 'pointer' }}
                                                >
                                                    Tentar Novamente
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(245, 158, 11, 0.6)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '10px', fontWeight: '700' }}>
                                                    <Sparkles size={10} /> Valor a Receber
                                                </div>
                                                
                                                <div style={{ fontSize: '4.5rem', fontWeight: '900', color: 'white', letterSpacing: '-0.05em', display: 'flex', alignItems: 'baseline' }}>
                                                    <span style={{ fontSize: '2rem', color: 'rgba(245, 158, 11, 0.5)', marginRight: '4px', fontWeight: '500' }}>R$</span>
                                                    { (amountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* TECLADO TÁTIL */}
                                    <div 
                                        style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(3, 1fr)', 
                                            gap: '10px',
                                            marginBottom: '32px',
                                            width: '100%',
                                            padding: '0 5px'
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => handleNumberClick(num)}
                                                className="tap-feedback"
                                                style={{ 
                                                    aspectRatio: '1.4/1', width: '100%',
                                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                                    borderRadius: "12px",
                                                    color: "white",
                                                    fontSize: "1.4rem",
                                                    fontWeight: "700",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            onClick={handleClear}
                                            className="tap-feedback"
                                            style={{ 
                                                aspectRatio: '1.4/1', width: '100%',
                                                backgroundColor: "rgba(231, 76, 60, 0.08)",
                                                border: "1px solid rgba(231, 76, 60, 0.2)",
                                                borderRadius: "12px",
                                                color: "#e74c3c",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <X size={20} strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={() => handleNumberClick(0)}
                                            className="tap-feedback"
                                            style={{ 
                                                aspectRatio: '1.4/1', width: '100%',
                                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                                borderRadius: "12px",
                                                color: "white",
                                                fontSize: "1.4rem",
                                                fontWeight: "700",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            0
                                        </button>
                                        <button
                                            onClick={handleBackspace}
                                            className="tap-feedback"
                                            style={{ 
                                                aspectRatio: '1.4/1', width: '100%',
                                                backgroundColor: "rgba(255, 255, 255, 0.12)",
                                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                                borderRadius: "12px",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            <Delete size={20} />
                                        </button>
                                    </div>

                                    <AdminButton
                                        onClick={handleGenerate}
                                        disabled={amountCents <= 0 || loading}
                                        loading={loading}
                                        fullWidth
                                        className="py-6 text-xl font-black rounded-[2rem] shadow-xl shadow-amber-500/20 uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        <QrCode size={24} strokeWidth={3} /> Gerar PIX
                                    </AdminButton>
                                </motion.div>
                            ) : (
                                /* ESTADO: QR CODE / AGUARDANDO */
                                <motion.div
                                    key="qr"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-full flex items-center justify-between mb-8">
                                        <button onClick={reset} className="p-3 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                                            <ArrowLeft size={24} />
                                        </button>
                                        <div className="text-center">
                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em]">Pagamento</p>
                                            <div className="text-3xl font-black text-white">{formattedAmount}</div>
                                        </div>
                                        <div className="w-12"></div>
                                    </div>

                                    {/* QR CODE AREA */}
                                    <div className="relative mb-10 group">
                                        <div className="absolute -inset-4 bg-amber-500/10 blur-2xl rounded-full animate-pulse opacity-50" />
                                        
                                        <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                                            {/* LINHA DE SCAN NEON */}
                                            <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)] z-10 animate-qr-scan" />
                                            
                                            <img
                                                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                                alt="QR Code PIX"
                                                className="w-64 h-64 block"
                                            />
                                            
                                            {/* Marcadores de canto visual */}
                                            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-slate-200" />
                                            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-slate-200" />
                                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-slate-200" />
                                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-slate-200" />
                                        </div>
                                    </div>

                                    <div className="mb-10 w-full flex flex-col items-center">
                                        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
                                            <RefreshCcw size={18} className="animate-spin-slow" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Banco...</span>
                                        </div>
                                    </div>

                                    <div className="w-full grid grid-cols-1 gap-4">
                                        <AdminButton
                                            onClick={checkManual}
                                            loading={checking}
                                            variant="primary"
                                            fullWidth
                                            className="py-5 font-black text-lg shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all"
                                        >
                                            Confirmar Recebimento Manual ✅
                                        </AdminButton>

                                        <div className="grid grid-cols-2 gap-3">
                                            <AdminButton
                                                onClick={copyToClipboard}
                                                variant="secondary"
                                                fullWidth
                                                className="text-[10px] font-bold"
                                            >
                                                <Copy size={14} className="mr-2" /> {showCopySuccess ? 'Copiado!' : 'Copia e Cola'}
                                            </AdminButton>
                                            <AdminButton
                                                onClick={() => window.open(`https://www.mercadopago.com.br/payments/${pixData.id}`, '_blank')}
                                                variant="secondary"
                                                fullWidth
                                                className="text-[10px] font-bold"
                                            >
                                                <Maximize2 size={14} className="mr-2" /> Log de Transação
                                            </AdminButton>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </GlassPanel>

                <div className="mt-8 text-center px-8 opacity-40">
                    <p className="text-[10px] font-medium leading-relaxed uppercase tracking-widest text-slate-500">
                        Sistema Integrado de Gestão de Vendas (POS-01) <br/>
                        Processado Seguramente via Mercado Pago
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes qr-scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
                .animate-qr-scan {
                    animation: qr-scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .receipt-paper {
                    background-image: linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px);
                    background-size: 100% 20px;
                }
            `}</style>
        </AdminPageLayout>
    );
}
