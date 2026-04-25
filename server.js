require("dotenv").config();

const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const cron = require("node-cron");
const PDFDocument = require("pdfkit");

const { neonQuery } = require("./db-neon");

const app = express();
const PORT = 5100;

const SHIFT_START_TIME = "17:00";
const SHIFT_GRACE_MINUTES = 10;
const HALF_DAY_MINUTES = 120;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mvexpress-change-this-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"));

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function nowLocalDateTimeParts() {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA");
  const time = now.toLocaleTimeString("en-GB", { hour12: false });
  return { now, date, time };
}

function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return 0;
  const parts = timeString.split(":").map(Number);
  const hour = parts[0] || 0;
  const minute = parts[1] || 0;
  return hour * 60 + minute;
}

function minutesToHourMinuteText(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function computeWorkedMinutes(inTime, outTime) {
  if (!inTime || !outTime) return 0;
  const inMinutes = timeToMinutes(inTime);
  const outMinutes = timeToMinutes(outTime);
  const diff = outMinutes - inMinutes;
  return diff > 0 ? diff : 0;
}

function getLateThresholdMinutes() {
  return timeToMinutes(SHIFT_START_TIME) + SHIFT_GRACE_MINUTES;
}

function getAttendanceStatusByCheckIn(inTime) {
  if (!inTime) return "Absent";
  return timeToMinutes(inTime) > getLateThresholdMinutes() ? "Late" : "Present";
}

function getFinalAttendanceStatus(inTime, outTime, workedMinutes, existingStatus = "") {
  const manualStatuses = ["Leave", "Absent"];
  if (manualStatuses.includes(existingStatus)) return existingStatus;
  if (!inTime) return "Absent";
  if (!outTime) return getAttendanceStatusByCheckIn(inTime);
  if (workedMinutes < HALF_DAY_MINUTES) return "Half Day";
  return getAttendanceStatusByCheckIn(inTime);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value) {
  const cleaned = normalizeText(value);
  return cleaned || null;
}

function normalizeStatus(value) {
  const cleaned = normalizeText(value).toLowerCase();
  if (cleaned === "inactive") return "Inactive";
  return "Active";
}

function normalizeRole(value) {
  const cleaned = normalizeText(value);
  return cleaned || "Staff";
}

function normalizeHourlyRate(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 50;
  return amount;
}

function normalizeMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Number(amount.toFixed(2));
}

function normalizeInteger(value, fallback = 0) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return Math.floor(amount);
}

function normalizeAttendanceStatus(value) {
  const cleaned = normalizeText(value);
  const allowed = ["Present", "Late", "Half Day", "Leave", "Absent", "Completed"];
  return allowed.includes(cleaned) ? cleaned : "Present";
}

function normalizeComplaintStatus(value) {
  const cleaned = normalizeText(value);
  const allowed = ["Open", "In Progress", "Resolved", "Closed"];
  return allowed.includes(cleaned) ? cleaned : "Open";
}

function normalizeComplaintType(value) {
  const cleaned = normalizeText(value);
  return cleaned || "General Issue";
}

function getComplaintPriorityByType(complaintType) {
  const type = normalizeText(complaintType).toLowerCase();

  const highPriorityTypes = [
    "parcel missing",
    "missing parcel",
    "parcel lost",
    "lost parcel",
    "not delivered",
    "parcel damage",
    "damaged parcel",
    "wrong delivery",
    "delivered to wrong person"
  ];

  const mediumPriorityTypes = [
    "delivery delay",
    "delay",
    "wrong status",
    "tracking not updated",
    "pickup issue",
    "payment issue"
  ];

  if (highPriorityTypes.some(item => type.includes(item))) {
    return "High";
  }

  if (mediumPriorityTypes.some(item => type.includes(item))) {
    return "Medium";
  }

  return "Low";
}

function normalizeInventoryStatus(currentStock, minimumStock) {
  return currentStock <= minimumStock ? "Low Stock" : "In Stock";
}

function normalizeExpenseCategory(value) {
  const cleaned = normalizeText(value);
  return cleaned || "General";
}

function normalizeIncomeCategory(value) {
  const cleaned = normalizeText(value);
  return cleaned || "General";
}

function normalizePaymentMode(value) {
  const cleaned = normalizeText(value);
  return cleaned || "Cash";
}

function normalizeOfferType(value) {
  const cleaned = normalizeText(value);
  return cleaned || "General";
}

function normalizeServiceType(value) {
  const cleaned = normalizeText(value);
  return cleaned || "General";
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login again.",
    });
  }
  next();
}

