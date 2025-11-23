import { getDatabase, Collections } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface Coach {
  _id?: ObjectId;
  name: string;
  specialties: string[]; // ["power", "cycling"]
  restrictions?: Restriction[];
  weeklyQuotas?: {
    power?: number;
    cycling?: number;
  };
  createdAt?: Date;
}

export interface Restriction {
  _id?: ObjectId;
  type: 'day' | 'time' | 'day_time'; // 'day', 'time', 'day_time'
  value: string; // day name, time, or "day-time" (e.g., "miércoles-19:00")
  isActive: boolean;
}

export async function getAllCoaches(): Promise<Coach[]> {
  const db = await getDatabase();
  const coaches = await db
    .collection<Coach>(Collections.COACHES)
    .find({})
    .sort({ name: 1 })
    .toArray();

  return coaches;
}

export async function getCoachById(id: string): Promise<Coach | null> {
  const db = await getDatabase();
  const coach = await db
    .collection<Coach>(Collections.COACHES)
    .findOne({ _id: new ObjectId(id) });

  return coach;
}

export async function createCoach(
  name: string,
  specialties: string[],
  weeklyQuotas?: { power?: number; cycling?: number }
): Promise<Coach> {
  const db = await getDatabase();

  const newCoach: Omit<Coach, '_id'> = {
    name,
    specialties,
    restrictions: [],
    weeklyQuotas,
    createdAt: new Date(),
  };

  const result = await db.collection<Coach>(Collections.COACHES).insertOne(newCoach as Coach);

  return {
    _id: result.insertedId,
    ...newCoach,
  };
}

export async function updateCoach(
  id: string,
  name: string,
  specialties: string[],
  weeklyQuotas?: { power?: number; cycling?: number }
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.collection<Coach>(Collections.COACHES).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        specialties,
        weeklyQuotas,
      },
    }
  );

  return result.modifiedCount > 0;
}

export async function deleteCoach(id: string): Promise<boolean> {
  const db = await getDatabase();

  const result = await db
    .collection<Coach>(Collections.COACHES)
    .deleteOne({ _id: new ObjectId(id) });

  return result.deletedCount > 0;
}

export async function addRestriction(
  coachId: string,
  restriction: Omit<Restriction, '_id'>
): Promise<boolean> {
  const db = await getDatabase();

  const newRestriction = {
    _id: new ObjectId(),
    ...restriction,
  };

  const result = await db.collection<Coach>(Collections.COACHES).updateOne(
    { _id: new ObjectId(coachId) },
    {
      $push: { restrictions: newRestriction } as any,
    }
  );

  return result.modifiedCount > 0;
}

export async function removeRestriction(
  coachId: string,
  restrictionId: string
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.collection<Coach>(Collections.COACHES).updateOne(
    { _id: new ObjectId(coachId) },
    {
      $pull: { restrictions: { _id: new ObjectId(restrictionId) } } as any,
    }
  );

  return result.modifiedCount > 0;
}

export async function getCoachRestrictions(coachId: string): Promise<Restriction[]> {
  const coach = await getCoachById(coachId);
  return coach?.restrictions || [];
}
