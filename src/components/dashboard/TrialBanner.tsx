import { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlansModal } from './PlansModal';

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const [plansOpen, setPlansOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          Teste grátis: faltam <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>
        </span>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs font-semibold"
          onClick={() => setPlansOpen(true)}
        >
          Escolher plano
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />
    </>
  );
}
