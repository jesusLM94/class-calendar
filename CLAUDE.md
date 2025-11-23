# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nova Class Calendar is a gym schedule management system for automatically generating and managing class schedules with intelligent coach rotation. Built as a full-stack Next.js 15 application using MongoDB Atlas for data persistence and deployed on Vercel.

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety throughout the application
- **MongoDB Atlas** - Cloud database (free tier)
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag & drop functionality
- **Vercel** - Deployment platform (free tier)

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Configure MongoDB connection
# Create .env.local with:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nova_calendar?retryWrites=true&w=majority
```

### Development
```bash
# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Project Structure

```
class-calendar/
├── app/
│   ├── api/              # API Routes (backend endpoints)
│   │   ├── coaches/
│   │   ├── schedules/
│   │   ├── generate/
│   │   ├── generated/
│   │   └── history/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page (tabs & week selector)
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── CoachManager.tsx
│   ├── ScheduleSetup.tsx
│   ├── ScheduleCalendar.tsx
│   ├── WeekSelector.tsx
│   ├── ClassBlock.tsx
│   └── DroppableTimeSlot.tsx
├── hooks/               # Custom React hooks
│   ├── useCoaches.ts
│   └── useSchedules.ts
├── lib/
│   ├── db/              # Database operations
│   │   ├── coaches.ts
│   │   ├── schedules.ts
│   │   └── history.ts
│   ├── mongodb.ts       # MongoDB connection
│   ├── scheduleGenerator.ts  # Scheduling algorithm
│   ├── api-client.ts    # Frontend API client
│   └── utils.ts         # Utility functions
└── .env.local          # Environment variables (not committed)
```

### Next.js App Router Architecture

The application uses Next.js 15's App Router with API routes as the backend:

- **Server Components**: Default in Next.js 15, used for layouts and API routes
- **Client Components**: Marked with `'use client'`, used for interactive UI
- **API Routes**: Located in `app/api/`, handle all backend logic and database operations
- **No separate backend**: API routes serve as the backend, eliminating need for separate Express server

### Database Schema (MongoDB)

MongoDB collections:

- **coaches**: Coach profiles
  - `name`: string
  - `specialties`: array of strings (`["power"]`, `["cycling"]`, or `["power", "cycling"]`)
  - `isActive`: boolean

- **coach_restrictions**: Time-based restrictions per coach
  - `coachId`: ObjectId reference
  - `restrictionType`: "day" | "time" | "custom"
  - `value`: string (e.g., "Monday", "06:00", or custom description)

- **available_schedules**: Weekly time slots configuration
  - `weekStart`: string (Monday date in YYYY-MM-DD format)
  - `day`: string (weekday name)
  - `time`: string (HH:MM format)
  - `classType`: "power" | "cycling" | null (null = both allowed)

- **schedule_assignments**: Historical record of all assignments
  - `weekStart`: string
  - `day`: string
  - `time`: string
  - `classType`: string
  - `coachId`: ObjectId reference
  - `coachName`: string
  - `createdAt`: Date
  - Used for rotation optimization (looks back 6 weeks)

- **weekly_configs**: Generated schedules per week
  - `weekStart`: string (unique key)
  - `generatedSchedule`: array of assignments
  - `createdAt`: Date
  - Stores current/active schedule for a week

### Core Components

**Components** (`components/`):
- **CoachManager.tsx**: Full coach CRUD interface with inline restriction management
- **ScheduleSetup.tsx**: Configure available time slots for a given week
- **ScheduleCalendar.tsx**: Drag-and-drop schedule view using @dnd-kit
- **WeekSelector.tsx**: Week navigation component
- **ClassBlock.tsx**: Individual draggable class component (client component)
- **DroppableTimeSlot.tsx**: Drop zone for drag-and-drop operations (client component)

**Hooks** (`hooks/`):
- **useCoaches.ts**: Manages coach state, fetching, and CRUD operations
- **useSchedules.ts**: Manages schedule state including available slots, generated schedules, and schedule matrix for calendar view

**API Client** (`lib/api-client.ts`):
- Centralized API client for frontend
- Organized into namespaced objects: `coachesAPI`, `schedulesAPI`, `utilityAPI`
- Includes helper functions for date manipulation and error handling

**Main Page** (`app/page.tsx`):
- Tab-based navigation (Coaches, Setup, Calendar)
- Week selector at top level
- Coordinates data flow between components via hooks

### Schedule Generator Algorithm

Located in `lib/scheduleGenerator.ts`, implements intelligent rotation logic:

1. **Historical Analysis**: Analyzes last 6 weeks of assignments
2. **Rotation Scoring**: Calculates scores per coach/time/type combination (lower = less recently assigned)
3. **Constraint Application**:
   - Filters by coach specialties
   - Applies coach restrictions (day/time/custom)
   - Enforces max 2 classes per day per coach
   - Prevents scheduling conflicts (e.g., no two Power classes simultaneously)
4. **Optimal Selection**: Selects best available coach for each slot
5. **Validation**: Post-generation checks for completeness and constraint adherence

### API Endpoints

All endpoints are in `app/api/`:

- `GET/POST /api/coaches` - List/create coaches
- `GET/PUT/DELETE /api/coaches/[id]` - Individual coach operations
- `GET/POST/DELETE /api/coaches/[id]/restrictions` - Manage restrictions
- `GET/POST /api/schedules/[weekStart]` - Available time slots for week
- `POST /api/generate/[weekStart]` - Generate optimal schedule
- `GET/PUT /api/generated/[weekStart]` - Get/update generated schedule
- `GET /api/history` - Historical assignments (with date filters)
- `GET /api/current-week` - Current week's Monday date
- `GET /api/health` - Health check endpoint

