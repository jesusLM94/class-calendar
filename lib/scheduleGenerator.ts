import { getAllCoaches, Coach, Restriction } from './db/coaches';
import { AvailableSlot, Assignment } from './db/schedules';
import { getScheduleHistory, HistoryAssignment } from './db/history';

interface DailyAssignments {
  [coachId: string]: {
    [dayOfWeek: number]: number;
  };
}

interface WeeklyAssignments {
  [coachId: string]: {
    power: number;
    cycling: number;
  };
}

interface RotationScores {
  [coachId: string]: {
    [scoreKey: string]: number;
  };
}

interface CoachScore {
  coach: Coach;
  score: number;
}

export class ScheduleGenerator {
  /**
   * Genera un horario completo para una semana
   */
  async generateWeekSchedule(
    weekStart: string,
    availableSlots: AvailableSlot[]
  ): Promise<Assignment[]> {
    const data = await this.getGenerationData(weekStart);
    const { coaches, history } = data;

    const schedule = this.createOptimalSchedule(
      weekStart,
      availableSlots,
      coaches,
      history
    );

    return schedule;
  }

  /**
   * Obtiene todos los datos necesarios para la generación
   */
  private async getGenerationData(weekStart: string): Promise<{
    coaches: Coach[];
    history: HistoryAssignment[];
  }> {
    const [coaches, history] = await Promise.all([
      getAllCoaches(),
      getScheduleHistory(6),
    ]);

    return { coaches, history };
  }

  /**
   * Crea el horario óptimo con rotación inteligente
   */
  private createOptimalSchedule(
    weekStart: string,
    availableSlots: AvailableSlot[],
    coaches: Coach[],
    history: HistoryAssignment[]
  ): Assignment[] {
    const schedule: Assignment[] = [];
    const dailyAssignments: DailyAssignments = {};
    const weeklyAssignments: WeeklyAssignments = {};

    // Inicializar contadores diarios y semanales para cada coach
    coaches.forEach((coach) => {
      const coachId = coach._id?.toString() || '';
      dailyAssignments[coachId] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
      weeklyAssignments[coachId] = { power: 0, cycling: 0 };
    });

    // Calcular scores de rotación basado en historial
    const rotationScores = this.calculateRotationScores(coaches, history, availableSlots);

    // Agrupar slots por día y hora para manejar simultaneidad
    const slotsByTime = this.groupSlotsByTime(availableSlots);

    // Procesar cada slot de tiempo
    Object.keys(slotsByTime).forEach((timeKey) => {
      const simultaneousSlots = slotsByTime[timeKey];
      const timeAssignments = this.assignCoachesToTimeSlot(
        simultaneousSlots,
        coaches,
        rotationScores,
        dailyAssignments,
        weeklyAssignments
      );

      timeAssignments.forEach((assignment) => {
        if (assignment.coachId) {
          schedule.push(assignment);

          // Actualizar contadores diarios
          dailyAssignments[assignment.coachId][assignment.dayOfWeek]++;

          // Actualizar contadores semanales por tipo de clase
          if (assignment.classType === 'power' || assignment.classType === 'cycling') {
            weeklyAssignments[assignment.coachId][assignment.classType]++;
          }

          // Actualizar scores de rotación
          const scoreKey = `${assignment.dayOfWeek}-${assignment.time}-${assignment.classType}`;
          if (rotationScores[assignment.coachId]) {
            rotationScores[assignment.coachId][scoreKey] =
              (rotationScores[assignment.coachId][scoreKey] || 0) + 1;
          }
        }
      });
    });

    return schedule;
  }

