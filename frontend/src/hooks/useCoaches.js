import { useState, useEffect } from "react";
import { coachesAPI, handleAPIError } from "../services/api";

export const useCoaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCoaches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await coachesAPI.getAll();
      setCoaches(response.data);
    } catch (err) {
      setError(handleAPIError(err, "Error al cargar los coaches"));
    } finally {
      setLoading(false);
    }
  };

  const addCoach = async (coachData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await coachesAPI.create(coachData);
      setCoaches((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al agregar coach");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCoach = async (id, coachData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await coachesAPI.update(id, coachData);
      setCoaches((prev) =>
        prev.map((coach) => (coach.id === id ? response.data : coach))
      );
      return response.data;
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al actualizar coach");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCoach = async (id) => {
    setLoading(true);
    setError(null);

    try {
      await coachesAPI.delete(id);
      setCoaches((prev) => prev.filter((coach) => coach.id !== id));
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al eliminar coach");
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getCoachRestrictions = async (coachId) => {
    try {
      const response = await coachesAPI.getRestrictions(coachId);
      return response.data;
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al obtener restricciones");
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const addCoachRestriction = async (coachId, restriction) => {
    try {
      const response = await coachesAPI.addRestriction(coachId, restriction);
      return response.data;
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al agregar restricción");
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const removeCoachRestriction = async (restrictionId) => {
    try {
      await coachesAPI.removeRestriction(restrictionId);
    } catch (err) {
      const errorMsg = handleAPIError(err, "Error al eliminar restricción");
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
