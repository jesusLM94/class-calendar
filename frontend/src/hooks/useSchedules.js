import { useState, useEffect } from "react";
import {
  schedulesAPI,
  utilityAPI,
  handleAPIError,
  formatDate,
} from "../services/api";

export const useSchedules = (weekStart) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [weeklyConfig, setWeeklyConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  // Load current week on mount
  useEffect(() => {
    const loadCurrentWeek = async () => {
      try {
        const response = await utilityAPI.getCurrentWeek();
        setCurrentWeek(response.data.weekStart);
      } catch (err) {
        console.error("Error loading current week:", err);
      }
    };

    loadCurrentWeek();
  }, []);

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
      const [slotsResponse, configResponse] = await Promise.allSettled([
        schedulesAPI.getWeekSchedules(weekStart),
        schedulesAPI.getGeneratedSchedule(weekStart),
      ]);

      if (slotsResponse.status === "fulfilled") {
        setAvailableSlots(slotsResponse.value.data);
      }

      if (configResponse.status === "fulfilled") {
        setWeeklyConfig(configResponse.value.data);
        setGeneratedSchedule(
          configResponse.value.data.generated_schedule || []
        );
      } else {
        // No generated schedule exists yet
        setGeneratedSchedule([]);
        setWeeklyConfig(null);
      }
    } catch (err) {
      setError(handleAPIError(err, "Error al cargar datos de la semana"));
    } finally {
      setLoading(false);
    }
  };

  const setWeekSchedules = async (schedules) => {
    if (!weekStart) return;

    setLoading(true);
    setError(null);

    try {
      await schedulesAPI.setWeekSchedules(weekStart, schedules);
      setAvailableSlots(schedules);
    } catch (err) {
      const errorMsg = handleAPIError(
        err,
        "Error al guardar horarios disponibles"
      );
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

      setGeneratedSchedule(response.data.schedule);
      setWeeklyConfig({
        week_start: weekStart,
        generated_schedule: response.data.schedule,
        config_data: response.data.configData || {},
      });

      return {
        schedule: response.data.schedule,
        validation: response.data.validation,
      };
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al generar horario");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const updateSchedule = async (newSchedule) => {
    if (!weekStart) return;

    setLoading(true);
    setError(null);

    try {
      await schedulesAPI.updateGeneratedSchedule(weekStart, newSchedule);
      setGeneratedSchedule(newSchedule);

      // Update weekly config
      setWeeklyConfig((prev) => ({
        ...prev,
        generated_schedule: newSchedule,
        last_modified: new Date().toISOString(),
      }));
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al actualizar horario");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const moveClassAssignment = (fromDay, fromTime, toDay, toTime) => {
    const newSchedule = [...generatedSchedule];

    // Find the assignment to move
    const assignmentIndex = newSchedule.findIndex(
      (assignment) =>
        assignment.dayOfWeek === fromDay && assignment.time === fromTime
    );

    if (assignmentIndex === -1) return generatedSchedule; // Assignment not found

    // Check if target slot is available
    const targetExists = newSchedule.some(
      (assignment) =>
        assignment.dayOfWeek === toDay &&
        assignment.time === toTime &&
        assignment.classType === newSchedule[assignmentIndex].classType
    );

    if (targetExists) {
      // Swap assignments
      const targetIndex = newSchedule.findIndex(
        (assignment) =>
          assignment.dayOfWeek === toDay &&
          assignment.time === toTime &&
          assignment.classType === newSchedule[assignmentIndex].classType
      );

      const temp = { ...newSchedule[assignmentIndex] };
      newSchedule[assignmentIndex] = {
        ...newSchedule[targetIndex],
        dayOfWeek: fromDay,
        time: fromTime,
      };
      newSchedule[targetIndex] = {
        ...temp,
        dayOfWeek: toDay,
        time: toTime,
      };
    } else {
      // Move to empty slot
      newSchedule[assignmentIndex] = {
        ...newSchedule[assignmentIndex],
        dayOfWeek: toDay,
        time: toTime,
      };
    }

    return newSchedule;
  };

  const removeClassAssignment = (dayOfWeek, time, classType) => {
    const newSchedule = generatedSchedule.filter(
      (assignment) =>
        !(
          assignment.dayOfWeek === dayOfWeek &&
          assignment.time === time &&
          assignment.classType === classType
        )
    );
    return newSchedule;
  };

  const addClassAssignment = (
    dayOfWeek,
    time,
    coachId,
    coachName,
    classType
  ) => {
    const newAssignment = {
      coachId,
      coachName,
      dayOfWeek,
      time,
      classType,
    };

    const newSchedule = [...generatedSchedule, newAssignment];
    return newSchedule;
  };

  // Get schedule organized by day and time for calendar display
  const getScheduleMatrix = () => {
    const matrix = {};

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
  const getTimeSlots = () => {
    const times = new Set();
    availableSlots.forEach((slot) => times.add(slot.time));
    return Array.from(times).sort();
  };

  return {
    // Data
    availableSlots,
    generatedSchedule,
    weeklyConfig,
    currentWeek,

    // State
    loading,
    generating,
    error,

    // Actions
    loadWeekData,
    setWeekSchedules,
    generateSchedule,
    updateSchedule,

    // Schedule manipulation
    moveClassAssignment,
    removeClassAssignment,
    addClassAssignment,

    // Helpers
    getScheduleMatrix,
    getTimeSlots,

    // State setters
    setError,
    setGeneratedSchedule,
  };
};

export default useSchedules;
