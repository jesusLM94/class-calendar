'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Coach {
  id: string;
  name: string;
  specialties: string[];
  weeklyQuotas?: {
    power?: number;
    cycling?: number;
  };
}

interface Restriction {
  id: string;
  restriction_type?: string;
  type?: string;
  restriction_value?: string;
  value?: string;
}

interface FormData {
  name: string;
  specialties: string[];
  weeklyQuotas: {
    power: number;
    cycling: number;
  };
}

interface RestrictionForm {
  type: string;
  value: string;
  day: string;
  time: string;
}

interface CoachManagerProps {
  coaches: Coach[];
  loading: boolean;
  error: string | null;
  onSuccess: (message: string) => void;
  onAddCoach: (data: FormData) => Promise<void>;
  onUpdateCoach: (id: string, data: FormData) => Promise<void>;
  onDeleteCoach: (id: string) => Promise<void>;
  onGetRestrictions: (coachId: string) => Promise<Restriction[]>;
  onAddRestriction: (coachId: string, restriction: RestrictionForm) => Promise<void>;
  onRemoveRestriction: (coachId: string, restrictionId: string) => Promise<void>;
}

const CoachManager: React.FC<CoachManagerProps> = ({
  coaches,
  loading,
  error,
  onSuccess,
  onAddCoach,
  onUpdateCoach,
  onDeleteCoach,
  onGetRestrictions,
  onAddRestriction,
  onRemoveRestriction,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [showRestrictions, setShowRestrictions] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    specialties: [],
    weeklyQuotas: {
      power: 0,
      cycling: 0,
    },
  });
  const [restrictionForm, setRestrictionForm] = useState<RestrictionForm>({
    type: 'day',
    value: '',
    day: '',
    time: '',
  });

  // Reset form when form is closed
  useEffect(() => {
    if (!showForm) {
      setFormData({ name: '', specialties: [], weeklyQuotas: { power: 0, cycling: 0 } });
      setEditingCoach(null);
    }
  }, [showForm]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.name || formData.specialties.length === 0) {
      return;
    }

    try {
      if (editingCoach) {
        await onUpdateCoach(editingCoach.id, formData);
        onSuccess('Coach actualizado exitosamente');
      } else {
        await onAddCoach(formData);
        onSuccess('Coach agregado exitosamente');
      }
      setShowForm(false);
    } catch (error) {
      // Error is handled by the parent
    }
  };

  const handleEdit = (coach: Coach): void => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      specialties: [...coach.specialties],
      weeklyQuotas: {
        power: coach.weeklyQuotas?.power || 0,
        cycling: coach.weeklyQuotas?.cycling || 0,
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (coach: Coach): Promise<void> => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${coach.name}?`)) {
      try {
        await onDeleteCoach(coach.id);
        onSuccess('Coach eliminado exitosamente');
      } catch (error) {
        // Error is handled by the parent
      }
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean): void => {
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

  const loadRestrictions = async (coachId: string): Promise<void> => {
    try {
      const data = await onGetRestrictions(coachId);
      setRestrictions(data);
      setShowRestrictions(coachId);
    } catch (error) {
      // Error is handled by the parent
    }
  };

  const handleAddRestriction = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!showRestrictions) return;

    // Build the restriction value based on type
    let value = '';
    if (restrictionForm.type === 'day') {
      if (!restrictionForm.day) return;
      value = restrictionForm.day;
    } else if (restrictionForm.type === 'time') {
      if (!restrictionForm.time) return;
      value = restrictionForm.time;
    } else if (restrictionForm.type === 'day_time') {
      if (!restrictionForm.day || !restrictionForm.time) return;
      value = `${restrictionForm.day}-${restrictionForm.time}`;
    }

    try {
      await onAddRestriction(showRestrictions, {
        type: restrictionForm.type,
        value,
        day: restrictionForm.day,
        time: restrictionForm.time,
      });
      setRestrictionForm({ type: 'day', value: '', day: '', time: '' });
      loadRestrictions(showRestrictions); // Reload restrictions
      onSuccess('Restricción agregada');
    } catch (error) {
      // Error is handled by the parent
    }
  };

  const handleRemoveRestriction = async (restrictionId: string): Promise<void> => {
    if (!showRestrictions) return;

    try {
      await onRemoveRestriction(showRestrictions, restrictionId);
      loadRestrictions(showRestrictions); // Reload restrictions
      onSuccess('Restricción eliminada');
    } catch (error) {
      // Error is handled by the parent
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
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Coaches</h2>
          <p className="text-gray-600">Administra los coaches y sus especialidades</p>
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
                <h3 className="text-lg font-semibold text-gray-900">{coach.name}</h3>
                <div className="flex space-x-2 mt-2">
                  {coach.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className={`px-2 py-1 text-xs rounded-full ${
                        specialty === 'power'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {specialty === 'power' ? 'Power' : 'Cycling'}
                    </span>
                  ))}
                </div>
                {/* Display Weekly Quotas */}
                {coach.weeklyQuotas && (coach.weeklyQuotas.power || coach.weeklyQuotas.cycling) ? (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Cuota semanal: </span>
                    {(coach.weeklyQuotas?.power ?? 0) > 0 && (
                      <span className="mr-2">Power: {coach.weeklyQuotas.power}</span>
                    )}
                    {(coach.weeklyQuotas?.cycling ?? 0) > 0 && (
                      <span>Cycling: {coach.weeklyQuotas.cycling}</span>
                    )}
                  </div>
                ) : null}
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
              {editingCoach ? 'Editar Coach' : 'Agregar Nuevo Coach'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  {['power', 'cycling'].map((specialty) => (
                    <label key={specialty} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                        className="mr-2 rounded border-gray-300 text-nova-gold focus:ring-nova-gold"
                      />
                      <span className="text-sm">
                        {specialty === 'power' ? 'Nova Power' : 'Nova Cycling'}
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

              {/* Weekly Quotas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clases por Semana (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.specialties.includes('power') && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nova Power</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.weeklyQuotas.power}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weeklyQuotas: {
                              ...prev.weeklyQuotas,
                              power: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="nova-input"
                        placeholder="0"
                      />
                    </div>
                  )}
                  {formData.specialties.includes('cycling') && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nova Cycling</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.weeklyQuotas.cycling}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weeklyQuotas: {
                              ...prev.weeklyQuotas,
                              cycling: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="nova-input"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deja en 0 para balanceo automático
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.name || formData.specialties.length === 0}
                  className="nova-button-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingCoach ? 'Actualizar' : 'Agregar'}
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
                Restricciones - {coaches.find((c) => c.id === showRestrictions)?.name}
              </h3>
              <button
                onClick={() => setShowRestrictions(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Add Restriction Form */}
            <form onSubmit={handleAddRestriction} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Agregar Restricción</h4>

              {/* Restriction Type */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Tipo de restricción</label>
                <select
                  value={restrictionForm.type}
                  onChange={(e) =>
                    setRestrictionForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                      day: '',
                      time: '',
                    }))
                  }
                  className="nova-input w-full"
                >
                  <option value="day">Día completo</option>
                  <option value="time">Horario específico (todos los días)</option>
                  <option value="day_time">Día y horario específico</option>
                </select>
              </div>

              {/* Dynamic Fields Based on Type */}
              <div className="space-y-3">
                {/* Day Dropdown - shown for 'day' and 'day_time' */}
                {(restrictionForm.type === 'day' || restrictionForm.type === 'day_time') && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Día</label>
                    <select
                      value={restrictionForm.day}
                      onChange={(e) =>
                        setRestrictionForm((prev) => ({
                          ...prev,
                          day: e.target.value,
                        }))
                      }
                      className="nova-input w-full"
                      required
                    >
                      <option key="empty-day" value="">Seleccionar día...</option>
                      <option key="lunes" value="lunes">Lunes</option>
                      <option key="martes" value="martes">Martes</option>
                      <option key="miércoles" value="miércoles">Miércoles</option>
                      <option key="jueves" value="jueves">Jueves</option>
                      <option key="viernes" value="viernes">Viernes</option>
                      <option key="sábado" value="sábado">Sábado</option>
                      <option key="domingo" value="domingo">Domingo</option>
                    </select>
                  </div>
                )}

                {/* Time Dropdown - shown for 'time' and 'day_time' */}
                {(restrictionForm.type === 'time' || restrictionForm.type === 'day_time') && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Horario</label>
                    <select
                      value={restrictionForm.time}
                      onChange={(e) =>
                        setRestrictionForm((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                      className="nova-input w-full"
                      required
                    >
                      <option value="">Seleccionar horario...</option>
                      <option value="06:00">06:00</option>
                      <option value="07:00">07:00</option>
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                      <option value="20:00">20:00</option>
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="nova-button-primary text-sm mt-3 w-full">
                Agregar Restricción
              </button>
            </form>

            {/* Restrictions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {restrictions.map((restriction, index) => {
                const type = restriction.restriction_type || restriction.type;
                const value = restriction.restriction_value || restriction.value;
                // Handle both _id (MongoDB) and id formats
                const restrictionId = restriction.id || (restriction as any)._id?.toString() || `restriction-${index}`;

                // Format restriction display
                let displayText = '';
                if (type === 'day' && value) {
                  displayText = `No puede dar clases los ${value}`;
                } else if (type === 'time' && value) {
                  displayText = `No puede dar clases a las ${value}`;
                } else if (type === 'day_time' && value) {
                  const [day, time] = value.split('-');
                  displayText = `No puede dar clases los ${day} a las ${time}`;
                }

                return (
                  <div
                    key={restrictionId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="text-sm text-gray-700">{displayText}</div>
                    <button
                      onClick={() => handleRemoveRestriction(restrictionId)}
                      className="text-red-500 hover:text-red-700 text-sm ml-3 flex-shrink-0"
                    >
                      Eliminar
                    </button>
                  </div>
                );
              })}

              {restrictions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay restricciones configuradas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachManager;
