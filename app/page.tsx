'use client';

import React, { useState } from 'react';
import { formatDate, getMondayOfWeek, getWeekDates } from '@/lib/utils';
import CoachManager from '@/components/CoachManager';
import WeekSelector from '@/components/WeekSelector';
import ScheduleSetup from '@/components/ScheduleSetup';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import useCoaches from '@/hooks/useCoaches';
import useSchedules from '@/hooks/useSchedules';

export default function Home() {
  const [currentWeek, setCurrentWeek] = useState(formatDate(getMondayOfWeek()));
  const [activeTab, setActiveTab] = useState<'coaches' | 'setup' | 'calendar'>('calendar');
  const [showSuccess, setShowSuccess] = useState('');

  const {
    coaches,
    loading: coachesLoading,
    error: coachesError,
    addCoach,
    updateCoach,
    deleteCoach,
    getCoachRestrictions,
    addCoachRestriction,
    removeCoachRestriction,
  } = useCoaches();

  const {
    availableSlots,
    generatedSchedule,
    loading: schedulesLoading,
    generating,
    error: schedulesError,
    generateSchedule,
    updateSchedule,
    getScheduleMatrix,
    getTimeSlots,
    setWeekSchedules,
    setError: setSchedulesError,
  } = useSchedules(currentWeek);

  // Show success message
  const showSuccessMessage = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  // Handle week change
  const handleWeekChange = (newWeek: Date) => {
    setCurrentWeek(formatDate(newWeek));
  };

  // Handle schedule generation
  const handleGenerateSchedule = async () => {
    try {
      const result = await generateSchedule();

      if (result && result.validation && result.validation.errors.length > 0) {
        console.warn('Schedule generated with warnings:', result.validation.errors);
      }

      showSuccessMessage('¡Horario generado exitosamente!');
      setActiveTab('calendar');
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  };

  // Handle manual schedule updates
  const handleScheduleUpdate = async (newSchedule: any[]) => {
    try {
      await updateSchedule(newSchedule);
      showSuccessMessage('Horario actualizado');
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  // Handle save slots
  const handleSaveSlots = async (slots: any[]) => {
    try {
      await setWeekSchedules(slots);
    } catch (error) {
      console.error('Error saving slots:', error);
      throw error;
    }
  };

  const weekDates = getWeekDates(new Date(currentWeek));
  const scheduleMatrix = getScheduleMatrix();
  const timeSlots = getTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nova Class Calendar</h1>
              <p className="text-gray-600">Sistema de horarios automático</p>
            </div>
            <WeekSelector currentWeek={currentWeek} onWeekChange={handleWeekChange} />
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg">
            {showSuccess}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`${
                activeTab === 'calendar'
                  ? 'border-nova-gold text-nova-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`${
                activeTab === 'setup'
                  ? 'border-nova-gold text-nova-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`${
                activeTab === 'coaches'
                  ? 'border-nova-gold text-nova-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              👥 Coaches
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {coachesError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {coachesError}
          </div>
        )}
        {schedulesError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {schedulesError}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'calendar' && (
          <ScheduleCalendar
            currentWeek={currentWeek}
            weekDates={weekDates}
            scheduleMatrix={scheduleMatrix}
            timeSlots={timeSlots}
            coaches={coaches}
            loading={schedulesLoading}
            onScheduleUpdate={handleScheduleUpdate}
          />
        )}

        {activeTab === 'setup' && (
          <ScheduleSetup
            currentWeek={currentWeek}
            weekDates={weekDates}
            coaches={coaches}
            availableSlots={availableSlots}
            loading={schedulesLoading}
            generating={generating}
            onGenerateSchedule={handleGenerateSchedule}
            onSaveSlots={handleSaveSlots}
          />
        )}

        {activeTab === 'coaches' && (
          <CoachManager
            coaches={coaches}
            loading={coachesLoading}
            error={coachesError}
            onSuccess={showSuccessMessage}
            onAddCoach={addCoach}
            onUpdateCoach={updateCoach}
            onDeleteCoach={deleteCoach}
            onGetRestrictions={getCoachRestrictions}
            onAddRestriction={addCoachRestriction}
            onRemoveRestriction={removeCoachRestriction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
        <p>Desarrollado para optimizar los horarios de Nova Gym</p>
      </footer>
    </div>
  );
}
