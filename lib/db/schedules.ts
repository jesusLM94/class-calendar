import { getDatabase, Collections } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface AvailableSlot {
  dayOfWeek: number; // 1=Monday, 7=Sunday
  time: string; // "HH:MM"
  classType?: string; // "power", "cycling", or null (both allowed)
}

export interface WeekSchedule {
  _id?: ObjectId;
  weekStart: string; // YYYY-MM-DD (Monday)
  slots: AvailableSlot[];
  createdAt?: Date;
  lastModified?: Date;
}

export interface GeneratedSchedule {
  _id?: ObjectId;
  weekStart: string; // YYYY-MM-DD (Monday)
  assignments: Assignment[];
  createdAt?: Date;
  lastModified?: Date;
}

export interface Assignment {
  coachId: string;
  coachName: string;
  dayOfWeek: number;
  time: string;
  classType: string; // "power" or "cycling"
}

export async function getAvailableSlots(weekStart: string): Promise<AvailableSlot[]> {
  const db = await getDatabase();
  const schedule = await db
    .collection<WeekSchedule>(Collections.SCHEDULES)
    .findOne({ weekStart });

  return schedule?.slots || [];
}

export async function setAvailableSlots(
  weekStart: string,
  slots: AvailableSlot[]
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.collection<WeekSchedule>(Collections.SCHEDULES).updateOne(
    { weekStart },
    {
      $set: {
        slots,
        lastModified: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return result.modifiedCount > 0 || result.upsertedCount > 0;
}

export async function getGeneratedSchedule(
  weekStart: string
): Promise<Assignment[] | null> {
  const db = await getDatabase();
  const schedule = await db
    .collection<GeneratedSchedule>(Collections.WEEKLY_CONFIGS)
    .findOne({ weekStart });

  return schedule?.assignments || null;
}

export async function saveGeneratedSchedule(
  weekStart: string,
  assignments: Assignment[]
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db
    .collection<GeneratedSchedule>(Collections.WEEKLY_CONFIGS)
    .updateOne(
      { weekStart },
      {
        $set: {
          assignments,
          lastModified: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

  return result.modifiedCount > 0 || result.upsertedCount > 0;
}

export async function updateGeneratedSchedule(
  weekStart: string,
  assignments: Assignment[]
): Promise<boolean> {
  return saveGeneratedSchedule(weekStart, assignments);
}
