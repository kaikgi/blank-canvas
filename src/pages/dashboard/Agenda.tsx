import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isSameDay, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User, Ban, Filter, CalendarDays, List, Scissors, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserEstablishment } from '@/hooks/useUserEstablishment';
import { useAppointments } from '@/hooks/useAppointments';
import { useManageProfessionals } from '@/hooks/useManageProfessionals';
import { useTimeBlocks, useRecurringTimeBlocks } from '@/hooks/useTimeBlocks';
import { AppointmentDetailsDialog } from '@/components/dashboard/AppointmentDetailsDialog';
import { cn } from '@/lib/utils';
type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'no_show' | 'canceled';

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  customer: { id: string; name: string; phone: string; email: string | null } | null;
  professional: { id: string; name: string } | null;
  service: { id: string; name: string; duration_minutes: number } | null;
}

const statusColors: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  arrived: 'bg-purple-100 text-purple-800 border-purple-200',
  in_service: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  no_show: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-red-100 text-red-800 border-red-200',
  canceled_by_customer: 'bg-red-100 text-red-800 border-red-200',
  canceled_by_establishment: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels: Record<string, string> = {
  booked: 'Agendado',
  confirmed: 'Confirmado',
  arrived: 'Chegou',
  in_service: 'Em atendimento',
  completed: 'Concluído',
  no_show: 'Não compareceu',
  canceled: 'Cancelado',
  canceled_by_customer: 'Cancelado',
  canceled_by_establishment: 'Cancelado',
};

