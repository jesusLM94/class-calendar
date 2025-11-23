'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import ClassBlock from './ClassBlock';

interface Assignment {
  coachId: string;
  coachName: string;
  dayOfWeek: number;
  time: string;
  classType: string;
}

interface DroppableTimeSlotProps {
  id: string;
  classType: string;
  assignment?: Assignment | null;
  isActive?: boolean;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  id,
  classType,
  assignment,
  isActive,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const getSlotStyles = (): string => {
    let baseStyles = 'min-h-[50px] p-2 rounded-lg transition-all duration-200 relative ';

    if (isOver) {
      baseStyles += 'bg-nova-gold bg-opacity-20 border-2 border-nova-gold border-dashed ';
    } else if (assignment) {
      baseStyles += 'bg-transparent ';
    } else {
      baseStyles +=
        classType === 'power'
          ? 'bg-red-50 border border-red-200 border-dashed hover:bg-red-100 '
          : 'bg-blue-50 border border-blue-200 border-dashed hover:bg-blue-100 ';
    }

    if (isActive) {
      baseStyles += 'ring-2 ring-nova-gold ring-opacity-50 ';
    }

    return baseStyles;
  };

  const getPlaceholderContent = (): React.ReactElement | null => {
    if (isOver) {
      return (
        <div className="flex items-center justify-center h-full text-nova-gold font-medium">
          Soltar aquí
        </div>
      );
    }

    if (!assignment) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          <div className="text-center">
            <div className="mb-1">{classType === 'power' ? '💪' : '🚴'}</div>
            <div className="uppercase tracking-wide font-medium">{classType}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={setNodeRef} className={getSlotStyles()}>
      {assignment ? <ClassBlock assignment={assignment} /> : getPlaceholderContent()}
    </div>
  );
};

export default DroppableTimeSlot;
