import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, getPlanDisplayInfo } from '@/hooks/useSubscription';
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage';
import { useUserEstablishment } from '@/hooks/useUserEstablishment';
import { usePlans, formatPriceBRL } from '@/hooks/usePlans';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionStatusBadge } from '@/components/billing/SubscriptionStatusBadge';
import { UsageProgressBar } from '@/components/billing/UsageProgressBar';
import { PlanComparisonCard } from '@/components/billing/PlanComparisonCard';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  Building2, 
  ExternalLink,
  Crown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Assinatura() {
  const { user } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: establishment, isLoading: establishmentLoading } = useUserEstablishment();
  const { data: usage, isLoading: usageLoading } = useSubscriptionUsage(establishment?.id);
  const { data: plans, isLoading: plansLoading } = usePlans();

  const isLoading = subscriptionLoading || establishmentLoading || usageLoading || plansLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const currentPlanCode = subscription?.plan_code || 'basic';
  const planInfo = getPlanDisplayInfo(currentPlanCode);
  const currentPlan = plans?.find(p => p.code === currentPlanCode);

  // Calculate usage percentages
  const professionalsPercentage = usage?.max_professionals 
    ? Math.round((usage.current_professionals / usage.max_professionals) * 100)
    : 0;
  const appointmentsPercentage = usage?.max_appointments_month 
    ? Math.round((usage.current_appointments_month / usage.max_appointments_month) * 100)
    : 0;

  const isNearProfessionalsLimit = professionalsPercentage >= 80;
  const isNearAppointmentsLimit = appointmentsPercentage >= 80;
  const showUpgradeAlert = isNearProfessionalsLimit || isNearAppointmentsLimit;

  // Build features for plan comparison
  const buildPlanFeatures = (plan: typeof currentPlan) => {
    if (!plan) return [];
    return [
      {
        name: plan.max_professionals === 1 ? '1 profissional' : `Até ${plan.max_professionals} profissionais`,
        included: true,
      },
      {
        name: plan.max_appointments_month ? `${plan.max_appointments_month} agendamentos/mês` : 'Agendamentos ilimitados',
        included: true,
      },
      {
        name: 'Página de agendamento online',
        included: true,
      },
      {
        name: 'Portal do profissional',
        included: true,
      },
      {
        name: 'Múltiplos estabelecimentos',
        included: plan.allow_multi_establishments,
      },
      {
        name: 'Suporte prioritário',
        included: plan.code === 'studio',
      },
    ];
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e acompanhe seu uso</p>
      </div>

      {/* Upgrade Alert */}
      {showUpgradeAlert && currentPlanCode !== 'studio' && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Você está próximo do limite do seu plano. Considere fazer upgrade para continuar crescendo sem interrupções.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Plan Card - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Seu Plano
              </CardTitle>
              {subscription && (
                <SubscriptionStatusBadge status={subscription.status} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Info Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={planInfo.bgColor + ' ' + planInfo.color + ' text-base px-3 py-1'}>
                      {planInfo.name}
                    </Badge>
                    {currentPlanCode === 'studio' && (
                      <Badge variant="outline" className="text-xs">Premium</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subscription 
                      ? `Renovação em ${format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })}`
                      : 'Plano gratuito'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  R$ {currentPlan ? formatPriceBRL(currentPlan.price_cents) : '0,00'}
                </div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </div>
            </div>

            {/* Plan Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Profissionais</div>
                  <div className="font-semibold">
                    {currentPlan?.max_professionals === 1 ? '1' : `Até ${currentPlan?.max_professionals}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Agendamentos</div>
                  <div className="font-semibold">
                    {currentPlan?.max_appointments_month ? `${currentPlan.max_appointments_month}/mês` : 'Ilimitados'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Unidades</div>
                  <div className="font-semibold">
                    {currentPlan?.allow_multi_establishments ? 'Múltiplas' : '1 unidade'}
                  </div>
                </div>
              </div>
            </div>

            {/* Manage Button */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" asChild>
                <a href="https://dashboard.kiwify.com.br" target="_blank" rel="noopener noreferrer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Gerenciar Pagamento
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Uso Atual
            </CardTitle>
            <CardDescription>
              Acompanhe o consumo do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usage && (
              <>
                <UsageProgressBar
                  current={usage.current_professionals || 0}
                  max={usage.max_professionals}
                  label="Profissionais"
                  icon={<Users className="h-4 w-4" />}
                />
                
                <UsageProgressBar
                  current={usage.current_appointments_month || 0}
                  max={usage.max_appointments_month}
                  label="Agendamentos"
                  icon={<Calendar className="h-4 w-4" />}
                />

                {/* Quick Stats */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Restantes (Prof.)</span>
                    <span className="font-medium">
                      {usage.professionals_remaining !== null 
                        ? usage.professionals_remaining
                        : '∞'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Restantes (Agend.)</span>
                    <span className="font-medium">
                      {usage.appointments_remaining !== null 
                        ? usage.appointments_remaining
                        : '∞'}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-2">
                  {showUpgradeAlert ? (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Próximo do limite</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Uso dentro do limite</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison Section */}
      {currentPlanCode !== 'studio' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Comparar Planos</h2>
              <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans?.map((plan) => (
              <PlanComparisonCard
                key={plan.id}
                planCode={plan.code}
                planName={plan.name}
                priceCents={plan.price_cents}
                isPopular={plan.popular}
                isCurrentPlan={plan.code === currentPlanCode}
                features={buildPlanFeatures(plan)}
                userId={user?.id}
                userEmail={user?.email || undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Studio Plan Success Message */}
      {currentPlanCode === 'studio' && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Você está no plano máximo! 🎉</h3>
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