async function generateComplaintId() {
  const row = await getQuery(
    `SELECT complaint_id FROM complaints WHERE complaint_id LIKE 'MVE-CMP%' ORDER BY id DESC LIMIT 1`
  );

  let nextNumber = 1;

  if (row && row.complaint_id) {
    const lastNumber = Number(String(row.complaint_id).replace("MVE-CMP", ""));
    if (Number.isFinite(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `MVE-CMP${String(nextNumber).padStart(8, "0")}`;
}

async function generateNeonComplaintId() {
  const result = await neonQuery(
    `SELECT complaint_id FROM complaints WHERE complaint_id LIKE 'MVE-CMP%' ORDER BY id DESC LIMIT 1`
  );

  let nextNumber = 1;

  if (result.rows.length && result.rows[0].complaint_id) {
    const lastNumber = Number(String(result.rows[0].complaint_id).replace("MVE-CMP", ""));
    if (Number.isFinite(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `MVE-CMP${String(nextNumber).padStart(8, "0")}`;
}

async function addActivityLog(actionType, actionDetails) {
  try {
    await runQuery(
      `INSERT INTO activity_logs (action_type, action_details) VALUES (?, ?)`,
      [actionType, actionDetails]
    );
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
}

function getCurrentMonthString() {
  const { date } = nowLocalDateTimeParts();
  return date.slice(0, 7);
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      whatsapp TEXT,
      gpay TEXT,
      role TEXT DEFAULT 'Staff',
      hourly_rate REAL DEFAULT 50,
      joining_date TEXT,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      in_time TEXT,
      out_time TEXT,
      worked_minutes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Present',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )
  `);

  db.run(`ALTER TABLE attendance_logs ADD COLUMN notes TEXT`, () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      payroll_month TEXT NOT NULL,
      total_worked_minutes INTEGER DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      base_salary REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      final_salary REAL DEFAULT 0,
      paid_status TEXT DEFAULT 'Unpaid',
      paid_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(staff_id, payroll_month),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT UNIQUE,
      complaint_type TEXT DEFAULT 'General Issue',
      complaint_status TEXT DEFAULT 'Open',
      priority TEXT DEFAULT 'Medium',
      courier_name TEXT,
      pod_number TEXT,
      reference_number TEXT,
      sender_name TEXT,
      sender_phone TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      customer_message TEXT NOT NULL,
      admin_note TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`ALTER TABLE complaints ADD COLUMN priority TEXT DEFAULT 'Medium'`, () => {});    

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT DEFAULT 'pcs',
      supplier_name TEXT,
      purchase_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      minimum_stock INTEGER DEFAULT 0,
      stock_status TEXT DEFAULT 'In Stock',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date TEXT NOT NULL,
      category TEXT NOT NULL,
      expense_name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'Cash',
      vendor_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS income_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      income_date TEXT NOT NULL,
      category TEXT NOT NULL,
      income_name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'Cash',
      customer_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS offers_whatsapp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      mobile_number TEXT NOT NULL,
      offer_title TEXT NOT NULL,
      offer_message TEXT NOT NULL,
      offer_type TEXT DEFAULT 'General',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      whatsapp_number TEXT,
      birthday TEXT,
      visit_count INTEGER DEFAULT 0,
      last_service_used TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT,
      action_details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.get("SELECT * FROM users WHERE username = ?", ["MVEXPRESS021"], (err, row) => {
    if (err) {
      console.error("User check error:", err.message);
      return;
    }

    if (!row) {
      db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
         ["MVEXPRESS021", bcrypt.hashSync("Varamonish2121", 10)],
        (insertErr) => {
          if (insertErr) {
            console.error("Default user insert error:", insertErr.message);
          } else {
            console.log("Default login created successfully.");
          }
        }
      );
    }
  });
});

/* =========================
   AUTH APIS
========================= */

app.post("/login", (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, user) => {
      if (err) {
        console.error("Login error:", err.message);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again."
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }

      let isMatch = false;

      if (String(user.password).startsWith("$2")) {
        isMatch = bcrypt.compareSync(password, user.password);
      } else {
        isMatch = password === user.password;

        if (isMatch) {
          const hashedPassword = bcrypt.hashSync(password, 10);
          db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);
        }
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username
      };

      return res.json({
        success: true,
        message: "Login successful"
      });
    }
  );
});

app.get("/check-auth", (req, res) => {
  if (req.session.user) {
    return res.json({
      loggedIn: true,
      user: req.session.user,
    });
  }

  return res.json({
    loggedIn: false,
  });
});

app.get("/api/neon-test", async (req, res) => {
  try {
    const result = await neonQuery("SELECT NOW() AS current_time");
    return res.json({
      success: true,
      message: "Neon connected successfully.",
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error("Neon test error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post("/api/neon-test-complaint", async (req, res) => {
  try {
    const complaintType = normalizeComplaintType(req.body.complaint_type);
    const priority = getComplaintPriorityByType(complaintType);
    const courierName = normalizeOptionalText(req.body.courier_name);
    const podNumber = normalizeOptionalText(req.body.pod_number);
    const referenceNumber = normalizeOptionalText(req.body.reference_number);
    const senderName = normalizeOptionalText(req.body.sender_name);
    const senderPhone = normalizeOptionalText(req.body.sender_phone);
    const receiverName = normalizeOptionalText(req.body.receiver_name);
    const receiverPhone = normalizeOptionalText(req.body.receiver_phone);
    const customerMessage = normalizeText(req.body.customer_message);

    if (customerMessage.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please enter proper complaint message."
      });
    }

    const complaintId = await generateNeonComplaintId();

    await neonQuery(
      `
      INSERT INTO complaints (
        complaint_id, complaint_type, priority, complaint_status,
        courier_name, pod_number, reference_number,
        sender_name, sender_phone, receiver_name, receiver_phone,
        customer_message, admin_note
      )
      VALUES ($1, $2, $3, 'Open', $4, $5, $6, $7, $8, $9, $10, $11, NULL)
      `,
      [
        complaintId,
        complaintType,
        priority,
        courierName,
        podNumber,
        referenceNumber,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        customerMessage
      ]
    );

    return res.json({
      success: true,
      message: "Neon complaint inserted successfully.",
      complaint_id: complaintId
    });
  } catch (error) {
    console.error("Neon complaint insert error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =========================
   DATABASE BACKUP API
========================= */

function createAutoBackup() {
  try {
    const sourcePath = path.join(__dirname, "database.sqlite");
    const backupDir = path.join(__dirname, "backups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-");

    const backupName = `auto-backup-${stamp}.sqlite`;
    const backupPath = path.join(backupDir, backupName);

    fs.copyFileSync(sourcePath, backupPath);

    console.log("Auto backup created:", backupName);

  } catch (error) {
    console.error("Auto backup error:", error.message);
  }
}

   cron.schedule("0 22 * * *", () => {
  createAutoBackup();
});

app.post("/api/backup-database", requireAuth, async (req, res) => {
  try {
    const sourcePath = path.join(__dirname, "database.sqlite");
    const backupDir = path.join(__dirname, "backups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const now = new Date();
    const stamp = now
      .toISOString()
      .replace(/[:.]/g, "-");

    const backupName = `database-backup-${stamp}.sqlite`;
    const backupPath = path.join(backupDir, backupName);

    fs.copyFileSync(sourcePath, backupPath);

    await addActivityLog(
      "DATABASE_BACKUP_CREATED",
      `Database backup created: ${backupName}`
    );

    return res.json({
      success: true,
      message: "Database backup created successfully.",
      file: backupName
    });
  } catch (error) {
    console.error("Backup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create database backup."
    });
  }
});

  app.post("/api/restore-database", requireAuth, async (req, res) => {
  try {
    const backupFile = normalizeText(req.body.backup_file || "");

    if (!backupFile) {
      return res.status(400).json({
        success: false,
        message: "Backup file name is required."
      });
    }

    if (!backupFile.endsWith(".sqlite") || backupFile.includes("..") || backupFile.includes("/") || backupFile.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid backup file name."
      });
    }

    const databasePath = path.join(__dirname, "database.sqlite");
    const backupDir = path.join(__dirname, "backups");
    const selectedBackupPath = path.join(backupDir, backupFile);

    if (!fs.existsSync(selectedBackupPath)) {
      return res.status(404).json({
        success: false,
        message: "Selected backup file not found."
      });
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-");

    const emergencyBackupName = `before-restore-backup-${stamp}.sqlite`;
    const emergencyBackupPath = path.join(backupDir, emergencyBackupName);

    fs.copyFileSync(databasePath, emergencyBackupPath);
    fs.copyFileSync(selectedBackupPath, databasePath);

    await addActivityLog(
      "DATABASE_RESTORED",
      `Database restored from ${backupFile}. Emergency backup created: ${emergencyBackupName}`
    );

    return res.json({
      success: true,
      message: "Database restored successfully. Please restart the server.",
      restored_from: backupFile,
      emergency_backup: emergencyBackupName
    });
  } catch (error) {
    console.error("Restore error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to restore database."
    });
  }
});

 app.get("/api/list-backups", requireAuth, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, "backups");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith(".sqlite"))
      .sort()
      .reverse();

    return res.json({
      success: true,
      backups: files
    });
  } catch (error) {
    console.error("List backups error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to list backups."
    });
  }
});

/* =========================
   DASHBOARD SUMMARY
========================= */

app.get("/api/dashboard-summary", requireAuth, async (req, res) => {
  try {
    const { date } = nowLocalDateTimeParts();

    const activeStaffRow = await getQuery(`SELECT COUNT(*) AS count FROM staff WHERE status = 'Active'`);
    const openComplaintsRow = await getQuery(`SELECT COUNT(*) AS count FROM complaints WHERE complaint_status IN ('Open', 'In Progress')`);
    const lowStockRow = await getQuery(`SELECT COUNT(*) AS count FROM inventory_items WHERE stock_status = 'Low Stock'`);

    const todayExpenseRow = await getQuery(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date = ?`,
      [date]
    );

    const todayIncomeRow = await getQuery(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM income_entries WHERE income_date = ?`,
      [date]
    );

    const customers = await allQuery(`SELECT * FROM customers`);

    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDate = String(today.getDate()).padStart(2, "0");

    let birthdayTodayCount = 0;
    let birthdayThisMonthCount = 0;
    let loyalCustomerCount = 0;
    let vipRepeatCount = 0;

    for (const customer of customers) {
      const birthday = String(customer.birthday || "");
      const visits = Number(customer.visit_count || 0);

      if (birthday) {
        const parts = birthday.split("-");
        if (parts.length === 3) {
          if (parts[1] === todayMonth) birthdayThisMonthCount += 1;
          if (parts[1] === todayMonth && parts[2] === todayDate) birthdayTodayCount += 1;
        }
      }

      if (visits >= 10) vipRepeatCount += 1;
      else if (visits >= 5) loyalCustomerCount += 1;
    }

    const todayIncome = Number(todayIncomeRow?.total || 0);
    const todayExpense = Number(todayExpenseRow?.total || 0);

    return res.json({
      success: true,
      data: {
        totalShipments: 0,
        openComplaints: openComplaintsRow?.count || 0,
        activeStaff: activeStaffRow?.count || 0,
        lowStockItems: lowStockRow?.count || 0,
        todayIncome,
        todayExpense,
        birthdayTodayCount,
        birthdayThisMonthCount,
        loyalCustomerCount,
        vipRepeatCount
      }
    });
  } catch (error) {
    console.error("Dashboard summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary."
    });
  }
});

/* =========================
   STAFF MANAGEMENT APIS
========================= */

app.get("/api/staff", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const status = normalizeText(req.query.status || "");

    let sql = `SELECT * FROM staff WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          name LIKE ?
          OR mobile LIKE ?
          OR whatsapp LIKE ?
          OR gpay LIKE ?
          OR role LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (status && status !== "All") {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await allQuery(sql, params);

    return res.json({
      success: true,
      staff: rows,
    });
  } catch (error) {
    console.error("Get staff error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff list.",
    });
  }
});

app.get("/api/staff/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID.",
      });
    }

    const row = await getQuery(`SELECT * FROM staff WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Staff not found.",
      });
    }

    return res.json({
      success: true,
      staff: row,
    });
  } catch (error) {
    console.error("Get one staff error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff details.",
    });
  }
});

app.post("/api/staff", requireAuth, async (req, res) => {
  try {
    const name = normalizeText(req.body.name);
    const mobile = normalizeText(req.body.mobile);
    const whatsapp = normalizeOptionalText(req.body.whatsapp);
    const gpay = normalizeOptionalText(req.body.gpay);
    const role = normalizeRole(req.body.role);
    const hourlyRate = normalizeHourlyRate(req.body.hourly_rate);
    const joiningDate = normalizeOptionalText(req.body.joining_date);
    const status = normalizeStatus(req.body.status);
    const notes = normalizeOptionalText(req.body.notes);

    if (!name) {
      return res.status(400).json({ success: false, message: "Staff name is required." });
    }

    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required." });
    }

    const result = await runQuery(
      `
      INSERT INTO staff (
        name, mobile, whatsapp, gpay, role, hourly_rate,
        joining_date, status, notes, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [name, mobile, whatsapp, gpay, role, hourlyRate, joiningDate, status, notes]
    );

    await addActivityLog(
      "STAFF_CREATED",
      `Staff created: ${name} | Mobile: ${mobile} | Role: ${role}`
    );

    return res.json({
      success: true,
      message: "Staff added successfully.",
      staffId: result.lastID,
    });
  } catch (error) {
    console.error("Create staff error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to add staff." });
  }
});

app.put("/api/staff/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    const existing = await getQuery(`SELECT * FROM staff WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    const name = normalizeText(req.body.name);
    const mobile = normalizeText(req.body.mobile);
    const whatsapp = normalizeOptionalText(req.body.whatsapp);
    const gpay = normalizeOptionalText(req.body.gpay);
    const role = normalizeRole(req.body.role);
    const hourlyRate = normalizeHourlyRate(req.body.hourly_rate);
    const joiningDate = normalizeOptionalText(req.body.joining_date);
    const status = normalizeStatus(req.body.status);
    const notes = normalizeOptionalText(req.body.notes);

    if (!name) {
      return res.status(400).json({ success: false, message: "Staff name is required." });
    }

    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required." });
    }

    await runQuery(
      `
      UPDATE staff
      SET
        name = ?,
        mobile = ?,
        whatsapp = ?,
        gpay = ?,
        role = ?,
        hourly_rate = ?,
        joining_date = ?,
        status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [name, mobile, whatsapp, gpay, role, hourlyRate, joiningDate, status, notes, id]
    );

    await addActivityLog("STAFF_UPDATED", `Staff updated: ${name} | ID: ${id}`);

    return res.json({ success: true, message: "Staff updated successfully." });
  } catch (error) {
    console.error("Update staff error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update staff." });
  }
});

app.delete("/api/staff/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    const existing = await getQuery(`SELECT * FROM staff WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    await runQuery(`DELETE FROM staff WHERE id = ?`, [id]);

    await addActivityLog("STAFF_DELETED", `Staff deleted: ${existing.name} | ID: ${id}`);

    return res.json({ success: true, message: "Staff deleted successfully." });
  } catch (error) {
    console.error("Delete staff error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete staff." });
  }
});

