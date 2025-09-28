import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ClassBlock = ({ assignment, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${assignment.dayOfWeek}-${assignment.time}-${assignment.classType}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getClassTypeStyles = (classType) => {
    switch (classType) {
      case "power":
        return "class-block-power";
      case "cycling":
        return "class-block-cycling";
      default:
        return "class-block";
    }
  };

  const getClassTypeIcon = (classType) => {
    switch (classType) {
      case "power":
        return "💪";
      case "cycling":
        return "🚴";
      default:
        return "🏋️";
    }
  };

  const blockClasses = `
    ${getClassTypeStyles(assignment.classType)}
    ${isDragging || isSortableDragging ? "opacity-50 scale-105 rotate-2" : ""}
    select-none
  `.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={blockClasses}
    >
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-lg">
          {getClassTypeIcon(assignment.classType)}
        </span>
        <span className="font-semibold text-sm uppercase tracking-wide">
          {assignment.classType}
        </span>
      </div>

      <div className="font-medium text-gray-800 mb-1">
        {assignment.coachName}
      </div>

      <div className="text-xs text-gray-600">{assignment.time}</div>

      {/* Drag Handle Visual Indicator */}
      <div className="absolute top-1 right-1 opacity-30">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 10h2v2H8v-2zm6 0h2v2h-2v-2zM8 14h2v2H8v-2zm6 0h2v2h-2v-2z" />
        </svg>
      </div>
    </div>
  );
};

export default ClassBlock;
