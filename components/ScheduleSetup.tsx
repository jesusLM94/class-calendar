'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Coach {
  id: string;
  name: string;
  specialties: string[];
}

interface Slot {
  dayOfWeek: number;
  time: string;
  classType: string | null;
}

interface AvailableSlot {
  day_of_week?: number;
  dayOfWeek?: number;
  time: string;
  class_type?: string | null;
  classType?: string | null;
}

interface ScheduleSetupProps {
  currentWeek: string;
  weekDates: Date[];
  coaches: Coach[];
  availableSlots: AvailableSlot[];
  loading: boolean;
  generating: boolean;
  onGenerateSchedule: () => void;
  onSaveSlots: (slots: Slot[]) => Promise<void>;
}

const ScheduleSetup: React.FC<ScheduleSetupProps> = ({
  currentWeek,
  weekDates,
  coaches,
  availableSlots,
  loading,
  generating,
  onGenerateSchedule,
  onSaveSlots,
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({
    time: '06:00',
    classType: null as string | null,
    selectedDays: [1, 2, 3, 4, 5] as number[], // Default: Mon-Fri
  });

  // Load slots when component mounts or availableSlots change
  useEffect(() => {
    if (availableSlots.length > 0) {
      setSlots(
        availableSlots.map((slot) => ({
          dayOfWeek: slot.day_of_week || slot.dayOfWeek || 1,
          time: slot.time,
          classType: slot.class_type !== undefined ? slot.class_type : slot.classType || null,
        }))
      );
    } else {
      setSlots([]);
    }
  }, [availableSlots]);

  const handleAddSlot = (): void => {
    if (newSlot.selectedDays.length === 0) {
      alert('Selecciona al menos un día');
      return;
    }

    // Create a slot for each selected day
    const newSlots: Slot[] = newSlot.selectedDays.map((dayOfWeek) => ({
      dayOfWeek,
      time: newSlot.time,
      classType: newSlot.classType,
    }));

    // Check for duplicates
    const duplicates = newSlots.filter((newSlot) =>
      slots.some(
        (slot) =>
          slot.dayOfWeek === newSlot.dayOfWeek &&
          slot.time === newSlot.time &&
          slot.classType === newSlot.classType
      )
    );

    if (duplicates.length > 0) {
      const dayNames = duplicates.map((s) => getDayName(s.dayOfWeek)).join(', ');
      alert(`Ya existen horarios para: ${dayNames} a las ${newSlot.time}`);
      return;
    }

    // Add all new slots
    setSlots([...slots, ...newSlots]);

    // Show success message
    const count = newSlots.length;
    alert(`✓ ${count} horario${count > 1 ? 's' : ''} agregado${count > 1 ? 's' : ''} exitosamente`);
  };

  const handleRemoveSlot = (index: number): void => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSaveSlots = async (): Promise<void> => {
    try {
      await onSaveSlots(slots);
      alert('Horarios guardados exitosamente');
    } catch (error) {
      alert('Error al guardar horarios');
    }
  };

  const getDayName = (dayNumber: number): string => {
    const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayNumber];
  };

  const getShortDayName = (dayNumber: number): string => {
    const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days[dayNumber];
  };

  const toggleDay = (dayNumber: number): void => {
    setNewSlot((prev) => {
      const isSelected = prev.selectedDays.includes(dayNumber);
      if (isSelected) {
        return { ...prev, selectedDays: prev.selectedDays.filter((d) => d !== dayNumber) };
      } else {
        return { ...prev, selectedDays: [...prev.selectedDays, dayNumber].sort() };
      }
    });
  };

  const selectWeekdays = (): void => {
    setNewSlot((prev) => ({ ...prev, selectedDays: [1, 2, 3, 4, 5] }));
  };

  const selectWeekend = (): void => {
    setNewSlot((prev) => ({ ...prev, selectedDays: [6, 7] }));
  };

  const selectAllDays = (): void => {
    setNewSlot((prev) => ({ ...prev, selectedDays: [1, 2, 3, 4, 5, 6, 7] }));
  };

  const getClassTypeDisplay = (classType: string | null): string => {
    if (!classType) return 'Ambas';
    return classType === 'power' ? 'Power' : 'Cycling';
  };

  const groupSlotsByDay = (): { [key: number]: Slot[] } => {
    const grouped: { [key: number]: Slot[] } = {};
    slots.forEach((slot) => {
      if (!grouped[slot.dayOfWeek]) {
        grouped[slot.dayOfWeek] = [];
      }
      grouped[slot.dayOfWeek].push(slot);
    });

    // Sort slots within each day by time
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  };

  const canGenerateSchedule = slots.length > 0 && coaches.length > 0;
  const slotsChanged =
    JSON.stringify(slots) !==
    JSON.stringify(
      availableSlots.map((s) => ({
        dayOfWeek: s.day_of_week || s.dayOfWeek,
        time: s.time,
        classType: s.class_type !== undefined ? s.class_type : s.classType,
      }))
    );

  const groupedSlots = groupSlotsByDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración Semanal</h2>
          <p className="text-gray-600">Define los horarios disponibles para la semana</p>
        </div>

        <div className="flex space-x-3">
          {slotsChanged && (
            <button
              onClick={handleSaveSlots}
              disabled={loading}
              className="nova-button-secondary"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}

          <button
            onClick={onGenerateSchedule}
            disabled={!canGenerateSchedule || generating}
            className="nova-button-primary flex items-center space-x-2"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{generating ? 'Generando...' : 'Generar Horario'}</span>
          </button>
        </div>
      </div>

      {/* Week Info */}
      <div className="nova-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Semana del {weekDates[0].toLocaleDateString('es-ES')}
            </h3>
            <p className="text-gray-600 text-sm">{slots.length} horarios configurados</p>
          </div>

          {!canGenerateSchedule && (
            <div className="text-red-600 text-sm">
              {coaches.length === 0
                ? 'Necesitas agregar coaches primero'
                : 'Agrega al menos un horario'}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Add New Slot */}
        <div className="space-y-6">
          <div className="nova-card p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Horario</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                <input
                  type="time"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot((prev) => ({ ...prev, time: e.target.value }))}
                  className="nova-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Días que se repite
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={selectWeekdays}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Lun-Vie"
                    >
                      L-V
                    </button>
                    <button
                      type="button"
                      onClick={selectWeekend}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Sáb-Dom"
                    >
                      S-D
                    </button>
                    <button
                      type="button"
                      onClick={selectAllDays}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Todos"
                    >
                      Todos
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        newSlot.selectedDays.includes(day)
                          ? 'border-nova-gold bg-nova-gold bg-opacity-10 text-nova-gold font-semibold'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-medium">{getShortDayName(day)}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {newSlot.selectedDays.length === 0
                    ? 'Selecciona al menos un día'
                    : `${newSlot.selectedDays.length} día${newSlot.selectedDays.length > 1 ? 's' : ''} seleccionado${newSlot.selectedDays.length > 1 ? 's' : ''}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de clase
                </label>
                <select
                  value={newSlot.classType || ''}
                  onChange={(e) =>
                    setNewSlot((prev) => ({
                      ...prev,
                      classType: e.target.value || null,
                    }))
                  }
                  className="nova-input"
                >
                  <option value="">Ambas (Power y Cycling)</option>
                  <option value="power">Solo Power</option>
                  <option value="cycling">Solo Cycling</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  &quot;Ambas&quot; permite que se asigne tanto Power como Cycling al mismo horario
                </p>
              </div>

              <button
                onClick={handleAddSlot}
                disabled={newSlot.selectedDays.length === 0}
                className="nova-button-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-5 h-5" />
                <span>
                  {newSlot.selectedDays.length === 0
                    ? 'Agregar Horario'
                    : newSlot.selectedDays.length === 1
                      ? 'Agregar 1 Horario'
                      : `Agregar ${newSlot.selectedDays.length} Horarios`}
                </span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="nova-card p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de horarios:</span>
                <span className="font-medium">{slots.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coaches disponibles:</span>
                <span className="font-medium">{coaches.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Power coaches:</span>
                <span className="font-medium">
                  {coaches.filter((c) => c.specialties.includes('power')).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cycling coaches:</span>
                <span className="font-medium">
                  {coaches.filter((c) => c.specialties.includes('cycling')).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Slots */}
        <div className="space-y-6">
          <div className="nova-card p-6">
            <h3 className="text-lg font-semibold mb-4">Horarios Configurados</h3>

            {slots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay horarios configurados</p>
                <p className="text-sm">Agrega el primer horario para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedSlots)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((day) => (
                    <div key={day} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {getDayName(parseInt(day))}
                      </h4>
                      <div className="space-y-2">
                        {groupedSlots[parseInt(day)].map((slot, index) => (
                          <div
                            key={`${day}-${slot.time}-${slot.classType}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm font-medium">{slot.time}</span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  !slot.classType
                                    ? 'bg-gray-100 text-gray-800'
                                    : slot.classType === 'power'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {getClassTypeDisplay(slot.classType)}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveSlot(
                                  slots.findIndex(
                                    (s) =>
                                      s.dayOfWeek === slot.dayOfWeek &&
                                      s.time === slot.time &&
                                      s.classType === slot.classType
                                  )
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSetup;
