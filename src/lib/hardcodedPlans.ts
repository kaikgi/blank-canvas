export interface HardcodedPlan {
  code: string;
  name: string;
  description: string;
  price: string;
  priceCents: number;
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
    features: [
      '1 profissional',
      'Agendamento online ilimitado',
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
    features: [
      'Até 5 profissionais',
      'Agendamento online ilimitado',
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
    features: [
      'Até 15 profissionais',
      'Agendamento online ilimitado',
      'Notificações por email e WhatsApp',
      'Página pública de agendamento',
      'Relatórios e métricas avançados',
      'Suporte prioritário',
    ],
    popular: false,
    checkoutUrl: 'https://pay.kiwify.com.br/gDSvrq6',
  },
];
