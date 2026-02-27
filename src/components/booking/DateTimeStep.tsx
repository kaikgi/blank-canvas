import { useState } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimeStepProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  onSelectDate: (date: Date | undefined) => void;
  onSelectTime: (time: string) => void;
  availableSlots: string[];
  isLoadingSlots: boolean;
  maxFutureDays: number;
}

export function DateTimeStep({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  availableSlots,
  isLoadingSlots,
  maxFutureDays,
}: DateTimeStepProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxFutureDays);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Escolha a data e horário</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Data</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  onSelectDate(date);
                  setIsCalendarOpen(false);
                }}
                disabled={(date) =>
                  isBefore(date, today) || isBefore(maxDate, date)
                }
                initialFocus
                locale={ptBR}
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        </div>

        {selectedDate && (
          <div>
            <label className="text-sm font-medium mb-2 block">Horário</label>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum horário disponível nesta data.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => onSelectTime(time)}
                    className={cn(
                      'py-3 px-3 rounded-md text-sm font-medium transition-colors touch-target',
                      'border',
                      selectedTime === time
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground/50'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
