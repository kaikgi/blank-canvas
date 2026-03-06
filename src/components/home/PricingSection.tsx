import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type BillingPeriod, formatCentsBRL } from "@/lib/hardcodedPlans";

const PERIODS: { key: BillingPeriod; label: string }[] = [
  { key: "monthly", label: "Mensal" },
  { key: "quarterly", label: "Trimestral" },
  { key: "yearly", label: "Anual" },
];

function PriceDisplay({ plan, period }: { plan: (typeof PLANS)[0]; period: BillingPeriod }) {
  const cents = plan.prices[period];
  const formatted = formatCentsBRL(cents);
  const monthlyCents = plan.prices.monthly;
  const fullMonthlyTotal = monthlyCents * 12;
  const annualSaving = fullMonthlyTotal - plan.prices.yearly;

  return (
    <div className="min-h-[120px] mt-4 transition-all duration-200">
      <div className="flex items-baseline gap-1">
        <span className={cn("text-sm", plan.popular ? "text-primary-foreground/70" : "text-muted-foreground")}>R$</span>
        <span className="text-display-md tabular-nums">{formatted}</span>
        {period === "monthly" && (
          <span className={cn("text-body-sm", plan.popular ? "text-primary-foreground/70" : "text-muted-foreground")}>/mês</span>
        )}
      </div>
      {period === "quarterly" && (
        <div>
          <p className={cn("text-body-sm mt-1", plan.popular ? "text-primary-foreground/70" : "text-muted-foreground")}>
            à vista por trimestre
          </p>
          <p className={cn("text-xs font-semibold mt-1.5 inline-block px-2 py-0.5 rounded-full", plan.popular ? "bg-primary-foreground/20 text-primary-foreground" : "bg-foreground/10 text-foreground")}>
            Economize 10%
          </p>
        </div>
      )}
      {period === "yearly" && (
        <div>
          <p className={cn("text-body-sm mt-1 line-through opacity-60", plan.popular ? "text-primary-foreground/70" : "text-muted-foreground")}>
            De R${formatCentsBRL(fullMonthlyTotal)}
          </p>
          <p className={cn("text-xs font-semibold mt-1.5 inline-block px-2 py-0.5 rounded-full", plan.popular ? "bg-primary-foreground/20 text-primary-foreground" : "bg-foreground/10 text-foreground")}>
            Economize R${formatCentsBRL(annualSaving)} por ano
          </p>
        </div>
      )}
    </div>
  );
}

export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="precos" className="py-24 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-label text-muted-foreground uppercase tracking-wider mb-4">Preços</p>
          <h2 className="text-display-md md:text-display-lg text-balance mb-6">Planos simples, sem surpresas</h2>
          <p className="text-body-lg text-muted-foreground">
            Escolha o plano ideal para o seu negócio e comece a usar agora.
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center justify-center gap-1 mb-12">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                period === p.key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground/40"
              )}
            >
              {p.label}
            </button>
          ))}
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
                <p className={cn("text-body-sm", plan.popular ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>

              <PriceDisplay plan={plan} period={period} />

              <ul className="flex-1 space-y-3 mt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-body-sm">
                    <Check size={18} className={cn("mt-0.5 shrink-0", plan.popular ? "text-primary-foreground" : "text-foreground")} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Button variant={plan.popular ? "secondary" : "default"} size="lg" className="w-full" asChild>
                  <a href={plan.checkoutUrls[period]} target="_blank" rel="noopener noreferrer">
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
