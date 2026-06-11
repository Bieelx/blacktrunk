const FINANCIAL_STATUS_PT: Record<string, string> = {
  AUTHORIZED: 'Autorizado',
  PAID: 'Pago',
  PARTIALLY_PAID: 'Parcialmente pago',
  PARTIALLY_REFUNDED: 'Parcialmente reembolsado',
  PENDING: 'Pagamento pendente',
  REFUNDED: 'Reembolsado',
  VOIDED: 'Cancelado',
  EXPIRED: 'Expirado',
};

const FULFILLMENT_STATUS_PT: Record<string, string> = {
  SUCCESS: 'Enviado',
  OPEN: 'Em preparação',
  PENDING: 'Em preparação',
  IN_PROGRESS: 'Em preparação',
  CANCELLED: 'Cancelado',
  ERROR: 'Erro no envio',
  FAILURE: 'Falha no envio',
};

export function financialStatusPtBr(status?: string | null): string | null {
  if (!status) return null;
  return FINANCIAL_STATUS_PT[status] ?? status;
}

export function fulfillmentStatusPtBr(status?: string | null): string | null {
  if (!status || status === 'N/A') return null;
  return FULFILLMENT_STATUS_PT[status] ?? status;
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