/* =========================
   ATTENDANCE APIS
========================= */

app.get("/api/attendance/today", requireAuth, async (req, res) => {
  try {
    const date = normalizeText(req.query.date || "") || nowLocalDateTimeParts().date;

    const rows = await allQuery(
      `
      SELECT
        s.id AS staff_id,
        s.name,
        s.mobile,
        s.whatsapp,
        s.gpay,
        s.role,
        s.hourly_rate,
        s.status AS staff_status,
        a.id AS attendance_id,
        a.attendance_date,
        a.in_time,
        a.out_time,
        a.worked_minutes,
        a.status AS attendance_status,
        a.notes AS attendance_notes
      FROM staff s
      LEFT JOIN attendance_logs a
        ON a.staff_id = s.id
        AND a.attendance_date = ?
      WHERE s.status = 'Active'
      ORDER BY s.id DESC
      `,
      [date]
    );

    const mapped = rows.map((row) => {
      const workedMinutes = Number(row.worked_minutes || 0);
      const estimatedPay = (workedMinutes / 60) * Number(row.hourly_rate || 0);
      const finalStatus = row.attendance_status || "Absent";

      return {
        ...row,
        worked_minutes: workedMinutes,
        worked_time_text: minutesToHourMinuteText(workedMinutes),
        estimated_pay: Number(estimatedPay.toFixed(2)),
        final_status: finalStatus,
        attendance_notes: row.attendance_notes || "",
        is_checked_in: !!row.in_time,
        is_checked_out: !!row.out_time,
      };
    });

    return res.json({
      success: true,
      date,
      settings: {
        shift_start_time: SHIFT_START_TIME,
        grace_minutes: SHIFT_GRACE_MINUTES,
        half_day_minutes: HALF_DAY_MINUTES,
      },
      attendance: mapped,
    });
  } catch (error) {
    console.error("Get today attendance error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch today's attendance." });
  }
});

app.post("/api/attendance/check-in/:staffId", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.params.staffId);
    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    const staff = await getQuery(`SELECT * FROM staff WHERE id = ?`, [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    if (staff.status !== "Active") {
      return res.status(400).json({ success: false, message: "Only active staff can check in." });
    }

    const { date, time } = nowLocalDateTimeParts();

    const existing = await getQuery(
      `SELECT * FROM attendance_logs WHERE staff_id = ? AND attendance_date = ?`,
      [staffId, date]
    );

    if (existing && existing.in_time) {
      return res.status(400).json({ success: false, message: "This staff is already checked in for today." });
    }

    const status = getAttendanceStatusByCheckIn(time);

    if (existing) {
      await runQuery(
        `
        UPDATE attendance_logs
        SET
          in_time = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [time, status, existing.id]
      );
    } else {
      await runQuery(
        `
        INSERT INTO attendance_logs (
          staff_id, attendance_date, in_time, out_time,
          worked_minutes, status, notes, updated_at
        )
        VALUES (?, ?, ?, NULL, 0, ?, NULL, CURRENT_TIMESTAMP)
        `,
        [staffId, date, time, status]
      );
    }

    await addActivityLog(
      "ATTENDANCE_CHECK_IN",
      `Check-in recorded: ${staff.name} | Date: ${date} | Time: ${time} | Status: ${status}`
    );

    return res.json({
      success: true,
      message: `Check-in recorded for ${staff.name} at ${time}.`,
      status,
    });
  } catch (error) {
    console.error("Check-in error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to record check-in." });
  }
});

app.post("/api/attendance/check-out/:staffId", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.params.staffId);
    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    const staff = await getQuery(`SELECT * FROM staff WHERE id = ?`, [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    const { date, time } = nowLocalDateTimeParts();

    const existing = await getQuery(
      `SELECT * FROM attendance_logs WHERE staff_id = ? AND attendance_date = ?`,
      [staffId, date]
    );

    if (!existing || !existing.in_time) {
      return res.status(400).json({ success: false, message: "Check-in not found for today. Cannot check out." });
    }

    if (existing.out_time) {
      return res.status(400).json({ success: false, message: "This staff is already checked out for today." });
    }

    if (["Leave", "Absent"].includes(existing.status)) {
      return res.status(400).json({ success: false, message: `Cannot check out because status is ${existing.status}.` });
    }

    const workedMinutes = computeWorkedMinutes(existing.in_time, time);

    if (workedMinutes <= 0) {
      return res.status(400).json({ success: false, message: "Invalid OUT time. Check-out must be after check-in." });
    }

    const finalStatus = getFinalAttendanceStatus(existing.in_time, time, workedMinutes, existing.status);

    await runQuery(
      `
      UPDATE attendance_logs
      SET
        out_time = ?,
        worked_minutes = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [time, workedMinutes, finalStatus, existing.id]
    );

    await addActivityLog(
      "ATTENDANCE_CHECK_OUT",
      `Check-out recorded: ${staff.name} | Date: ${date} | Time: ${time} | Worked: ${minutesToHourMinuteText(workedMinutes)} | Status: ${finalStatus}`
    );

    return res.json({
      success: true,
      message: `Check-out recorded for ${staff.name} at ${time}.`,
      worked_minutes: workedMinutes,
      worked_time_text: minutesToHourMinuteText(workedMinutes),
      status: finalStatus,
    });
  } catch (error) {
    console.error("Check-out error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to record check-out." });
  }
});

app.post("/api/attendance/manual-status", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.body.staff_id);
    const attendanceDate = normalizeText(req.body.attendance_date || "") || nowLocalDateTimeParts().date;
    const status = normalizeAttendanceStatus(req.body.status);
    const notes = normalizeOptionalText(req.body.notes);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    if (!["Present", "Late", "Half Day", "Leave", "Absent"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid attendance status." });
    }

    const staff = await getQuery(`SELECT * FROM staff WHERE id = ?`, [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    const existing = await getQuery(
      `SELECT * FROM attendance_logs WHERE staff_id = ? AND attendance_date = ?`,
      [staffId, attendanceDate]
    );

    let inTime = existing?.in_time || null;
    let outTime = existing?.out_time || null;
    let workedMinutes = Number(existing?.worked_minutes || 0);

    if (status === "Absent" || status === "Leave") {
      inTime = null;
      outTime = null;
      workedMinutes = 0;
    }

    if (status === "Half Day" && workedMinutes === 0) {
      workedMinutes = HALF_DAY_MINUTES;
    }

    if (existing) {
      await runQuery(
        `
        UPDATE attendance_logs
        SET
          in_time = ?,
          out_time = ?,
          worked_minutes = ?,
          status = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [inTime, outTime, workedMinutes, status, notes, existing.id]
      );
    } else {
      await runQuery(
        `
        INSERT INTO attendance_logs (
          staff_id, attendance_date, in_time, out_time,
          worked_minutes, status, notes, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [staffId, attendanceDate, inTime, outTime, workedMinutes, status, notes]
      );
    }

    await addActivityLog(
      "ATTENDANCE_MANUAL_STATUS",
      `Manual attendance status set: ${staff.name} | Date: ${attendanceDate} | Status: ${status}`
    );

    return res.json({
      success: true,
      message: `${status} marked for ${staff.name}.`,
    });
  } catch (error) {
    console.error("Manual attendance status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update attendance status." });
  }
});

