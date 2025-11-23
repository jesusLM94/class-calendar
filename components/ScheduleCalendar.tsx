'use client';

import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCenter, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getShortDayName } from '@/lib/utils';
import ClassBlock from './ClassBlock';
import DroppableTimeSlot from './DroppableTimeSlot';

interface Assignment {
  coachId: string;
  coachName: string;
  dayOfWeek: number;
  time: string;
  classType: string;
}

interface Coach {
  id: string;
  name: string;
  specialties: string[];
  weeklyQuotas?: {
    power?: number;
    cycling?: number;
  };
}

interface ScheduleMatrix {
  [key: string]: {
    [classType: string]: Assignment;
  };
}

interface ScheduleCalendarProps {
  currentWeek: string;
  weekDates: Date[];
  scheduleMatrix: ScheduleMatrix;
  timeSlots: string[];
  coaches: Coach[];
  loading: boolean;
  onScheduleUpdate: (schedule: Assignment[]) => void;
}

interface DraggedItem extends Assignment {
  originalSlot: string;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  currentWeek,
  weekDates,
  scheduleMatrix,
  timeSlots,
  coaches,
  loading,
  onScheduleUpdate,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event;
    setActiveId(active.id as string);

    // Parse the dragged item info from the ID
    const [dayOfWeek, time, classType] = (active.id as string).split('-');
    const assignment = scheduleMatrix[`${dayOfWeek}-${time}`]?.[classType];

