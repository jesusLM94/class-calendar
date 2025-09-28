import React, { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { getShortDayName } from "../services/api";
import useSchedules from "../hooks/useSchedules";

const ScheduleSetup = ({
  currentWeek,
  weekDates,
  coaches,
  onGenerateSchedule,
  generating,
}) => {
  const { availableSlots, setWeekSchedules, loading } =
    useSchedules(currentWeek);

  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 1,
    time: "06:00",
    classType: null, // null means both classes can be scheduled
  });

  // Load slots when component mounts or availableSlots change
  useEffect(() => {
    if (availableSlots.length > 0) {
      setSlots(
        availableSlots.map((slot) => ({
          dayOfWeek: slot.day_of_week,
          time: slot.time,
          classType: slot.class_type,
        }))
      );
    } else {
      setSlots([]);
    }
  }, [availableSlots]);

  const handleAddSlot = () => {
    const newSlotData = { ...newSlot };

    // Check if slot already exists
    const exists = slots.some(
      (slot) =>
        slot.dayOfWeek === newSlotData.dayOfWeek &&
        slot.time === newSlotData.time &&
        slot.classType === newSlotData.classType
    );

    if (exists) {
      alert("Este horario ya existe");
      return;
    }

    setSlots([...slots, newSlotData]);
  };

  const handleRemoveSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSaveSlots = async () => {
    try {
      await setWeekSchedules(slots);
      alert("Horarios guardados exitosamente");
    } catch (error) {
      alert("Error al guardar horarios");
    }
  };

  const getDayName = (dayNumber) => {
    const days = [
      "",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    return days[dayNumber];
  };

  const getClassTypeDisplay = (classType) => {
    if (!classType) return "Ambas";
    return classType === "power" ? "Power" : "Cycling";
  };

  const groupSlotsByDay = () => {
    const grouped = {};
    slots.forEach((slot) => {
      if (!grouped[slot.dayOfWeek]) {
        grouped[slot.dayOfWeek] = [];
      }
      grouped[slot.dayOfWeek].push(slot);
    });

    // Sort slots within each day by time
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  };

  const canGenerateSchedule = slots.length > 0 && coaches.length > 0;
  const slotsChanged =
    JSON.stringify(slots) !==
    JSON.stringify(
      availableSlots.map((s) => ({
        dayOfWeek: s.day_of_week,
        time: s.time,
        classType: s.class_type,
      }))
    );

  const groupedSlots = groupSlotsByDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configuración Semanal
          </h2>
          <p className="text-gray-600">
            Define los horarios disponibles para la semana
          </p>
        </div>

        <div className="flex space-x-3">
          {slotsChanged && (
            <button
              onClick={handleSaveSlots}
              disabled={loading}
              className="nova-button-secondary"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          )}

          <button
            onClick={onGenerateSchedule}
            disabled={!canGenerateSchedule || generating}
            className="nova-button-primary flex items-center space-x-2"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{generating ? "Generando..." : "Generar Horario"}</span>
          </button>
        </div>
      </div>

      {/* Week Info */}
      <div className="nova-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Semana del {weekDates[0].toLocaleDateString("es-ES")}
            </h3>
            <p className="text-gray-600 text-sm">
              {slots.length} horarios configurados
            </p>
          </div>

          {!canGenerateSchedule && (
            <div className="text-red-600 text-sm">
              {coaches.length === 0
                ? "Necesitas agregar coaches primero"
                : "Agrega al menos un horario"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Día de la semana
                </label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={(e) =>
                    setNewSlot((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(e.target.value),
                    }))
                  }
                  className="nova-input"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <option key={day} value={day}>
                      {getDayName(day)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario
                </label>
                <input
                  type="time"
                  value={newSlot.time}
                  onChange={(e) =>
                    setNewSlot((prev) => ({ ...prev, time: e.target.value }))
                  }
                  className="nova-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de clase
                </label>
                <select
                  value={newSlot.classType || ""}
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
                  "Ambas" permite que se asigne tanto Power como Cycling al
                  mismo horario
                </p>
              </div>

              <button
                onClick={handleAddSlot}
                className="nova-button-primary w-full flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Agregar Horario</span>
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
                  {
                    coaches.filter((c) => c.specialties.includes("power"))
                      .length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cycling coaches:</span>
                <span className="font-medium">
                  {
                    coaches.filter((c) => c.specialties.includes("cycling"))
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Slots */}
        <div className="space-y-6">
          <div className="nova-card p-6">
            <h3 className="text-lg font-semibold mb-4">
              Horarios Configurados
            </h3>

            {slots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay horarios configurados</p>
                <p className="text-sm">
                  Agrega el primer horario para comenzar
                </p>
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
                        {groupedSlots[day].map((slot, index) => (
                          <div
                            key={`${day}-${slot.time}-${slot.classType}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-sm font-medium">
                                {slot.time}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  !slot.classType
                                    ? "bg-gray-100 text-gray-800"
                                    : slot.classType === "power"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
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