app.post("/api/attendance/correct-time", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.body.staff_id);
    const attendanceDate = normalizeText(req.body.attendance_date || "") || nowLocalDateTimeParts().date;
    const inTime = normalizeText(req.body.in_time || "");
    const outTime = normalizeText(req.body.out_time || "");
    const reason = normalizeOptionalText(req.body.reason);
    const manualStatus = normalizeText(req.body.status || "");

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    const staff = await getQuery(`SELECT * FROM staff WHERE id = ?`, [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    if (!inTime && !outTime && !manualStatus) {
      return res.status(400).json({
        success: false,
        message: "Enter IN time, OUT time, or a manual status."
      });
    }

    const existing = await getQuery(
      `SELECT * FROM attendance_logs WHERE staff_id = ? AND attendance_date = ?`,
      [staffId, attendanceDate]
    );

    let finalInTime = inTime || existing?.in_time || null;
    let finalOutTime = outTime || existing?.out_time || null;
    let finalWorkedMinutes = 0;
    let finalStatus = existing?.status || "Present";

    if (manualStatus && ["Present", "Late", "Half Day", "Leave", "Absent"].includes(manualStatus)) {
      finalStatus = manualStatus;
    }

    if (finalStatus === "Absent" || finalStatus === "Leave") {
      finalInTime = null;
      finalOutTime = null;
      finalWorkedMinutes = 0;
    } else {
      if (finalInTime && finalOutTime) {
        finalWorkedMinutes = computeWorkedMinutes(finalInTime, finalOutTime);

        if (finalWorkedMinutes <= 0) {
          return res.status(400).json({
            success: false,
            message: "OUT time must be after IN time."
          });
        }

        if (!manualStatus) {
          finalStatus = getFinalAttendanceStatus(finalInTime, finalOutTime, finalWorkedMinutes, existing?.status || "");
        }
      } else if (finalInTime && !finalOutTime) {
        finalWorkedMinutes = 0;
        if (!manualStatus) {
          finalStatus = getAttendanceStatusByCheckIn(finalInTime);
        }
      } else if (!finalInTime && finalOutTime) {
        return res.status(400).json({
          success: false,
          message: "IN time is required before saving OUT time."
        });
      }
    }

    if (finalStatus === "Half Day" && finalWorkedMinutes === 0) {
      finalWorkedMinutes = HALF_DAY_MINUTES;
    }

    const notes = reason || existing?.notes || null;

    if (existing) {
      await runQuery(
        `
        UPDATE attendance_logs
        SET
          in_time = ?,
          out_time = ?,
          worked_minutes = ?,
          status = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [finalInTime, finalOutTime, finalWorkedMinutes, finalStatus, notes, existing.id]
      );
    } else {
      await runQuery(
        `
        INSERT INTO attendance_logs (
          staff_id, attendance_date, in_time, out_time,
          worked_minutes, status, notes, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [staffId, attendanceDate, finalInTime, finalOutTime, finalWorkedMinutes, finalStatus, notes]
      );
    }

    await addActivityLog(
      "ATTENDANCE_TIME_CORRECTED",
      `Attendance corrected: ${staff.name} | Date: ${attendanceDate} | IN: ${finalInTime || "-"} | OUT: ${finalOutTime || "-"} | Status: ${finalStatus} | Reason: ${notes || "-"}`
    );

    return res.json({
      success: true,
      message: `Attendance corrected for ${staff.name}.`,
      data: {
        staff_id: staffId,
        attendance_date: attendanceDate,
        in_time: finalInTime,
        out_time: finalOutTime,
        worked_minutes: finalWorkedMinutes,
        worked_time_text: minutesToHourMinuteText(finalWorkedMinutes),
        status: finalStatus
      }
    });
  } catch (error) {
    console.error("Attendance correct-time error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save corrected attendance time."
    });
  }
});

app.get("/api/attendance/monthly-summary", requireAuth, async (req, res) => {
  try {
    const requestedMonth = normalizeText(req.query.month || "");
    const month = requestedMonth || getCurrentMonthString();

    const rows = await allQuery(
      `
      SELECT
        s.id AS staff_id,
        s.name,
        s.role,
        s.hourly_rate,
        s.status AS staff_status,
        COALESCE(SUM(a.worked_minutes), 0) AS total_worked_minutes,
        COUNT(a.id) AS total_entries,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS total_late,
        SUM(CASE WHEN a.status = 'Half Day' THEN 1 ELSE 0 END) AS total_half_day,
        SUM(CASE WHEN a.status = 'Leave' THEN 1 ELSE 0 END) AS total_leave,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS total_absent
      FROM staff s
      LEFT JOIN attendance_logs a
        ON a.staff_id = s.id
        AND substr(a.attendance_date, 1, 7) = ?
      GROUP BY s.id, s.name, s.role, s.hourly_rate, s.status
      ORDER BY s.id DESC
      `,
      [month]
    );

    const summary = rows.map((row) => {
      const totalWorkedMinutes = Number(row.total_worked_minutes || 0);
      const totalPay = (totalWorkedMinutes / 60) * Number(row.hourly_rate || 0);

      return {
        ...row,
        total_worked_minutes: totalWorkedMinutes,
        total_worked_time_text: minutesToHourMinuteText(totalWorkedMinutes),
        estimated_pay: Number(totalPay.toFixed(2)),
        total_late: Number(row.total_late || 0),
        total_half_day: Number(row.total_half_day || 0),
        total_leave: Number(row.total_leave || 0),
        total_absent: Number(row.total_absent || 0),
      };
    });

    return res.json({
      success: true,
      month,
      settings: {
        shift_start_time: SHIFT_START_TIME,
        grace_minutes: SHIFT_GRACE_MINUTES,
        half_day_minutes: HALF_DAY_MINUTES,
      },
      summary,
    });
  } catch (error) {
    console.error("Monthly attendance summary error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch monthly attendance summary." });
  }
});

/* =========================
   PAYROLL APIS
========================= */

app.get("/api/payroll", requireAuth, async (req, res) => {
  try {
    const month = normalizeText(req.query.month || "") || getCurrentMonthString();

    const summaryRows = await allQuery(
      `
      SELECT
        s.id AS staff_id,
        s.name,
        s.role,
        s.hourly_rate,
        s.status AS staff_status,
        COALESCE(SUM(a.worked_minutes), 0) AS total_worked_minutes
      FROM staff s
      LEFT JOIN attendance_logs a
        ON a.staff_id = s.id
        AND substr(a.attendance_date, 1, 7) = ?
      GROUP BY s.id, s.name, s.role, s.hourly_rate, s.status
      ORDER BY s.id DESC
      `,
      [month]
    );

    const payrollRows = [];

    for (const row of summaryRows) {
      const totalWorkedMinutes = Number(row.total_worked_minutes || 0);
      const hourlyRate = Number(row.hourly_rate || 0);
      const baseSalary = Number(((totalWorkedMinutes / 60) * hourlyRate).toFixed(2));

      const savedPayroll = await getQuery(
        `SELECT * FROM payroll_records WHERE staff_id = ? AND payroll_month = ?`,
        [row.staff_id, month]
      );

      const bonus = Number(savedPayroll?.bonus || 0);
      const deduction = Number(savedPayroll?.deduction || 0);
      const finalSalary = Number((baseSalary + bonus - deduction).toFixed(2));

      payrollRows.push({
        staff_id: row.staff_id,
        name: row.name,
        role: row.role,
        hourly_rate: hourlyRate,
        total_worked_minutes: totalWorkedMinutes,
        total_worked_time_text: minutesToHourMinuteText(totalWorkedMinutes),
        base_salary: baseSalary,
        bonus,
        deduction,
        final_salary: finalSalary,
        paid_status: savedPayroll?.paid_status || "Unpaid",
        paid_date: savedPayroll?.paid_date || null,
        notes: savedPayroll?.notes || "",
        staff_status: row.staff_status,
      });
    }

    return res.json({
      success: true,
      month,
      payroll: payrollRows,
    });
  } catch (error) {
    console.error("Get payroll error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch payroll data." });
  }
});

