"use client";

import { useState, useEffect } from 'react';

export default function ReservationForm() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        date: '2026-03-08',
        time: '11:00',
        guests: 1
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Format phone as (XX) XXXXX-XXXX
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const isPhoneValid = (phone: string) => phone.replace(/\D/g, '').length === 11;


    // Payment Modal State
    const [showModal, setShowModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, ticket_url: string } | null>(null);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [reservationId, setReservationId] = useState<number | null>(null);

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
                        clearInterval(interval);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 3000); // Poll every 3 seconds
        }

        return () => clearInterval(interval);
    }, [showModal, reservationId, paymentConfirmed]);

    const handleSubmit = async (e: React.FormEvent, payNow: boolean) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!isPhoneValid(formData.phone)) {
            setMessage({ type: 'error', text: 'Informe um número de celular válido com DDD: (XX) XXXXX-XXXX' });
            setLoading(false);
            return;
        }

        try {
            // 1. Create Reservation
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setReservationId(data.id);

                if (payNow) {
                    // 2. Create PIX payment
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
                        setMessage({ type: 'success', text: 'Reserva feita! Conclua o pagamento abaixo.' });
                    } else {
                        setMessage({ type: 'error', text: checkoutData.error || 'Erro ao gerar PIX. Tente a opção manual.' });
                    }
                } else {
                    setMessage({ type: 'success', text: 'Reserva confirmada! Você pode realizar o pagamento manualmente ou na retirada.' });
                    setFormData({ name: '', phone: '', date: '2026-03-08', time: '11:00', guests: 1 });
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao realizar reserva.' });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                {/* Event Info Header */}
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(212, 160, 23, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: '1px solid var(--primary)'
                }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '5px' }}>Feijoada Solidária</h3>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>📅 Domingo, 08/03 às 11:00</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Local: Retirada na Igreja</p>
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Seu Nome</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome aqui"
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
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
                                width: '100%', padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${formData.phone.length > 0 ? (isPhoneValid(formData.phone) ? '#25d366' : '#e74c3c') : 'var(--glass-border)'}`,
                                borderRadius: '8px', color: 'white'
                            }}
                        />
                        {formData.phone.length > 0 && !isPhoneValid(formData.phone) && (
                            <span style={{ fontSize: '0.75rem', color: '#e74c3c', marginTop: '4px', display: 'block' }}>
                                Número incompleto — ex: (92) 99999-9999
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
                            onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                        />
                    </div>
                </div>

                {message.text && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        backgroundColor: message.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                        color: message.type === 'success' ? '#2ecc71' : '#e74c3c',
                        border: `1px solid ${message.type === 'success' ? '#2ecc71' : '#e74c3c'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <button
                        onClick={(e) => handleSubmit(e, true)}
                        type="button"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', fontSize: '1rem', padding: '15px' }}
                    >
                        {loading ? 'Processando...' : 'Gera QR Code pro PIX'}
                    </button>

                    <button
                        onClick={(e) => handleSubmit(e, false)}
                        type="button"
                        disabled={loading}
                        style={{
                            width: '100%',
                            fontSize: '0.9rem',
                            padding: '12px',
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-muted)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Apenas Reservar
                    </button>
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
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="glass-card" style={{
                        maxWidth: '400px',
                        width: '100%',
                        padding: '30px',
                        textAlign: 'center',
                        border: paymentConfirmed ? '2px solid #2ecc71' : '1px solid var(--glass-border)'
                    }}>
                        {!paymentConfirmed ? (
                            <>
                                <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Pagamento via PIX</h3>
                                <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                                    Escaneie o QR Code abaixo ou copie a chave PIX para finalizar sua reserva.
                                </p>

                                {pixData ? (
                                    <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                                        <img
                                            src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                            alt="QR Code PIX"
                                            style={{ width: '200px', height: '200px' }}
                                        />
                                    </div>
                                ) : (
                                    <p>Carregando QR Code...</p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button
                                        onClick={() => {
                                            if (pixData) {
                                                navigator.clipboard.writeText(pixData.qr_code);
                                                alert('Chave PIX copiada!');
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            background: 'var(--primary)',
                                            color: 'black',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Copiar Chave PIX
                                    </button>

                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                                        Aguardando confirmação do pagamento...
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '20px' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                                <h3 style={{ color: '#2ecc71', marginBottom: '10px' }}>Pagamento Confirmado!</h3>
                                <p style={{ marginBottom: '25px' }}>
                                    Recebemos seu pagamento com sucesso. Sua reserva está garantida!
                                </p>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        window.location.reload();
                                    }}
                                    style={{
                                        padding: '12px 30px',
                                        background: '#2ecc71',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
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
                                    marginTop: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Fechar e pagar depois
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
