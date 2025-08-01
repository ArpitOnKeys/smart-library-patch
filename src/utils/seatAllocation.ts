import { Student } from '@/types/database';
import { studentDb } from '@/lib/database';

export interface SeatStatus {
  seatNumber: string;
  available: boolean;
  occupiedBy?: {
    studentId: string;
    studentName: string;
    shift: string;
  }[];
  blocked: boolean; // True if occupied by Full Time student
}

export interface SeatAllocationOptions {
  shift: 'Morning' | 'Evening' | 'Full Time';
  excludeStudentId?: string; // For editing existing students
}

/**
 * Gets the current seat allocation status for all seats (1-100)
 */
export const getSeatMap = (options: SeatAllocationOptions): SeatStatus[] => {
  const allStudents = studentDb.getAll();
  const seatMap: SeatStatus[] = [];

  // Initialize all seats as available
  for (let i = 1; i <= 100; i++) {
    seatMap.push({
      seatNumber: i.toString(),
      available: true,
      occupiedBy: [],
      blocked: false
    });
  }

  // Process all student seat assignments
  allStudents.forEach(student => {
    // Skip if this is the student being edited
    if (options.excludeStudentId && student.id === options.excludeStudentId) {
      return;
    }

    const seatIndex = parseInt(student.seatNumber) - 1;
    if (seatIndex >= 0 && seatIndex < 100) {
      const seat = seatMap[seatIndex];
      
      seat.occupiedBy?.push({
        studentId: student.id,
        studentName: student.name,
        shift: student.shift
      });

      // If student has Full Time shift, block the seat completely
      if (student.shift === 'Full Time') {
        seat.blocked = true;
        seat.available = false;
      }
    }
  });

  // Determine availability based on requested shift
  seatMap.forEach(seat => {
    if (seat.blocked) {
      // Seat is blocked by Full Time student
      seat.available = false;
    } else if (options.shift === 'Full Time') {
      // For Full Time requests, seat must be completely free
      seat.available = seat.occupiedBy?.length === 0;
    } else {
      // For Morning/Evening, check if that specific shift is available
      const shiftOccupied = seat.occupiedBy?.some(occupant => 
        occupant.shift === options.shift
      );
      seat.available = !shiftOccupied;
    }
  });

  return seatMap;
};

/**
 * Gets only available seat numbers for a specific shift
 */
export const getAvailableSeats = (options: SeatAllocationOptions): string[] => {
  const seatMap = getSeatMap(options);
  return seatMap
    .filter(seat => seat.available)
    .map(seat => seat.seatNumber)
    .sort((a, b) => parseInt(a) - parseInt(b));
};

/**
 * Validates if a seat is available for allocation
 */
export const isSeatAvailable = (
  seatNumber: string, 
  options: SeatAllocationOptions
): boolean => {
  const seatMap = getSeatMap(options);
  const seat = seatMap.find(s => s.seatNumber === seatNumber);
  return seat?.available || false;
};

/**
 * Gets seat allocation conflicts for display
 */
export const getSeatConflicts = (seatNumber: string): {
  hasConflict: boolean;
  conflictDetails: string[];
} => {
  const allStudents = studentDb.getAll();
  const conflicts: string[] = [];
  
  const occupyingSeat = allStudents.filter(
    student => student.seatNumber === seatNumber
  );

  occupyingSeat.forEach(student => {
    if (student.shift === 'Full Time') {
      conflicts.push(`Seat ${seatNumber} is occupied by ${student.name} (Full Time)`);
    } else {
      conflicts.push(`Seat ${seatNumber} is occupied by ${student.name} (${student.shift} shift)`);
    }
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictDetails: conflicts
  };
};

/**
 * Suggests best available seats
 */
export const suggestSeats = (
  options: SeatAllocationOptions,
  count: number = 5
): string[] => {
  const availableSeats = getAvailableSeats(options);
  return availableSeats.slice(0, count);
};