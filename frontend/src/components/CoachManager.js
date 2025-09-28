import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import useCoaches from "../hooks/useCoaches";

const CoachManager = ({ onSuccess }) => {
  const {
    coaches,
    loading,
    error,
    addCoach,
    updateCoach,
    deleteCoach,
    getCoachRestrictions,
    addCoachRestriction,
    removeCoachRestriction,
  } = useCoaches();

  const [showForm, setShowForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [showRestrictions, setShowRestrictions] = useState(null);
  const [restrictions, setRestrictions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    specialties: [],
  });
  const [restrictionForm, setRestrictionForm] = useState({
    type: "day",
    value: "",
  });

  // Reset form when form is closed
  useEffect(() => {
    if (!showForm) {
      setFormData({ name: "", specialties: [] });
      setEditingCoach(null);
    }
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.specialties.length === 0) {
      return;
    }

    try {
      if (editingCoach) {
        await updateCoach(editingCoach.id, formData);
        onSuccess("Coach actualizado exitosamente");
      } else {
        await addCoach(formData);
        onSuccess("Coach agregado exitosamente");
      }
      setShowForm(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEdit = (coach) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      specialties: [...coach.specialties],
    });
    setShowForm(true);
  };

  const handleDelete = async (coach) => {
    if (
      window.confirm(`¿Estás seguro de que quieres eliminar a ${coach.name}?`)
    ) {
      try {
        await deleteCoach(coach.id);
        onSuccess("Coach eliminado exitosamente");
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleSpecialtyChange = (specialty, checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, specialty],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        specialties: prev.specialties.filter((s) => s !== specialty),
      }));
    }
  };

  const loadRestrictions = async (coachId) => {
    try {
      const data = await getCoachRestrictions(coachId);
      setRestrictions(data);
      setShowRestrictions(coachId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleAddRestriction = async (e) => {
    e.preventDefault();
    if (!restrictionForm.value) return;

    try {
      await addCoachRestriction(showRestrictions, restrictionForm);
      setRestrictionForm({ type: "day", value: "" });
      loadRestrictions(showRestrictions); // Reload restrictions
      onSuccess("Restricción agregada");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveRestriction = async (restrictionId) => {
    try {
      await removeCoachRestriction(restrictionId);
      loadRestrictions(showRestrictions); // Reload restrictions
      onSuccess("Restricción eliminada");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loading && coaches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nova-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Coaches
          </h2>
          <p className="text-gray-600">
            Administra los coaches y sus especialidades
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="nova-button-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Agregar Coach</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Coaches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => (
          <div key={coach.id} className="nova-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {coach.name}
                </h3>
                <div className="flex space-x-2 mt-2">
                  {coach.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className={`px-2 py-1 text-xs rounded-full ${
                        specialty === "power"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {specialty === "power" ? "Power" : "Cycling"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => loadRestrictions(coach.id)}
                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                  title="Ver restricciones"
                >
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(coach)}
                  className="p-2 text-gray-400 hover:text-nova-gold transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(coach)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {coaches.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No hay coaches registrados.</p>
            <p className="text-sm">Agrega tu primer coach para comenzar.</p>
          </div>
        )}
      </div>

      {/* Coach Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingCoach ? "Editar Coach" : "Agregar Nuevo Coach"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="nova-input"
                  placeholder="Nombre del coach"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades
                </label>
                <div className="space-y-2">
                  {["power", "cycling"].map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) =>
                          handleSpecialtyChange(specialty, e.target.checked)
                        }
                        className="mr-2 rounded border-gray-300 text-nova-gold focus:ring-nova-gold"
                      />
                      <span className="text-sm">
                        {specialty === "power" ? "Nova Power" : "Nova Cycling"}
                      </span>
                    </label>
                  ))}
                </div>
                {formData.specialties.length === 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Selecciona al menos una especialidad
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.name ||
                    formData.specialties.length === 0
                  }
                  className="nova-button-primary flex-1 disabled:opacity-50"
                >
                  {loading
                    ? "Guardando..."
                    : editingCoach
                    ? "Actualizar"
                    : "Agregar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="nova-button-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restrictions Modal */}
      {showRestrictions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Restricciones -{" "}
                {coaches.find((c) => c.id === showRestrictions)?.name}
              </h3>
              <button
                onClick={() => setShowRestrictions(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Add Restriction Form */}
            <form
              onSubmit={handleAddRestriction}
              className="mb-6 p-4 bg-gray-50 rounded-lg"
            >
              <h4 className="text-sm font-medium mb-3">Agregar Restricción</h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={restrictionForm.type}
                  onChange={(e) =>
                    setRestrictionForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="nova-input"
                >
                  <option value="day">Día de la semana</option>
                  <option value="time">Horario específico</option>
                </select>

                <input
                  type="text"
                  value={restrictionForm.value}
                  onChange={(e) =>
                    setRestrictionForm((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  className="nova-input"
                  placeholder={
                    restrictionForm.type === "day" ? "ej: lunes" : "ej: 07:00"
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="nova-button-primary text-sm mt-3"
              >
                Agregar
              </button>
            </form>

            {/* Restrictions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {restrictions.map((restriction) => (
                <div
                  key={restriction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium capitalize">
                      {restriction.restriction_type}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {restriction.restriction_value}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveRestriction(restriction.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}

              {restrictions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No hay restricciones configuradas
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachManager;
