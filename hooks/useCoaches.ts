'use client';

import { useState, useEffect } from 'react';
import { coachesAPI, handleAPIError } from '@/lib/api-client';

interface Coach {
  id: string;
  name: string;
  specialties: string[];
}

interface Restriction {
  id: string;
  type: string;
  value: string;
  isActive: boolean;
}

export const useCoaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCoaches = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await coachesAPI.getAll();
      setCoaches(data);
    } catch (err) {
      setError(handleAPIError(err, 'Error al cargar los coaches'));
    } finally {
      setLoading(false);
    }
  };

  const addCoach = async (coachData: { name: string; specialties: string[] }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await coachesAPI.create(coachData);
      setCoaches((prev) => [...prev, data]);
      return data;
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al agregar coach');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCoach = async (id: string, coachData: { name: string; specialties: string[] }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await coachesAPI.update(id, coachData);
      setCoaches((prev) => prev.map((coach) => (coach.id === id ? data : coach)));
      return data;
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al actualizar coach');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCoach = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await coachesAPI.delete(id);
      setCoaches((prev) => prev.filter((coach) => coach.id !== id));
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al eliminar coach');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getCoachRestrictions = async (coachId: string): Promise<Restriction[]> => {
    try {
      const data = await coachesAPI.getRestrictions(coachId);
      return data;
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al obtener restricciones');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const addCoachRestriction = async (coachId: string, restriction: { type: string; value: string }) => {
    try {
      const data = await coachesAPI.addRestriction(coachId, restriction);
      return data;
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al agregar restricción');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const removeCoachRestriction = async (coachId: string, restrictionId: string) => {
    try {
      await coachesAPI.removeRestriction(coachId, restrictionId);
    } catch (err) {
      const errorMsg = handleAPIError(err, 'Error al eliminar restricción');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  return {
    coaches,
    loading,
    error,
    loadCoaches,
    addCoach,
    updateCoach,
    deleteCoach,
    getCoachRestrictions,
    addCoachRestriction,
    removeCoachRestriction,
    setError,
  };
};

export default useCoaches;
