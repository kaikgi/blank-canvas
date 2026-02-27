import { AlertTriangle, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlans, formatPriceBRL, getProfessionalsLabel } from '@/hooks/usePlans';
import { getKiwifyCheckoutUrl } from '@/lib/kiwifyCheckout';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

export function TrialExpiredModal() {
  const { data: plans, isLoading } = usePlans();
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-4xl space-y-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Período de teste encerrado</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Seu período de teste acabou!
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escolha um plano para continuar usando o Agendali e liberar sua agenda.
          </p>
        </div>

        {/* Plans */}
        {!isLoading && plans && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
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
                    <span className="text-3xl font-bold">{formatPriceBRL(plan.price_cents)}</span>
                    <span className={cn(
                      "text-body-sm",
                      plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      /mês
                    </span>
                  </div>
                  <p className={cn(
                    "text-body-sm mt-1",
                    plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {getProfessionalsLabel(plan.max_professionals)}
                  </p>
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
                      href={getKiwifyCheckoutUrl(plan.code, user?.id, user?.email || undefined)}
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
        )}
      </div>
    </div>
  );
}
