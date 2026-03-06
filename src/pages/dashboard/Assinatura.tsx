import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, getBillingCycleLabel } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useUserEstablishment } from '@/hooks/useUserEstablishment';
import { useAuth } from '@/hooks/useAuth';
import { PLANS, type BillingPeriod, formatCentsBRL } from '@/lib/hardcodedPlans';
import { getPlanEntitlements, formatLimit } from '@/lib/planEntitlements';
import { PlanCardsGrid } from '@/components/billing/PlanCardsGrid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CreditCard,
  Users,
  Calendar,
  ExternalLink,
  Crown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CalendarDays,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Assinatura() {
  const { user } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: establishment, isLoading: establishmentLoading } = useUserEstablishment();
  const { data: limits, isLoading: limitsLoading } = usePlanLimits(establishment?.id);

  const isLoading = subscriptionLoading || establishmentLoading || limitsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const est = establishment as any;
  const estStatus = (est?.status || '').toLowerCase();
  const estPlano = (est?.plano || '').toLowerCase();

  const hasActiveSubscription = subscription?.status === 'active';

  // Determine display plan code
  let displayPlanCode: string;
  if (hasActiveSubscription) {
    displayPlanCode = (subscription?.plan_code || subscription?.plan || 'solo').toLowerCase();
  } else if (estPlano && estPlano !== 'nenhum') {
    displayPlanCode = estPlano;
  } else {
    displayPlanCode = 'solo';
  }

  const currentPlan = PLANS.find(p => p.code === displayPlanCode) || PLANS[0];
  const entitlements = getPlanEntitlements(estStatus, displayPlanCode);

  // Billing cycle from subscription
  const billingCycle = (subscription?.billing_cycle || 'monthly').toLowerCase() as BillingPeriod;
  const billingCycleLabel = getBillingCycleLabel(billingCycle);

  // Period end
  const periodEnd = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;


  // Usage
  const profLimit = entitlements.professionalLimit;
  const profCurrent = limits?.currentProfessionals ?? 0;
  const isNearProfessionalsLimit = profLimit !== Infinity && profLimit > 0
    ? (profCurrent / profLimit) >= 0.8
    : false;

  const isMaxPlan = displayPlanCode === 'pro';

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e acompanhe seu uso</p>
      </div>

      {/* Upgrade Alert */}
      {isNearProfessionalsLimit && !isMaxPlan && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Você está próximo do limite de profissionais. Considere fazer upgrade para continuar crescendo.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Seu Plano
              </CardTitle>
              {hasActiveSubscription ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary">Sem assinatura</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Info Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-base px-3 py-1">
                      {currentPlan.name}
                    </Badge>
                    {hasActiveSubscription && (
                      <Badge variant="outline" className="text-xs">
                        {billingCycleLabel}
                      </Badge>
                    )}
                  </div>
                  {hasActiveSubscription ? (
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Assinatura ativa • {billingCycleLabel}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Nenhuma assinatura ativa
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold tabular-nums">
                  R$ {formatPriceBRL(currentPlan.prices.monthly)}
                </div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </div>
            </div>

            {/* Subscription Details */}
            {hasActiveSubscription && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                  <Repeat className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Ciclo de cobrança</div>
                    <div className="font-medium text-sm">{billingCycleLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Válido até</div>
                    <div className="font-medium text-sm">{periodEnd || '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Profissionais</div>
                  <div className="font-semibold text-sm">{formatLimit(entitlements.professionalLimit)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Agendamentos</div>
                  <div className="font-semibold text-sm">
                    {entitlements.appointmentLimit === Infinity ? 'Ilimitados' : entitlements.appointmentLimit}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Crown className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Plano</div>
                  <div className="font-semibold text-sm">{currentPlan.name}</div>
                </div>
              </div>
            </div>

            {/* Manage Payment */}
            {hasActiveSubscription && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://dashboard.kiwify.com.br" target="_blank" rel="noopener noreferrer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerenciar Pagamento
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              Uso Atual
            </CardTitle>
            <CardDescription>Consumo do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Professionals usage */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Profissionais</div>
                  <div className="font-semibold text-sm">
                    {profCurrent} / {formatLimit(entitlements.professionalLimit)}
                  </div>
                </div>
              </div>
              {profLimit !== Infinity && profLimit > 0 && (
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      profCurrent >= profLimit ? 'bg-destructive' :
                      isNearProfessionalsLimit ? 'bg-amber-500' : 'bg-primary'
                    )}
                    style={{ width: `${Math.min((profCurrent / profLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Appointments */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Agendamentos</div>
                <div className="font-semibold text-sm">
                  {entitlements.appointmentLimit === Infinity ? 'Ilimitados' : `Até ${entitlements.appointmentLimit}/mês`}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="pt-2 border-t">
              {isNearProfessionalsLimit ? (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Próximo do limite</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Uso dentro do limite</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison Section */}
      {!isMaxPlan && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Comparar Planos</h2>
              <p className="text-muted-foreground text-sm">
                Faça upgrade para desbloquear mais recursos
              </p>
            </div>
          </div>

          <PlanCardsGrid
            currentPlanCode={displayPlanCode}
            defaultPeriod={billingCycle as BillingPeriod}
            ctaLabel="Fazer upgrade"
          />
        </div>
      )}

      {/* Max Plan Success */}
      {isMaxPlan && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Você está no plano Pro! 🎉</h3>
              <p className="text-muted-foreground">
                Aproveite todos os recursos premium do Agendali sem limitações.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
