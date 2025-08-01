import React, { useState, useEffect } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  getAvailableSeats, 
  getSeatConflicts, 
  suggestSeats,
  SeatAllocationOptions 
} from '@/utils/seatAllocation';
import { UseFormReturn } from 'react-hook-form';

interface SeatSelectorProps {
  form: UseFormReturn<any>;
  selectedShift: 'Morning' | 'Evening' | 'Full Time' | '';
  excludeStudentId?: string;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({ 
  form, 
  selectedShift,
  excludeStudentId 
}) => {
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [suggestedSeats, setSuggestedSeats] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<{ hasConflict: boolean; conflictDetails: string[] }>({
    hasConflict: false,
    conflictDetails: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const selectedSeat = form.watch('seatNumber');

  // Update available seats when shift changes
  useEffect(() => {
    if (selectedShift) {
      refreshSeatData();
    } else {
      setAvailableSeats([]);
      setSuggestedSeats([]);
      setConflicts({ hasConflict: false, conflictDetails: [] });
    }
  }, [selectedShift, excludeStudentId]);

  // Check conflicts when seat selection changes
  useEffect(() => {
    if (selectedSeat) {
      const conflictData = getSeatConflicts(selectedSeat);
      setConflicts(conflictData);
    } else {
      setConflicts({ hasConflict: false, conflictDetails: [] });
    }
  }, [selectedSeat]);

  const refreshSeatData = () => {
    if (!selectedShift) return;
    
    setIsLoading(true);
    const options: SeatAllocationOptions = {
      shift: selectedShift as 'Morning' | 'Evening' | 'Full Time',
      excludeStudentId
    };

    const available = getAvailableSeats(options);
    const suggested = suggestSeats(options, 5);
    
    setAvailableSeats(available);
    setSuggestedSeats(suggested);
    setIsLoading(false);
  };

  const handleSuggestionClick = (seatNumber: string) => {
    form.setValue('seatNumber', seatNumber);
  };

  const getShiftInfo = () => {
    switch (selectedShift) {
      case 'Morning':
        return 'Seat available for Morning shift only';
      case 'Evening':
        return 'Seat available for Evening shift only';
      case 'Full Time':
        return 'Seat will be reserved for both Morning and Evening shifts';
      default:
        return 'Please select a shift first';
    }
  };

  return (
    <FormField
      control={form.control}
      name="seatNumber"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium">Select Seat</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshSeatData}
              disabled={!selectedShift || isLoading}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Shift Info */}
          {selectedShift && (
            <div className="text-xs text-muted-foreground mb-2">
              {getShiftInfo()}
            </div>
          )}

          <FormControl>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedShift || availableSeats.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedShift 
                    ? "Select shift first" 
                    : availableSeats.length === 0 
                    ? "No seats available" 
                    : "Choose available seat"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableSeats.map((seatNumber) => (
                  <SelectItem key={seatNumber} value={seatNumber}>
                    <div className="flex items-center justify-between w-full">
                      <span>Seat {seatNumber}</span>
                      <CheckCircle className="h-3 w-3 text-green-500 ml-2" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>

          {/* Seat Suggestions */}
          {selectedShift && suggestedSeats.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Suggested seats:</div>
              <div className="flex flex-wrap gap-1">
                {suggestedSeats.map((seatNumber) => (
                  <Badge
                    key={seatNumber}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleSuggestionClick(seatNumber)}
                  >
                    {seatNumber}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {conflicts.hasConflict && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="font-medium mb-1">Seat Conflict Detected:</div>
                {conflicts.conflictDetails.map((detail, index) => (
                  <div key={index} className="text-xs">{detail}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Availability Status */}
          {selectedShift && (
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Available seats: </span>
              <span className={availableSeats.length > 0 ? "text-green-600" : "text-red-600"}>
                {availableSeats.length} / 100
              </span>
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};