import { getDatabase, Collections } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface HistoryAssignment {
  _id?: ObjectId;
  weekStart: string; // YYYY-MM-DD (Monday)
  coachId: string;
  coachName: string;
  dayOfWeek: number;
  time: string;
  classType: string; // "power" or "cycling"
  createdAt?: Date;
}

export async function saveAssignmentsToHistory(
  weekStart: string,
  assignments: Array<{
    coachId: string;
    coachName: string;
    dayOfWeek: number;
    time: string;
    classType: string;
  }>
): Promise<boolean> {
  const db = await getDatabase();

  const historyDocs: Omit<HistoryAssignment, '_id'>[] = assignments.map((assignment) => ({
    weekStart,
    coachId: assignment.coachId,
    coachName: assignment.coachName,
    dayOfWeek: assignment.dayOfWeek,
    time: assignment.time,
    classType: assignment.classType,
    createdAt: new Date(),
  }));

  if (historyDocs.length === 0) return true;

  // First, remove any existing assignments for this week
  await db.collection<HistoryAssignment>(Collections.ASSIGNMENTS).deleteMany({ weekStart });

  // Then insert the new assignments
  const result = await db
    .collection<HistoryAssignment>(Collections.ASSIGNMENTS)
    .insertMany(historyDocs as HistoryAssignment[]);

  return result.insertedCount > 0;
}

export async function getScheduleHistory(weeksBack: number = 6): Promise<HistoryAssignment[]> {
  const db = await getDatabase();

  // Get the date from weeksBack weeks ago
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const history = await db
    .collection<HistoryAssignment>(Collections.ASSIGNMENTS)
    .find({
      weekStart: { $gte: cutoffDateStr },
    })
    .sort({ weekStart: -1, dayOfWeek: 1, time: 1 })
    .toArray();

  return history;
}

export async function getCoachHistory(
  coachId: string,
  weeksBack: number = 6
): Promise<HistoryAssignment[]> {
  const db = await getDatabase();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const history = await db
    .collection<HistoryAssignment>(Collections.ASSIGNMENTS)
    .find({
      coachId,
      weekStart: { $gte: cutoffDateStr },
    })
    .sort({ weekStart: -1, dayOfWeek: 1, time: 1 })
    .toArray();

  return history;
}
