"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Mail, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Acesso negado");
            }
        } catch (err) {
            setError("Erro ao conectar com o servidor");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "16px 16px 16px 48px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid var(--glass-border)",
        borderRadius: "14px",
        color: "white",
        fontSize: "1rem",
        outline: "none",
        transition: "all 0.3s ease",
        boxSizing: "border-box" as const,
    };

    return (
        <div className="admin-login-layout" style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0c10",
            padding: "20px",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Background effects */}
            <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "rgba(212, 160, 23, 0.05)", borderRadius: "50%", filter: "blur(100px)" }} />
            <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, background: "rgba(212, 160, 23, 0.03)", borderRadius: "50%", filter: "blur(100px)" }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-panel"
                style={{
                    maxWidth: "420px",
                    width: "100%",
                    padding: "48px 32px",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 2
                }}
            >
                <div style={{
                    width: "64px",
                    height: "64px",
                    background: "rgba(212, 160, 23, 0.1)",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    border: "1px solid rgba(212, 160, 23, 0.3)"
                }}>
                    <UtensilsCrossed size={32} color="var(--primary)" />
                </div>

                <h1 className="brand" style={{
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "4px",
                    color: "var(--primary)",
                    marginBottom: "8px"
                }}>Administração</h1>
                <h2 className="title-md" style={{ marginBottom: "8px" }}>Reserva Feijoada</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "32px" }}>
                    Acesse com seu email e senha
                </p>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Campo Email */}
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Seu email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            style={inputStyle}
                            className="input-focus"
                        />
                    </div>

                    {/* Campo Senha */}
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            style={inputStyle}
                            className="input-focus"
                        />
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            style={{ color: "#e74c3c", fontSize: "0.85rem", fontWeight: "600", margin: 0, textAlign: "left" }}
                        >
                            ⚠️ {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: "100%",
                            padding: "18px",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            fontSize: "1rem",
                            marginTop: "4px"
                        }}
                    >
                        {loading ? "Verificando..." : (
                            <>
                                <LogIn size={20} />
                                Acessar Painel
                            </>
                        )}
                    </button>
                </form>

                <p style={{ marginTop: "28px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Somente pessoal autorizado.
                </p>
            </motion.div>
        </div>
    );
}
