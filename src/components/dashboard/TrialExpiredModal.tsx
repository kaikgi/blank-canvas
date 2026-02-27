import { AlertTriangle, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { PLANS } from '@/lib/hardcodedPlans';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export function TrialExpiredModal() {
  const { reason } = useTrialStatus();

  const title = reason === 'past_due'
    ? 'Sua assinatura está com pagamento pendente'
    : reason === 'canceled'
      ? 'Sua conta foi cancelada'
      : 'Seu período de teste acabou';

  return (
    // No close button, no click-outside dismiss — inescapable paywall
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-4xl space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Acesso bloqueado</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escolha um de nossos planos abaixo para continuar usando o Agendali.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={cn(
                "relative rounded-2xl border p-6 transition-all flex flex-col h-full",
                plan.popular
                  ? "bg-primary text-primary-foreground border-primary shadow-strong scale-105"
                  : "bg-card border-border hover:border-foreground/20 hover:shadow-elegant"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-foreground text-xs font-semibold whitespace-nowrap z-10">
                  Mais popular
                </div>
              )}

              <div className="min-h-[60px]">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className={cn(
                  "text-body-sm",
                  plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {plan.description}
                </p>
              </div>

              <div className="min-h-[70px] mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm">R$</span>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={cn(
                    "text-body-sm",
                    plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    /mês
                  </span>
                </div>
              </div>

              <ul className="flex-1 space-y-2 mt-4">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={cn(
                      "mt-0.5 shrink-0",
                      plan.popular ? "text-primary-foreground" : "text-foreground"
                    )} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4">
                <Button
                  variant={plan.popular ? "secondary" : "default"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <a
                    href={plan.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escolher plano
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
