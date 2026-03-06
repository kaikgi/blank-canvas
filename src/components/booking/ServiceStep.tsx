import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/hooks/useServices';

interface ServiceStepProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
}

function formatPrice(cents: number | null): string {
  if (cents === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function ServiceStep({ services, selectedServiceId, onSelect }: ServiceStepProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum serviço disponível no momento.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold mb-4">Escolha o serviço</h2>
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service)}
          className={cn(
            'w-full p-4 rounded-lg border text-left transition-all',
            'hover:border-foreground/50',
            selectedServiceId === service.id
              ? 'border-foreground bg-accent'
              : 'border-border'
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {service.description}
                </p>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <Clock className="w-4 h-4" />
                <span>{service.duration_minutes} min</span>
              </div>
            </div>
            {service.price_cents !== null && (
              <span className="font-semibold">{formatPrice(service.price_cents)}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
