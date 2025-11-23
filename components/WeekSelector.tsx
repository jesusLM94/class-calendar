'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getWeekDates, formatDate } from '@/lib/utils';

interface WeekSelectorProps {
  currentWeek: string;
  onWeekChange: (date: Date) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, onWeekChange }) => {
  const weekDates = getWeekDates(new Date(currentWeek));
  const startDate = weekDates[0];
  const endDate = weekDates[6];

  const goToPreviousWeek = (): void => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    onWeekChange(newWeek);
  };

  const goToNextWeek = (): void => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    onWeekChange(newWeek);
  };

  const goToCurrentWeek = (): void => {
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    onWeekChange(monday);
  };

  const formatDateRange = (): string => {
    const startStr = startDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
    const endStr = endDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${startStr} - ${endStr}`;
  };

  const isCurrentWeek = (): boolean => {
    const today = new Date();
    return today >= startDate && today <= endDate;
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Week Navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          title="Semana anterior"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center min-w-[200px]">
          <div className="font-semibold text-gray-900">{formatDateRange()}</div>
          {isCurrentWeek() && (
            <div className="text-xs text-nova-gold font-medium">Semana actual</div>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          title="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        {!isCurrentWeek() && (
          <button onClick={goToCurrentWeek} className="nova-button-secondary text-sm">
            Hoy
          </button>
        )}

        <input
          type="date"
          value={currentWeek}
          onChange={(e) => onWeekChange(new Date(e.target.value))}
          className="nova-input text-sm w-auto"
          title="Seleccionar fecha"
        />
      </div>
    </div>
  );
};

export default WeekSelector;
