import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, type BillingPeriod, type HardcodedPlan, formatCentsBRL } from "@/lib/hardcodedPlans";

const PERIODS: { key: BillingPeriod; label: string }[] = [
  { key: "monthly", label: "Mensal" },
  { key: "quarterly", label: "Trimestral" },
  { key: "yearly", label: "Anual" },
];

interface PlanCardsGridProps {
  /** Currently active plan code (shows "Plano atual" badge) */
  currentPlanCode?: string;
  /** Default billing period */
  defaultPeriod?: BillingPeriod;
  /** CTA label override */
  ctaLabel?: string;
  /** Compact mode for modals */
  compact?: boolean;
  /** Additional className for the grid container */
  className?: string;
}

function PriceDisplay({ plan, period, compact }: { plan: HardcodedPlan; period: BillingPeriod; compact?: boolean }) {
  const cents = plan.prices[period];
  const formatted = formatCentsBRL(cents);
  const monthlyCents = plan.prices.monthly;
  const fullMonthlyTotal = monthlyCents * 12;
  const fullQuarterlyTotal = monthlyCents * 3;
  const annualSaving = fullMonthlyTotal - plan.prices.yearly;
  const quarterlyDiscount = Math.round((1 - plan.prices.quarterly / fullQuarterlyTotal) * 100);
  const yearlyDiscount = Math.round((1 - plan.prices.yearly / fullMonthlyTotal) * 100);

  const mutedClass = plan.popular ? "text-primary-foreground/70" : "text-muted-foreground";
  const badgeClass = cn(
    "text-xs font-semibold mt-1.5 inline-block px-2 py-0.5 rounded-full",
    plan.popular
      ? "bg-primary-foreground/20 text-primary-foreground"
      : "bg-foreground/10 text-foreground"
  );

  return (
    <div className={cn("transition-all duration-200", compact ? "min-h-[80px] mt-3" : "min-h-[110px] mt-4")}>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-sm", mutedClass)}>R$</span>
        <span className={cn("font-bold tabular-nums", compact ? "text-2xl" : "text-3xl")}>{formatted}</span>
        {period === "monthly" && (
          <span className={cn("text-sm", mutedClass)}>/mês</span>
        )}
      </div>
      {period === "quarterly" && (
        <div>
          <p className={cn("text-sm mt-1", mutedClass)}>por trimestre</p>
          <p className={badgeClass}>Economize {quarterlyDiscount}%</p>
        </div>
      )}
      {period === "yearly" && (
        <div>
          <p className={cn("text-sm mt-1 line-through opacity-60", mutedClass)}>
            De R${formatCentsBRL(fullMonthlyTotal)}
          </p>
          <p className={badgeClass}>
            Economize R${formatCentsBRL(annualSaving)}/ano
          </p>
        </div>
      )}
    </div>
  );
}

export function PlanCardsGrid({
  currentPlanCode,
  defaultPeriod = "monthly",
  ctaLabel = "Escolher plano",
  compact = false,
  className,
}: PlanCardsGridProps) {
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Period Toggle */}
      <div className="flex items-center justify-center gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
              period === p.key
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-foreground/40"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch",
        compact ? "max-w-3xl mx-auto" : "max-w-5xl mx-auto"
      )}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlanCode === plan.code;

          return (
            <div
              key={plan.code}
              className={cn(
                "relative rounded-2xl border flex flex-col h-full transition-all duration-200",
                compact ? "p-5" : "p-6",
                plan.popular
                  ? "bg-primary text-primary-foreground border-primary shadow-strong"
                  : isCurrent
                    ? "bg-card border-primary/50 shadow-sm"
                    : "bg-card border-border hover:border-foreground/20 hover:shadow-elegant"
              )}
            >
              {/* Badges */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-foreground text-xs font-semibold whitespace-nowrap z-10">
                  Mais popular
                </div>
              )}
              {isCurrent && !plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap z-10">
                  Plano atual
                </div>
              )}

              {/* Plan Header */}
              <div className={compact ? "min-h-[52px]" : "min-h-[68px]"}>
                <h3 className={cn("font-bold mb-1", compact ? "text-lg" : "text-xl")}>{plan.name}</h3>
                <p className={cn(
                  "text-sm",
                  plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <PriceDisplay plan={plan} period={period} compact={compact} />

              {/* Features */}
              <ul className={cn("flex-1 space-y-2.5", compact ? "mt-4" : "mt-6")}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={compact ? 14 : 16}
                      className={cn(
                        "mt-0.5 shrink-0",
                        plan.popular ? "text-primary-foreground" : "text-foreground"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className={cn("mt-auto", compact ? "pt-4" : "pt-6")}>
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Plano atual
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? "secondary" : "default"}
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <a href={plan.checkoutUrls[period]} target="_blank" rel="noopener noreferrer">
                      {ctaLabel}
                      <ExternalLink size={14} className="ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
