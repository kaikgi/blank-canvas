import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, getPlanDisplayInfo } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useUserEstablishment } from '@/hooks/useUserEstablishment';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionStatusBadge } from '@/components/billing/SubscriptionStatusBadge';
import { UsageProgressBar } from '@/components/billing/UsageProgressBar';
import { PLANS } from '@/lib/hardcodedPlans';
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
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const currentPlanCode = limits?.isTrial ? 'trial' : (subscription?.plan_code || 'basico');
  const displayPlanCode = limits?.isTrial ? 'studio' : (subscription?.plan_code || 'basico');
  const planInfo = getPlanDisplayInfo(displayPlanCode);
  const currentPlan = PLANS.find(p => p.code === displayPlanCode) || PLANS[0];

  // Calculate usage percentages
  const professionalsPercentage = limits?.maxProfessionals 
    ? Math.round((limits.currentProfessionals / limits.maxProfessionals) * 100)
    : 0;
  const appointmentsPercentage = limits?.maxAppointmentsMonth 
    ? Math.round((limits.currentAppointmentsMonth / limits.maxAppointmentsMonth) * 100)
    : 0;

  const isNearProfessionalsLimit = professionalsPercentage >= 80;
  const isNearAppointmentsLimit = appointmentsPercentage >= 80;
  const showUpgradeAlert = isNearProfessionalsLimit || isNearAppointmentsLimit;

  // No longer need buildPlanFeatures - using hardcoded PLANS

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e acompanhe seu uso</p>
      </div>

      {/* Upgrade Alert */}
      {showUpgradeAlert && displayPlanCode !== 'studio' && (
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
                  R$ {currentPlan.price}
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
                  <div className="font-semibold">{currentPlan.features[0]}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Agendamentos</div>
                  <div className="font-semibold">Ilimitados</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Plano</div>
                  <div className="font-semibold">{currentPlan.name}</div>
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
            {limits && (
              <>
                <UsageProgressBar
                  current={limits.currentProfessionals}
                  max={limits.maxProfessionals}
                  label="Profissionais"
                  icon={<Users className="h-4 w-4" />}
                />
                
                <UsageProgressBar
                  current={limits.currentAppointmentsMonth}
                  max={limits.maxAppointmentsMonth}
                  label="Agendamentos"
                  icon={<Calendar className="h-4 w-4" />}
                />

                {/* Quick Stats */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Restantes (Prof.)</span>
                    <span className="font-medium">
                      {limits.professionalsRemaining}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Restantes (Agend.)</span>
                    <span className="font-medium">
                      {limits.appointmentsRemaining !== null 
                        ? limits.appointmentsRemaining
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
      {displayPlanCode !== 'studio' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Comparar Planos</h2>
              <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.code}
                className={cn(
                  "relative rounded-2xl border p-6 transition-all flex flex-col h-full",
                  plan.popular
                    ? "bg-primary text-primary-foreground border-primary shadow-strong"
                    : "bg-card border-border hover:border-foreground/20",
                  plan.code === displayPlanCode && "ring-2 ring-primary"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-foreground text-xs font-semibold whitespace-nowrap z-10">
                    Mais popular
                  </div>
                )}
                {plan.code === displayPlanCode && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold z-10">
                    {limits?.isTrial ? 'Trial ativo' : 'Plano atual'}
                  </div>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className={cn("text-sm mt-1", plan.popular ? "text-primary-foreground/80" : "text-muted-foreground")}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-sm">R$</span>
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={cn("text-sm", plan.popular ? "text-primary-foreground/80" : "text-muted-foreground")}>/mês</span>
                </div>
                <ul className="flex-1 space-y-2 mt-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4">
                  {plan.code === displayPlanCode && !limits?.isTrial ? (
                    <Button variant="outline" disabled className="w-full">Plano atual</Button>
                  ) : (
                    <Button variant={plan.popular ? "secondary" : "default"} size="lg" className="w-full" asChild>
                      <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer">
                        {limits?.isTrial ? 'Assinar' : 'Assinar'} {plan.name}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Studio Plan Success Message */}
      {displayPlanCode === 'studio' && !limits?.isTrial && (
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
