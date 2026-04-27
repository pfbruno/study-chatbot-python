export function normalizeBillingErrorMessage(error: unknown): string {
  const fallback = "Não foi possível processar a assinatura agora."

  if (error instanceof Error) {
    const message = error.message || fallback
    const normalized = message.toLowerCase()

    if (normalized.includes("card token service not found")) {
      return (
        "O Mercado Pago recusou a tokenização no ambiente de testes de assinatura. " +
        "A interface está funcionando, mas esse fluxo precisa ser validado em produção controlada."
      )
    }

    if (normalized.includes("mercado pago não configurado")) {
      return "O backend ainda não está configurado corretamente com as credenciais do Mercado Pago."
    }

    if (normalized.includes("plano do mercado pago ainda não foi criado")) {
      return (
        "O plano do Mercado Pago ainda não foi criado no backend. " +
        "Execute primeiro o bootstrap do plano e tente novamente."
      )
    }

    if (normalized.includes("token do cartão")) {
      return "O token do cartão não foi gerado. Revise os dados e tente novamente."
    }

    return message
  }

  return fallback
}