import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, List, Grid3X3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientAppointments, useClientAppointmentsByMonth, type ClientAppointment } from '@/hooks/useClientAppointments';
import { ClientAppointmentDialog } from '@/components/client/ClientAppointmentDialog';

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

type ViewMode = 'list' | 'week' | 'month';

export default function ClientAppointments() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointment | null>(null);

  const { data: allAppointments = [], isLoading } = useClientAppointments({
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  const { data: monthAppointments = [], isLoading: isLoadingMonth } = useClientAppointmentsByMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Filter appointments for week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekAppointments = allAppointments.filter((apt) => {
    const date = new Date(apt.start_at);
    return date >= weekStart && date <= weekEnd;
  });

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Generate month calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const getAppointmentsForDay = (date: Date) => {
    return monthAppointments.filter((apt) => 
      isSameDay(new Date(apt.start_at), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(addDays(currentDate, direction === 'prev' ? -7 : 7));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground">Visualize e gerencie seus agendamentos</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="booked">Agendados</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Mês
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          {allAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== 'all' ? 'Tente alterar os filtros' : 'Você ainda não possui agendamentos'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allAppointments.map((apt) => (
                <Card 
                  key={apt.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedAppointment(apt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {apt.establishment.logo_url && (
                          <AvatarImage src={apt.establishment.logo_url} alt={apt.establishment.name} />
                        )}
                        <AvatarFallback>
                          {apt.establishment.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{apt.service.name}</h3>
                          <Badge variant={statusVariants[apt.status]}>
                            {statusLabels[apt.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {apt.establishment.name} • {apt.professional.name}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {format(new Date(apt.start_at), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayAppointments = weekAppointments.filter((apt) =>
                isSameDay(new Date(apt.start_at), day)
              );
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toISOString()} className="min-h-[120px]">
                  <div className={`text-center py-2 rounded-t-md ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-xs font-medium">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className="text-lg font-bold">{format(day, 'd')}</p>
                  </div>
                  <div className="border border-t-0 rounded-b-md p-1 space-y-1 min-h-[80px]">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs p-1 rounded bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => setSelectedAppointment(apt)}
                      >
                        <p className="font-medium truncate">{format(new Date(apt.start_at), 'HH:mm')}</p>
                        <p className="truncate text-muted-foreground">{apt.service.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoadingMonth ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-7 bg-muted">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="py-2 text-center text-sm font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] border-t border-l p-1 ${
                        !isCurrentMonth ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className={`text-right mb-1 ${
                        isToday 
                          ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center ml-auto text-sm font-bold' 
                          : 'text-sm'
                      } ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <div
                            key={apt.id}
                            className="text-xs p-1 rounded bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors truncate"
                            onClick={() => setSelectedAppointment(apt)}
                          >
                            {format(new Date(apt.start_at), 'HH:mm')} {apt.service.name}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Details Dialog */}
      <ClientAppointmentDialog
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      />
    </div>
  );
}
