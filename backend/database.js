const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, "nova_calendar.db"));
    this.init();
  }

  init() {
    // Tabla de coaches
    this.db.run(`
      CREATE TABLE IF NOT EXISTS coaches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        specialties TEXT NOT NULL, -- JSON array: ["power", "cycling"]
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de restricciones de coaches
    this.db.run(`
      CREATE TABLE IF NOT EXISTS coach_restrictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coach_id INTEGER NOT NULL,
        restriction_type VARCHAR(50) NOT NULL, -- 'day', 'time', 'custom'
        restriction_value TEXT NOT NULL, -- day name, time, or custom description
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (coach_id) REFERENCES coaches (id) ON DELETE CASCADE
      )
    `);

    // Tabla de horarios disponibles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS available_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start DATE NOT NULL, -- Lunes de la semana
        day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
        time VARCHAR(5) NOT NULL, -- formato "HH:MM"
        class_type VARCHAR(20), -- 'power', 'cycling', or null (ambos)
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // Tabla de asignaciones generadas (historial)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS schedule_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start DATE NOT NULL,
        coach_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        time VARCHAR(5) NOT NULL,
        class_type VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coach_id) REFERENCES coaches (id) ON DELETE CASCADE
      )
    `);

    // Tabla de configuraciones semanales
    this.db.run(`
      CREATE TABLE IF NOT EXISTS weekly_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start DATE NOT NULL UNIQUE,
        config_data TEXT NOT NULL, -- JSON con configuración específica
        generated_schedule TEXT, -- JSON con el horario generado
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully");
  }

  // Métodos para coaches
  addCoach(name, specialties, callback) {
    const stmt = this.db.prepare(
      "INSERT INTO coaches (name, specialties) VALUES (?, ?)"
    );
    stmt.run(name, JSON.stringify(specialties), callback);
    stmt.finalize();
  }

  getCoaches(callback) {
    this.db.all("SELECT * FROM coaches ORDER BY name", (err, rows) => {
      if (err) return callback(err);
      // Parse specialties JSON
      const coaches = rows.map((row) => ({
        ...row,
        specialties: JSON.parse(row.specialties),
      }));
      callback(null, coaches);
    });
  }

  updateCoach(id, name, specialties, callback) {
    const stmt = this.db.prepare(
      "UPDATE coaches SET name = ?, specialties = ? WHERE id = ?"
    );
    stmt.run(name, JSON.stringify(specialties), id, callback);
    stmt.finalize();
  }

  deleteCoach(id, callback) {
    const stmt = this.db.prepare("DELETE FROM coaches WHERE id = ?");
    stmt.run(id, callback);
    stmt.finalize();
  }

  // Métodos para restricciones
  addCoachRestriction(coachId, type, value, callback) {
    const stmt = this.db.prepare(
      "INSERT INTO coach_restrictions (coach_id, restriction_type, restriction_value) VALUES (?, ?, ?)"
    );
    stmt.run(coachId, type, value, callback);
    stmt.finalize();
  }

  getCoachRestrictions(coachId, callback) {
    const sql = coachId
      ? "SELECT * FROM coach_restrictions WHERE coach_id = ? AND is_active = 1"
      : "SELECT * FROM coach_restrictions WHERE is_active = 1";

    if (coachId) {
      this.db.all(sql, [coachId], callback);
    } else {
      this.db.all(sql, callback);
    }
  }

  removeCoachRestriction(id, callback) {
    const stmt = this.db.prepare(
      "UPDATE coach_restrictions SET is_active = 0 WHERE id = ?"
    );
    stmt.run(id, callback);
    stmt.finalize();
  }

  // Métodos para horarios disponibles
  setWeekSchedules(weekStart, schedules, callback) {
    // Primero eliminar horarios existentes de esa semana
    this.db.run(
      "DELETE FROM available_schedules WHERE week_start = ?",
      [weekStart],
      (err) => {
        if (err) return callback(err);

        // Insertar nuevos horarios
        const stmt = this.db.prepare(
          "INSERT INTO available_schedules (week_start, day_of_week, time, class_type) VALUES (?, ?, ?, ?)"
        );

        schedules.forEach((schedule) => {
          stmt.run(
            weekStart,
            schedule.dayOfWeek,
            schedule.time,
            schedule.classType
          );
        });

        stmt.finalize(callback);
      }
    );
  }

  getWeekSchedules(weekStart, callback) {
    this.db.all(
      "SELECT * FROM available_schedules WHERE week_start = ? AND is_active = 1 ORDER BY day_of_week, time",
      [weekStart],
      callback
    );
  }

  // Métodos para asignaciones (historial)
  saveScheduleAssignments(weekStart, assignments, callback) {
    // Primero eliminar asignaciones existentes de esa semana
    this.db.run(
      "DELETE FROM schedule_assignments WHERE week_start = ?",
      [weekStart],
      (err) => {
        if (err) return callback(err);

        const stmt = this.db.prepare(
          "INSERT INTO schedule_assignments (week_start, coach_id, day_of_week, time, class_type) VALUES (?, ?, ?, ?, ?)"
        );

        assignments.forEach((assignment) => {
          stmt.run(
            weekStart,
            assignment.coachId,
            assignment.dayOfWeek,
            assignment.time,
            assignment.classType
          );
        });

        stmt.finalize(callback);
      }
    );
  }

  getScheduleHistory(weeksBack = 6, callback) {
    this.db.all(
      `
      SELECT sa.*, c.name as coach_name 
      FROM schedule_assignments sa
      JOIN coaches c ON sa.coach_id = c.id
      WHERE sa.week_start >= date('now', '-${weeksBack} weeks')
      ORDER BY sa.week_start DESC, sa.day_of_week, sa.time
    `,
      callback
    );
  }

  // Métodos para configuraciones semanales
  saveWeeklyConfig(weekStart, configData, generatedSchedule, callback) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO weekly_configs (week_start, config_data, generated_schedule, last_modified)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      weekStart,
      JSON.stringify(configData),
      JSON.stringify(generatedSchedule),
      callback
    );
    stmt.finalize();
  }

  getWeeklyConfig(weekStart, callback) {
    this.db.get(
      "SELECT * FROM weekly_configs WHERE week_start = ?",
      [weekStart],
      (err, row) => {
        if (err) return callback(err);
        if (row) {
          row.config_data = JSON.parse(row.config_data);
          if (row.generated_schedule) {
            row.generated_schedule = JSON.parse(row.generated_schedule);
          }
        }
        callback(null, row);
      }
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
