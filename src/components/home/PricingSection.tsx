import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/hardcodedPlans";

export function PricingSection() {
  return (
    <section id="precos" className="py-24 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-label text-muted-foreground uppercase tracking-wider mb-4">
            Preços
          </p>
          <h2 className="text-display-md md:text-display-lg text-balance mb-6">
            Planos simples, sem surpresas
          </h2>
          <p className="text-body-lg text-muted-foreground">
            Teste grátis por 7 dias. Depois, escolha o plano ideal para o seu negócio.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={cn(
                "relative rounded-2xl border p-6 transition-premium flex flex-col h-full",
                plan.popular
                  ? "bg-primary text-primary-foreground border-primary shadow-strong"
                  : "bg-card border-border hover:border-foreground/20 hover:shadow-elegant"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-foreground text-xs font-semibold whitespace-nowrap z-10">
                  Mais popular
                </div>
              )}

              <div className="min-h-[72px]">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={cn(
                  "text-body-sm",
                  plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {plan.description}
                </p>
              </div>

              <div className="min-h-[80px] mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm">R$</span>
                  <span className="text-display-md">{plan.price}</span>
                  <span className={cn(
                    "text-body-sm",
                    plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    /mês
                  </span>
                </div>
              </div>

              <ul className="flex-1 space-y-3 mt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-body-sm">
                    <Check
                      size={18}
                      className={cn(
                        "mt-0.5 shrink-0",
                        plan.popular ? "text-primary-foreground" : "text-foreground"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
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

        <div className="text-center mt-12">
          <p className="text-body-md text-muted-foreground">
            Precisa de mais?{" "}
            <a href="https://www.agendali.online/contato" className="text-foreground font-medium animate-underline">
              Fale com nosso time
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
