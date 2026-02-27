import { Link } from 'react-router-dom';
import { Calendar, Clock, XCircle, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useClientAppointments } from '@/hooks/useClientAppointments';

const statusLabels: Record<string, string> = {
  booked: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não compareceu',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  booked: 'outline',
  confirmed: 'default',
  completed: 'secondary',
  canceled: 'destructive',
  no_show: 'destructive',
};

export default function ClientDashboard() {
  const { data: appointments = [], isLoading } = useClientAppointments();

  // Get upcoming appointments (future, not canceled)
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.start_at) > now && apt.status !== 'canceled' && apt.status !== 'no_show'
  );
  const nextAppointment = upcomingAppointments[0];

  // Stats for current month
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthAppointments = appointments.filter((apt) => {
    const date = new Date(apt.start_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const totalThisMonth = thisMonthAppointments.filter(
    (apt) => apt.status !== 'canceled' && apt.status !== 'no_show'
  ).length;
  const canceledThisMonth = thisMonthAppointments.filter(
    (apt) => apt.status === 'canceled'
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral</h1>
          <p className="text-muted-foreground">Acompanhe seus agendamentos</p>
        </div>
        <Button asChild>
          <Link to="/client/search">
            <Plus className="h-4 w-4 mr-2" />
            Agendar Novo
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {format(now, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados Este Mês</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{canceledThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {format(now, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      <Card>
        <CardHeader>
          <CardTitle>Próximo Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                {nextAppointment.establishment.logo_url && (
                  <AvatarImage src={nextAppointment.establishment.logo_url} alt={nextAppointment.establishment.name} />
                )}
                <AvatarFallback>
                  {nextAppointment.establishment.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium truncate">{nextAppointment.establishment.name}</h3>
                  <Badge variant={statusVariants[nextAppointment.status]}>
                    {statusLabels[nextAppointment.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {nextAppointment.service.name} com {nextAppointment.professional.name}
                </p>
                <p className="text-sm font-medium">
                  {format(new Date(nextAppointment.start_at), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                {nextAppointment.establishment.address && (
                  <p className="text-xs text-muted-foreground truncate">
                    {nextAppointment.establishment.address}
                    {nextAppointment.establishment.city && `, ${nextAppointment.establishment.city}`}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" className="shrink-0 self-start" asChild>
                <Link to={`/client/appointments`}>
                  Ver Detalhes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum agendamento futuro</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Que tal agendar um serviço agora?
              </p>
              <Button asChild>
                <Link to="/client/search">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Agora
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      {appointments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimos Agendamentos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client/appointments">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    {apt.establishment.logo_url && (
                      <AvatarImage src={apt.establishment.logo_url} alt={apt.establishment.name} />
                    )}
                    <AvatarFallback>
                      {apt.establishment.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{apt.service.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {apt.establishment.name} • {apt.professional.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {format(new Date(apt.start_at), 'dd/MM/yyyy')}
                    </p>
                    <Badge variant={statusVariants[apt.status]} className="mt-1">
                      {statusLabels[apt.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
