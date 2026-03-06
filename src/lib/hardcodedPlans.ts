export interface HardcodedPlan {
  code: string;
  name: string;
  description: string;
  prices: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
  checkoutUrls: {
    monthly: string;
    quarterly: string;
    annual: string;
  };
  maxProfessionals: number | null;
  features: string[];
  popular: boolean;
  /** @deprecated Use checkoutUrls[period] instead */
  checkoutUrl: string;
}

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export const PLANS: HardcodedPlan[] = [
  {
    code: 'basico',
    name: 'Solo',
    description: 'Ideal para profissionais autônomos',
    prices: { monthly: 3900, quarterly: 10500, annual: 35100 },
    maxProfessionals: 1,
    features: [
      '1 profissional',
      'Agendamentos ilimitados',
      'Página pública de agendamento',
      'Lembretes por e-mail',
      'Suporte padrão',
    ],
    popular: false,
    checkoutUrl: 'https://pay.kiwify.com.br/3Zeym7r',
    checkoutUrls: {
      monthly: 'https://pay.kiwify.com.br/3Zeym7r',
      quarterly: 'https://pay.kiwify.com.br/73RMrpB',
      annual: 'https://pay.kiwify.com.br/ImV5cuf',
    },
  },
  {
    code: 'essencial',
    name: 'Studio',
    description: 'Para pequenos estabelecimentos',
    prices: { monthly: 7900, quarterly: 21300, annual: 71100 },
    maxProfessionals: 4,
    features: [
      'Até 4 profissionais',
      'Agendamentos ilimitados',
      'Página pública com Logo',
      'Lembretes por e-mail',
      'Gestão de Comissões',
      'Relatórios de desempenho',
    ],
    popular: true,
    checkoutUrl: 'https://pay.kiwify.com.br/uc7CCUY',
    checkoutUrls: {
      monthly: 'https://pay.kiwify.com.br/uc7CCUY',
      quarterly: 'https://pay.kiwify.com.br/dQip57V',
      annual: 'https://pay.kiwify.com.br/g4qeKkm',
    },
  },
  {
    code: 'studio',
    name: 'Pro',
    description: 'Para estúdios e clínicas',
    prices: { monthly: 14900, quarterly: 40200, annual: 134100 },
    maxProfessionals: null,
    features: [
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Página pública personalizável',
      'Lembretes por e-mail',
      'Gestão de Comissões',
      'Relatórios financeiros avançados',
      'Suporte prioritário',
    ],
    popular: false,
    checkoutUrl: 'https://pay.kiwify.com.br/i9OOO1',
    checkoutUrls: {
      monthly: 'https://pay.kiwify.com.br/i9OOO1',
      quarterly: 'https://pay.kiwify.com.br/oQ2rGRC',
      annual: 'https://pay.kiwify.com.br/kIinvfN',
    },
  },
];

/** Returns plan limits. Trial gets 3 professionals. */
export function getPlanLimits(planCode: string | undefined, isTrial: boolean) {
  if (isTrial) {
    return { maxProfessionals: 3 as number | null };
  }
  const plan = PLANS.find(p => p.code === planCode) || PLANS[0];
  return { maxProfessionals: plan.maxProfessionals };
}

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
