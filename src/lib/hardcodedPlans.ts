export interface HardcodedPlan {
  code: string;
  name: string;
  description: string;
  price: string;
  priceCents: number;
  maxProfessionals: number | null; // null = unlimited
  features: string[];
  popular: boolean;
  checkoutUrl: string;
}

export const PLANS: HardcodedPlan[] = [
  {
    code: 'basico',
    name: 'Básico',
    description: 'Ideal para profissionais autônomos',
    price: '19,90',
    priceCents: 1990,
    maxProfessionals: 1,
    features: [
      '1 profissional',
      'Agendamentos ilimitados',
      'Notificações por email',
      'Página pública de agendamento',
    ],
    popular: false,
    checkoutUrl: 'https://pay.kiwify.com.br/6pi4D4u',
  },
  {
    code: 'essencial',
    name: 'Essencial',
    description: 'Para pequenos estabelecimentos',
    price: '49,90',
    priceCents: 4990,
    maxProfessionals: 4,
    features: [
      'Até 4 profissionais',
      'Agendamentos ilimitados',
      'Notificações por email e WhatsApp',
      'Página pública de agendamento',
      'Relatórios e métricas',
    ],
    popular: true,
    checkoutUrl: 'https://pay.kiwify.com.br/XXG8JDp',
  },
  {
    code: 'studio',
    name: 'Studio',
    description: 'Para estúdios e clínicas',
    price: '99,90',
    priceCents: 9990,
    maxProfessionals: null,
    features: [
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Notificações por email e WhatsApp',
      'Página pública de agendamento',
      'Relatórios e métricas avançados',
      'Suporte prioritário',
    ],
    popular: false,
    checkoutUrl: 'https://pay.kiwify.com.br/gDSvrq6',
  },
];

/** Returns plan limits. Trial gets Studio limits (everything unlimited). */
export function getPlanLimits(planCode: string | undefined, isTrial: boolean) {
  if (isTrial) {
    return { maxProfessionals: null as number | null };
  }
  const plan = PLANS.find(p => p.code === planCode) || PLANS[0];
  return { maxProfessionals: plan.maxProfessionals };
}