### Key Data Flows

1. **Schedule Generation Flow**:
   - User configures available time slots in ScheduleSetup
   - Saves to `available_schedules` collection via `POST /api/schedules/[weekStart]`
   - Clicks "Generate Schedule"
   - `POST /api/generate/[weekStart]` triggers algorithm
   - Algorithm fetches: coaches, restrictions, 6-week history from MongoDB
   - Generates optimal assignments
   - Saves to both `schedule_assignments` (history) and `weekly_configs` (current)
   - Frontend fetches and displays in ScheduleCalendar with drag-and-drop editing

2. **Rotation Algorithm**:
   - Queries last 6 weeks from `schedule_assignments` collection
   - Tracks each coach's recent assignments by day/time/type
   - Scores potential assignments (lower score = less recently assigned)
   - Filters candidates by specialty and restrictions
   - Validates constraints (workload limits, no conflicts)
   - Selects best candidate for each slot

3. **Manual Modifications**:
   - User drags classes between time slots in calendar
   - Updates sent to backend via `PUT /api/generated/[weekStart]`
   - Updates stored in `weekly_configs.generatedSchedule`
   - Does NOT create new entries in `schedule_assignments` (history preserved)

## Important Implementation Notes

### Coach Specialties
Stored as arrays in MongoDB: `["power"]`, `["cycling"]`, or `["power", "cycling"]`. No need for JSON parsing/stringifying as MongoDB handles arrays natively.

### Week Identification
All week-based operations use Monday's date in `YYYY-MM-DD` format as the key. Helper function `getMondayOfWeek()` is available in `lib/utils.ts`.

### Restrictions System
Three restriction types in `coach_restrictions` collection:
- `day`: Coach unavailable on specific weekday (value: "Monday", "Tuesday", etc.)
- `time`: Coach unavailable at specific time (value: "06:00", "19:00", etc.)
- `custom`: Free-form restriction description

### Class Types
Valid values: `"power"`, `"cycling"`, or `null` (both allowed). Used in `available_schedules.classType` and assignments.

### Environment Variables
- `MONGODB_URI`: MongoDB Atlas connection string (required)
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/nova_calendar?retryWrites=true&w=majority`
  - Stored in `.env.local` for development
  - Set in Vercel dashboard for production

### TypeScript Conventions
- All components use TypeScript (`.tsx` for components, `.ts` for utilities)
- Define types/interfaces for data structures
- Use `'use client'` directive for client components (those using hooks, state, or browser APIs)
- Server components (default) can directly access database

## Common Development Patterns

### Adding a New API Endpoint
1. Create new route file in `app/api/` following Next.js conventions
   - Example: `app/api/your-endpoint/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use `NextResponse` for responses
4. Add database operations to appropriate file in `lib/db/` if needed
5. Add API function to `lib/api-client.ts` for frontend use
6. Use in components via hooks or direct calls

Example:
```typescript
// app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db('nova_calendar');
  const data = await db.collection('your_collection').find({}).toArray();
  return NextResponse.json(data);
}
```

### Adding a New Component
1. Create component in `components/` directory
2. Add `'use client'` directive if component uses hooks, state, or browser APIs
3. Use Tailwind CSS for styling (consistent with existing components)
4. Import and use in `app/page.tsx` or other parent components
5. Consider creating a custom hook in `hooks/` if component needs complex state management

### Working with MongoDB
- Access database via `clientPromise` from `lib/mongodb.ts`
- Collections: coaches, coach_restrictions, available_schedules, schedule_assignments, weekly_configs
- MongoDB ObjectId: Use `new ObjectId(id)` for queries
- Always await database operations
- Use `.toArray()` to convert cursor to array

### Modifying Schedule Algorithm
Edit `lib/scheduleGenerator.ts`. Key functions:
- `createOptimalSchedule()`: Main entry point, orchestrates entire generation
- `calculateRotationScores()`: Computes historical scores from last 6 weeks
- `findBestCoach()`: Selection logic with all constraints applied
- `validateSchedule()`: Post-generation validation checks

## Testing and Validation

The schedule generator includes built-in validation that checks:
- All slots are filled (or reports unfillable slots with reasons)
- No coach exceeds 2 classes per day
- No scheduling conflicts (e.g., simultaneous Power classes)
- All assignments respect coach restrictions
- All coaches match specialty requirements

Validation results are returned with the generated schedule.

## Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import repository in Vercel
3. Add `MONGODB_URI` environment variable in project settings
4. Vercel auto-detects Next.js and deploys
5. Get free subdomain: `https://your-project.vercel.app`

### MongoDB Atlas Setup
1. Create free cluster (M0 tier) at mongodb.com/cloud/atlas
2. Create database user with read/write permissions
3. Whitelist IP addresses (use 0.0.0.0/0 for development)
4. Get connection string from "Connect" > "Drivers"
5. Add to `.env.local` and Vercel environment variables

## Development Tips

- Use `'use client'` only when necessary (hooks, state, browser APIs)
- API routes are server-side by default, can access database directly
- Next.js caching is aggressive, use `revalidate` options if needed
- MongoDB queries are async, always use `await`
- Use `console.log()` in API routes to debug (logs appear in terminal)
- TypeScript strict mode is enabled, fix all type errors before building
