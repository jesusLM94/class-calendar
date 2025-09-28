import React, { useState, useEffect } from "react";
import { formatDate, getMondayOfWeek, getWeekDates } from "./services/api";
import CoachManager from "./components/CoachManager";
import WeekSelector from "./components/WeekSelector";
import ScheduleSetup from "./components/ScheduleSetup";
import ScheduleCalendar from "./components/ScheduleCalendar";
import useCoaches from "./hooks/useCoaches";
import useSchedules from "./hooks/useSchedules";
import "./index.css";

function App() {
  const [currentWeek, setCurrentWeek] = useState(formatDate(getMondayOfWeek()));
  const [activeTab, setActiveTab] = useState("calendar"); // 'coaches', 'setup', 'calendar'
  const [showSuccess, setShowSuccess] = useState("");

  const {
    coaches,
    loading: coachesLoading,
    error: coachesError,
    loadCoaches,
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
    setError: setSchedulesError,
  } = useSchedules(currentWeek);

  // Show success message
  const showSuccessMessage = (message) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(""), 3000);
  };

  // Handle week change
  const handleWeekChange = (newWeek) => {
    setCurrentWeek(formatDate(newWeek));
  };

  // Handle schedule generation
  const handleGenerateSchedule = async () => {
    try {
      const result = await generateSchedule();

      if (result.validation && result.validation.errors.length > 0) {
        console.warn(
          "Schedule generated with warnings:",
          result.validation.errors
        );
      }

      showSuccessMessage("¡Horario generado exitosamente!");
      setActiveTab("calendar");
    } catch (error) {
      console.error("Error generating schedule:", error);
    }
  };

  // Handle manual schedule updates
  const handleScheduleUpdate = async (newSchedule) => {
    try {
      await updateSchedule(newSchedule);
      showSuccessMessage("Horario actualizado");
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const weekDates = getWeekDates(new Date(currentWeek));
  const scheduleMatrix = getScheduleMatrix();
  const timeSlots = getTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="nova-gradient w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Nova Class Calendar
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de horarios inteligente
                </p>
              </div>
            </div>

            {/* Week Selector */}
            <WeekSelector
              currentWeek={currentWeek}
              onWeekChange={handleWeekChange}
            />
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{showSuccess}</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(coachesError || schedulesError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">
              {coachesError || schedulesError}
            </span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => {
                setSchedulesError(null);
              }}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "coaches", name: "Coaches", icon: "👥" },
              { id: "setup", name: "Configuración", icon: "⚙️" },
              { id: "calendar", name: "Calendario", icon: "📅" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-nova-gold text-nova-gold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "coaches" && (
          <CoachManager
            coaches={coaches}
            loading={coachesLoading}
            onCoachChange={loadCoaches}
            onSuccess={showSuccessMessage}
          />
        )}

        {activeTab === "setup" && (
          <ScheduleSetup
            currentWeek={currentWeek}
            weekDates={weekDates}
            availableSlots={availableSlots}
            coaches={coaches}
            loading={schedulesLoading}
            onSlotsChange={() => {
              // Refresh schedules data
            }}
            onGenerateSchedule={handleGenerateSchedule}
            generating={generating}
          />
        )}

        {activeTab === "calendar" && (
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Nova Class Calendar - Sistema de generación automática de horarios
            </p>
            <p className="text-xs mt-1">
              Desarrollado para optimizar la rotación de coaches y mejorar la
              experiencia de los miembros
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