app.post("/api/payroll/save", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.body.staff_id);
    const payrollMonth = normalizeText(req.body.payroll_month || "");
    const bonus = normalizeMoney(req.body.bonus);
    const deduction = normalizeMoney(req.body.deduction);
    const notes = normalizeOptionalText(req.body.notes);

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    if (!payrollMonth) {
      return res.status(400).json({ success: false, message: "Payroll month is required." });
    }

    const staff = await getQuery(`SELECT * FROM staff WHERE id = ?`, [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found." });
    }

    const attendanceRow = await getQuery(
      `
      SELECT COALESCE(SUM(worked_minutes), 0) AS total_worked_minutes
      FROM attendance_logs
      WHERE staff_id = ?
        AND substr(attendance_date, 1, 7) = ?
      `,
      [staffId, payrollMonth]
    );

    const totalWorkedMinutes = Number(attendanceRow?.total_worked_minutes || 0);
    const hourlyRate = Number(staff.hourly_rate || 0);
    const baseSalary = Number(((totalWorkedMinutes / 60) * hourlyRate).toFixed(2));
    const finalSalary = Number((baseSalary + bonus - deduction).toFixed(2));

    const existing = await getQuery(
      `SELECT * FROM payroll_records WHERE staff_id = ? AND payroll_month = ?`,
      [staffId, payrollMonth]
    );

    if (existing) {
      await runQuery(
        `
        UPDATE payroll_records
        SET
          total_worked_minutes = ?,
          hourly_rate = ?,
          base_salary = ?,
          bonus = ?,
          deduction = ?,
          final_salary = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE staff_id = ? AND payroll_month = ?
        `,
        [totalWorkedMinutes, hourlyRate, baseSalary, bonus, deduction, finalSalary, notes, staffId, payrollMonth]
      );
    } else {
      await runQuery(
        `
        INSERT INTO payroll_records (
          staff_id, payroll_month, total_worked_minutes, hourly_rate,
          base_salary, bonus, deduction, final_salary, notes, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [staffId, payrollMonth, totalWorkedMinutes, hourlyRate, baseSalary, bonus, deduction, finalSalary, notes]
      );
    }

    await addActivityLog(
      "PAYROLL_SAVED",
      `Payroll saved: ${staff.name} | Month: ${payrollMonth} | Final Salary: ₹${finalSalary}`
    );

    return res.json({
      success: true,
      message: `Payroll saved for ${staff.name}.`,
      data: {
        staff_id: staffId,
        payroll_month: payrollMonth,
        total_worked_minutes: totalWorkedMinutes,
        hourly_rate: hourlyRate,
        base_salary: baseSalary,
        bonus,
        deduction,
        final_salary: finalSalary,
      },
    });
  } catch (error) {
    console.error("Save payroll error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to save payroll." });
  }
});

app.post("/api/payroll/mark-paid", requireAuth, async (req, res) => {
  try {
    const staffId = Number(req.body.staff_id);
    const payrollMonth = normalizeText(req.body.payroll_month || "");
    const paidDate = normalizeText(req.body.paid_date || "") || nowLocalDateTimeParts().date;

    if (!Number.isInteger(staffId) || staffId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid staff ID." });
    }

    if (!payrollMonth) {
      return res.status(400).json({ success: false, message: "Payroll month is required." });
    }

    const existing = await getQuery(
      `SELECT * FROM payroll_records WHERE staff_id = ? AND payroll_month = ?`,
      [staffId, payrollMonth]
    );

    if (!existing) {
      return res.status(404).json({ success: false, message: "Save payroll first before marking as paid." });
    }

    await runQuery(
      `
      UPDATE payroll_records
      SET
        paid_status = 'Paid',
        paid_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE staff_id = ? AND payroll_month = ?
      `,
      [paidDate, staffId, payrollMonth]
    );

    const staff = await getQuery(`SELECT name FROM staff WHERE id = ?`, [staffId]);

    await addActivityLog(
      "PAYROLL_MARKED_PAID",
      `Payroll marked paid: ${staff?.name || staffId} | Month: ${payrollMonth} | Paid Date: ${paidDate}`
    );

    return res.json({ success: true, message: "Payroll marked as paid." });
  } catch (error) {
    console.error("Mark payroll paid error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to mark payroll as paid." });
  }
});

/* =========================
   COMPLAINTS APIS
========================= */

app.post("/api/complaints", async (req, res) => {
  try {
    const complaintType = normalizeComplaintType(req.body.complaint_type);
    const priority = getComplaintPriorityByType(complaintType);
    const courierName = normalizeOptionalText(req.body.courier_name);
    const podNumber = normalizeOptionalText(req.body.pod_number);
    const referenceNumber = normalizeOptionalText(req.body.reference_number);
    const senderName = normalizeOptionalText(req.body.sender_name);
    const senderPhone = normalizeOptionalText(req.body.sender_phone);
    const receiverName = normalizeOptionalText(req.body.receiver_name);
    const receiverPhone = normalizeOptionalText(req.body.receiver_phone);
    const customerMessage = normalizeText(req.body.customer_message);

    if (customerMessage.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please enter proper complaint message."
      });
    }

    if (senderPhone && !/^[0-9]{10}$/.test(senderPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender phone number."
      });
    }

    if (receiverPhone && !/^[0-9]{10}$/.test(receiverPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver phone number."
      });
    }

    if (!podNumber && !referenceNumber) {
      return res.status(400).json({
        success: false,
        message: "POD or Reference number required."
      });
    }

   // Check POD separately
if (podNumber) {
  const podDuplicate = await neonQuery(
    `
    SELECT complaint_id
    FROM complaints
    WHERE complaint_status IN ('Open', 'In Progress')
    AND pod_number = $1
    LIMIT 1
    `,
    [podNumber]
  );

  if (podDuplicate.rows.length) {
    return res.status(409).json({
      success: false,
      message: `Existing complaint already found for this POD: ${podNumber}. Complaint ID: ${podDuplicate.rows[0].complaint_id}`,
      complaint_id: podDuplicate.rows[0].complaint_id
    });
  }
}

// Check Reference separately
if (referenceNumber) {
  const refDuplicate = await neonQuery(
    `
    SELECT complaint_id
    FROM complaints
    WHERE complaint_status IN ('Open', 'In Progress')
    AND reference_number = $1
    LIMIT 1
    `,
    [referenceNumber]
  );

  if (refDuplicate.rows.length) {
    return res.status(409).json({
      success: false,
      message: `Existing complaint already found for this Reference: ${referenceNumber}. Complaint ID: ${refDuplicate.rows[0].complaint_id}`,
      complaint_id: refDuplicate.rows[0].complaint_id
    });
  }
}

    const complaintId = await generateNeonComplaintId();

    await neonQuery(
      `
      INSERT INTO complaints (
        complaint_id, complaint_type, priority, complaint_status,
        courier_name, pod_number, reference_number,
        sender_name, sender_phone, receiver_name, receiver_phone,
        customer_message, admin_note
      )
      VALUES ($1, $2, $3, 'Open', $4, $5, $6, $7, $8, $9, $10, $11, NULL)
      `,
      [
        complaintId,
        complaintType,
        priority,
        courierName,
        podNumber,
        referenceNumber,
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        customerMessage
      ]
    );

    await addActivityLog(
      "COMPLAINT_CREATED",
      `Neon complaint submitted: ${complaintId} | POD: ${podNumber || "-"} | Reference: ${referenceNumber || "-"}`
    );

    return res.json({
      success: true,
      message: "Complaint submitted successfully.",
      complaint_id: complaintId
    });
  } catch (error) {
    console.error("Create Neon complaint error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint."
    });
  }
});

app.get("/api/complaint-status", async (req, res) => {
  try {
    const complaintId = normalizeText(req.query.complaint_id || "");

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Complaint ID is required."
      });
    }

    const result = await neonQuery(
      `
      SELECT 
        complaint_id,
        complaint_type,
        priority,
        complaint_status,
        courier_name,
        pod_number,
        reference_number,
        customer_message,
        admin_note,
        submitted_at
      FROM complaints
      WHERE complaint_id = $1
      `,
      [complaintId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    return res.json({
      success: true,
      complaint: result.rows[0]
    });
  } catch (error) {
    console.error("Neon complaint status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint status."
    });
  }
});

app.get("/api/complaints", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const status = normalizeText(req.query.status || "");

    let sql = `SELECT * FROM complaints WHERE 1=1`;
    const params = [];
    let index = 1;

    if (search) {
      sql += `
        AND (
          complaint_id ILIKE $${index}
          OR pod_number ILIKE $${index}
          OR reference_number ILIKE $${index}
          OR courier_name ILIKE $${index}
          OR sender_name ILIKE $${index}
          OR sender_phone ILIKE $${index}
          OR receiver_name ILIKE $${index}
          OR receiver_phone ILIKE $${index}
          OR customer_message ILIKE $${index}
        )
      `;
      params.push(`%${search}%`);
      index++;
    }

    if (status && status !== "All") {
      sql += ` AND complaint_status = $${index}`;
      params.push(status);
      index++;
    }

    sql += ` ORDER BY id DESC`;

    const result = await neonQuery(sql, params);

    return res.json({
      success: true,
      complaints: result.rows
    });
  } catch (error) {
    console.error("Get Neon complaints error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints."
    });
  }
});

app.get("/api/complaints/:complaintId", requireAuth, async (req, res) => {
  try {
    const complaintId = normalizeText(req.params.complaintId);

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID."
      });
    }

    const result = await neonQuery(
      `SELECT * FROM complaints WHERE complaint_id = $1`,
      [complaintId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    return res.json({
      success: true,
      complaint: result.rows[0]
    });
  } catch (error) {
    console.error("Get one Neon complaint error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint details."
    });
  }
});

app.get("/api/export-complaints", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const status = normalizeText(req.query.status || "");

    let sql = `SELECT * FROM complaints WHERE 1=1`;
    const params = [];
    let index = 1;

    if (search) {
      sql += `
        AND (
          complaint_id ILIKE $${index}
          OR pod_number ILIKE $${index}
          OR reference_number ILIKE $${index}
          OR courier_name ILIKE $${index}
          OR sender_name ILIKE $${index}
          OR sender_phone ILIKE $${index}
          OR receiver_name ILIKE $${index}
          OR receiver_phone ILIKE $${index}
          OR customer_message ILIKE $${index}
        )
      `;
      params.push(`%${search}%`);
      index++;
    }

    if (status && status !== "All") {
      sql += ` AND complaint_status = $${index}`;
      params.push(status);
      index++;
    }

    sql += ` ORDER BY submitted_at DESC`;

    const result = await neonQuery(sql, params);
    const rows = result.rows;

    if (!rows || rows.length === 0) {
      return res.status(404).send("No complaints to export");
    }

    function csvSafe(value) {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    }

    const headers = [
      "Complaint ID",
      "Type",
      "Priority",
      "Status",
      "Courier",
      "POD",
      "Reference",
      "Sender Name",
      "Sender Phone",
      "Receiver Name",
      "Receiver Phone",
      "Customer Message",
      "Admin Note",
      "Submitted At"
    ];

    const csvRows = rows.map((r) => [
      r.complaint_id,
      r.complaint_type,
      r.priority || "Medium",
      r.complaint_status,
      r.courier_name,
      r.pod_number,
      r.reference_number,
      r.sender_name,
      r.sender_phone,
      r.receiver_name,
      r.receiver_phone,
      r.customer_message,
      r.admin_note,
      r.submitted_at
    ].map(csvSafe).join(","));

    const csv = [
      headers.map(csvSafe).join(","),
      ...csvRows
    ].join("\n");

    const fileName = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    return res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export complaints error:", error.message);
    return res.status(500).send("Export failed: " + error.message);
  }
});

app.get("/api/export-complaints-pdf", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const status = normalizeText(req.query.status || "");

    let sql = `SELECT * FROM complaints WHERE 1=1`;
    const params = [];
    let index = 1;

    if (search) {
      sql += `
        AND (
          complaint_id ILIKE $${index}
          OR pod_number ILIKE $${index}
          OR reference_number ILIKE $${index}
          OR courier_name ILIKE $${index}
          OR sender_name ILIKE $${index}
          OR sender_phone ILIKE $${index}
          OR receiver_name ILIKE $${index}
          OR receiver_phone ILIKE $${index}
          OR customer_message ILIKE $${index}
        )
      `;
      params.push(`%${search}%`);
      index++;
    }

    if (status && status !== "All") {
      sql += ` AND complaint_status = $${index}`;
      params.push(status);
      index++;
    }

    sql += ` ORDER BY submitted_at DESC`;

    const result = await neonQuery(sql, params);
    const rows = result.rows;

    const doc = new PDFDocument({
      size: "A4",
      margin: 40
    });

    const fileName = `complaints-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    doc.pipe(res);

    doc.fontSize(20).text("MVEXPRESS Complaints Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    if (!rows.length) {
      doc.fontSize(12).text("No complaints found.");
      doc.end();
      return;
    }

    rows.forEach((r, index) => {
      if (doc.y > 700) doc.addPage();

      doc
        .fontSize(13)
        .text(`${index + 1}. ${r.complaint_id || "-"}`, { continued: true })
        .fontSize(10)
        .text(`   Status: ${r.complaint_status || "-"}   Priority: ${r.priority || "Medium"}`);

      doc.fontSize(10).text(`Type: ${r.complaint_type || "-"}`);
      doc.text(`Courier: ${r.courier_name || "-"} | POD: ${r.pod_number || "-"} | Ref: ${r.reference_number || "-"}`);
      doc.text(`Sender: ${r.sender_name || "-"} (${r.sender_phone || "-"})`);
      doc.text(`Receiver: ${r.receiver_name || "-"} (${r.receiver_phone || "-"})`);
      doc.text(`Submitted: ${r.submitted_at || "-"}`);
      doc.moveDown(0.4);
      doc.text(`Customer Message: ${r.customer_message || "-"}`);
      doc.text(`Admin Note: ${r.admin_note || "-"}`);
      doc.moveDown(0.8);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(0.8);
    });

    doc.end();
  } catch (error) {
    console.error("PDF export error:", error.message);
    res.status(500).send("PDF export failed: " + error.message);
  }
});

