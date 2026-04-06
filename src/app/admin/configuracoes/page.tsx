"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Calendar, Clock, MapPin, DollarSign, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import GlassPanel from "@/components/admin/GlassPanel";
import AdminInput from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";

interface EventConfig {
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  delivery_enabled: boolean;
  delivery_fee: number;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao buscar config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <AdminPageLayout 
        title="Configurações do Evento"
        subtitle="Edite os detalhes que aparecem para os clientes e o valor da marmita."
        maxWidth="800px"
        backPath="/admin"
    >
        <GlassPanel>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <AdminInput
                label="Título do Evento"
                icon={Tag}
                value={config?.title || ''}
                onChange={(e) => setConfig(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Ex: Feijoada Solidária"
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <AdminInput
                    label="Data do Evento"
                    icon={Calendar}
                    type="date"
                    value={config?.date || ''}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, date: e.target.value } : null)}
                    required
                />
                <AdminInput
                    label="Horário"
                    icon={Clock}
                    type="time"
                    value={config?.time || ''}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, time: e.target.value } : null)}
                    required
                />
              </div>

              <AdminInput
                label="Local de Retirada"
                icon={MapPin}
                value={config?.location || ''}
                onChange={(e) => setConfig(prev => prev ? { ...prev, location: e.target.value } : null)}
                placeholder="Ex: Retirada na Igreja"
                required
              />

              <AdminInput
                label="Valor da Marmita (R$)"
                icon={DollarSign}
                type="number"
                step="0.01"
                min="0"
                value={config?.price || 0}
                onChange={(e) => setConfig(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                required
              />

              <div style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: config?.delivery_enabled ? "20px" : "0" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", color: "white", marginBottom: "4px", fontFamily: 'Outfit, sans-serif' }}>Habilitar Entrega em Domicílio</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Permite que os clientes escolham receber o pedido em casa.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => prev ? { ...prev, delivery_enabled: !prev.delivery_enabled } : null)}
                    style={{
                      width: "50px",
                      height: "26px",
                      borderRadius: "13px",
                      background: config?.delivery_enabled ? "var(--primary)" : "rgba(255,255,255,0.1)",
                      position: "relative",
                      transition: "all 0.3s",
                      cursor: "pointer",
                      border: "none"
                    }}
                  >
                    <div style={{
                      width: "20px",
                      height: "20px",
                      background: "white",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "3px",
                      left: config?.delivery_enabled ? "27px" : "3px",
                      transition: "all 0.3s"
                    }}></div>
                  </button>
                </div>

                {config?.delivery_enabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <AdminInput
                        label="Valor da Taxa de Entrega (R$)"
                        icon={DollarSign}
                        type="number"
                        step="0.01"
                        min="0"
                        value={config?.delivery_fee || 0}
                        onChange={(e) => setConfig(prev => prev ? { ...prev, delivery_fee: parseFloat(e.target.value) } : null)}
                        required
                    />
                  </motion.div>
                )}
              </div>

              <AdminButton
                type="submit"
                loading={saving}
                icon={Save}
                fullWidth
                style={{ marginTop: '12px', padding: '18px', fontSize: '1rem' }}
              >
                Salvar Alterações
              </AdminButton>
            </form>
        </GlassPanel>
    </AdminPageLayout>
  );
}
