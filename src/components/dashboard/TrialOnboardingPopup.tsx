import { useState, useEffect } from 'react';
import { X, Sparkles, Users, Calendar, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'agendali_trial_onboarding_dismissed';

interface TrialOnboardingPopupProps {
  daysLeft: number;
}

export function TrialOnboardingPopup({ daysLeft }: TrialOnboardingPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== '1') {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Bem-vindo ao Agendali! 🎉</h2>
        </div>

        <p className="text-muted-foreground mb-4">
          Você está no <span className="font-semibold text-foreground">período de teste gratuito</span> por{' '}
          <span className="font-semibold text-foreground">7 dias</span>. Veja o que está incluído:
        </p>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm">Até <strong>3 profissionais</strong> cadastrados</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm">Até <strong>130 agendamentos</strong> no período</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-sm">Após os 7 dias, o acesso será bloqueado até você assinar um plano.</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Faltam <strong className="text-foreground">{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> de teste.
        </p>

        <Button onClick={dismiss} className="w-full" size="lg">
          Entendi, vamos começar!
        </Button>
      </div>
    </div>
  );
}