  /**
   * Agrupa slots por día y hora para manejar simultaneidad
   */
  private groupSlotsByTime(availableSlots: AvailableSlot[]): {
    [key: string]: AvailableSlot[];
  } {
    const grouped: { [key: string]: AvailableSlot[] } = {};

    availableSlots.forEach((slot) => {
      const key = `${slot.dayOfWeek}-${slot.time}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(slot);
    });

    return grouped;
  }

  /**
   * Asigna coaches a un slot de tiempo específico (maneja simultaneidad)
   */
  private assignCoachesToTimeSlot(
    simultaneousSlots: AvailableSlot[],
    coaches: Coach[],
    rotationScores: RotationScores,
    dailyAssignments: DailyAssignments,
    weeklyAssignments: WeeklyAssignments
  ): Assignment[] {
    const assignments: Assignment[] = [];
    const usedCoaches = new Set<string>();

    // Separar slots por tipo
    const powerSlots = simultaneousSlots.filter(
      (s) => !s.classType || s.classType === 'power'
    );
    const cyclingSlots = simultaneousSlots.filter(
      (s) => !s.classType || s.classType === 'cycling'
    );

    // Asignar Power (solo uno por horario)
    if (powerSlots.length > 0) {
      const powerSlot = powerSlots[0];
      const powerCoach = this.selectBestCoach(
        powerSlot,
        'power',
        coaches,
        rotationScores,
        dailyAssignments,
        weeklyAssignments,
        usedCoaches
      );

      if (powerCoach) {
        const coachId = powerCoach._id?.toString() || '';
        assignments.push({
          coachId,
          coachName: powerCoach.name,
          dayOfWeek: powerSlot.dayOfWeek,
          time: powerSlot.time,
          classType: 'power',
        });
        usedCoaches.add(coachId);
      }
    }

    // Asignar Cycling
    if (cyclingSlots.length > 0) {
      const cyclingSlot = cyclingSlots[0];
      const cyclingCoach = this.selectBestCoach(
        cyclingSlot,
        'cycling',
        coaches,
        rotationScores,
        dailyAssignments,
        weeklyAssignments,
        usedCoaches
      );

      if (cyclingCoach) {
        const coachId = cyclingCoach._id?.toString() || '';
        assignments.push({
          coachId,
          coachName: cyclingCoach.name,
          dayOfWeek: cyclingSlot.dayOfWeek,
          time: cyclingSlot.time,
          classType: 'cycling',
        });
        usedCoaches.add(coachId);
      }
    }

    return assignments;
  }

  /**
   * Selecciona el mejor coach para un slot específico
   */
  private selectBestCoach(
    slot: AvailableSlot,
    classType: string,
    coaches: Coach[],
    rotationScores: RotationScores,
    dailyAssignments: DailyAssignments,
    weeklyAssignments: WeeklyAssignments,
    usedCoaches: Set<string>
  ): Coach | null {
    // Filtrar coaches elegibles
    const eligibleCoaches = coaches.filter((coach) => {
      const coachId = coach._id?.toString() || '';

      // Check if coach teaches this class type
      if (!coach.specialties.includes(classType)) return false;

      // Check if coach is already used in this time slot
      if (usedCoaches.has(coachId)) return false;

      // Check daily limit (max 2 classes per day)
      if (dailyAssignments[coachId][slot.dayOfWeek] >= 2) return false;

      // Check restrictions
      const coachRestrictions = coach.restrictions || [];
      const hasRestriction = coachRestrictions.some((restriction) => {
        if (restriction.type === 'day') {
          const dayName = this.getDayName(slot.dayOfWeek);
          return restriction.value.toLowerCase() === dayName.toLowerCase();
        }
        if (restriction.type === 'time') {
          return restriction.value === slot.time;
        }
        if (restriction.type === 'day_time') {
          // Format: "miércoles-19:00"
          const [restrictedDay, restrictedTime] = restriction.value.split('-');
          const dayName = this.getDayName(slot.dayOfWeek);
          return (
            restrictedDay.toLowerCase() === dayName.toLowerCase() &&
            restrictedTime === slot.time
          );
        }
        return false;
      });

      if (hasRestriction) return false;

      return true;
    });

    if (eligibleCoaches.length === 0) return null;

    // Calcular score para cada coach elegible
    const coachScores: CoachScore[] = eligibleCoaches.map((coach) => {
      const coachId = coach._id?.toString() || '';
      const scoreKey = `${slot.dayOfWeek}-${slot.time}-${classType}`;
      const rotationScore = rotationScores[coachId]
        ? rotationScores[coachId][scoreKey] || 0
        : 0;

      // Score más bajo = mejor (menos veces asignado recientemente)
      const totalDailyClasses = Object.values(dailyAssignments[coachId]).reduce(
        (a, b) => a + b,
        0
      );

      // Base score: rotation history + total workload
      let score = rotationScore * 10 + totalDailyClasses;

      // Quota consideration (soft target)
      const quota = coach.weeklyQuotas?.[classType as 'power' | 'cycling'];
      if (quota && quota > 0) {
        const currentCount = weeklyAssignments[coachId][classType as 'power' | 'cycling'];

        // If coach is under quota, give them preference (lower score)
        if (currentCount < quota) {
          score -= 5; // Bonus for being under quota
        }
        // If at or over quota, no bonus (maintains base score)
      }

      return {
        coach,
        score,
      };
    });

    // Ordenar por score y seleccionar el mejor
    coachScores.sort((a, b) => a.score - b.score);

    // Añadir algo de aleatoriedad entre los mejores candidatos
    const topCandidates = coachScores.filter((c) => c.score === coachScores[0].score);
    const selectedIndex = Math.floor(Math.random() * topCandidates.length);

    return topCandidates[selectedIndex].coach;
  }

  /**
   * Calcula scores de rotación basado en el historial
   */
  private calculateRotationScores(
    coaches: Coach[],
    history: HistoryAssignment[],
    availableSlots: AvailableSlot[]
  ): RotationScores {
    const scores: RotationScores = {};

    // Inicializar scores
    coaches.forEach((coach) => {
      const coachId = coach._id?.toString() || '';
      scores[coachId] = {};
    });

    // Calcular scores basado en historial (últimas 6 semanas)
    history.forEach((assignment) => {
      const coachId = assignment.coachId;
      const scoreKey = `${assignment.dayOfWeek}-${assignment.time}-${assignment.classType}`;
      if (scores[coachId]) {
        scores[coachId][scoreKey] = (scores[coachId][scoreKey] || 0) + 1;
      }
    });

    return scores;
  }

  /**
   * Convierte número de día a nombre
   */
  private getDayName(dayNumber: number): string {
    const days = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    return days[dayNumber] || '';
  }

  /**
   * Calcula estadísticas de cuotas para el horario
   */
  calculateQuotaStats(
    schedule: Assignment[],
    coaches: Coach[]
  ): Array<{
    coachId: string;
    coachName: string;
    power: { target: number; actual: number; status: 'under' | 'met' | 'over' };
    cycling: { target: number; actual: number; status: 'under' | 'met' | 'over' };
  }> {
    const stats: Array<{
      coachId: string;
      coachName: string;
      power: { target: number; actual: number; status: 'under' | 'met' | 'over' };
      cycling: { target: number; actual: number; status: 'under' | 'met' | 'over' };
    }> = [];

    coaches.forEach((coach) => {
      const coachId = coach._id?.toString() || '';
      const coachAssignments = schedule.filter((a) => a.coachId === coachId);

      const powerCount = coachAssignments.filter((a) => a.classType === 'power').length;
      const cyclingCount = coachAssignments.filter((a) => a.classType === 'cycling').length;

      const powerQuota = coach.weeklyQuotas?.power || 0;
      const cyclingQuota = coach.weeklyQuotas?.cycling || 0;

      // Only include coaches with quotas or assignments
      if (powerQuota > 0 || cyclingQuota > 0 || powerCount > 0 || cyclingCount > 0) {
        stats.push({
          coachId,
          coachName: coach.name,
          power: {
            target: powerQuota,
            actual: powerCount,
            status: powerQuota === 0 ? 'met' : powerCount < powerQuota ? 'under' : powerCount === powerQuota ? 'met' : 'over',
          },
          cycling: {
            target: cyclingQuota,
            actual: cyclingCount,
            status: cyclingQuota === 0 ? 'met' : cyclingCount < cyclingQuota ? 'under' : cyclingCount === cyclingQuota ? 'met' : 'over',
          },
        });
      }
    });

    return stats;
  }

  /**
   * Valida que el horario generado cumple todas las restricciones
   */
  validateSchedule(schedule: Assignment[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const dailyCounts: { [coachId: string]: { [day: number]: number } } = {};
    const timeSlotCounts: { [timeKey: string]: { power: number; cycling: number } } = {};

    schedule.forEach((assignment) => {
      const coachId = assignment.coachId;
      const day = assignment.dayOfWeek;
      const timeKey = `${day}-${assignment.time}`;
      const classType = assignment.classType;

      // Contar clases por coach por día
      if (!dailyCounts[coachId]) dailyCounts[coachId] = {};
      dailyCounts[coachId][day] = (dailyCounts[coachId][day] || 0) + 1;

      // Contar clases por horario y tipo
      if (!timeSlotCounts[timeKey]) timeSlotCounts[timeKey] = { power: 0, cycling: 0 };
      if (classType === 'power' || classType === 'cycling') {
        timeSlotCounts[timeKey][classType]++;
      }
    });

    // Validar máximo 2 clases por día por coach
    Object.keys(dailyCounts).forEach((coachId) => {
      Object.keys(dailyCounts[coachId]).forEach((day) => {
        const dayNum = parseInt(day);
        if (dailyCounts[coachId][dayNum] > 2) {
          errors.push(
            `Coach ${coachId} has ${dailyCounts[coachId][dayNum]} classes on day ${day} (max 2)`
          );
        }
      });
    });

    // Validar no más de 1 Power por horario
    Object.keys(timeSlotCounts).forEach((timeKey) => {
      if (timeSlotCounts[timeKey].power > 1) {
        errors.push(`Multiple Power classes at ${timeKey}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ScheduleGenerator;
