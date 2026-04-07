"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    text: string;
    exiting?: boolean;
}

interface EventConfig {
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  delivery_enabled?: boolean;
  delivery_fee?: number;
}

export default function ReservationForm({
    reservation,
    onSuccess
}: {
    reservation?: { 
        id: number; 
        customer_name: string; 
        phone: string; 
        guests: number;
        delivery_type?: 'retirada' | 'entrega';
        address?: string;
    };
    onSuccess?: () => void;
}) {
    const [eventConfig, setEventConfig] = useState<EventConfig>({
        title: 'Feijoada Solidária',
        date: '2026-03-08',
        time: '11:00',
        location: 'Retirada na Igreja',
        price: 20.00
    });

    const [formData, setFormData] = useState({
        name: reservation?.customer_name || '',
        phone: reservation?.phone || '',
        date: eventConfig.date,
        time: eventConfig.time,
        guests: reservation?.guests || 1,
        delivery_type: reservation?.delivery_type || 'retirada',
        address: reservation?.address || ''
    });
    
    // Sync formData with reservation info if it changes (e.g. modal opening)
    useEffect(() => {
        if (reservation) {
            setFormData(prev => ({
                ...prev,
                name: reservation.customer_name,
                phone: reservation.phone,
                guests: reservation.guests,
                delivery_type: reservation.delivery_type || 'retirada',
                address: reservation.address || ''
            }));
        }
    }, [reservation]);
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const autocompleteRef = useRef<any>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    const deliveryFee = formData.delivery_type === 'entrega' ? (eventConfig.delivery_fee || 0) : 0;
    const totalPrice = (formData.guests * eventConfig.price) + deliveryFee;

    // Initialize Google Autocomplete
    useEffect(() => {
        if (formData.delivery_type === 'entrega' && typeof window !== 'undefined' && window.google) {
            const initAutocomplete = () => {
                if (!addressInputRef.current) return;
                
                autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
                    componentRestrictions: { country: 'br' },
                    fields: ['address_components', 'formatted_address', 'geometry'],
                    types: ['address']
                });

                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current.getPlace();
                    if (place.formatted_address) {
                        setFormData(prev => ({ ...prev, address: place.formatted_address }));
                    }
                });
            };

            // Small delay to ensure the textarea is rendered
            const timer = setTimeout(initAutocomplete, 100);
            return () => clearTimeout(timer);
        }
    }, [formData.delivery_type]);

    // Fetch event config
    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setEventConfig(data);
                    setFormData(prev => ({
                        ...prev,
                        date: data.date,
                        time: data.time
                    }));
                }
            })
            .catch(err => console.error('Erro ao buscar configurações:', err));
    }, []);

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
                        guests: formData.guests,
                        delivery_type: formData.delivery_type,
                        address: formData.address
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
                                name: formData.name,
                                delivery_type: formData.delivery_type
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
                        setFormData({ 
                            name: '', 
                            phone: '', 
                            date: eventConfig.date, 
                            time: eventConfig.time, 
                            guests: 1,
                            delivery_type: 'retirada',
                            address: ''
                        });
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

    const formatDateDisplayName = (dateStr: string) => {
        try {
            const [year, month, day] = dateStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month}`;
        } catch (err) {
            return dateStr;
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
                    <h3 className="title-md" style={{ color: 'var(--primary)', marginBottom: '8px' }}>{reservation ? 'Editar Reserva' : eventConfig.title}</h3>
                    <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>📅 {formatDateDisplayName(eventConfig.date)} às {eventConfig.time}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Local: {eventConfig.location}</p>
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

                {/* Delivery Type Selection */}
                {eventConfig.delivery_enabled && (
                    <div className="input-group" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <label style={{ display: 'block', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>Como deseja receber?</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, delivery_type: 'retirada' })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: formData.delivery_type === 'retirada' ? 'var(--primary)' : 'var(--glass-border)',
                                    background: formData.delivery_type === 'retirada' ? 'rgba(212, 160, 23, 0.1)' : 'transparent',
                                    color: formData.delivery_type === 'retirada' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🏪 Retirada
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, delivery_type: 'entrega' })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: formData.delivery_type === 'entrega' ? 'var(--primary)' : 'var(--glass-border)',
                                    background: formData.delivery_type === 'entrega' ? 'rgba(212, 160, 23, 0.1)' : 'transparent',
                                    color: formData.delivery_type === 'entrega' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🛵 Entrega
                            </button>
                        </div>

                        {formData.delivery_type === 'entrega' && (
                            <div className="animate-fade-in" style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Endereço de Entrega</label>
                                <input
                                    ref={addressInputRef}
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Comece a digitar seu endereço..."
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>✨</span> Taxa de entrega: R$ {eventConfig.delivery_fee?.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                )}


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
                        className="tap-feedback btn-primary"
                        disabled={loading}
                        style={{ width: '100%', fontSize: '1.05rem', padding: '18px', borderRadius: '14px' }}
                    >
                        {loading ? 'Processando...' : reservation ? 'Salvar Alterações 💾' : 'Gera QR Code pro PIX 📲'}
                    </button>

                    {!reservation && (
                        <button
                            onClick={(e) => handleSubmit(e, false)}
                            type="button"
                            className="tap-feedback"
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
                                        className="tap-feedback btn-primary"
                                        style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                                    >
                                        Copiar Chave PIX
                                    </button>

                                    <button
                                        disabled={loading}
                                        onClick={async () => {
                                            if (!reservationId) return;
                                            setLoading(true);
                                            try {
                                                const res = await fetch(`/api/reservations/${reservationId}/status`);
                                                const data = await res.json();
                                                if (data.status === 'Pago') {
                                                    setPaymentConfirmed(true);
                                                    showToast('success', '🏆 Recebido! Pagamento confirmado.');
                                                } else {
                                                    showToast('info', 'Ainda não recebemos. Tente em alguns instantes.');
                                                }
                                            } catch (err) {
                                                showToast('error', 'Ops! Tente novamente em instantes.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="tap-feedback"
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            fontSize: '0.9rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'white',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        {loading ? 'Verificando...' : 'Já paguei! Verificar agora 🔄'}
                                    </button>

                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
                                    className="tap-feedback btn-primary"
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
                                className="tap-feedback"
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
