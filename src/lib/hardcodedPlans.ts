export interface HardcodedPlan {
  code: string;
  name: string;
  description: string;
  price: string;
  priceCents: number;
  maxProfessionals: number;
  maxAppointmentsMonth: number | null; // null = unlimited
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
    maxAppointmentsMonth: 50,
    features: [
      '1 profissional',
      'Até 50 agendamentos/mês',
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
    maxProfessionals: 3,
    maxAppointmentsMonth: 120,
    features: [
      'Até 3 profissionais',
      'Até 120 agendamentos/mês',
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
    maxProfessionals: 10,
    maxAppointmentsMonth: null,
    features: [
      'Até 10 profissionais',
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

/** Returns plan limits. Trial gets Studio limits. */
export function getPlanLimits(planCode: string | undefined, isTrial: boolean) {
  if (isTrial) {
    const studio = PLANS.find(p => p.code === 'studio')!;
    return { maxProfessionals: studio.maxProfessionals, maxAppointmentsMonth: studio.maxAppointmentsMonth };
  }
  const plan = PLANS.find(p => p.code === planCode) || PLANS[0];
  return { maxProfessionals: plan.maxProfessionals, maxAppointmentsMonth: plan.maxAppointmentsMonth };
}
