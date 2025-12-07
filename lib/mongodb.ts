import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri: string = process.env.MONGODB_URI;
const options = {};

// Extract database name from URI or use default
function getDatabaseName(uri: string): string {
  try {
    // Try to extract database name from URI path
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    // Fall back to default if parsing fails
  }
  return 'nova_calendar'; // default database name
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the MongoClient across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new MongoClient
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper function to get the database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(getDatabaseName(uri));
}

// Collection names as constants
export const Collections = {
  COACHES: 'coaches',
  SCHEDULES: 'schedules',
  ASSIGNMENTS: 'assignments',
  WEEKLY_CONFIGS: 'weekly_configs',
} as const;