    if (assignment) {
      setDraggedItem({
        ...assignment,
        originalSlot: `${dayOfWeek}-${time}-${classType}`,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      // Parse source and target
      const [sourceDayOfWeek, sourceTime, sourceClassType] = activeId.split('-');
      const [targetDayOfWeek, targetTime, targetClassType] = overId.split('-');

      // Get current schedule from scheduleMatrix
      const currentSchedule: Assignment[] = [];
      Object.keys(scheduleMatrix).forEach((key) => {
        const [day, time] = key.split('-');
        Object.values(scheduleMatrix[key]).forEach((assignment) => {
          currentSchedule.push({
            ...assignment,
            dayOfWeek: parseInt(day),
            time: time,
          });
        });
      });

      // Create new schedule with the moved assignment
      const newSchedule = currentSchedule.map((assignment) => {
        if (
          assignment.dayOfWeek === parseInt(sourceDayOfWeek) &&
          assignment.time === sourceTime &&
          assignment.classType === sourceClassType
        ) {
          // This is the moved assignment
          return {
            ...assignment,
            dayOfWeek: parseInt(targetDayOfWeek),
            time: targetTime,
          };
        }
        return assignment;
      });

      onScheduleUpdate(newSchedule);
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const handleDragCancel = (): void => {
    setActiveId(null);
    setDraggedItem(null);
  };

  // Create droppable items for DndContext
  const droppableIds: string[] = [];
  timeSlots.forEach((time) => {
    [1, 2, 3, 4, 5, 6, 7].forEach((day) => {
      ['power', 'cycling'].forEach((classType) => {
        droppableIds.push(`${day}-${time}-${classType}`);
      });
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nova-gold"></div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay horarios configurados
        </h3>
        <p className="text-gray-600">
          Ve a la sección &quot;Configuración&quot; para agregar horarios disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Calendario de Clases</h2>
        <p className="text-gray-600">Arrastra y suelta las clases para reorganizar el horario</p>
      </div>

      {/* Calendar */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="nova-card overflow-hidden">
          <div className="calendar-grid">
            {/* Header Row */}
            <div className="time-label">
              <span className="text-sm font-medium">Horario</span>
            </div>
            {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
              <div key={dayOfWeek} className="day-header">
                <div className="text-sm font-semibold">{getShortDayName(dayOfWeek)}</div>
                <div className="text-xs opacity-90">{weekDates[dayOfWeek - 1]?.getDate()}</div>
              </div>
            ))}

            {/* Time Slots */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                {/* Time Label */}
                <div className="time-label">
                  <span className="text-sm font-medium">{time}</span>
                </div>

                {/* Day Slots */}
                {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                  const slotKey = `${dayOfWeek}-${time}`;
                  const slotAssignments = scheduleMatrix[slotKey] || {};

                  return (
                    <div key={`${dayOfWeek}-${time}`} className="time-slot">
                      {/* Power Class Slot */}
                      <DroppableTimeSlot
                        id={`${dayOfWeek}-${time}-power`}
                        classType="power"
                        assignment={slotAssignments.power}
                        isActive={activeId === `${dayOfWeek}-${time}-power`}
                      />

                      {/* Cycling Class Slot */}
                      <DroppableTimeSlot
                        id={`${dayOfWeek}-${time}-cycling`}
                        classType="cycling"
                        assignment={slotAssignments.cycling}
                        isActive={activeId === `${dayOfWeek}-${time}-cycling`}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem && <ClassBlock assignment={draggedItem} isDragging={true} />}
        </DragOverlay>
      </DndContext>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="nova-card p-6">
          <h3 className="text-lg font-semibold mb-2">Clases Totales</h3>
          <div className="text-3xl font-bold text-nova-gold">
            {Object.keys(scheduleMatrix).reduce((total, key) => {
              return total + Object.keys(scheduleMatrix[key]).length;
            }, 0)}
          </div>
        </div>

        <div className="nova-card p-6">
          <h3 className="text-lg font-semibold mb-2">Power Classes</h3>
          <div className="text-3xl font-bold text-red-600">
            {Object.keys(scheduleMatrix).reduce((total, key) => {
              return total + (scheduleMatrix[key].power ? 1 : 0);
            }, 0)}
          </div>
        </div>

        <div className="nova-card p-6">
          <h3 className="text-lg font-semibold mb-2">Cycling Classes</h3>
          <div className="text-3xl font-bold text-blue-600">
            {Object.keys(scheduleMatrix).reduce((total, key) => {
              return total + (scheduleMatrix[key].cycling ? 1 : 0);
            }, 0)}
          </div>
        </div>
      </div>

      {/* Coach Assignment Summary with Quotas */}
      <div className="nova-card p-6">
        <h3 className="text-lg font-semibold mb-4">Asignación de Coaches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {
            // Calculate actual assignments by type
            const powerCount = Object.keys(scheduleMatrix).reduce((count, key) => {
              const assignment = scheduleMatrix[key].power;
              return assignment?.coachId === coach.id ? count + 1 : count;
            }, 0);

            const cyclingCount = Object.keys(scheduleMatrix).reduce((count, key) => {
              const assignment = scheduleMatrix[key].cycling;
              return assignment?.coachId === coach.id ? count + 1 : count;
            }, 0);

            const totalAssignments = powerCount + cyclingCount;

            // Get quotas
            const powerQuota = coach.weeklyQuotas?.power || 0;
            const cyclingQuota = coach.weeklyQuotas?.cycling || 0;

            // Determine status for color coding
            const getPowerStatus = () => {
              if (powerQuota === 0) return 'neutral';
              if (powerCount < powerQuota) return 'under';
              if (powerCount === powerQuota) return 'met';
              return 'over';
            };

            const getCyclingStatus = () => {
              if (cyclingQuota === 0) return 'neutral';
              if (cyclingCount < cyclingQuota) return 'under';
              if (cyclingCount === cyclingQuota) return 'met';
              return 'over';
            };

            const powerStatus = getPowerStatus();
            const cyclingStatus = getCyclingStatus();

            return (
              <div key={coach.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{coach.name}</div>
                    <div className="text-xs text-gray-500">
                      Total: {totalAssignments} clases
                    </div>
                  </div>
                </div>

                {/* Quota breakdown by type */}
                <div className="space-y-2">
                  {coach.specialties.includes('power') && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Power:</span>
                      <span
                        className={`font-semibold ${
                          powerStatus === 'met'
                            ? 'text-green-600'
                            : powerStatus === 'under'
                            ? 'text-yellow-600'
                            : powerStatus === 'over'
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {powerCount}
                        {powerQuota > 0 && ` / ${powerQuota}`}
                        {powerStatus === 'met' && ' ✓'}
                        {powerStatus === 'under' && ' ⚠'}
                        {powerStatus === 'over' && ' !'}
                      </span>
                    </div>
                  )}

                  {coach.specialties.includes('cycling') && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Cycling:</span>
                      <span
                        className={`font-semibold ${
                          cyclingStatus === 'met'
                            ? 'text-green-600'
                            : cyclingStatus === 'under'
                            ? 'text-yellow-600'
                            : cyclingStatus === 'over'
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {cyclingCount}
                        {cyclingQuota > 0 && ` / ${cyclingQuota}`}
                        {cyclingStatus === 'met' && ' ✓'}
                        {cyclingStatus === 'under' && ' ⚠'}
                        {cyclingStatus === 'over' && ' !'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