app.put("/api/complaints/:complaintId", requireAuth, async (req, res) => {
  try {
    const complaintId = normalizeText(req.params.complaintId);
    const complaintStatus = normalizeComplaintStatus(req.body.complaint_status);
    const adminNote = normalizeOptionalText(req.body.admin_note);

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID."
      });
    }

    const existing = await neonQuery(
      `SELECT * FROM complaints WHERE complaint_id = $1`,
      [complaintId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found."
      });
    }

    await neonQuery(
      `
      UPDATE complaints
      SET
        complaint_status = $1,
        admin_note = $2
      WHERE complaint_id = $3
      `,
      [complaintStatus, adminNote, complaintId]
    );

    await addActivityLog(
      "COMPLAINT_UPDATED",
      `Neon complaint updated: ${complaintId} | Status: ${complaintStatus}`
    );

    return res.json({
      success: true,
      message: "Complaint updated successfully."
    });
  } catch (error) {
    console.error("Update Neon complaint error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update complaint."
    });
  }
});

/* =========================
   INVENTORY APIS
========================= */

app.get("/api/inventory", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const status = normalizeText(req.query.status || "");

    let sql = `SELECT * FROM inventory_items WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          item_name LIKE ?
          OR category LIKE ?
          OR supplier_name LIKE ?
          OR unit LIKE ?
          OR notes LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (status && status !== "All") {
      sql += ` AND stock_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await allQuery(sql, params);

    return res.json({
      success: true,
      inventory: rows,
    });
  } catch (error) {
    console.error("Get inventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory items.",
    });
  }
});

app.get("/api/inventory/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid inventory ID." });
    }

    const row = await getQuery(`SELECT * FROM inventory_items WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }

    return res.json({
      success: true,
      item: row,
    });
  } catch (error) {
    console.error("Get one inventory item error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory item.",
    });
  }
});

app.post("/api/inventory", requireAuth, async (req, res) => {
  try {
    const itemName = normalizeText(req.body.item_name);
    const category = normalizeText(req.body.category);
    const unit = normalizeText(req.body.unit || "pcs") || "pcs";
    const supplierName = normalizeOptionalText(req.body.supplier_name);
    const purchasePrice = normalizeMoney(req.body.purchase_price);
    const sellingPrice = normalizeMoney(req.body.selling_price);
    const currentStock = normalizeInteger(req.body.current_stock, 0);
    const minimumStock = normalizeInteger(req.body.minimum_stock, 0);
    const notes = normalizeOptionalText(req.body.notes);
    const stockStatus = normalizeInventoryStatus(currentStock, minimumStock);

    if (!itemName) {
      return res.status(400).json({ success: false, message: "Item name is required." });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    const result = await runQuery(
      `
      INSERT INTO inventory_items (
        item_name, category, unit, supplier_name, purchase_price, selling_price,
        current_stock, minimum_stock, stock_status, notes, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        itemName,
        category,
        unit,
        supplierName,
        purchasePrice,
        sellingPrice,
        currentStock,
        minimumStock,
        stockStatus,
        notes,
      ]
    );

    await addActivityLog(
      "INVENTORY_CREATED",
      `Inventory item created: ${itemName} | Category: ${category} | Stock: ${currentStock}`
    );

    return res.json({
      success: true,
      message: "Inventory item added successfully.",
      itemId: result.lastID,
    });
  } catch (error) {
    console.error("Create inventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add inventory item.",
    });
  }
});

app.put("/api/inventory/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid inventory ID." });
    }

    const existing = await getQuery(`SELECT * FROM inventory_items WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }

    const itemName = normalizeText(req.body.item_name);
    const category = normalizeText(req.body.category);
    const unit = normalizeText(req.body.unit || "pcs") || "pcs";
    const supplierName = normalizeOptionalText(req.body.supplier_name);
    const purchasePrice = normalizeMoney(req.body.purchase_price);
    const sellingPrice = normalizeMoney(req.body.selling_price);
    const currentStock = normalizeInteger(req.body.current_stock, 0);
    const minimumStock = normalizeInteger(req.body.minimum_stock, 0);
    const notes = normalizeOptionalText(req.body.notes);
    const stockStatus = normalizeInventoryStatus(currentStock, minimumStock);

    if (!itemName) {
      return res.status(400).json({ success: false, message: "Item name is required." });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    await runQuery(
      `
      UPDATE inventory_items
      SET
        item_name = ?,
        category = ?,
        unit = ?,
        supplier_name = ?,
        purchase_price = ?,
        selling_price = ?,
        current_stock = ?,
        minimum_stock = ?,
        stock_status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        itemName,
        category,
        unit,
        supplierName,
        purchasePrice,
        sellingPrice,
        currentStock,
        minimumStock,
        stockStatus,
        notes,
        id,
      ]
    );

    await addActivityLog(
      "INVENTORY_UPDATED",
      `Inventory item updated: ${itemName} | ID: ${id} | Stock: ${currentStock}`
    );

    return res.json({
      success: true,
      message: "Inventory item updated successfully.",
    });
  } catch (error) {
    console.error("Update inventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory item.",
    });
  }
});

app.delete("/api/inventory/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid inventory ID." });
    }

    const existing = await getQuery(`SELECT * FROM inventory_items WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }

    await runQuery(`DELETE FROM inventory_items WHERE id = ?`, [id]);

    await addActivityLog(
      "INVENTORY_DELETED",
      `Inventory item deleted: ${existing.item_name} | ID: ${id}`
    );

    return res.json({
      success: true,
      message: "Inventory item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete inventory error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inventory item.",
    });
  }
});

/* =========================
   EXPENSES APIS
========================= */

app.get("/api/expenses", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const category = normalizeText(req.query.category || "");
    const startDate = normalizeText(req.query.start_date || "");
    const endDate = normalizeText(req.query.end_date || "");

    let sql = `SELECT * FROM expenses WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          expense_name LIKE ?
          OR category LIKE ?
          OR vendor_name LIKE ?
          OR payment_mode LIKE ?
          OR notes LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (category && category !== "All") {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (startDate) {
      sql += ` AND expense_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND expense_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY expense_date DESC, id DESC`;

    const rows = await allQuery(sql, params);

    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return res.json({
      success: true,
      expenses: rows,
      total_amount: Number(totalAmount.toFixed(2)),
    });
  } catch (error) {
    console.error("Get expenses error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses.",
    });
  }
});

app.get("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const row = await getQuery(`SELECT * FROM expenses WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.json({
      success: true,
      expense: row,
    });
  } catch (error) {
    console.error("Get one expense error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense.",
    });
  }
});

