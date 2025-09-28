#!/usr/bin/env node

// Demo setup script for Nova Class Calendar
const axios = require("axios");

const API_BASE = "http://localhost:3001/api";

const demoCoaches = [
  { name: "Re", specialties: ["power", "cycling"] },
  { name: "Cheke", specialties: ["power"] },
  { name: "Borish", specialties: ["cycling"] },
  { name: "Mich", specialties: ["power", "cycling"] },
  { name: "Lau", specialties: ["cycling"] },
  { name: "Fer", specialties: ["cycling"] },
  { name: "Vale", specialties: ["cycling"] },
  { name: "Jeni", specialties: ["power"] },
];

const demoSchedules = [
  // Monday
  { dayOfWeek: 1, time: "06:15", classType: null },
  { dayOfWeek: 1, time: "08:30", classType: null },
  { dayOfWeek: 1, time: "17:30", classType: null },
  { dayOfWeek: 1, time: "19:05", classType: null },

  // Tuesday
  { dayOfWeek: 2, time: "06:15", classType: null },
  { dayOfWeek: 2, time: "08:30", classType: null },
  { dayOfWeek: 2, time: "17:30", classType: null },
  { dayOfWeek: 2, time: "19:05", classType: null },

  // Wednesday
  { dayOfWeek: 3, time: "06:15", classType: null },
  { dayOfWeek: 3, time: "08:30", classType: null },
  { dayOfWeek: 3, time: "17:30", classType: null },
  { dayOfWeek: 3, time: "19:05", classType: null },

  // Thursday
  { dayOfWeek: 4, time: "06:15", classType: null },
  { dayOfWeek: 4, time: "08:30", classType: null },
  { dayOfWeek: 4, time: "17:30", classType: null },
  { dayOfWeek: 4, time: "19:05", classType: null },

  // Friday
  { dayOfWeek: 5, time: "06:15", classType: null },
  { dayOfWeek: 5, time: "08:30", classType: null },
  { dayOfWeek: 5, time: "17:30", classType: null },
  { dayOfWeek: 5, time: "19:05", classType: null },
];

async function setupDemo() {
  try {
    console.log("🏋️  Setting up Nova Class Calendar Demo...\n");

    // Check if server is running
    try {
      await axios.get(`${API_BASE}/health`);
      console.log("✅ Backend server is running\n");
    } catch (error) {
      console.log("❌ Backend server is not running. Please start it first:");
      console.log("   cd backend && npm start\n");
      return;
    }

    // Add demo coaches
    console.log("👥 Adding demo coaches...");
    for (const coach of demoCoaches) {
      try {
        const response = await axios.post(`${API_BASE}/coaches`, coach);
        console.log(
          `   ✅ Added ${coach.name} (${coach.specialties.join(", ")})`
        );
      } catch (error) {
        if (
          error.response?.status === 500 &&
          error.response?.data?.error?.includes("UNIQUE constraint failed")
        ) {
          console.log(`   ⚠️  ${coach.name} already exists`);
        } else {
          console.log(`   ❌ Error adding ${coach.name}: ${error.message}`);
        }
      }
    }

    // Get current week
    const weekResponse = await axios.get(`${API_BASE}/current-week`);
    const currentWeek = weekResponse.data.weekStart;
    console.log(`\n📅 Setting up schedule for week: ${currentWeek}`);

    // Add demo schedules
    console.log("⏰ Configuring weekly schedule...");
    try {
      await axios.post(`${API_BASE}/schedules/${currentWeek}`, {
        schedules: demoSchedules,
      });
      console.log("   ✅ Weekly schedule configured");
    } catch (error) {
      console.log(`   ❌ Error configuring schedule: ${error.message}`);
    }

    // Generate schedule
    console.log("🎲 Generating automatic schedule...");
    try {
      const generateResponse = await axios.post(
        `${API_BASE}/generate/${currentWeek}`
      );
      const schedule = generateResponse.data.schedule;
      console.log(
        `   ✅ Generated schedule with ${schedule.length} class assignments`
      );

      // Show generated schedule summary
      console.log("\n📋 Generated Schedule Summary:");
      const scheduleByDay = {};
      schedule.forEach((assignment) => {
        const dayName = [
          "",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ][assignment.dayOfWeek];
        const key = `${dayName} ${assignment.time}`;
        if (!scheduleByDay[key]) scheduleByDay[key] = [];
        scheduleByDay[key].push(
          `${assignment.coachName} (${assignment.classType})`
        );
      });

      Object.keys(scheduleByDay).forEach((timeSlot) => {
        console.log(`   ${timeSlot}: ${scheduleByDay[timeSlot].join(" + ")}`);
      });
    } catch (error) {
      console.log(`   ❌ Error generating schedule: ${error.message}`);
    }

    console.log("\n🎉 Demo setup complete!");
    console.log("\n🚀 Next steps:");
    console.log("   1. Start the frontend: cd frontend && npm start");
    console.log("   2. Open http://localhost:3000 in your browser");
    console.log(
      "   3. Explore the three tabs: Coaches, Configuration, Calendar"
    );
    console.log("   4. Try drag & drop on the calendar to rearrange classes");
  } catch (error) {
    console.error("❌ Demo setup failed:", error.message);
  }
}

setupDemo();
