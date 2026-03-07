# Guia de Geração de APK com Bubblewrap 🚀

Como preparei o seu projeto para ser uma **PWA (Progressive Web App)** com manifesto e ícones de alta qualidade, agora você pode usar o **Bubblewrap** para gerar um APK oficial para Android.

## 📋 Pré-requisitos

1. **Deploy**: O seu site deve estar publicado (ex: Vercel, Netlify) com HTTPS.
2. **Node.js**: Você já tem instalado. Em seu sistema (/home/helenilson), abra o terminal.
3. **Java & Android SDK**: O Bubblewrap ajudará a baixar se você não tiver.

## 🚀 Geração Automatizada (Recomendado)

Desenvolvi dois scripts para automatizar todo o fluxo do Bubblewrap, incluindo a aceitação de licenças e o gerenciamento de senhas:

1.  **Inicializar**: `node scripts/android/init_bubblewrap.js`
    *(Cria a pasta `android-app/` e configura o projeto)*
2.  **Gerar APK**: `node scripts/android/build_bubblewrap.js`
    *(Gera os arquivos finais na pasta `android-app/`)*

### Arquivos Gerados
- **APK Assinado**: `android-app/app-release-signed.apk` (Pronto para instalar)
- **App Bundle**: `android-app/app-release-bundle.aab` (Pronto para a Play Store)

---

## 🛠️ Passo a Passo Manual (Referência)
... (mantido para backup) ...

---
> [!TIP]
> **Por que Bubblewrap?**
> Ele usa a tecnologia **Trusted Web Activity (TWA)**, que abre o seu site dentro de uma aba do Chrome super otimizada e sem barra de endereços, garantindo performance nativa e acesso total às APIs modernas da web.
