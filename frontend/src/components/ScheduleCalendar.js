import React, { useState } from "react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getShortDayName } from "../services/api";
import ClassBlock from "./ClassBlock";
import DroppableTimeSlot from "./DroppableTimeSlot";

const ScheduleCalendar = ({
  currentWeek,
  weekDates,
  scheduleMatrix,
  timeSlots,
  coaches,
  loading,
  onScheduleUpdate,
}) => {
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);

    // Parse the dragged item info from the ID
    const [dayOfWeek, time, classType] = active.id.split("-");
    const assignment = scheduleMatrix[`${dayOfWeek}-${time}`]?.[classType];

    if (assignment) {
      setDraggedItem({
        ...assignment,
        originalSlot: `${dayOfWeek}-${time}-${classType}`,
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      // Parse source and target
      const [sourceDayOfWeek, sourceTime, sourceClassType] =
        activeId.split("-");
      const [targetDayOfWeek, targetTime, targetClassType] = overId.split("-");

      // Get current schedule from scheduleMatrix
      const currentSchedule = [];
      Object.keys(scheduleMatrix).forEach((key) => {
        const [day, time] = key.split("-");
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

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedItem(null);
  };

  // Create droppable items for DndContext
  const droppableIds = [];
  timeSlots.forEach((time) => {
    [1, 2, 3, 4, 5, 6, 7].forEach((day) => {
      ["power", "cycling"].forEach((classType) => {
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
          Ve a la sección "Configuración" para agregar horarios disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Calendario de Clases
        </h2>
        <p className="text-gray-600">
          Arrastra y suelta las clases para reorganizar el horario
        </p>
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
                <div className="text-sm font-semibold">
                  {getShortDayName(dayOfWeek)}
                </div>
                <div className="text-xs opacity-90">
                  {weekDates[dayOfWeek - 1]?.getDate()}
                </div>
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
          {draggedItem && (
            <ClassBlock assignment={draggedItem} isDragging={true} />
          )}
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

      {/* Coach Assignment Summary */}
      <div className="nova-card p-6">
        <h3 className="text-lg font-semibold mb-4">Asignación de Coaches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => {
            const coachAssignments = Object.keys(scheduleMatrix).reduce(
              (assignments, key) => {
                const slotAssignments = Object.values(scheduleMatrix[key]);
                return (
                  assignments +
                  slotAssignments.filter(
                    (assignment) => assignment.coachId === coach.id
                  ).length
                );
              },
              0
            );

            return (
              <div
                key={coach.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{coach.name}</div>
                  <div className="text-sm text-gray-600">
                    {coach.specialties.join(", ")}
                  </div>
                </div>
                <div className="text-lg font-semibold text-nova-gold">
                  {coachAssignments}
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
