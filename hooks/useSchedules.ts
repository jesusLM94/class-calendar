'use client';

import { useState, useEffect } from 'react';
import { schedulesAPI, utilityAPI, handleAPIError } from '@/lib/api-client';

interface Assignment {
  coachId: string;
  coachName: string;
  dayOfWeek: number;
  time: string;
  classType: string;
}

interface AvailableSlot {
  dayOfWeek: number;
  time: string;
  classType?: string | null;
}

export const useSchedules = (weekStart: string) => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load week data when weekStart changes
  useEffect(() => {
    if (weekStart) {
      loadWeekData();
    }
  }, [weekStart]);

  const loadWeekData = async () => {
    if (!weekStart) return;

    setLoading(true);
    setError(null);

    try {
      // Load available slots and generated schedule in parallel
      const [slotsData, scheduleData] = await Promise.allSettled([
        schedulesAPI.getWeekSchedules(weekStart),
        schedulesAPI.getGeneratedSchedule(weekStart),
      ]);

      if (slotsData.status === 'fulfilled') {
        setAvailableSlots(slotsData.value);
      }

      if (scheduleData.status === 'fulfilled' && scheduleData.value.schedule) {
        setGeneratedSchedule(scheduleData.value.schedule);
      } else {
        setGeneratedSchedule([]);
      }
    } catch (err) {
      setError(handleAPIError(err, 'Error al cargar datos de la semana'));
    } finally {
      setLoading(false);
    }
  };

  const setWeekSchedules = async (schedules: AvailableSlot[]) => {
    if (!weekStart) return;

    setLoading(true);
    setError(null);

    try {
      await schedulesAPI.setWeekSchedules(weekStart, schedules);
      setAvailableSlots(schedules);
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al guardar horarios disponibles');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (!weekStart) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await schedulesAPI.generateWeekSchedule(weekStart);
      setGeneratedSchedule(response.schedule);

      return {
        schedule: response.schedule,
        validation: response.validation,
      };
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al generar horario');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const updateSchedule = async (newSchedule: Assignment[]) => {
    if (!weekStart) return;

    setLoading(true);
    setError(null);

    try {
      await schedulesAPI.updateGeneratedSchedule(weekStart, newSchedule);
      setGeneratedSchedule(newSchedule);
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al actualizar horario');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get schedule organized by day and time for calendar display
  const getScheduleMatrix = (): { [key: string]: { [classType: string]: Assignment } } => {
    const matrix: { [key: string]: { [classType: string]: Assignment } } = {};

    generatedSchedule.forEach((assignment) => {
      const key = `${assignment.dayOfWeek}-${assignment.time}`;
      if (!matrix[key]) {
        matrix[key] = {};
      }
      matrix[key][assignment.classType] = assignment;
    });

    return matrix;
  };

  // Get available time slots for the week
  const getTimeSlots = (): string[] => {
    const times = new Set<string>();
    availableSlots.forEach((slot) => times.add(slot.time));
    generatedSchedule.forEach((assignment) => times.add(assignment.time));
    return Array.from(times).sort();
  };

  return {
    // Data
    availableSlots,
    generatedSchedule,

    // State
    loading,
    generating,
    error,

    // Actions
    loadWeekData,
    setWeekSchedules,
    generateSchedule,
    updateSchedule,

    // Helpers
    getScheduleMatrix,
    getTimeSlots,

    // State setters
    setError,
    setGeneratedSchedule,
  };
};

export default useSchedules;
