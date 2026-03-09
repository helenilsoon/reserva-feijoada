"use client";

import { useState, useEffect, useCallback } from 'react';

interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    text: string;
    exiting?: boolean;
}

export default function ReservationForm({
    reservation,
    onSuccess
}: {
    reservation?: { id: number; customer_name: string; phone: string; guests: number };
    onSuccess?: () => void;
}) {
    const [formData, setFormData] = useState({
        name: reservation?.customer_name || '',
        phone: reservation?.phone || '',
        date: '2026-03-08',
        time: '11:00',
        guests: reservation?.guests || 1
    });
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const MARMITA_PRICE = 20.00;
    const totalPrice = formData.guests * MARMITA_PRICE;

    // Format phone as (XX) XXXXX-XXXX
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const isPhoneValid = (phone: string) => phone.replace(/\D/g, '').length === 11;

    // Toasts
    const showToast = useCallback((type: Toast['type'], text: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, text }]);
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
        }, 4000);
    }, []);

    // Payment Modal State
    const [showModal, setShowModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, ticket_url: string } | null>(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [reservationId, setReservationId] = useState<number | null>(reservation?.id || null);

    // Polling for payment status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (showModal && reservationId && !paymentConfirmed) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/reservations/${reservationId}/status`);
                    const data = await res.json();
                    if (data.status === 'Pago') {
                        setPaymentConfirmed(true);
                        showToast('success', '🏆 Reserva garantida! Pagamento confirmado.');
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 3000); // Poll every 3 seconds
        }

        return () => clearInterval(interval);
    }, [showModal, reservationId, paymentConfirmed, showToast]);

    const handleSubmit = async (e: React.FormEvent, payNow: boolean) => {
        e.preventDefault();
        setLoading(true);

        if (!isPhoneValid(formData.phone)) {
            showToast('error', 'Informe um celular válido: (XX) XXXXX-XXXX');
            setLoading(false);
            return;
        }

        if (!formData.name.trim()) {
            showToast('error', 'Por favor, informe seu nome.');
            setLoading(false);
            return;
        }

        try {
            if (reservation?.id) {
                // Update existing reservation
                const res = await fetch(`/api/reservations/${reservation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: formData.name,
                        phone: formData.phone,
                        guests: formData.guests
                    }),
                });

                if (res.ok) {
                    showToast('success', '✅ Reserva atualizada com sucesso!');
                    onSuccess?.();
                } else {
                    showToast('error', 'Erro ao atualizar reserva.');
                }
            } else {
                // Create new reservation
                const res = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();

                if (res.ok) {
                    setReservationId(data.id);

                    if (payNow) {
                        const checkoutRes = await fetch('/api/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                reservationId: data.id,
                                guests: formData.guests,
                                name: formData.name
                            }),
                        });

                        const checkoutData = await checkoutRes.json();

                        if (checkoutRes.ok && checkoutData.qr_code) {
                            setPixData(checkoutData);
                            setShowModal(true);
                            showToast('info', 'Quase lá! Escaneie o PIX para concluir.');
                        } else {
                            showToast('error', checkoutData.error || 'Erro ao gerar PIX. Tente novamente.');
                        }
                    } else {
                        showToast('success', '✅ Reserva feita! Pague na retirada ou via PIX depois.');
                        setFormData({ name: '', phone: '', date: '2026-03-08', time: '11:00', guests: 1 });
                    }
                } else {
                    showToast('error', data.error || 'Erro ao realizar reserva.');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            showToast('error', 'Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <form className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                {/* Event Info Header */}
                <div className="animate-glow" style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    background: 'rgba(212, 160, 23, 0.08)',
                    borderRadius: '20px',
                    marginBottom: '10px',
                    border: '1px solid rgba(212, 160, 23, 0.4)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                    <h3 className="title-md" style={{ color: 'var(--primary)', marginBottom: '8px' }}>{reservation ? 'Editar Reserva' : 'Feijoada Solidária'}</h3>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>📅 Domingo, 08/03 às 11:00</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Local: Retirada na Igreja</p>
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Seu Nome</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João Silva"
                        style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>WhatsApp</label>
                        <input
                            type="tel"
                            required
                            inputMode="numeric"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                            placeholder="(92) 99999-9999"
                            style={{
                                width: '100%', padding: '14px',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${formData.phone.length > 0 ? (isPhoneValid(formData.phone) ? '#25d366' : '#e74c3c') : 'var(--glass-border)'}`,
                                borderRadius: '12px', color: 'white',
                                fontSize: '16px'
                            }}
                        />
                        {formData.phone.length > 0 && !isPhoneValid(formData.phone) && (
                            <span style={{ fontSize: '0.75rem', color: '#e74c3c', marginTop: '6px', display: 'block', animation: 'fadeInDown 0.3s ease' }}>
                                Número incompleto
                            </span>
                        )}
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Marmitas</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={formData.guests}
                            onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                            style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', fontSize: '16px' }}
                        />
                    </div>
                </div>

                {/* Total Price Display */}
                <div style={{
                    textAlign: 'right',
                    padding: '12px 0',
                    borderTop: '1px solid var(--glass-border)',
                    marginTop: '5px'
                }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total do Pedido: </span>
                    <span style={{
                        color: 'var(--primary)',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        textShadow: '0 0 10px rgba(212, 160, 23, 0.3)'
                    }}>
                        R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    <button
                        onClick={(e) => handleSubmit(e, !reservation?.id)}
                        type="button"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', fontSize: '1.05rem', padding: '18px', borderRadius: '14px' }}
                    >
                        {loading ? 'Processando...' : reservation ? 'Salvar Alterações 💾' : 'Gera QR Code pro PIX 📲'}
                    </button>

                    {!reservation && (
                        <button
                            onClick={(e) => handleSubmit(e, false)}
                            type="button"
                            disabled={loading}
                            style={{
                                width: '100%',
                                fontSize: '0.9rem',
                                padding: '14px',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-muted)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Pagar Depois / Na Retirada
                        </button>
                    )}
                </div>
            </form>

            {/* Payment Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div className="glass-card animate-bounce" style={{
                        maxWidth: '420px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '32px 24px',
                        textAlign: 'center',
                        border: paymentConfirmed ? '2px solid #25d366' : '1px solid var(--glass-border)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                    }}>
                        {!paymentConfirmed ? (
                            <>
                                <h3 className="title-md" style={{ color: 'var(--primary)', marginBottom: '10px', fontFamily: 'Playfair Display' }}>Pagamento PIX</h3>
                                <p className="text-sm" style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                                    Escaneie o QR Code abaixo ou copie a chave PIX para finalizar sua reserva.
                                </p>

                                {pixData ? (
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '24px', display: 'inline-block', marginBottom: '20px', boxShadow: '0 0 40px rgba(212, 160, 23, 0.2)' }}>
                                        <img
                                            src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                            alt="QR Code PIX"
                                            style={{ width: '180px', height: '180px' }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={() => {
                                            if (pixData) {
                                                navigator.clipboard.writeText(pixData.qr_code);
                                                showToast('success', 'Chave PIX copiada! 📋');
                                            }
                                        }}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                                    >
                                        Copiar Chave PIX
                                    </button>

                                    <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'pulse-gold 1.5s infinite' }}></div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Aguardando pagamento...
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-scale">
                                <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🏆</div>
                                <h3 style={{ color: '#25d366', marginBottom: '12px', fontSize: '1.8rem', fontFamily: 'Playfair Display' }}>Confirmado!</h3>
                                <p style={{ marginBottom: '32px', fontSize: '1.1rem', lineHeight: 1.5 }}>
                                    Recebemos seu PIX com sucesso.<br />
                                    <strong>Sua feijoada está garantida!</strong>
                                </p>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        window.location.reload();
                                    }}
                                    className="btn-primary"
                                    style={{
                                        padding: '16px 40px',
                                        background: '#25d366',
                                        color: 'black'
                                    }}
                                >
                                    Concluir
                                </button>
                            </div>
                        )}

                        {!paymentConfirmed && (
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    marginTop: '30px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                Fechar e pagar depois
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' exit' : ''}`}>
                        {t.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
