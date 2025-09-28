const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const Database = require("./database");
const ScheduleGenerator = require("./scheduleGenerator");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React build (for production)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
}

// Initialize database and schedule generator
const db = new Database();
const generator = new ScheduleGenerator(db);

// Utility function to get Monday of current week
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

// ============= COACHES ROUTES =============

// Get all coaches
app.get("/api/coaches", (req, res) => {
  db.getCoaches((err, coaches) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(coaches);
  });
});

// Add new coach
app.post("/api/coaches", (req, res) => {
  const { name, specialties } = req.body;

  if (!name || !specialties || !Array.isArray(specialties)) {
    return res
      .status(400)
      .json({ error: "Name and specialties array are required" });
  }

  db.addCoach(name, specialties, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, name, specialties });
  });
});

// Update coach
app.put("/api/coaches/:id", (req, res) => {
  const { id } = req.params;
  const { name, specialties } = req.body;

  if (!name || !specialties || !Array.isArray(specialties)) {
    return res
      .status(400)
      .json({ error: "Name and specialties array are required" });
  }

  db.updateCoach(id, name, specialties, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Coach not found" });
    }
    res.json({ id: parseInt(id), name, specialties });
  });
});

// Delete coach
app.delete("/api/coaches/:id", (req, res) => {
  const { id } = req.params;

  db.deleteCoach(id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Coach not found" });
    }
    res.json({ message: "Coach deleted successfully" });
  });
});

// ============= RESTRICTIONS ROUTES =============

// Get coach restrictions
app.get("/api/coaches/:id/restrictions", (req, res) => {
  const { id } = req.params;

  db.getCoachRestrictions(parseInt(id), (err, restrictions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(restrictions);
  });
});

// Add coach restriction
app.post("/api/coaches/:id/restrictions", (req, res) => {
  const { id } = req.params;
  const { type, value } = req.body;

  if (!type || !value) {
    return res.status(400).json({ error: "Type and value are required" });
  }

  db.addCoachRestriction(parseInt(id), type, value, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      id: this.lastID,
      coach_id: parseInt(id),
      restriction_type: type,
      restriction_value: value,
    });
  });
});

// Remove coach restriction
app.delete("/api/restrictions/:id", (req, res) => {
  const { id } = req.params;

  db.removeCoachRestriction(id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Restriction not found" });
    }
    res.json({ message: "Restriction removed successfully" });
  });
});

// ============= SCHEDULES ROUTES =============

// Get available schedules for a week
app.get("/api/schedules/:weekStart", (req, res) => {
  const { weekStart } = req.params;

  db.getWeekSchedules(weekStart, (err, schedules) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(schedules);
  });
});

// Set available schedules for a week
app.post("/api/schedules/:weekStart", (req, res) => {
  const { weekStart } = req.params;
  const { schedules } = req.body;

  if (!Array.isArray(schedules)) {
    return res.status(400).json({ error: "Schedules array is required" });
  }

  db.setWeekSchedules(weekStart, schedules, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Week schedules updated successfully" });
  });
});

// ============= SCHEDULE GENERATION ROUTES =============

// Generate schedule for a week
app.post("/api/generate/:weekStart", async (req, res) => {
  const { weekStart } = req.params;

  try {
    // Get available slots for the week
    db.getWeekSchedules(weekStart, async (err, availableSlots) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (availableSlots.length === 0) {
        return res
          .status(400)
          .json({ error: "No available time slots for this week" });
      }

      try {
        const generatedSchedule = await generator.generateWeekSchedule(
          weekStart,
          availableSlots
        );

        // Validate the generated schedule
        const validation = generator.validateSchedule(generatedSchedule);
        if (!validation.isValid) {
          console.warn("Generated schedule has warnings:", validation.errors);
        }

        // Save the assignments to history
        db.saveScheduleAssignments(weekStart, generatedSchedule, (err) => {
          if (err) {
            console.error("Error saving assignments:", err);
            // Continue even if history saving fails
          }
        });

        // Save weekly config
        const configData = {
          availableSlots,
          generatedAt: new Date().toISOString(),
        };
        db.saveWeeklyConfig(weekStart, configData, generatedSchedule, (err) => {
          if (err) {
            console.error("Error saving weekly config:", err);
            // Continue even if config saving fails
          }
        });

        res.json({
          schedule: generatedSchedule,
          validation,
          weekStart,
        });
      } catch (genError) {
        res
          .status(500)
          .json({ error: "Error generating schedule: " + genError.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get generated schedule for a week
app.get("/api/generated/:weekStart", (req, res) => {
  const { weekStart } = req.params;

  db.getWeeklyConfig(weekStart, (err, config) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!config) {
      return res
        .status(404)
        .json({ error: "No generated schedule found for this week" });
    }

    res.json(config);
  });
});

// Update generated schedule (after manual modifications)
app.put("/api/generated/:weekStart", (req, res) => {
  const { weekStart } = req.params;
  const { schedule } = req.body;

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: "Schedule array is required" });
  }

  // Get existing config first
  db.getWeeklyConfig(weekStart, (err, existingConfig) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const configData = existingConfig
      ? existingConfig.config_data
      : { modifiedAt: new Date().toISOString() };
    configData.lastModified = new Date().toISOString();

    // Save updated config
    db.saveWeeklyConfig(weekStart, configData, schedule, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Update assignments history
      db.saveScheduleAssignments(weekStart, schedule, (err) => {
        if (err) {
          console.error("Error updating assignments:", err);
          // Continue even if history update fails
        }

        res.json({
          message: "Schedule updated successfully",
          weekStart,
          schedule,
        });
      });
    });
  });
});

// ============= HISTORY ROUTES =============

// Get schedule history
app.get("/api/history", (req, res) => {
  const { weeks } = req.query;
  const weeksBack = weeks ? parseInt(weeks) : 6;

  db.getScheduleHistory(weeksBack, (err, history) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(history);
  });
});

// ============= UTILITY ROUTES =============

// Get current week Monday
app.get("/api/current-week", (req, res) => {
  const monday = getMondayOfWeek();
  res.json({ weekStart: monday });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Serve React app for all non-API routes (production only)
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  db.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  db.close();
  process.exit(0);
});
