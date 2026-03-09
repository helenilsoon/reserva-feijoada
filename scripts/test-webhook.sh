#!/bin/bash

# Script para simular um webhook do Mercado Pago localmente
# Uso: ./scripts/test-webhook.sh <payment_id>

PAYMENT_ID=${1:-"123456789"}
WEBHOOK_URL="http://localhost:3000/api/webhooks/mercadopago"

echo "Enviando notificação fake para $WEBHOOK_URL..."
echo "Pagamento ID: $PAYMENT_ID"

curl -X POST "$WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d "{
       \"type\": \"payment\",
       \"data\": {
         \"id\": \"$PAYMENT_ID\"
       }
     }"

echo -e "\n\nNota: O script de webhook tentará buscar os detalhes reais no Mercado Pago usando seu token."
echo "Se o ID for inválido ou não estiver 'approved', a reserva não será atualizada."