type ViewMode = 'week' | 'list';

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showBlocks, setShowBlocks] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  const { data: establishment, isLoading: estLoading, error: estError, refetch: refetchEst } = useUserEstablishment();
  const { professionals } = useManageProfessionals(establishment?.id);
  

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: appointments, isLoading, error, refetch } = useAppointments(establishment?.id, {
    startDate: weekStart,
    endDate: weekEnd,
  });

  const { blocks: timeBlocks } = useTimeBlocks(establishment?.id);
  const { blocks: recurringBlocks } = useRecurringTimeBlocks(establishment?.id);

  const handleRetry = () => {
    if (estError) refetchEst();
    else refetch();
  };

  const getFilteredAppointments = () => {
    let filtered = appointments || [];
    if (selectedProfessional !== 'all') {
      filtered = filtered.filter((apt) => apt.professional?.id === selectedProfessional);
    }
    return filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  };

  const getAppointmentsForDay = (date: Date) => {
    let filtered = appointments?.filter((apt) => isSameDay(parseISO(apt.start_at), date)) || [];
    
    if (selectedProfessional !== 'all') {
      filtered = filtered.filter((apt) => apt.professional?.id === selectedProfessional);
    }
    
    return filtered;
  };

  const getBlocksForDay = (date: Date) => {
    if (!showBlocks) {
      return { punctualBlocks: [], recurringBlocks: [] };
    }

    const dayOfWeek = getDay(date);
    
    let punctualBlocks = timeBlocks.filter((block) => 
      isSameDay(parseISO(block.start_at), date)
    );
    
    let recurring = recurringBlocks.filter((block) => 
      block.weekday === dayOfWeek && block.active
    );

    if (selectedProfessional !== 'all') {
      punctualBlocks = punctualBlocks.filter((block) => 
        block.professional_id === selectedProfessional || block.professional_id === null
      );
      recurring = recurring.filter((block) => 
        block.professional_id === selectedProfessional || block.professional_id === null
      );
    }

    return { punctualBlocks, recurringBlocks: recurring };
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDetailsOpen(true);
  };

  // Error state
  if (estError || error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Erro ao carregar agenda</p>
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Loading state for establishment
  if (estLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Visualize e gerencie seus agendamentos
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="week" aria-label="Visualização semanal" className="touch-target">
              <CalendarDays className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Visualização em lista" className="touch-target">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="touch-target"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="touch-target"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="professional-filter" className="text-sm shrink-0">Profissional:</Label>
              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger id="professional-filter" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {viewMode === 'week' && (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-blocks"
                  checked={showBlocks}
                  onCheckedChange={setShowBlocks}
                />
                <Label htmlFor="show-blocks" className="text-sm">Mostrar bloqueios</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-lg font-medium">
        {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM, yyyy", { locale: ptBR })}
      </div>

      {isLoading ? (
        viewMode === 'week' ? (
          <div className="grid gap-4 md:grid-cols-7">
            {days.map((day) => (
              <Skeleton key={day.toISOString()} className="h-64" />
            ))}
          </div>
        ) : (
          <Skeleton className="h-96" />
        )
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const { punctualBlocks, recurringBlocks: dayRecurring } = getBlocksForDay(day);
            const hasBlocks = punctualBlocks.length > 0 || dayRecurring.length > 0;
            
            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "min-h-[200px]",
                  isToday(day) && "ring-2 ring-primary"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    "text-center text-sm",
                    isToday(day) && "text-primary"
                  )}>
                    <span className="block text-xs text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-lg",
                      isToday(day) && "bg-primary text-primary-foreground rounded-full w-8 h-8 inline-flex items-center justify-center"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-2">
                  {dayRecurring.map((block) => (
                    <div
                      key={`rec-${block.id}`}
                      className="p-2 rounded-md border text-xs bg-amber-50 text-amber-800 border-amber-200"
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <Ban className="h-3 w-3" />
                        {block.start_time} - {block.end_time}
                      </div>
                      <div className="truncate mt-1">
                        {block.reason || 'Bloqueio recorrente'}
                      </div>
                      {block.professionals?.name && (
                        <div className="text-amber-600 truncate text-[10px]">
                          {block.professionals.name}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {punctualBlocks.map((block) => (
                    <div
                      key={`pnt-${block.id}`}
                      className="p-2 rounded-md border text-xs bg-orange-50 text-orange-800 border-orange-200"
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <Ban className="h-3 w-3" />
                        {format(parseISO(block.start_at), 'HH:mm')} - {format(parseISO(block.end_at), 'HH:mm')}
                      </div>
                      <div className="truncate mt-1">
                        {block.reason || 'Bloqueio'}
                      </div>
                      {block.professionals?.name && (
                        <div className="text-orange-600 truncate text-[10px]">
                          {block.professionals.name}
                        </div>
                      )}
                    </div>
                  ))}

                  {dayAppointments.length === 0 && !hasBlocks ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sem agendamentos
                    </p>
                  ) : (
                    dayAppointments.slice(0, 5).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt)}
                        className={cn(
                          "p-2 rounded-md border text-xs cursor-pointer hover:opacity-80 transition-opacity",
                          statusColors[apt.status]
                        )}
                      >
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(apt.start_at), 'HH:mm')}
                        </div>
                        <div className="truncate mt-1">
                          {apt.service?.name}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground truncate">
                          <User className="h-3 w-3" />
                          {apt.customer?.name}
                        </div>
                      </div>
                    ))
                  )}
                  {dayAppointments.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{dayAppointments.length - 5} mais
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredAppointments().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum agendamento neste período
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredAppointments().map((apt) => (
                    <TableRow 
                      key={apt.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAppointmentClick(apt)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(parseISO(apt.start_at), "dd/MM", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(apt.start_at), 'HH:mm')} - {format(parseISO(apt.end_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{apt.customer?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <span>{apt.service?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{apt.professional?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", statusColors[apt.status])}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend - only show in week view */}
      {viewMode === 'week' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusLabels).map(([key, label]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={cn("text-xs", statusColors[key])}
                >
                  {label}
                </Badge>
              ))}
              {showBlocks && (
                <>
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-800 border-amber-200"
                  >
                    Bloqueio Recorrente
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-orange-50 text-orange-800 border-orange-200"
                  >
                    Bloqueio Pontual
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
}