app.post("/api/expenses", requireAuth, async (req, res) => {
  try {
    const expenseDate = normalizeText(req.body.expense_date || "") || nowLocalDateTimeParts().date;
    const category = normalizeExpenseCategory(req.body.category);
    const expenseName = normalizeText(req.body.expense_name);
    const amount = normalizeMoney(req.body.amount);
    const paymentMode = normalizePaymentMode(req.body.payment_mode);
    const vendorName = normalizeOptionalText(req.body.vendor_name);
    const notes = normalizeOptionalText(req.body.notes);

    if (!expenseName) {
      return res.status(400).json({ success: false, message: "Expense name is required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0." });
    }

    const result = await runQuery(
      `
      INSERT INTO expenses (
        expense_date, category, expense_name, amount,
        payment_mode, vendor_name, notes, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [expenseDate, category, expenseName, amount, paymentMode, vendorName, notes]
    );

    await addActivityLog(
      "EXPENSE_CREATED",
      `Expense created: ${expenseName} | Amount: ₹${amount} | Date: ${expenseDate}`
    );

    return res.json({
      success: true,
      message: "Expense added successfully.",
      expenseId: result.lastID,
    });
  } catch (error) {
    console.error("Create expense error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to add expense." });
  }
});

app.put("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid expense ID." });
    }

    const existing = await getQuery(`SELECT * FROM expenses WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }

    const expenseDate = normalizeText(req.body.expense_date || "") || nowLocalDateTimeParts().date;
    const category = normalizeExpenseCategory(req.body.category);
    const expenseName = normalizeText(req.body.expense_name);
    const amount = normalizeMoney(req.body.amount);
    const paymentMode = normalizePaymentMode(req.body.payment_mode);
    const vendorName = normalizeOptionalText(req.body.vendor_name);
    const notes = normalizeOptionalText(req.body.notes);

    if (!expenseName) {
      return res.status(400).json({ success: false, message: "Expense name is required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0." });
    }

    await runQuery(
      `
      UPDATE expenses
      SET
        expense_date = ?,
        category = ?,
        expense_name = ?,
        amount = ?,
        payment_mode = ?,
        vendor_name = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [expenseDate, category, expenseName, amount, paymentMode, vendorName, notes, id]
    );

    await addActivityLog(
      "EXPENSE_UPDATED",
      `Expense updated: ${expenseName} | ID: ${id} | Amount: ₹${amount}`
    );

    return res.json({
      success: true,
      message: "Expense updated successfully.",
    });
  } catch (error) {
    console.error("Update expense error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update expense." });
  }
});

app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid expense ID." });
    }

    const existing = await getQuery(`SELECT * FROM expenses WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }

    await runQuery(`DELETE FROM expenses WHERE id = ?`, [id]);

    await addActivityLog(
      "EXPENSE_DELETED",
      `Expense deleted: ${existing.expense_name} | ID: ${id}`
    );

    return res.json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete expense." });
  }
});

/* =========================
   INCOME APIS
========================= */

app.get("/api/income", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const category = normalizeText(req.query.category || "");
    const startDate = normalizeText(req.query.start_date || "");
    const endDate = normalizeText(req.query.end_date || "");

    let sql = `SELECT * FROM income_entries WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          income_name LIKE ?
          OR category LIKE ?
          OR customer_name LIKE ?
          OR payment_mode LIKE ?
          OR notes LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (category && category !== "All") {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (startDate) {
      sql += ` AND income_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND income_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY income_date DESC, id DESC`;

    const rows = await allQuery(sql, params);
    const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return res.json({
      success: true,
      income: rows,
      total_amount: Number(totalAmount.toFixed(2)),
    });
  } catch (error) {
    console.error("Get income error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch income entries.",
    });
  }
});

app.get("/api/income/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid income ID.",
      });
    }

    const row = await getQuery(`SELECT * FROM income_entries WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Income entry not found.",
      });
    }

    return res.json({
      success: true,
      income: row,
    });
  } catch (error) {
    console.error("Get one income error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch income entry.",
    });
  }
});

app.post("/api/income", requireAuth, async (req, res) => {
  try {
    const incomeDate = normalizeText(req.body.income_date || "") || nowLocalDateTimeParts().date;
    const category = normalizeIncomeCategory(req.body.category);
    const incomeName = normalizeText(req.body.income_name);
    const amount = normalizeMoney(req.body.amount);
    const paymentMode = normalizePaymentMode(req.body.payment_mode);
    const customerName = normalizeOptionalText(req.body.customer_name);
    const notes = normalizeOptionalText(req.body.notes);

    if (!incomeName) {
      return res.status(400).json({
        success: false,
        message: "Income name is required."
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0."
      });
    }

    const result = await runQuery(
      `
      INSERT INTO income_entries (
        income_date, category, income_name, amount,
        payment_mode, customer_name, notes, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [incomeDate, category, incomeName, amount, paymentMode, customerName, notes]
    );

    if (customerName) {
  const existingCustomer = await getQuery(
    `SELECT * FROM customers WHERE customer_name = ?`,
    [customerName]
  );

  if (existingCustomer) {
    await runQuery(
      `
      UPDATE customers
      SET
        visit_count = COALESCE(visit_count, 0) + 1,
        last_service_used = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [category, existingCustomer.id]
    );
  } else {
    await runQuery(
      `
      INSERT INTO customers (
        customer_name,
        mobile_number,
        whatsapp_number,
        birthday,
        visit_count,
        last_service_used,
        address,
        notes,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        customerName,
        "Not Provided",
        null,
        null,
        1,
        category,
        null,
        "Auto-created from income entry"
      ]
    );
  }
}

    await addActivityLog(
      "INCOME_CREATED",
      `Income created: ${incomeName} | Amount: ₹${amount} | Date: ${incomeDate}`
    );

    return res.json({
      success: true,
      message: "Income added successfully.",
      incomeId: result.lastID
    });
  } catch (error) {
    console.error("Create income error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to add income."
    });
  }
});

app.put("/api/income/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid income ID." });
    }

    const existing = await getQuery(`SELECT * FROM income_entries WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Income entry not found." });
    }

    const incomeDate = normalizeText(req.body.income_date || "") || nowLocalDateTimeParts().date;
    const category = normalizeIncomeCategory(req.body.category);
    const incomeName = normalizeText(req.body.income_name);
    const amount = normalizeMoney(req.body.amount);
    const paymentMode = normalizePaymentMode(req.body.payment_mode);
    const customerName = normalizeOptionalText(req.body.customer_name);
    const notes = normalizeOptionalText(req.body.notes);

    if (!incomeName) {
      return res.status(400).json({ success: false, message: "Income name is required." });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0." });
    }

    await runQuery(
      `
      UPDATE income_entries
      SET
        income_date = ?,
        category = ?,
        income_name = ?,
        amount = ?,
        payment_mode = ?,
        customer_name = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [incomeDate, category, incomeName, amount, paymentMode, customerName, notes, id]
    );

    if (customerName) {
      const existingCustomer = await getQuery(
        `SELECT * FROM customers WHERE customer_name = ?`,
        [customerName]
      );

      if (existingCustomer) {
        await runQuery(
          `
          UPDATE customers
          SET
            visit_count = COALESCE(visit_count, 0) + 1,
            last_service_used = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
          [category, existingCustomer.id]
        );
      } else {
        await runQuery(
          `
          INSERT INTO customers (
            customer_name,
            mobile_number,
            whatsapp_number,
            birthday,
            visit_count,
            last_service_used,
            address,
            notes,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `,
          [
            customerName,
            "Not Provided",
            null,
            null,
            1,
            category,
            null,
            "Auto-created from income entry"
          ]
        );
      }
    }

    await addActivityLog(
      "INCOME_UPDATED",
      `Income updated: ${incomeName} | ID: ${id} | Amount: ₹${amount}`
    );

    return res.json({
      success: true,
      message: "Income updated successfully."
    });
  } catch (error) {
    console.error("Update income error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update income."
    });
  }
});

app.delete("/api/income/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid income ID." });
    }

    const existing = await getQuery(`SELECT * FROM income_entries WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Income entry not found." });
    }

    await runQuery(`DELETE FROM income_entries WHERE id = ?`, [id]);

    await addActivityLog(
      "INCOME_DELETED",
      `Income deleted: ${existing.income_name} | ID: ${id}`
    );

    return res.json({
      success: true,
      message: "Income deleted successfully.",
    });
  } catch (error) {
    console.error("Delete income error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete income." });
  }
});

/* =========================
   PROFIT & LOSS APIS
========================= */

app.get("/api/profit-loss", requireAuth, async (req, res) => {
  try {
    const month = normalizeText(req.query.month || "") || getCurrentMonthString();

    const expenseRow = await getQuery(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_expense
      FROM expenses
      WHERE substr(expense_date, 1, 7) = ?
      `,
      [month]
    );

    const payrollRow = await getQuery(
      `
      SELECT COALESCE(SUM(final_salary), 0) AS total_payroll
      FROM payroll_records
      WHERE payroll_month = ?
      `,
      [month]
    );

    const totalExpense = Number(expenseRow?.total_expense || 0);
    const totalPayroll = Number(payrollRow?.total_payroll || 0);

    // for now income is manual zero until income module is built
        const incomeRow = await getQuery(
      `
      SELECT COALESCE(SUM(amount), 0) AS total_income
      FROM income_entries
      WHERE substr(income_date, 1, 7) = ?
      `,
      [month]
    );

    const totalIncome = Number(incomeRow?.total_income || 0);

    const totalOutflow = Number((totalExpense + totalPayroll).toFixed(2));
    const netProfit = Number((totalIncome - totalOutflow).toFixed(2));

    const expenseBreakdown = await allQuery(
      `
      SELECT
        category,
        COUNT(*) AS total_entries,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM expenses
      WHERE substr(expense_date, 1, 7) = ?
      GROUP BY category
      ORDER BY total_amount DESC
      `,
      [month]
    );

    return res.json({
      success: true,
      month,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        total_payroll: totalPayroll,
        total_outflow: totalOutflow,
        net_profit: netProfit
      },
      expense_breakdown: expenseBreakdown
    });
  } catch (error) {
    console.error("Profit loss error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load profit and loss data."
    });
  }
});

/* =========================
   CUSTOMER MANAGEMENT APIS
========================= */

