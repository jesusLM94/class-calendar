class ScheduleGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Genera un horario completo para una semana
   * @param {string} weekStart - Fecha de inicio de semana (YYYY-MM-DD)
   * @param {Array} availableSlots - Horarios disponibles para la semana
   * @returns {Promise} - Horario generado
   */
  async generateWeekSchedule(weekStart, availableSlots) {
    return new Promise((resolve, reject) => {
      this.getGenerationData(weekStart, (err, data) => {
        if (err) return reject(err);

        const { coaches, restrictions, history } = data;

        try {
          const schedule = this.createOptimalSchedule(
            weekStart,
            availableSlots,
            coaches,
            restrictions,
            history
          );
          resolve(schedule);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Obtiene todos los datos necesarios para la generación
   */
  getGenerationData(weekStart, callback) {
    let coaches, restrictions, history;
    let completed = 0;
    let hasError = false;

    const checkComplete = () => {
      completed++;
      if (completed === 3 && !hasError) {
        callback(null, { coaches, restrictions, history });
      }
    };

    const handleError = (err) => {
      if (!hasError) {
        hasError = true;
        callback(err);
      }
    };

    // Obtener coaches
    this.db.getCoaches((err, result) => {
      if (err) return handleError(err);
      coaches = result;
      checkComplete();
    });

    // Obtener restricciones
    this.db.getCoachRestrictions(null, (err, result) => {
      if (err) return handleError(err);
      restrictions = this.groupRestrictionsByCoach(result);
      checkComplete();
    });

    // Obtener historial
    this.db.getScheduleHistory(6, (err, result) => {
      if (err) return handleError(err);
      history = result;
      checkComplete();
    });
  }

  /**
   * Agrupa restricciones por coach ID
   */
  groupRestrictionsByCoach(restrictions) {
    const grouped = {};
    restrictions.forEach((restriction) => {
      if (!grouped[restriction.coach_id]) {
        grouped[restriction.coach_id] = [];
      }
      grouped[restriction.coach_id].push(restriction);
    });
    return grouped;
  }

  /**
   * Crea el horario óptimo con rotación inteligente
   */
  createOptimalSchedule(
    weekStart,
    availableSlots,
    coaches,
    restrictions,
    history
  ) {
    const schedule = [];
    const assignments = {};
    const dailyAssignments = {}; // Track daily assignments per coach

    // Inicializar contadores diarios para cada coach
    coaches.forEach((coach) => {
      dailyAssignments[coach.id] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    });

    // Calcular scores de rotación basado en historial
    const rotationScores = this.calculateRotationScores(
      coaches,
      history,
      availableSlots
    );

    // Agrupar slots por día y hora para manejar simultaneidad
    const slotsByTime = this.groupSlotsByTime(availableSlots);

    // Procesar cada slot de tiempo
    Object.keys(slotsByTime).forEach((timeKey) => {
      const simultaneousSlots = slotsByTime[timeKey];
      const timeAssignments = this.assignCoachesToTimeSlot(
        simultaneousSlots,
        coaches,
        restrictions,
        rotationScores,
        dailyAssignments
      );

      timeAssignments.forEach((assignment) => {
        if (assignment.coachId) {
          schedule.push(assignment);

          // Actualizar contadores diarios
          dailyAssignments[assignment.coachId][assignment.dayOfWeek]++;

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
  groupSlotsByTime(availableSlots) {
    const grouped = {};

    availableSlots.forEach((slot) => {
      const key = `${slot.day_of_week}-${slot.time}`;
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
  assignCoachesToTimeSlot(
    simultaneousSlots,
    coaches,
    restrictions,
    rotationScores,
    dailyAssignments
  ) {
    const assignments = [];
    const usedCoaches = new Set();

    // Separar slots por tipo
    const powerSlots = simultaneousSlots.filter(
      (s) => !s.class_type || s.class_type === "power"
    );
    const cyclingSlots = simultaneousSlots.filter(
      (s) => !s.class_type || s.class_type === "cycling"
    );

    // Asignar Power (solo uno por horario)
    if (powerSlots.length > 0) {
      const powerSlot = powerSlots[0];
      const powerCoach = this.selectBestCoach(
        powerSlot,
        "power",
        coaches,
        restrictions,
        rotationScores,
        dailyAssignments,
        usedCoaches
      );

      if (powerCoach) {
        assignments.push({
          coachId: powerCoach.id,
          coachName: powerCoach.name,
          dayOfWeek: powerSlot.day_of_week,
          time: powerSlot.time,
          classType: "power",
        });
        usedCoaches.add(powerCoach.id);
      }
    }

    // Asignar Cycling
    if (cyclingSlots.length > 0) {
      const cyclingSlot = cyclingSlots[0];
      const cyclingCoach = this.selectBestCoach(
        cyclingSlot,
        "cycling",
        coaches,
        restrictions,
        rotationScores,
        dailyAssignments,
        usedCoaches
      );

      if (cyclingCoach) {
        assignments.push({
          coachId: cyclingCoach.id,
          coachName: cyclingCoach.name,
          dayOfWeek: cyclingSlot.day_of_week,
          time: cyclingSlot.time,
          classType: "cycling",
        });
        usedCoaches.add(cyclingCoach.id);
      }
    }

    return assignments;
  }

  /**
   * Selecciona el mejor coach para un slot específico
   */
  selectBestCoach(
    slot,
    classType,
    coaches,
    restrictions,
    rotationScores,
    dailyAssignments,
    usedCoaches
  ) {
    // Filtrar coaches elegibles
    const eligibleCoaches = coaches.filter((coach) => {
      // Check if coach teaches this class type
      if (!coach.specialties.includes(classType)) return false;

      // Check if coach is already used in this time slot
      if (usedCoaches.has(coach.id)) return false;

      // Check daily limit (max 2 classes per day)
      if (dailyAssignments[coach.id][slot.day_of_week] >= 2) return false;

      // Check restrictions
      const coachRestrictions = restrictions[coach.id] || [];
      const hasRestriction = coachRestrictions.some((restriction) => {
        if (restriction.restriction_type === "day") {
          const dayName = this.getDayName(slot.day_of_week);
          return (
            restriction.restriction_value.toLowerCase() ===
            dayName.toLowerCase()
          );
        }
        if (restriction.restriction_type === "time") {
          return restriction.restriction_value === slot.time;
        }
        return false;
      });

      if (hasRestriction) return false;

      return true;
    });

    if (eligibleCoaches.length === 0) return null;

    // Calcular score para cada coach elegible
    const coachScores = eligibleCoaches.map((coach) => {
      const scoreKey = `${slot.day_of_week}-${slot.time}-${classType}`;
      const rotationScore = rotationScores[coach.id]
        ? rotationScores[coach.id][scoreKey] || 0
        : 0;

      // Score más bajo = mejor (menos veces asignado recientemente)
      const totalDailyClasses = Object.values(
        dailyAssignments[coach.id]
      ).reduce((a, b) => a + b, 0);

      return {
        coach,
        score: rotationScore * 10 + totalDailyClasses, // Priorizar rotación sobre carga total
      };
    });

    // Ordenar por score y seleccionar el mejor
    coachScores.sort((a, b) => a.score - b.score);

    // Añadir algo de aleatoriedadentre los mejores candidatos
    const topCandidates = coachScores.filter(
      (c) => c.score === coachScores[0].score
    );
    const selectedIndex = Math.floor(Math.random() * topCandidates.length);

    return topCandidates[selectedIndex].coach;
  }

  /**
   * Calcula scores de rotación basado en el historial
   */
  calculateRotationScores(coaches, history, availableSlots) {
    const scores = {};

    // Inicializar scores
    coaches.forEach((coach) => {
      scores[coach.id] = {};
    });

    // Calcular scores basado en historial (últimas 6 semanas)
    history.forEach((assignment) => {
      const scoreKey = `${assignment.day_of_week}-${assignment.time}-${assignment.class_type}`;
      if (scores[assignment.coach_id]) {
        scores[assignment.coach_id][scoreKey] =
          (scores[assignment.coach_id][scoreKey] || 0) + 1;
      }
    });

    return scores;
  }

  /**
   * Convierte número de día a nombre
   */
  getDayName(dayNumber) {
    const days = [
      "",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ];
    return days[dayNumber] || "";
  }

  /**
   * Valida que el horario generado cumple todas las restricciones
   */
  validateSchedule(schedule) {
    const errors = [];
    const dailyCounts = {};
    const timeSlotCounts = {};

    schedule.forEach((assignment) => {
      const coachId = assignment.coachId;
      const day = assignment.dayOfWeek;
      const timeKey = `${day}-${assignment.time}`;
      const classType = assignment.classType;

      // Contar clases por coach por día
      if (!dailyCounts[coachId]) dailyCounts[coachId] = {};
      dailyCounts[coachId][day] = (dailyCounts[coachId][day] || 0) + 1;

      // Contar clases por horario y tipo
      if (!timeSlotCounts[timeKey])
        timeSlotCounts[timeKey] = { power: 0, cycling: 0 };
      timeSlotCounts[timeKey][classType]++;
    });

    // Validar máximo 2 clases por día por coach
    Object.keys(dailyCounts).forEach((coachId) => {
      Object.keys(dailyCounts[coachId]).forEach((day) => {
        if (dailyCounts[coachId][day] > 2) {
          errors.push(
            `Coach ${coachId} has ${dailyCounts[coachId][day]} classes on day ${day} (max 2)`
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

module.exports = ScheduleGenerator;
