import { X, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/hardcodedPlans';
import { cn } from '@/lib/utils';

interface PlansModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlansModal({ open, onClose }: PlansModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border rounded-2xl shadow-xl max-w-3xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Escolha seu plano</h2>
          <p className="text-muted-foreground mt-1">
            Assine antes do fim do teste para não perder acesso
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.code}
              className={cn(
                'relative rounded-xl border p-5 flex flex-col',
                plan.popular
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                  : 'bg-card border-border'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-background text-foreground text-xs font-semibold whitespace-nowrap">
                  Mais popular
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p
                className={cn(
                  'text-sm mt-1',
                  plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {plan.description}
              </p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-sm">R$</span>
                <span className="text-3xl font-bold">{(plan.prices.monthly / 100).toLocaleString('pt-BR')}</span>
                <span
                  className={cn(
                    'text-sm',
                    plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  /mês
                </span>
              </div>
              <ul className="flex-1 space-y-1.5 mt-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <Button
                  variant={plan.popular ? 'secondary' : 'default'}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <a href={plan.checkoutUrls.monthly} target="_blank" rel="noopener noreferrer">
                    Assinar {plan.name}
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