app.get("/api/customers", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const serviceType = normalizeText(req.query.service_type || "");

    let sql = `SELECT * FROM customers WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          customer_name LIKE ?
          OR mobile_number LIKE ?
          OR whatsapp_number LIKE ?
          OR last_service_used LIKE ?
          OR address LIKE ?
          OR notes LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (serviceType && serviceType !== "All") {
      sql += ` AND last_service_used = ?`;
      params.push(serviceType);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await allQuery(sql, params);

    return res.json({
      success: true,
      customers: rows
    });
  } catch (error) {
    console.error("Get customers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers."
    });
  }
});

app.get("/api/customers/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID."
      });
    }

    const row = await getQuery(`SELECT * FROM customers WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Customer not found."
      });
    }

    return res.json({
      success: true,
      customer: row
    });
  } catch (error) {
    console.error("Get one customer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer."
    });
  }
});

app.post("/api/customers", requireAuth, async (req, res) => {
  try {
    const customerName = normalizeText(req.body.customer_name);
    const mobileNumber = normalizeText(req.body.mobile_number);
    const whatsappNumber = normalizeOptionalText(req.body.whatsapp_number);
    const birthday = normalizeOptionalText(req.body.birthday);
    const visitCount = normalizeInteger(req.body.visit_count, 0);
    const lastServiceUsed = normalizeServiceType(req.body.last_service_used);
    const address = normalizeOptionalText(req.body.address);
    const notes = normalizeOptionalText(req.body.notes);

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required."
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    const result = await runQuery(
      `
      INSERT INTO customers (
        customer_name, mobile_number, whatsapp_number, birthday,
        visit_count, last_service_used, address, notes, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [customerName, mobileNumber, whatsappNumber, birthday, visitCount, lastServiceUsed, address, notes]
    );

    await addActivityLog(
      "CUSTOMER_CREATED",
      `Customer created: ${customerName} | Mobile: ${mobileNumber} | Service: ${lastServiceUsed}`
    );

    return res.json({
      success: true,
      message: "Customer saved successfully.",
      customerId: result.lastID
    });
  } catch (error) {
    console.error("Create customer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save customer."
    });
  }
});

app.put("/api/customers/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID."
      });
    }

    const existing = await getQuery(`SELECT * FROM customers WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found."
      });
    }

    const customerName = normalizeText(req.body.customer_name);
    const mobileNumber = normalizeText(req.body.mobile_number);
    const whatsappNumber = normalizeOptionalText(req.body.whatsapp_number);
    const birthday = normalizeOptionalText(req.body.birthday);
    const visitCount = normalizeInteger(req.body.visit_count, 0);
    const lastServiceUsed = normalizeServiceType(req.body.last_service_used);
    const address = normalizeOptionalText(req.body.address);
    const notes = normalizeOptionalText(req.body.notes);

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required."
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    await runQuery(
      `
      UPDATE customers
      SET
        customer_name = ?,
        mobile_number = ?,
        whatsapp_number = ?,
        birthday = ?,
        visit_count = ?,
        last_service_used = ?,
        address = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [customerName, mobileNumber, whatsappNumber, birthday, visitCount, lastServiceUsed, address, notes, id]
    );

    await addActivityLog(
      "CUSTOMER_UPDATED",
      `Customer updated: ${customerName} | ID: ${id} | Mobile: ${mobileNumber}`
    );

    return res.json({
      success: true,
      message: "Customer updated successfully."
    });
  } catch (error) {
    console.error("Update customer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer."
    });
  }
});

app.delete("/api/customers/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID."
      });
    }

    const existing = await getQuery(`SELECT * FROM customers WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Customer not found."
      });
    }

    await runQuery(`DELETE FROM customers WHERE id = ?`, [id]);

    await addActivityLog(
      "CUSTOMER_DELETED",
      `Customer deleted: ${existing.customer_name} | ID: ${id}`
    );

    return res.json({
      success: true,
      message: "Customer deleted successfully."
    });
  } catch (error) {
    console.error("Delete customer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer."
    });
  }
});

/* =========================
   OFFERS / WHATSAPP APIS
========================= */

app.get("/api/offers-whatsapp", requireAuth, async (req, res) => {
  try {
    const search = normalizeText(req.query.search || "");
    const offerType = normalizeText(req.query.offer_type || "");

    let sql = `SELECT * FROM offers_whatsapp WHERE 1=1`;
    const params = [];

    if (search) {
      sql += `
        AND (
          customer_name LIKE ?
          OR mobile_number LIKE ?
          OR offer_title LIKE ?
          OR offer_message LIKE ?
          OR offer_type LIKE ?
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }

    if (offerType && offerType !== "All") {
      sql += ` AND offer_type = ?`;
      params.push(offerType);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await allQuery(sql, params);

    return res.json({
      success: true,
      offers: rows
    });
  } catch (error) {
    console.error("Get offers error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch offers."
    });
  }
});

app.get("/api/offers-whatsapp/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID."
      });
    }

    const row = await getQuery(`SELECT * FROM offers_whatsapp WHERE id = ?`, [id]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Offer not found."
      });
    }

    return res.json({
      success: true,
      offer: row
    });
  } catch (error) {
    console.error("Get one offer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch offer."
    });
  }
});

app.post("/api/offers-whatsapp", requireAuth, async (req, res) => {
  try {
    const customerName = normalizeOptionalText(req.body.customer_name);
    const mobileNumber = normalizeText(req.body.mobile_number);
    const offerTitle = normalizeText(req.body.offer_title);
    const offerMessage = normalizeText(req.body.offer_message);
    const offerType = normalizeOfferType(req.body.offer_type);

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    if (!offerTitle) {
      return res.status(400).json({
        success: false,
        message: "Offer title is required."
      });
    }

    if (!offerMessage) {
      return res.status(400).json({
        success: false,
        message: "Offer message is required."
      });
    }

    const result = await runQuery(
      `
      INSERT INTO offers_whatsapp (
        customer_name, mobile_number, offer_title, offer_message, offer_type, updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [customerName, mobileNumber, offerTitle, offerMessage, offerType]
    );

    await addActivityLog(
      "OFFER_CREATED",
      `Offer created: ${offerTitle} | Mobile: ${mobileNumber} | Type: ${offerType}`
    );

    return res.json({
      success: true,
      message: "Offer saved successfully.",
      offerId: result.lastID
    });
  } catch (error) {
    console.error("Create offer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save offer."
    });
  }
});

app.put("/api/offers-whatsapp/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID."
      });
    }

    const existing = await getQuery(`SELECT * FROM offers_whatsapp WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Offer not found."
      });
    }

    const customerName = normalizeOptionalText(req.body.customer_name);
    const mobileNumber = normalizeText(req.body.mobile_number);
    const offerTitle = normalizeText(req.body.offer_title);
    const offerMessage = normalizeText(req.body.offer_message);
    const offerType = normalizeOfferType(req.body.offer_type);

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required."
      });
    }

    if (!offerTitle) {
      return res.status(400).json({
        success: false,
        message: "Offer title is required."
      });
    }

    if (!offerMessage) {
      return res.status(400).json({
        success: false,
        message: "Offer message is required."
      });
    }

    await runQuery(
      `
      UPDATE offers_whatsapp
      SET
        customer_name = ?,
        mobile_number = ?,
        offer_title = ?,
        offer_message = ?,
        offer_type = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [customerName, mobileNumber, offerTitle, offerMessage, offerType, id]
    );

    await addActivityLog(
      "OFFER_UPDATED",
      `Offer updated: ${offerTitle} | ID: ${id} | Mobile: ${mobileNumber}`
    );

    return res.json({
      success: true,
      message: "Offer updated successfully."
    });
  } catch (error) {
    console.error("Update offer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update offer."
    });
  }
});

app.delete("/api/offers-whatsapp/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID."
      });
    }

    const existing = await getQuery(`SELECT * FROM offers_whatsapp WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Offer not found."
      });
    }

    await runQuery(`DELETE FROM offers_whatsapp WHERE id = ?`, [id]);

    await addActivityLog(
      "OFFER_DELETED",
      `Offer deleted: ${existing.offer_title} | ID: ${id}`
    );

    return res.json({
      success: true,
      message: "Offer deleted successfully."
    });
  } catch (error) {
    console.error("Delete offer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete offer."
    });
  }
});

/* =========================
   ACTIVITY LOGS
========================= */

app.get("/api/activity-logs", requireAuth, async (req, res) => {
  try {
    const rows = await allQuery(
      `SELECT * FROM activity_logs ORDER BY id DESC LIMIT 100`
    );

    return res.json({
      success: true,
      logs: rows,
    });
  } catch (error) {
    console.error("Get activity logs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs.",
    });
  }
});

/* =========================
   BASIC ROUTES
========================= */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.get("/dashboard.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/staff.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "staff.html"));
});

app.get("/attendance.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "attendance.html"));
});

app.get("/payroll.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "payroll.html"));
});

app.get("/payslip.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "payslip.html"));
});

app.get("/complaints.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "complaints.html"));
});

app.get("/inventory.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "inventory.html"));
});

app.get("/expenses.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "expenses.html"));
});

app.get("/income.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "income.html"));
});

app.get("/profit-loss.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "profit-loss.html"));
});

app.get("/offers-whatsapp.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "offers-whatsapp.html"));
});

app.get("/activity-logs.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "activity-logs.html"));
});

app.get("/customers.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login.html");
  return res.sendFile(path.join(__dirname, "public", "customers.html"));
});

app.get("/complaint-form.html", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "complaint-form.html"));
});

app.get("/complaint-status.html", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "complaint-status.html"));
});

app.listen(PORT, () => {
  console.log(`MVEXPRESS app running at http://localhost:${PORT}`);
});