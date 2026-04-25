const ATTENDANCE_ADMIN_PASSWORD = "MONISH0987@";

const THEMES = {
  "midnight-lux": {
    "--primary": "#7c3aed",
    "--primary-2": "#2563eb",
    "--accent": "#06b6d4",
    "--sidebar-gradient": "linear-gradient(180deg, #060c18 0%, #0d1527 50%, #111a31 100%)",
    "--banner-gradient": "radial-gradient(circle at top right, rgba(6,182,212,0.22), transparent 22%), linear-gradient(135deg, #0f172a 0%, #1d4ed8 58%, #7c3aed 100%)",
    "--emphasis-gradient": "linear-gradient(135deg, #0f172a 0%, #172554 50%, #1d4ed8 100%)",
    "--brand-gradient": "linear-gradient(135deg, #7c3aed 0%, #2563eb 60%, #06b6d4 100%)",
    "--body-bg": "radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 14%), radial-gradient(circle at bottom left, rgba(124, 58, 237, 0.08), transparent 16%), linear-gradient(180deg, #eef3f9 0%, #f8fafc 100%)",
    "--card-bg": "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.99))",
    "--text-main": "#0f172a",
    "--text-muted": "#64748b",
    "--status-bg": "#dcfce7",
    "--status-text": "#166534"
  },
  "royal-indigo": {
    "--primary": "#4f46e5",
    "--primary-2": "#7c3aed",
    "--accent": "#60a5fa",
    "--sidebar-gradient": "linear-gradient(180deg, #0b1120 0%, #151a3a 52%, #1d2350 100%)",
    "--banner-gradient": "radial-gradient(circle at top right, rgba(96,165,250,0.18), transparent 24%), linear-gradient(135deg, #1e1b4b 0%, #3730a3 55%, #6d28d9 100%)",
    "--emphasis-gradient": "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)",
    "--brand-gradient": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #60a5fa 100%)",
    "--body-bg": "radial-gradient(circle at top right, rgba(79, 70, 229, 0.12), transparent 14%), radial-gradient(circle at bottom left, rgba(124, 58, 237, 0.1), transparent 16%), linear-gradient(180deg, #eff2ff 0%, #f8fafc 100%)",
    "--card-bg": "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(244,246,255,0.99))",
    "--text-main": "#111827",
    "--text-muted": "#6366f1",
    "--status-bg": "#e0e7ff",
    "--status-text": "#3730a3"
  },
  "emerald-executive": {
    "--primary": "#059669",
    "--primary-2": "#0891b2",
    "--accent": "#22c55e",
    "--sidebar-gradient": "linear-gradient(180deg, #071610 0%, #0b241c 52%, #103329 100%)",
    "--banner-gradient": "radial-gradient(circle at top right, rgba(34,197,94,0.16), transparent 22%), linear-gradient(135deg, #052e2b 0%, #065f46 55%, #0891b2 100%)",
    "--emphasis-gradient": "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%)",
    "--brand-gradient": "linear-gradient(135deg, #059669 0%, #0891b2 60%, #22c55e 100%)",
    "--body-bg": "radial-gradient(circle at top right, rgba(5, 150, 105, 0.12), transparent 14%), radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.08), transparent 16%), linear-gradient(180deg, #ecfdf5 0%, #f8fafc 100%)",
    "--card-bg": "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(240,253,250,0.99))",
    "--text-main": "#0f172a",
    "--text-muted": "#047857",
    "--status-bg": "#dcfce7",
    "--status-text": "#166534"
  },
  "graphite-gold": {
    "--primary": "#b45309",
    "--primary-2": "#d97706",
    "--accent": "#f59e0b",
    "--sidebar-gradient": "linear-gradient(180deg, #101010 0%, #171717 52%, #262626 100%)",
    "--banner-gradient": "radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 22%), linear-gradient(135deg, #111111 0%, #3f3f46 48%, #b45309 100%)",
    "--emphasis-gradient": "linear-gradient(135deg, #18181b 0%, #3f3f46 50%, #a16207 100%)",
    "--brand-gradient": "linear-gradient(135deg, #111827 0%, #b45309 60%, #f59e0b 100%)",
    "--body-bg": "radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 14%), radial-gradient(circle at bottom left, rgba(180, 83, 9, 0.08), transparent 16%), linear-gradient(180deg, #fafaf9 0%, #f8fafc 100%)",
    "--card-bg": "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,251,235,0.99))",
    "--text-main": "#111827",
    "--text-muted": "#92400e",
    "--status-bg": "#fef3c7",
    "--status-text": "#92400e"
  }
};

let editingStaffId = null;
let payrollRowsState = [];

function applyTheme(themeName) {
  const theme = THEMES[themeName] || THEMES["midnight-lux"];
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  localStorage.setItem("mvexpress-theme", themeName);
  const selector = document.getElementById("themeSelector");
  if (selector) selector.value = themeName;
}

function setupThemeChanger() {
  const selector = document.getElementById("themeSelector");
  const applyBtn = document.getElementById("applyThemeBtn");
  const savedTheme = localStorage.getItem("mvexpress-theme") || "midnight-lux";
  applyTheme(savedTheme);
  if (selector) selector.value = savedTheme;
  if (applyBtn && selector) applyBtn.addEventListener("click", () => applyTheme(selector.value));
  if (selector) selector.addEventListener("change", () => applyTheme(selector.value));
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");
    message.textContent = "";
    if (!username || !password) {
      message.textContent = "Please enter username and password.";
      return;
    }
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        window.location.href = "/dashboard.html";
      } else {
        message.textContent = data.message || "Login failed.";
      }
    } catch {
      message.textContent = "Server connection failed.";
    }
  });
}

function logout() {
  window.location.href = "/logout";
}

async function checkAuthForProtectedPages() {
 const isProtectedPage =
  window.location.pathname.includes("dashboard.html") ||
  window.location.pathname.includes("staff.html") ||
  window.location.pathname.includes("attendance.html") ||
  window.location.pathname.includes("payroll.html") ||
  window.location.pathname.includes("payslip.html") ||
  window.location.pathname.includes("complaints.html") ||
  window.location.pathname.includes("inventory.html") ||
  window.location.pathname.includes("expenses.html") ||
  document.querySelector(".dashboard-body"); 

  if (!isProtectedPage) return;

  try {
    const response = await fetch("/check-auth");
    const data = await response.json();
    if (!data.loggedIn) window.location.href = "/login.html";
  } catch {
    window.location.href = "/login.html";
  }
}

async function loadDashboardSummary() {
  const activeStaff = document.getElementById("activeStaff");
  const openComplaints = document.getElementById("openComplaints");
  const lowStockItems = document.getElementById("lowStockItems");
  const todayIncome = document.getElementById("todayIncome");
  const todayExpense = document.getElementById("todayExpense");
  const netPosition = document.getElementById("netPosition");

  const birthdayTodayEl = document.getElementById("birthdayTodayCount");
  const birthdayThisMonthEl = document.getElementById("birthdayThisMonthCount");
  const loyalCustomerEl = document.getElementById("loyalCustomerCount");
  const vipRepeatEl = document.getElementById("vipRepeatCount");

  if (!activeStaff || !openComplaints || !lowStockItems || !todayIncome || !todayExpense) return;

  try {
    const response = await fetch("/api/dashboard-summary");
    const data = await response.json();
    if (!data.success || !data.data) return;

    const summary = data.data;

    const income = Number(summary.todayIncome || 0);
    const expense = Number(summary.todayExpense || 0);
    const net = income - expense;

    activeStaff.textContent = summary.activeStaff ?? 0;
    openComplaints.textContent = summary.openComplaints ?? 0;
    lowStockItems.textContent = summary.lowStockItems ?? 0;
    todayIncome.textContent = `₹${income}`;
    todayExpense.textContent = `₹${expense}`;
    if (netPosition) netPosition.textContent = `₹${net}`;

    if (birthdayTodayEl) birthdayTodayEl.textContent = summary.birthdayTodayCount || 0;
    if (birthdayThisMonthEl) birthdayThisMonthEl.textContent = summary.birthdayThisMonthCount || 0;
    if (loyalCustomerEl) loyalCustomerEl.textContent = summary.loyalCustomerCount || 0;
    if (vipRepeatEl) vipRepeatEl.textContent = summary.vipRepeatCount || 0;

  } catch (error) {
    console.error("Dashboard summary load failed:", error);
  }
}

/* =========================
   COMMON HELPERS
========================= */

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTag(status) {
  if (status === "Active" || status === "Paid" || status === "Completed" || status === "Present" || status === "Resolved") {
    return `<span class="tag tag-success">${escapeHtml(status)}</span>`;
  }
  if (status === "Inactive" || status === "Unpaid" || status === "Absent" || status === "Closed") {
    return `<span class="tag tag-danger">${escapeHtml(status)}</span>`;
  }
  return `<span class="tag tag-warning">${escapeHtml(status || "-")}</span>`;
}

function formatAttendanceTag(status) {
  const safe = escapeHtml(status || "-");
  if (status === "Present" || status === "Completed") return `<span class="tag tag-success">${safe}</span>`;
  if (status === "Late" || status === "Half Day" || status === "In Progress" || status === "Open") return `<span class="tag tag-warning">${safe}</span>`;
  if (status === "Leave" || status === "Absent" || status === "Closed") return `<span class="tag tag-danger">${safe}</span>`;
  return `<span class="tag tag-warning">${safe}</span>`;
}

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return `₹${num.toFixed(2)}`;
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getTodayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* =========================
   STAFF MODULE
========================= */

function getStaffElements() {
  return {
    form: document.getElementById("staffForm"),
    name: document.getElementById("staffName"),
    mobile: document.getElementById("staffMobile"),
    whatsapp: document.getElementById("staffWhatsapp"),
    gpay: document.getElementById("staffGpay"),
    role: document.getElementById("staffRole"),
    hourlyRate: document.getElementById("staffHourlyRate"),
    joiningDate: document.getElementById("staffJoiningDate"),
    status: document.getElementById("staffStatus"),
    notes: document.getElementById("staffNotes"),
    message: document.getElementById("staffFormMessage"),
    saveBtn: document.getElementById("saveStaffBtn"),
    resetBtn: document.getElementById("resetStaffBtn"),
    tableBody: document.getElementById("staffTableBody"),
    searchInput: document.getElementById("staffSearch"),
    statusFilter: document.getElementById("staffFilterStatus"),
    searchBtn: document.getElementById("searchStaffBtn"),
    refreshBtn: document.getElementById("refreshStaffBtn")
  };
}

function resetStaffForm() {
  const el = getStaffElements();
  if (!el.form) return;
  el.form.reset();
  editingStaffId = null;
  if (el.hourlyRate) el.hourlyRate.value = 50;
  if (el.status) el.status.value = "Active";
  if (el.saveBtn) el.saveBtn.textContent = "Save Staff";
  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }
}

function getStaffPayload() {
  const el = getStaffElements();
  return {
    name: el.name?.value.trim() || "",
    mobile: el.mobile?.value.trim() || "",
    whatsapp: el.whatsapp?.value.trim() || "",
    gpay: el.gpay?.value.trim() || "",
    role: el.role?.value.trim() || "Staff",
    hourly_rate: el.hourlyRate?.value || "50",
    joining_date: el.joiningDate?.value || "",
    status: el.status?.value || "Active",
    notes: el.notes?.value.trim() || ""
  };
}

function validateStaffPayload(payload) {
  if (!payload.name) return "Staff name is required.";
  if (!payload.mobile) return "Mobile number is required.";
  return "";
}

async function loadStaffList() {
  const el = getStaffElements();
  if (!el.tableBody) return;
  const search = el.searchInput?.value.trim() || "";
  const status = el.statusFilter?.value || "All";

  el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Loading staff data...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const response = await fetch(`/api/staff?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Failed to load staff data.</td></tr>`;
      return;
    }

    const rows = data.staff || [];
    if (rows.length === 0) {
      el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">No staff records found.</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map((staff) => `
      <tr>
        <td>${staff.id}</td>
        <td>${escapeHtml(staff.name)}</td>
        <td>${escapeHtml(staff.mobile)}</td>
        <td>${escapeHtml(staff.whatsapp || "-")}</td>
        <td>${escapeHtml(staff.gpay || "-")}</td>
        <td>${escapeHtml(staff.role || "-")}</td>
        <td>₹${Number(staff.hourly_rate || 0)}</td>
        <td>${escapeHtml(staff.joining_date || "-")}</td>
        <td>${formatTag(staff.status)}</td>
        <td>${escapeHtml(staff.notes || "-")}</td>
        <td>${escapeHtml(staff.created_at || "-")}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="secondary-btn" onclick="editStaff(${staff.id})">Edit</button>
            <button type="button" class="danger-btn" onclick="deleteStaff(${staff.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch {
    el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Server error while loading staff data.</td></tr>`;
  }
}

async function saveStaff(e) {
  e.preventDefault();
  const el = getStaffElements();
  if (!el.form) return;

  const payload = getStaffPayload();
  const validationError = validateStaffPayload(payload);

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }

  if (validationError) {
    if (el.message) el.message.textContent = validationError;
    return;
  }

  try {
    const isEdit = editingStaffId !== null;
    const url = isEdit ? `/api/staff/${editingStaffId}` : "/api/staff";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) el.message.textContent = data.message || "Failed to save staff.";
      return;
    }

    resetStaffForm();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Staff saved successfully.";
    }

    await loadStaffList();
    await loadDashboardSummary();
    await populateAttendanceControlStaffOptions();
  } catch {
    if (el.message) el.message.textContent = "Server error while saving staff.";
  }
}

async function editStaff(id) {
  const el = getStaffElements();
  if (!el.form) return;

  try {
    const response = await fetch(`/api/staff/${id}`);
    const data = await response.json();

    if (!data.success || !data.staff) {
      if (el.message) el.message.textContent = data.message || "Failed to load staff details.";
      return;
    }

    const staff = data.staff;
    editingStaffId = staff.id;

    if (el.name) el.name.value = staff.name || "";
    if (el.mobile) el.mobile.value = staff.mobile || "";
    if (el.whatsapp) el.whatsapp.value = staff.whatsapp || "";
    if (el.gpay) el.gpay.value = staff.gpay || "";
    if (el.role) el.role.value = staff.role || "";
    if (el.hourlyRate) el.hourlyRate.value = staff.hourly_rate ?? 50;
    if (el.joiningDate) el.joiningDate.value = staff.joining_date || "";
    if (el.status) el.status.value = staff.status || "Active";
    if (el.notes) el.notes.value = staff.notes || "";
    if (el.saveBtn) el.saveBtn.textContent = "Update Staff";

    if (el.message) {
      el.message.style.color = "#1d4ed8";
      el.message.textContent = `Editing staff ID ${staff.id}`;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    if (el.message) el.message.textContent = "Server error while loading staff details.";
  }
}

async function deleteStaff(id) {
  const confirmed = window.confirm("Are you sure you want to delete this staff record?");
  if (!confirmed) return;

  const el = getStaffElements();

  try {
    const response = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!data.success) {
      if (el.message) el.message.textContent = data.message || "Failed to delete staff.";
      return;
    }

    if (editingStaffId === id) resetStaffForm();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Staff deleted successfully.";
    }

    await loadStaffList();
    await loadDashboardSummary();
    await populateAttendanceControlStaffOptions();
  } catch {
    if (el.message) el.message.textContent = "Server error while deleting staff.";
  }
}

function setupStaffPage() {
  const el = getStaffElements();
  if (!el.form) return;

  el.form.addEventListener("submit", saveStaff);
  if (el.resetBtn) el.resetBtn.addEventListener("click", resetStaffForm);
  if (el.searchBtn) el.searchBtn.addEventListener("click", loadStaffList);

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", async () => {
      if (el.searchInput) el.searchInput.value = "";
      if (el.statusFilter) el.statusFilter.value = "All";
      await loadStaffList();
    });
  }

  if (el.searchInput) {
    el.searchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await loadStaffList();
      }
    });
  }

  if (el.statusFilter) el.statusFilter.addEventListener("change", loadStaffList);

  resetStaffForm();
  loadStaffList();
}

/* =========================
   ATTENDANCE MODULE
========================= */

function getAttendanceElements() {
  return {
    cardsGrid: document.getElementById("attendanceCardsGrid"),
    message: document.getElementById("attendanceMessage"),
    refreshBtn: document.getElementById("refreshAttendanceBtn"),
    dateTag: document.getElementById("attendanceDateTag"),
    selectedDateInput: document.getElementById("attendanceSelectedDate"),
    monthInput: document.getElementById("attendanceMonth"),
    loadSummaryBtn: document.getElementById("loadMonthlySummaryBtn"),
    summaryTableBody: document.getElementById("attendanceSummaryTableBody"),
    controlForm: document.getElementById("attendanceControlForm"),
    controlSection: document.getElementById("attendanceControlForm")?.closest(".page-card"),
    controlStaff: document.getElementById("attendanceControlStaff"),
    controlDate: document.getElementById("attendanceControlDate"),
    manualStatus: document.getElementById("attendanceManualStatus"),
    quickAction: document.getElementById("attendanceQuickAction"),
    controlNotes: document.getElementById("attendanceControlNotes"),
    quickActionBtn: document.getElementById("applyAttendanceQuickActionBtn"),
    resetControlBtn: document.getElementById("resetAttendanceControlBtn")
  };
}

function clearStatusActionHighlight() {
  document.querySelectorAll(".status-action-btn").forEach((btn) => {
    btn.classList.remove("active-status-action");
  });
}

function setStatusActionHighlight(status) {
  clearStatusActionHighlight();
  const target = document.querySelector(`.status-action-btn[data-status-action="${CSS.escape(status)}"]`);
  if (target) target.classList.add("active-status-action");
}

function selectStatusCardAction(status) {
  const el = getAttendanceElements();
  if (el.quickAction) el.quickAction.value = status;
  if (el.manualStatus) el.manualStatus.value = status;
  setStatusActionHighlight(status);

  if (el.controlSection) {
    el.controlSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (el.message) {
    el.message.style.color = "#1d4ed8";
    el.message.textContent = `${status} selected. Choose staff if needed, then click Apply Quick Action.`;
  }
}

async function populateAttendanceControlStaffOptions() {
  const el = getAttendanceElements();
  const timeEditStaff = document.getElementById("attendanceEditStaff");

  if (!el.controlStaff && !timeEditStaff) return;

  try {
    const response = await fetch("/api/staff?status=Active");
    const data = await response.json();
    if (!data.success) return;

    const rows = data.staff || [];
    const optionsHtml =
      `<option value="">Select staff</option>` +
      rows.map((staff) => `<option value="${staff.id}">${escapeHtml(staff.name)} (${escapeHtml(staff.role || "Staff")})</option>`).join("");

    if (el.controlStaff) {
      el.controlStaff.innerHTML = optionsHtml;
    }

    if (timeEditStaff) {
      timeEditStaff.innerHTML = optionsHtml;
    }
  } catch (error) {
    console.error("Failed to load attendance staff options", error);
  }
}

function resetAttendanceTimeEditPanel() {
  const section = document.getElementById("attendanceTimeEditSection");
  const staff = document.getElementById("attendanceEditStaff");
  const date = document.getElementById("attendanceEditDate");
  const reason = document.getElementById("attendanceEditReason");
  const message = document.getElementById("attendanceTimeEditMessage");

  // NEW AM/PM fields
  const inHour = document.getElementById("attendanceEditInHour");
  const inMinute = document.getElementById("attendanceEditInMinute");
  const inMeridiem = document.getElementById("attendanceEditInMeridiem");

  const outHour = document.getElementById("attendanceEditOutHour");
  const outMinute = document.getElementById("attendanceEditOutMinute");
  const outMeridiem = document.getElementById("attendanceEditOutMeridiem");

  if (staff) staff.value = "";
  if (date) date.value = "";
  if (reason) reason.value = "";
  if (message) message.textContent = "";

  // Reset AM/PM inputs
  if (inHour) inHour.value = "";
  if (inMinute) inMinute.value = "";
  if (inMeridiem) inMeridiem.value = "";

  if (outHour) outHour.value = "";
  if (outMinute) outMinute.value = "";
  if (outMeridiem) outMeridiem.value = "";

  if (section) {
    section.style.display = "none";
  }
}

async function saveAttendanceCorrectedTime(e) {
  e.preventDefault();

  const staffId = Number(document.getElementById("attendanceEditStaff")?.value || 0);
  const attendanceDate = document.getElementById("attendanceEditDate")?.value || "";
  const inHour = document.getElementById("attendanceEditInHour")?.value || "";
  const inMinute = document.getElementById("attendanceEditInMinute")?.value || "";
  const inMeridiem = document.getElementById("attendanceEditInMeridiem")?.value || "";
  const outHour = document.getElementById("attendanceEditOutHour")?.value || "";
  const outMinute = document.getElementById("attendanceEditOutMinute")?.value || "";
  const outMeridiem = document.getElementById("attendanceEditOutMeridiem")?.value || "";

function convertTo24Hour(hour, minute, meridiem) {
  if (!hour || minute === "" || !meridiem) return "";

  const minuteNum = Number(minute);
  if (!Number.isInteger(minuteNum) || minuteNum < 0 || minuteNum > 59) {
    return "";
  }

  let h = Number(hour);

  if (meridiem === "AM" && h === 12) h = 0;
  if (meridiem === "PM" && h !== 12) h += 12;

  return `${String(h).padStart(2, "0")}:${String(minuteNum).padStart(2, "0")}`;
}

  const inTime = convertTo24Hour(inHour, inMinute, inMeridiem);
  const outTime = convertTo24Hour(outHour, outMinute, outMeridiem);
  const reason = document.getElementById("attendanceEditReason")?.value.trim() || "";
  const messageEl = document.getElementById("attendanceTimeEditMessage");

  if (messageEl) {
    messageEl.style.color = "";
    messageEl.textContent = "";
  }

  if (!staffId) {
    if (messageEl) {
      messageEl.style.color = "#dc2626";
      messageEl.textContent = "Please select a staff member.";
    }
    return;
  }

  if (!attendanceDate) {
    if (messageEl) {
      messageEl.style.color = "#dc2626";
      messageEl.textContent = "Please choose attendance date.";
    }
    return;
  }

  if (!inTime && !outTime) {
    if (messageEl) {
      messageEl.style.color = "#dc2626";
      messageEl.textContent = "Please enter IN time, OUT time, or both.";
    }
    return;
  }

  try {
    const response = await fetch("/api/attendance/correct-time", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        staff_id: staffId,
        attendance_date: attendanceDate,
        in_time: inTime,
        out_time: outTime,
        reason
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (messageEl) {
        messageEl.style.color = "#dc2626";
        messageEl.textContent = data.message || "Failed to save corrected attendance time.";
      }
      return;
    }

    if (messageEl) {
      messageEl.style.color = "#166534";
      messageEl.textContent = data.message || "Corrected time saved successfully.";
    }

    await loadTodayAttendance();
    await loadMonthlyAttendanceSummary();
    resetAttendanceTimeEditPanel();
  } catch (error) {
    console.error("Save corrected attendance error:", error);
    if (messageEl) {
      messageEl.style.color = "#dc2626";
      messageEl.textContent = "Server error while saving corrected attendance time.";
    }
  }
}

function buildAttendanceCard(item) {
  const inTime = item.in_time || "-";
  const outTime = item.out_time || "-";
  const workedText = item.worked_time_text || "0h 0m";
  const estimatedPay = formatCurrency(item.estimated_pay || 0);
  const finalStatus = item.final_status || item.attendance_status || "Absent";
  const notes = item.attendance_notes || "-";

  const canCheckIn = !item.is_checked_in && !["Leave", "Absent"].includes(finalStatus);
  const canCheckOut = item.is_checked_in && !item.is_checked_out && !["Leave", "Absent"].includes(finalStatus);

  return `
    <article class="module-card">
      <div class="module-icon">${item.staff_id}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>
        <strong>Role:</strong> ${escapeHtml(item.role || "-")}<br>
        <strong>Mobile:</strong> ${escapeHtml(item.mobile || "-")}<br>
        <strong>Hourly Rate:</strong> ₹${Number(item.hourly_rate || 0)}
      </p>

      <div style="display:grid; gap:10px; margin-bottom:16px;">
        <div>${formatAttendanceTag(finalStatus)}</div>
        <div><strong>IN Time:</strong> ${escapeHtml(inTime)}</div>
        <div><strong>OUT Time:</strong> ${escapeHtml(outTime)}</div>
        <div><strong>Worked Today:</strong> ${escapeHtml(workedText)}</div>
        <div><strong>Estimated Pay:</strong> ${escapeHtml(estimatedPay)}</div>
        <div><strong>Notes:</strong> ${escapeHtml(notes)}</div>
      </div>

       <div style="display:grid; gap:10px;">
  <button type="button" class="action-btn" onclick="checkInStaff(${item.staff_id})" ${canCheckIn ? "" : "disabled"}>IN</button>
  <button type="button" class="danger-btn" onclick="checkOutStaff(${item.staff_id})" ${canCheckOut ? "" : "disabled"}>OUT</button>
  <button type="button" class="secondary-btn" onclick="prefillAttendanceControl(${item.staff_id}, '${escapeHtml(finalStatus).replaceAll("&#039;", "'")}', \`${escapeHtml(item.attendance_notes || "")}\`)">Manual Control</button>
  <button type="button" class="secondary-btn" onclick="openAttendanceAdminEdit(${item.staff_id})">Edit</button>
</div>         
          
    </article>
  `;
}

async function loadTodayAttendance() {
  const el = getAttendanceElements();
  if (!el.cardsGrid) return;

  const selectedDate = el.selectedDateInput?.value || getTodayValue();

  el.cardsGrid.innerHTML = `
    <article class="module-card">
      <div class="module-icon">⏳</div>
      <h3>Loading attendance...</h3>
      <p>Please wait while attendance data is being loaded.</p>
      <button type="button" disabled>Loading</button>
    </article>
  `;

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }

  try {
    const response = await fetch(`/api/attendance/today?date=${encodeURIComponent(selectedDate)}`);
    const data = await response.json();

    if (!data.success) {
      el.cardsGrid.innerHTML = `
        <article class="module-card">
          <div class="module-icon">!</div>
          <h3>Attendance load failed</h3>
          <p>${escapeHtml(data.message || "Could not load attendance data.")}</p>
          <button type="button" disabled>Error</button>
        </article>
      `;
      return;
    }

    if (el.dateTag) el.dateTag.textContent = data.date || selectedDate;
    if (el.controlDate && !el.controlDate.value) el.controlDate.value = data.date || selectedDate;

    const list = data.attendance || [];

    if (list.length === 0) {
      el.cardsGrid.innerHTML = `
        <article class="module-card">
          <div class="module-icon">0</div>
          <h3>No active staff found</h3>
          <p>Add active staff first in Staff Management to use attendance.</p>
          <button type="button" disabled>No Staff</button>
        </article>
      `;
      return;
    }

    el.cardsGrid.innerHTML = list.map(buildAttendanceCard).join("");
  } catch {
    el.cardsGrid.innerHTML = `
      <article class="module-card">
        <div class="module-icon">!</div>
        <h3>Server error</h3>
        <p>Server error while loading attendance data.</p>
        <button type="button" disabled>Error</button>
      </article>
    `;
  }
}

async function checkInStaff(staffId) {
  const el = getAttendanceElements();
  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "Recording check-in...";
  }

  try {
    const response = await fetch(`/api/attendance/check-in/${staffId}`, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Check-in failed.";
      }
      return;
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Check-in successful.";
    }

    await loadTodayAttendance();
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while recording check-in.";
    }
  }
}

async function checkOutStaff(staffId) {
  const el = getAttendanceElements();
  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "Recording check-out...";
  }

  try {
    const response = await fetch(`/api/attendance/check-out/${staffId}`, { method: "POST" });
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Check-out failed.";
      }
      return;
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = `${data.message || "Check-out successful."} Worked: ${data.worked_time_text || ""}`;
    }

    await loadTodayAttendance();
    await loadMonthlyAttendanceSummary();
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while recording check-out.";
    }
  }
}

async function loadMonthlyAttendanceSummary() {
  const el = getAttendanceElements();
  if (!el.summaryTableBody) return;

  const month = el.monthInput?.value || getCurrentMonthValue();
  el.summaryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading monthly summary...</td></tr>`;

  try {
    const response = await fetch(`/api/attendance/monthly-summary?month=${encodeURIComponent(month)}`);
    const data = await response.json();

    if (!data.success) {
      el.summaryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Failed to load monthly summary.</td></tr>`;
      return;
    }

    const rows = data.summary || [];
    if (rows.length === 0) {
      el.summaryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No monthly summary found.</td></tr>`;
      return;
    }

    el.summaryTableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.staff_id}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.role || "-")}</td>
        <td>₹${Number(row.hourly_rate || 0)}</td>
        <td>${Number(row.total_entries || 0)}</td>
        <td>${escapeHtml(row.total_worked_time_text || "0h 0m")}</td>
        <td>${formatCurrency(row.estimated_pay || 0)}</td>
        <td>${formatTag(row.staff_status)}</td>
      </tr>
    `).join("");
  } catch {
    el.summaryTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Server error while loading monthly summary.</td></tr>`;
  }
}

function prefillAttendanceControl(staffId, status = "", notes = "") {
  const controlStaff = document.getElementById("attendanceControlStaff");
  const manualStatus = document.getElementById("attendanceManualStatus");
  const quickAction = document.getElementById("attendanceQuickAction");
  const controlNotes = document.getElementById("attendanceControlNotes");
  const controlDate = document.getElementById("attendanceControlDate");
  const selectedDateInput = document.getElementById("attendanceSelectedDate");
  const manualSection = document.getElementById("attendanceManualSection");

  if (controlStaff) controlStaff.value = String(staffId);
  if (manualStatus && status) manualStatus.value = status;
  if (quickAction) quickAction.value = "";
  if (controlNotes) controlNotes.value = notes || "";
  if (controlDate && !controlDate.value) {
    controlDate.value = selectedDateInput?.value || getTodayValue();
  }

  if (manualSection) {
    manualSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function resetAttendanceControlForm() {
  const el = getAttendanceElements();
  if (el.controlStaff) el.controlStaff.value = "";
  if (el.manualStatus) el.manualStatus.value = "Present";
  if (el.quickAction) el.quickAction.value = "";
  if (el.controlNotes) el.controlNotes.value = "";
  if (el.controlDate && !el.controlDate.value) el.controlDate.value = getTodayValue();
  clearStatusActionHighlight();
}

async function saveManualAttendanceStatus(statusOverride = "") {
  const el = getAttendanceElements();
  if (!el.controlStaff || !el.controlDate || !el.manualStatus) return;

  const staffId = Number(el.controlStaff.value);
  const attendanceDate = el.controlDate.value || getTodayValue();
  const status = statusOverride || el.manualStatus.value;
  const notes = el.controlNotes?.value.trim() || "";

  if (!Number.isInteger(staffId) || staffId <= 0) {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Please select a staff member.";
    }
    return;
  }

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = `Saving ${status}...`;
  }

  try {
    const response = await fetch("/api/attendance/manual-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        attendance_date: attendanceDate,
        status,
        notes
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to save manual attendance status.";
      }
      return;
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Attendance status saved.";
    }

    if (el.selectedDateInput) {
      el.selectedDateInput.value = attendanceDate;
    }

    await loadTodayAttendance();
    await loadMonthlyAttendanceSummary();
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while saving attendance status.";
    }
  }
}

function setupAttendancePage() {
  const el = getAttendanceElements();
  if (!el.cardsGrid) return;

  if (el.monthInput && !el.monthInput.value) el.monthInput.value = getCurrentMonthValue();
  if (el.selectedDateInput && !el.selectedDateInput.value) el.selectedDateInput.value = getTodayValue();
  if (el.controlDate && !el.controlDate.value) el.controlDate.value = getTodayValue();

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", async () => {
      await loadTodayAttendance();
    });
  }

  if (el.loadSummaryBtn) {
    el.loadSummaryBtn.addEventListener("click", async () => {
      await loadMonthlyAttendanceSummary();
    });
  }

  if (el.selectedDateInput) {
    el.selectedDateInput.addEventListener("change", async () => {
      await loadTodayAttendance();
    });
  }

  if (el.controlForm) {
    el.controlForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveManualAttendanceStatus();
    });
  }

  if (el.quickAction) {
    el.quickAction.addEventListener("change", () => {
      const action = el.quickAction.value || "";
      if (action && el.manualStatus) el.manualStatus.value = action;
      if (action) setStatusActionHighlight(action);
      else clearStatusActionHighlight();
    });
  }

  if (el.manualStatus) {
    el.manualStatus.addEventListener("change", () => {
      const action = el.manualStatus.value || "";
      if (action) setStatusActionHighlight(action);
      else clearStatusActionHighlight();
    });
  }

  if (el.quickActionBtn) {
    el.quickActionBtn.addEventListener("click", async () => {
      const action = el.quickAction?.value || "";
      if (!action) {
        if (el.message) {
          el.message.style.color = "#dc2626";
          el.message.textContent = "Please choose a quick action.";
        }
        return;
      }
      if (el.manualStatus) el.manualStatus.value = action;
      setStatusActionHighlight(action);
      await saveManualAttendanceStatus(action);
    });
  }

  if (el.resetControlBtn) {
    el.resetControlBtn.addEventListener("click", resetAttendanceControlForm);
  }

  populateAttendanceControlStaffOptions();
  loadTodayAttendance();
  loadMonthlyAttendanceSummary();
}

const resetTimeEditBtn = document.getElementById("resetAttendanceTimeEditBtn");
if (resetTimeEditBtn) {
  resetTimeEditBtn.addEventListener("click", resetAttendanceTimeEditPanel);
}

const timeEditForm = document.getElementById("attendanceTimeEditForm");
if (timeEditForm) {
  timeEditForm.addEventListener("submit", saveAttendanceCorrectedTime);
}

/* =========================
   PAYROLL MODULE
========================= */

function getPayrollElements() {
  return {
    monthInput: document.getElementById("payrollMonth"),
    loadBtn: document.getElementById("loadPayrollBtn"),
    message: document.getElementById("payrollMessage"),
    tableBody: document.getElementById("payrollTableBody"),
    selectedMonth: document.getElementById("payrollSelectedMonth"),
    staffCount: document.getElementById("payrollStaffCount"),
    totalHours: document.getElementById("payrollTotalHours"),
    baseSalary: document.getElementById("payrollBaseSalary"),
    totalBonus: document.getElementById("payrollTotalBonus"),
    finalPayable: document.getElementById("payrollFinalPayable")
  };
}

function getPayrollRowFinalSalary(row) {
  const base = Number(row.base_salary || 0);
  const bonus = Number(row.bonus || 0);
  const deduction = Number(row.deduction || 0);
  return Number((base + bonus - deduction).toFixed(2));
}

function recalculatePayrollSummaryCards() {
  const el = getPayrollElements();
  if (!el.selectedMonth) return;

  const staffCount = payrollRowsState.length;
  const totalWorkedMinutes = payrollRowsState.reduce((sum, row) => sum + Number(row.total_worked_minutes || 0), 0);
  const totalBaseSalary = payrollRowsState.reduce((sum, row) => sum + Number(row.base_salary || 0), 0);
  const totalBonus = payrollRowsState.reduce((sum, row) => sum + Number(row.bonus || 0), 0);
  const totalFinal = payrollRowsState.reduce((sum, row) => sum + getPayrollRowFinalSalary(row), 0);

  const hours = Math.floor(totalWorkedMinutes / 60);
  const minutes = totalWorkedMinutes % 60;

  if (el.staffCount) el.staffCount.textContent = String(staffCount);
  if (el.totalHours) el.totalHours.textContent = `${hours}h ${minutes}m`;
  if (el.baseSalary) el.baseSalary.textContent = formatCurrency(totalBaseSalary);
  if (el.totalBonus) el.totalBonus.textContent = formatCurrency(totalBonus);
  if (el.finalPayable) el.finalPayable.textContent = formatCurrency(totalFinal);
}

function renderPayrollTable() {
  const el = getPayrollElements();
  if (!el.tableBody) return;

  if (payrollRowsState.length === 0) {
    el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No payroll records found.</td></tr>`;
    recalculatePayrollSummaryCards();
    return;
  }

  el.tableBody.innerHTML = payrollRowsState.map((row, index) => `
    <tr>
      <td>${row.staff_id}</td>
      <td>
        ${escapeHtml(row.name)}
        <div style="margin-top:6px;">${formatTag(row.paid_status || "Unpaid")}</div>
      </td>
      <td>${escapeHtml(row.role || "-")}</td>
      <td>₹${Number(row.hourly_rate || 0)}</td>
      <td>${escapeHtml(row.total_worked_time_text || "0h 0m")}</td>
      <td>${formatCurrency(row.base_salary || 0)}</td>
      <td><input type="number" min="0" step="0.01" value="${Number(row.bonus || 0)}" onchange="updatePayrollBonus(${index}, this.value)" /></td>
      <td><input type="number" min="0" step="0.01" value="${Number(row.deduction || 0)}" onchange="updatePayrollDeduction(${index}, this.value)" /></td>
      <td>
        <div style="display:grid; gap:10px;">
          <strong id="payrollFinalValue-${index}">${formatCurrency(getPayrollRowFinalSalary(row))}</strong>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="action-btn" onclick="savePayrollRow(${index})">Save</button>
            <button type="button" class="secondary-btn" onclick="markPayrollPaid(${index})" ${row.paid_status === "Paid" ? "disabled" : ""}>
              ${row.paid_status === "Paid" ? "Paid" : "Mark Paid"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  `).join("");

  recalculatePayrollSummaryCards();
}

async function loadPayrollData() {
  const el = getPayrollElements();
  if (!el.tableBody) return;

  const month = el.monthInput?.value || getCurrentMonthValue();

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "Loading payroll...";
  }

  el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Loading payroll...</td></tr>`;

  try {
    const response = await fetch(`/api/payroll?month=${encodeURIComponent(month)}`);
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to load payroll.";
      }
      el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Failed to load payroll.</td></tr>`;
      return;
    }

    payrollRowsState = (data.payroll || []).map((row) => ({
      ...row,
      bonus: Number(row.bonus || 0),
      deduction: Number(row.deduction || 0),
      base_salary: Number(row.base_salary || 0),
      total_worked_minutes: Number(row.total_worked_minutes || 0),
      hourly_rate: Number(row.hourly_rate || 0)
    }));

    if (el.selectedMonth) el.selectedMonth.textContent = data.month || month;
    if (el.monthInput && !el.monthInput.value) el.monthInput.value = data.month || month;

    renderPayrollTable();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = "Payroll loaded successfully.";
    }
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while loading payroll.";
    }
    el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Server error while loading payroll.</td></tr>`;
  }
}

function updatePayrollBonus(index, value) {
  const row = payrollRowsState[index];
  if (!row) return;
  const bonus = Number(value);
  row.bonus = Number.isFinite(bonus) && bonus >= 0 ? Number(bonus.toFixed(2)) : 0;
  const finalCell = document.getElementById(`payrollFinalValue-${index}`);
  if (finalCell) finalCell.textContent = formatCurrency(getPayrollRowFinalSalary(row));
  recalculatePayrollSummaryCards();
}

function updatePayrollDeduction(index, value) {
  const row = payrollRowsState[index];
  if (!row) return;
  const deduction = Number(value);
  row.deduction = Number.isFinite(deduction) && deduction >= 0 ? Number(deduction.toFixed(2)) : 0;
  const finalCell = document.getElementById(`payrollFinalValue-${index}`);
  if (finalCell) finalCell.textContent = formatCurrency(getPayrollRowFinalSalary(row));
  recalculatePayrollSummaryCards();
}

async function savePayrollRow(index) {
  const row = payrollRowsState[index];
  const el = getPayrollElements();
  if (!row || !el.monthInput) return;

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = `Saving payroll for ${row.name}...`;
  }

  try {
    const response = await fetch("/api/payroll/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: row.staff_id,
        payroll_month: el.monthInput.value || getCurrentMonthValue(),
        bonus: row.bonus,
        deduction: row.deduction,
        notes: ""
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to save payroll.";
      }
      return;
    }

    row.base_salary = Number(data.data?.base_salary || row.base_salary || 0);
    row.final_salary = Number(data.data?.final_salary || getPayrollRowFinalSalary(row));

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Payroll saved successfully.";
    }

    renderPayrollTable();
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while saving payroll.";
    }
  }
}

async function markPayrollPaid(index) {
  const row = payrollRowsState[index];
  const el = getPayrollElements();
  if (!row || !el.monthInput) return;

  const confirmed = window.confirm(`Mark payroll as paid for ${row.name}?`);
  if (!confirmed) return;

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = `Marking payroll paid for ${row.name}...`;
  }

  try {
    const response = await fetch("/api/payroll/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: row.staff_id,
        payroll_month: el.monthInput.value || getCurrentMonthValue()
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to mark payroll paid.";
      }
      return;
    }

    row.paid_status = "Paid";

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Payroll marked paid.";
    }

    renderPayrollTable();
  } catch {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while marking payroll paid.";
    }
  }
}

function setupPayrollPage() {
  const el = getPayrollElements();
  if (!el.tableBody) return;
  if (el.monthInput && !el.monthInput.value) el.monthInput.value = getCurrentMonthValue();
  if (el.loadBtn) el.loadBtn.addEventListener("click", loadPayrollData);
  loadPayrollData();
}

/* =========================
   COMPLAINTS MODULE
========================= */

function getComplaintElements() {
  return {
    form: document.getElementById("complaintForm"),
    type: document.getElementById("complaintType"),
    courier: document.getElementById("complaintCourier"),
    pod: document.getElementById("complaintPod"),
    reference: document.getElementById("complaintReference"),
    senderName: document.getElementById("complaintSenderName"),
    senderPhone: document.getElementById("complaintSenderPhone"),
    receiverName: document.getElementById("complaintReceiverName"),
    receiverPhone: document.getElementById("complaintReceiverPhone"),
    messageInput: document.getElementById("complaintMessageInput"),
    formMessage: document.getElementById("complaintFormMessage"),
    resetBtn: document.getElementById("resetComplaintBtn"),

    searchInput: document.getElementById("complaintSearch"),
    statusFilter: document.getElementById("complaintStatusFilter"),
    searchBtn: document.getElementById("searchComplaintsBtn"),
    refreshBtn: document.getElementById("refreshComplaintsBtn"),
    adminMessage: document.getElementById("complaintsAdminMessage"),
    tableBody: document.getElementById("complaintsTableBody"),

    updateForm: document.getElementById("complaintUpdateForm"),
    selectedComplaintId: document.getElementById("selectedComplaintId"),
    selectedComplaintSenderPhone: document.getElementById("selectedComplaintSenderPhone"),
    updateStatus: document.getElementById("updateComplaintStatus"),
    updateAdminNote: document.getElementById("updateComplaintAdminNote"),
    resetUpdateBtn: document.getElementById("resetComplaintUpdateBtn")
  };
}

function resetComplaintForm() {
  const el = getComplaintElements();
  if (!el.form) return;
  el.form.reset();
  if (el.formMessage) {
    el.formMessage.style.color = "";
    el.formMessage.textContent = "";
  }
}

function resetComplaintUpdatePanel() {
  const el = getComplaintElements();
  if (!el.updateForm) return;
  if (el.selectedComplaintId) el.selectedComplaintId.value = "";
  if (el.updateStatus) el.updateStatus.value = "Open";
  if (el.updateAdminNote) el.updateAdminNote.value = "";
}

function getComplaintPayload() {
  const el = getComplaintElements();
  return {
    complaint_type: el.type?.value || "General Issue",
    courier_name: el.courier?.value.trim() || "",
    pod_number: el.pod?.value.trim() || "",
    reference_number: el.reference?.value.trim() || "",
    sender_name: el.senderName?.value.trim() || "",
    sender_phone: el.senderPhone?.value.trim() || "",
    receiver_name: el.receiverName?.value.trim() || "",
    receiver_phone: el.receiverPhone?.value.trim() || "",
    customer_message: el.messageInput?.value.trim() || ""
  };
}

function validateComplaintPayload(payload) {
  if (!payload.customer_message) return "Complaint message is required.";
  return "";
}

async function submitComplaint(e) {
  e.preventDefault();
  const el = getComplaintElements();
  if (!el.form) return;

  const payload = getComplaintPayload();
  const validationError = validateComplaintPayload(payload);

  if (el.formMessage) {
    el.formMessage.style.color = "";
    el.formMessage.textContent = "";
  }

  if (validationError) {
    if (el.formMessage) el.formMessage.textContent = validationError;
    return;
  }

  try {
    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      if (el.formMessage) {
        el.formMessage.style.color = "#dc2626";
        el.formMessage.textContent = data.message || "Failed to submit complaint.";
      }
      return;
    }

    if (el.formMessage) {
  el.formMessage.style.color = "#166534";

  el.formMessage.innerHTML = `
    ${data.message || "Complaint submitted successfully."}<br>
    Complaint ID: <strong>${data.complaint_id || "-"}</strong><br><br>

    <a href="/complaint-status.html?complaint_id=${encodeURIComponent(data.complaint_id || "")}"
       class="public-submit"
       style="display:inline-block; text-decoration:none; color:white;">
       Check Complaint Status
    </a>
  `;
}

    resetComplaintForm();
    if (el.formMessage) {
      el.formMessage.style.color = "#166534";
      el.formMessage.textContent = `${data.message || "Complaint submitted successfully."} Complaint ID: ${data.complaint_id || "-"}`;
    }

    await loadComplaintsList();
    await loadDashboardSummary();
  } catch {
    if (el.formMessage) {
      el.formMessage.style.color = "#dc2626";
      el.formMessage.textContent = "Server error while submitting complaint.";
    }
  }
}

function fillComplaintUpdatePanel(complaintId, status, adminNote, phone) {
  const el = getComplaintElements();
  if (el.selectedComplaintId) el.selectedComplaintId.value = complaintId || "";
  if (el.selectedComplaintSenderPhone) {
  el.selectedComplaintSenderPhone.value = phone || "";
}

  if (el.updateStatus) el.updateStatus.value = status || "Open";
  if (el.updateAdminNote) el.updateAdminNote.value = adminNote || "";

  if (el.updateForm) {
    const section = el.updateForm.closest(".page-card");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadComplaintsList() {
  const el = getComplaintElements();
  const cardsGrid = document.getElementById("complaintsCardsGrid");

  if (!cardsGrid) return;

  const search = el.searchInput?.value.trim() || "";
  const status = el.statusFilter?.value || "All";

  cardsGrid.innerHTML = `<p style="text-align:center;">Loading complaints...</p>`;

  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const response = await fetch(`/api/complaints?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      cardsGrid.innerHTML = `<p style="text-align:center;color:#dc2626;">Failed to load complaints.</p>`;
      return;
    }

    const rows = data.complaints || [];

    if (!rows.length) {
      cardsGrid.innerHTML = `<p style="text-align:center;">No complaints found.</p>`;
      return;
    }

    cardsGrid.innerHTML = rows.map((row) => `
      <article class="complaint-card">
        <div class="complaint-card-top">
          <div>
            <p class="section-kicker">COMPLAINT ID</p>
            <h3>${escapeHtml(row.complaint_id)}</h3>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
         ${formatAttendanceTag(row.complaint_status)}
        <span class="priority-badge ${row.priority}">
        ${row.priority || "Medium"}
       </span>
        </div>
        </div>

        <div class="complaint-card-grid">
          <div>
            <span>Type</span>
            <strong>${escapeHtml(row.complaint_type || "-")}</strong>
          </div>

          <div>
            <span>Courier</span>
            <strong>${escapeHtml(row.courier_name || "-")}</strong>
          </div>

          <div>
            <span>POD</span>
            <strong>${escapeHtml(row.pod_number || "-")}</strong>
          </div>

          <div>
            <span>Reference</span>
            <strong>${escapeHtml(row.reference_number || "-")}</strong>
          </div>

          <div>
            <span>Sender</span>
            <strong>${escapeHtml(row.sender_name || "-")}</strong>
            <small>${escapeHtml(row.sender_phone || "-")}</small>
          </div>

          <div>
            <span>Receiver</span>
            <strong>${escapeHtml(row.receiver_name || "-")}</strong>
            <small>${escapeHtml(row.receiver_phone || "-")}</small>
          </div>

          <div>
            <span>Submitted</span>
            <strong>${escapeHtml(row.submitted_at || "-")}</strong>
          </div>
        </div>

        <div class="complaint-text-block">
          <span>Customer Message</span>
          <p>${escapeHtml(row.customer_message || "-")}</p>
        </div>

        <div class="complaint-text-block admin-note-block">
          <span>Admin Note</span>
          <p>${escapeHtml(row.admin_note || "-")}</p>
        </div>

        <div class="complaint-card-actions">
  
  <button
    type="button"
    class="secondary-btn"
    onclick="fillComplaintUpdatePanel(
  '${escapeHtml(row.complaint_id).replaceAll("&#039;", "'")}',
  '${escapeHtml(row.complaint_status).replaceAll("&#039;", "'")}',
  \`${escapeHtml(row.admin_note || "")}\`,
  '${escapeHtml(row.sender_phone || "")}'
)"
  >
    Update Complaint
  </button>

  <button
    type="button"
    class="primary-btn"
    onclick="sendWhatsAppReply(
  '${escapeHtml(row.complaint_id)}',
  '${escapeHtml(row.sender_phone || "")}',
  '${escapeHtml(row.complaint_status)}'
)"
  >
    WhatsApp Reply
  </button>

</div>
      </article>
    `).join("");

  } catch (error) {
    console.error("Load complaints card error:", error);
    cardsGrid.innerHTML = `<p style="text-align:center;color:#dc2626;">Server error while loading complaints.</p>`;
  }
}

async function saveComplaintUpdate(e) {
  e.preventDefault();
  const el = getComplaintElements();
  if (!el.updateForm) return;

  const complaintId = el.selectedComplaintId?.value.trim() || "";
  const complaintStatus = el.updateStatus?.value || "Open";
  const adminNote = el.updateAdminNote?.value.trim() || "";

  if (!complaintId) {
    if (el.adminMessage) {
      el.adminMessage.style.color = "#dc2626";
      el.adminMessage.textContent = "Please select a complaint from the table first.";
    }
    return;
  }

  if (el.adminMessage) {
    el.adminMessage.style.color = "";
    el.adminMessage.textContent = "Saving complaint update...";
  }

  try {
    const response = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        complaint_status: complaintStatus,
        admin_note: adminNote
      })
    });

    const data = await response.json();

    if (!data.success) {
      if (el.adminMessage) {
        el.adminMessage.style.color = "#dc2626";
        el.adminMessage.textContent = data.message || "Failed to update complaint.";
      }
      return;
    }

    if (el.adminMessage) {
      el.adminMessage.style.color = "#166534";
      el.adminMessage.textContent = data.message || "Complaint updated successfully.";
    }

    const autoPhone = el.selectedComplaintSenderPhone?.value || "";
    const autoComplaintId = el.selectedComplaintId?.value || "";
    const autoStatus = el.updateStatus?.value || "Open";

if (autoPhone && autoComplaintId) {
  sendWhatsAppReply(autoComplaintId, autoPhone, autoStatus);
}

    await loadComplaintsList();
    await loadDashboardSummary();
  } catch {
    if (el.adminMessage) {
      el.adminMessage.style.color = "#dc2626";
      el.adminMessage.textContent = "Server error while updating complaint.";
    }
  }
}

function setupComplaintsPage() {
  const el = getComplaintElements();
  if (!el.form && !el.tableBody && !el.updateForm) return;

  if (el.form) {
    el.form.addEventListener("submit", submitComplaint);
  }

  if (el.resetBtn) {
    el.resetBtn.addEventListener("click", resetComplaintForm);
  }

  if (el.searchBtn) {
    el.searchBtn.addEventListener("click", loadComplaintsList);
  }

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", async () => {
      if (el.searchInput) el.searchInput.value = "";
      if (el.statusFilter) el.statusFilter.value = "All";
      await loadComplaintsList();
    });
  }

  if (el.searchInput) {
    el.searchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await loadComplaintsList();
      }
    });
  }

  if (el.statusFilter) {
    el.statusFilter.addEventListener("change", loadComplaintsList);
  }

  if (el.updateForm) {
    el.updateForm.addEventListener("submit", saveComplaintUpdate);
  }

  if (el.resetUpdateBtn) {
    el.resetUpdateBtn.addEventListener("click", resetComplaintUpdatePanel);
  }

  loadComplaintsList();
}

/* =========================
   INVENTORY MODULE
========================= */

let editingInventoryId = null;

function getInventoryElements() {
  return {
    form: document.getElementById("inventoryForm"),
    itemName: document.getElementById("inventoryItemName"),
    category: document.getElementById("inventoryCategory"),
    unit: document.getElementById("inventoryUnit"),
    supplierName: document.getElementById("inventorySupplierName"),
    purchasePrice: document.getElementById("inventoryPurchasePrice"),
    sellingPrice: document.getElementById("inventorySellingPrice"),
    currentStock: document.getElementById("inventoryCurrentStock"),
    minimumStock: document.getElementById("inventoryMinimumStock"),
    notes: document.getElementById("inventoryNotes"),
    message: document.getElementById("inventoryFormMessage"),
    saveBtn: document.getElementById("saveInventoryBtn"),
    resetBtn: document.getElementById("resetInventoryBtn"),
    tableBody: document.getElementById("inventoryTableBody"),
    searchInput: document.getElementById("inventorySearch"),
    statusFilter: document.getElementById("inventoryStatusFilter"),
    searchBtn: document.getElementById("searchInventoryBtn"),
    refreshBtn: document.getElementById("refreshInventoryBtn")
  };
}

function resetInventoryForm() {
  const el = getInventoryElements();
  if (!el.form) return;

  el.form.reset();
  editingInventoryId = null;

  if (el.unit) el.unit.value = "pcs";
  if (el.saveBtn) el.saveBtn.textContent = "Save Inventory";

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }
}

function getInventoryPayload() {
  const el = getInventoryElements();

  return {
    item_name: el.itemName?.value.trim() || "",
    category: el.category?.value.trim() || "",
    unit: el.unit?.value.trim() || "pcs",
    supplier_name: el.supplierName?.value.trim() || "",
    purchase_price: el.purchasePrice?.value || "0",
    selling_price: el.sellingPrice?.value || "0",
    current_stock: el.currentStock?.value || "0",
    minimum_stock: el.minimumStock?.value || "0",
    notes: el.notes?.value.trim() || ""
  };
}

function validateInventoryPayload(payload) {
  if (!payload.item_name) return "Item name is required.";
  if (!payload.category) return "Category is required.";
  return "";
}

function formatInventoryStatus(status) {
  if (status === "Low Stock") {
    return `<span class="tag tag-danger">${escapeHtml(status)}</span>`;
  }
  return `<span class="tag tag-success">${escapeHtml(status || "In Stock")}</span>`;
}

async function loadInventoryList() {
  const el = getInventoryElements();
  if (!el.tableBody) return;

  const search = el.searchInput?.value.trim() || "";
  const status = el.statusFilter?.value || "All";

  el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Loading inventory...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const response = await fetch(`/api/inventory?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Failed to load inventory.</td></tr>`;
      return;
    }

    const rows = data.inventory || [];

    if (rows.length === 0) {
      el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">No inventory items found.</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${escapeHtml(item.item_name)}</td>
        <td>${escapeHtml(item.category || "-")}</td>
        <td>${escapeHtml(item.unit || "-")}</td>
        <td>${escapeHtml(item.supplier_name || "-")}</td>
        <td>${formatCurrency(item.purchase_price || 0)}</td>
        <td>${formatCurrency(item.selling_price || 0)}</td>
        <td>${Number(item.current_stock || 0)}</td>
        <td>${Number(item.minimum_stock || 0)}</td>
        <td>${formatInventoryStatus(item.stock_status)}</td>
        <td>${escapeHtml(item.notes || "-")}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="secondary-btn" onclick="editInventory(${item.id})">Edit</button>
            <button type="button" class="danger-btn" onclick="deleteInventory(${item.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch {
    el.tableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">Server error while loading inventory.</td></tr>`;
  }
}

async function saveInventory(e) {
  e.preventDefault();
  const el = getInventoryElements();
  if (!el.form) return;

  const payload = getInventoryPayload();
  const validationError = validateInventoryPayload(payload);

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }

  if (validationError) {
    if (el.message) el.message.textContent = validationError;
    return;
  }

  try {
    const isEdit = editingInventoryId !== null;
    const url = isEdit ? `/api/inventory/${editingInventoryId}` : "/api/inventory";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) el.message.textContent = data.message || "Failed to save inventory item.";
      return;
    }

    resetInventoryForm();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Inventory item saved successfully.";
    }

    await loadInventoryList();
    await loadDashboardSummary();
  } catch {
    if (el.message) el.message.textContent = "Server error while saving inventory item.";
  }
}

async function editInventory(id) {
  const el = getInventoryElements();
  if (!el.form) return;

  try {
    const response = await fetch(`/api/inventory/${id}`);
    const data = await response.json();

    if (!data.success || !data.item) {
      if (el.message) el.message.textContent = data.message || "Failed to load inventory item.";
      return;
    }

    const item = data.item;
    editingInventoryId = item.id;

    if (el.itemName) el.itemName.value = item.item_name || "";
    if (el.category) el.category.value = item.category || "";
    if (el.unit) el.unit.value = item.unit || "pcs";
    if (el.supplierName) el.supplierName.value = item.supplier_name || "";
    if (el.purchasePrice) el.purchasePrice.value = item.purchase_price ?? 0;
    if (el.sellingPrice) el.sellingPrice.value = item.selling_price ?? 0;
    if (el.currentStock) el.currentStock.value = item.current_stock ?? 0;
    if (el.minimumStock) el.minimumStock.value = item.minimum_stock ?? 0;
    if (el.notes) el.notes.value = item.notes || "";
    if (el.saveBtn) el.saveBtn.textContent = "Update Inventory";

    if (el.message) {
      el.message.style.color = "#1d4ed8";
      el.message.textContent = `Editing inventory item ID ${item.id}`;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    if (el.message) el.message.textContent = "Server error while loading inventory item.";
  }
}

async function deleteInventory(id) {
  const confirmed = window.confirm("Are you sure you want to delete this inventory item?");
  if (!confirmed) return;

  const el = getInventoryElements();

  try {
    const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!data.success) {
      if (el.message) el.message.textContent = data.message || "Failed to delete inventory item.";
      return;
    }

    if (editingInventoryId === id) resetInventoryForm();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Inventory item deleted successfully.";
    }

    await loadInventoryList();
    await loadDashboardSummary();
  } catch {
    if (el.message) el.message.textContent = "Server error while deleting inventory item.";
  }
}

function setupInventoryPage() {
  const el = getInventoryElements();
  if (!el.form && !el.tableBody) return;

  if (el.form) el.form.addEventListener("submit", saveInventory);
  if (el.resetBtn) el.resetBtn.addEventListener("click", resetInventoryForm);
  if (el.searchBtn) el.searchBtn.addEventListener("click", loadInventoryList);

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", async () => {
      if (el.searchInput) el.searchInput.value = "";
      if (el.statusFilter) el.statusFilter.value = "All";
      await loadInventoryList();
    });
  }

  if (el.searchInput) {
    el.searchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await loadInventoryList();
      }
    });
  }

  if (el.statusFilter) el.statusFilter.addEventListener("change", loadInventoryList);

  resetInventoryForm();
  loadInventoryList();
}

/* =========================
   PAYSLIP PAGE (simple existing page support)
========================= */

async function loadStaffForPayslip() {
  const staffSelect = document.getElementById("staffSelect");
  if (!staffSelect) return;

  try {
    const res = await fetch("/api/staff?status=Active");
    const data = await res.json();
    if (!data.success) return;

    let html = "";
    (data.staff || []).forEach((s) => {
      html += `<option value="${s.id}">${escapeHtml(s.name)}</option>`;
    });

    staffSelect.innerHTML = html;
  } catch (error) {
    console.error("Failed to load staff for payslip", error);
  }
}

async function loadPayslipData() {
  const staffSelect = document.getElementById("staffSelect");
  const monthSelect = document.getElementById("monthSelect");
  if (!staffSelect || !monthSelect) return;

  const id = staffSelect.value;
  const month = monthSelect.value || getCurrentMonthValue();

  try {
    const res = await fetch(`/api/payroll?month=${encodeURIComponent(month)}`);
    const data = await res.json();
    const payrollList = data.payroll || [];
    const p = payrollList.find((x) => String(x.staff_id) === String(id));

    if (!p) {
      alert("No payroll found for the selected staff and month.");
      return;
    }

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.innerText = value ?? "";
    };

    setText("month", month);
    setText("name", p.name);
    setText("role", p.role);
    setText("rate", "₹ " + p.hourly_rate);
    setText("hours", p.total_worked_time_text);
    setText("base", "₹ " + p.base_salary);
    setText("bonus", p.bonus);
    setText("deduction", p.deduction);
    setText("final", p.final_salary);
    setText("status", p.paid_status);
  } catch (error) {
    console.error("Failed to load payslip data", error);
  }
}

function printSlip() {
  window.print();
}

function setupPayslipPage() {
  const staffSelect = document.getElementById("staffSelect");
  const monthSelect = document.getElementById("monthSelect");
  if (!staffSelect || !monthSelect) return;

  if (!monthSelect.value) monthSelect.value = getCurrentMonthValue();
  loadStaffForPayslip();

  window.loadPayslip = loadPayslipData;
  window.printSlip = printSlip;
}

function setupPayrollPage() {
  const el = getPayrollElements();
  if (!el.tableBody) return;
  if (el.monthInput && !el.monthInput.value) el.monthInput.value = getCurrentMonthValue();
  if (el.loadBtn) el.loadBtn.addEventListener("click", loadPayrollData);
  loadPayrollData();
}

document.addEventListener("DOMContentLoaded", async () => {
  setupThemeChanger()
  await checkAuthForProtectedPages()
  await loadDashboardSummary()
  setupStaffPage()
  setupAttendancePage()
  setupPayrollPage()
  setupComplaintsPage();
  startComplaintAutoRefresh();
  setupInventoryPage()
  setupExpensesPage();
  setupIncomePage();
  setupPayslipPage()
  setupProfitLossPage();
  setupActivityLogsPage();
  setupOffersWhatsAppPage();
  setupCustomerPage();
  setupPublicComplaintForm();
  setupComplaintStatusPage();
  setupComplaintDropdown();
  setupBackupSystem();
  loadBackupList();
  setupRestoreSystem();
  setupExportComplaints();
  setupExportPdf();

})

window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.checkInStaff = checkInStaff;
window.checkOutStaff = checkOutStaff;
window.updatePayrollBonus = updatePayrollBonus;
window.updatePayrollDeduction = updatePayrollDeduction;
window.savePayrollRow = savePayrollRow;
window.markPayrollPaid = markPayrollPaid;
window.prefillAttendanceControl = prefillAttendanceControl;
window.selectStatusCardAction = selectStatusCardAction;
window.fillComplaintUpdatePanel = fillComplaintUpdatePanel;
window.editInventory = editInventory;
window.deleteInventory = deleteInventory;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;

/* =========================
   EXPENSES MODULE
========================= */

let editingExpenseId = null;

function getExpenseElements() {
  return {
    form: document.getElementById("expenseForm"),
    date: document.getElementById("expenseDate"),
    category: document.getElementById("expenseCategory"),
    name: document.getElementById("expenseName"),
    amount: document.getElementById("expenseAmount"),
    paymentMode: document.getElementById("expensePaymentMode"),
    vendorName: document.getElementById("expenseVendorName"),
    notes: document.getElementById("expenseNotes"),
    message: document.getElementById("expenseFormMessage"),
    saveBtn: document.getElementById("saveExpenseBtn"),
    resetBtn: document.getElementById("resetExpenseBtn"),

    searchInput: document.getElementById("expenseSearch"),
    categoryFilter: document.getElementById("expenseCategoryFilter"),
    startDate: document.getElementById("expenseStartDate"),
    endDate: document.getElementById("expenseEndDate"),
    searchBtn: document.getElementById("searchExpensesBtn"),
    refreshBtn: document.getElementById("refreshExpensesBtn"),

    totalAmount: document.getElementById("expenseTotalAmount"),
    tableBody: document.getElementById("expenseTableBody")
  };
}

function resetExpenseForm() {
  const el = getExpenseElements();
  if (!el.form) return;

  el.form.reset();
  editingExpenseId = null;

  if (el.date && !el.date.value) {
    el.date.value = getTodayValue();
  }

  if (el.saveBtn) {
    el.saveBtn.textContent = "Save Expense";
  }

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }
}

function getExpensePayload() {
  const el = getExpenseElements();

  return {
    expense_date: el.date?.value || getTodayValue(),
    category: el.category?.value || "General",
    expense_name: el.name?.value.trim() || "",
    amount: el.amount?.value || "0",
    payment_mode: el.paymentMode?.value || "Cash",
    vendor_name: el.vendorName?.value.trim() || "",
    notes: el.notes?.value.trim() || ""
  };
}

function validateExpensePayload(payload) {
  if (!payload.expense_name) return "Expense name is required.";
  if (Number(payload.amount || 0) <= 0) return "Amount must be greater than 0.";
  return "";
}

async function loadExpensesList() {
  const el = getExpenseElements();
  if (!el.tableBody) return;

  const search = el.searchInput?.value.trim() || "";
  const category = el.categoryFilter?.value || "All";
  const startDate = el.startDate?.value || "";
  const endDate = el.endDate?.value || "";

  el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Loading expenses...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await fetch(`/api/expenses?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Failed to load expenses.</td></tr>`;
      if (el.totalAmount) el.totalAmount.textContent = "₹0.00";
      return;
    }

    const rows = data.expenses || [];
    const totalAmount = Number(data.total_amount || 0);

    if (el.totalAmount) {
      el.totalAmount.textContent = formatCurrency(totalAmount);
    }

    if (rows.length === 0) {
      el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No expenses found.</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${escapeHtml(row.expense_date || "-")}</td>
        <td>${escapeHtml(row.category || "-")}</td>
        <td>${escapeHtml(row.expense_name || "-")}</td>
        <td>${formatCurrency(row.amount || 0)}</td>
        <td>${escapeHtml(row.payment_mode || "-")}</td>
        <td>${escapeHtml(row.vendor_name || "-")}</td>
        <td>${escapeHtml(row.notes || "-")}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="secondary-btn" onclick="editExpense(${row.id})">Edit</button>
            <button type="button" class="danger-btn" onclick="deleteExpense(${row.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Load expenses error:", error);
    el.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Server error while loading expenses.</td></tr>`;
    if (el.totalAmount) el.totalAmount.textContent = "₹0.00";
  }
}

async function saveExpense(e) {
  e.preventDefault();
  const el = getExpenseElements();
  if (!el.form) return;

  const payload = getExpensePayload();
  const validationError = validateExpensePayload(payload);

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "";
  }

  if (validationError) {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = validationError;
    }
    return;
  }

  try {
    const isEdit = editingExpenseId !== null;
    const url = isEdit ? `/api/expenses/${editingExpenseId}` : "/api/expenses";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to save expense.";
      }
      return;
    }

    resetExpenseForm();

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Expense saved successfully.";
    }

    await loadExpensesList();
    await loadDashboardSummary();
  } catch (error) {
    console.error("Save expense error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while saving expense.";
    }
  }
}

async function editExpense(id) {
  const el = getExpenseElements();
  if (!el.form) return;

  try {
    const response = await fetch(`/api/expenses/${id}`);
    const data = await response.json();

    if (!data.success || !data.expense) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to load expense details.";
      }
      return;
    }

    const expense = data.expense;
    editingExpenseId = expense.id;

    if (el.date) el.date.value = expense.expense_date || getTodayValue();
    if (el.category) el.category.value = expense.category || "General";
    if (el.name) el.name.value = expense.expense_name || "";
    if (el.amount) el.amount.value = expense.amount ?? 0;
    if (el.paymentMode) el.paymentMode.value = expense.payment_mode || "Cash";
    if (el.vendorName) el.vendorName.value = expense.vendor_name || "";
    if (el.notes) el.notes.value = expense.notes || "";

    if (el.saveBtn) {
      el.saveBtn.textContent = "Update Expense";
    }

    if (el.message) {
      el.message.style.color = "#1d4ed8";
      el.message.textContent = `Editing expense ID ${expense.id}`;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Edit expense load error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while loading expense details.";
    }
  }
}

async function deleteExpense(id) {
  const confirmed = window.confirm("Are you sure you want to delete this expense?");
  if (!confirmed) return;

  const el = getExpenseElements();

  try {
    const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to delete expense.";
      }
      return;
    }

    if (editingExpenseId === id) {
      resetExpenseForm();
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = data.message || "Expense deleted successfully.";
    }

    await loadExpensesList();
    await loadDashboardSummary();
  } catch (error) {
    console.error("Delete expense error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while deleting expense.";
    }
  }
}

function setupExpensesPage() {
  const el = getExpenseElements();
  if (!el.form && !el.tableBody) return;

  if (el.date && !el.date.value) {
    el.date.value = getTodayValue();
  }

  if (el.form) {
    el.form.addEventListener("submit", saveExpense);
  }

  if (el.resetBtn) {
    el.resetBtn.addEventListener("click", resetExpenseForm);
  }

  if (el.searchBtn) {
    el.searchBtn.addEventListener("click", loadExpensesList);
  }

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", async () => {
      if (el.searchInput) el.searchInput.value = "";
      if (el.categoryFilter) el.categoryFilter.value = "All";
      if (el.startDate) el.startDate.value = "";
      if (el.endDate) el.endDate.value = "";
      await loadExpensesList();
    });
  }

  if (el.searchInput) {
    el.searchInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await loadExpensesList();
      }
    });
  }

  if (el.categoryFilter) {
    el.categoryFilter.addEventListener("change", loadExpensesList);
  }

  resetExpenseForm();
  loadExpensesList();
}

/* =========================
   PROFIT & LOSS MODULE
========================= */

function getProfitLossElements() {
  return {
    monthInput: document.getElementById("profitLossMonth"),
    loadBtn: document.getElementById("loadProfitLossBtn"),
    message: document.getElementById("profitLossMessage"),
    income: document.getElementById("profitLossIncome"),
    expense: document.getElementById("profitLossExpense"),
    payroll: document.getElementById("profitLossPayroll"),
    outflow: document.getElementById("profitLossOutflow"),
    net: document.getElementById("profitLossNet"),
    breakdownBody: document.getElementById("profitLossBreakdownBody")
  };
}

async function loadProfitLossData() {
  const el = getProfitLossElements();
  if (!el.monthInput) return;

  const month = el.monthInput.value || "";

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "Loading monthly result...";
  }

  try {
    const response = await fetch(`/api/profit-loss?month=${encodeURIComponent(month)}`);
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to load profit and loss data.";
      }
      return;
    }

    const summary = data.summary || {};
    const breakdown = data.expense_breakdown || [];

    if (el.income) el.income.textContent = formatCurrency(summary.total_income || 0);
    if (el.expense) el.expense.textContent = formatCurrency(summary.total_expense || 0);
    if (el.payroll) el.payroll.textContent = formatCurrency(summary.total_payroll || 0);
    if (el.outflow) el.outflow.textContent = formatCurrency(summary.total_outflow || 0);
    if (el.net) el.net.textContent = formatCurrency(summary.net_profit || 0);

    if (el.breakdownBody) {
      if (!breakdown.length) {
        el.breakdownBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align:center;">No expense data found for this month.</td>
          </tr>
        `;
      } else {
        el.breakdownBody.innerHTML = breakdown.map((row) => `
          <tr>
            <td>${escapeHtml(row.category || "-")}</td>
            <td>${Number(row.total_entries || 0)}</td>
            <td>${formatCurrency(row.total_amount || 0)}</td>
          </tr>
        `).join("");
      }
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = `Profit & Loss loaded for ${month}.`;
    }
  } catch (error) {
    console.error("Profit loss load error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while loading profit and loss.";
    }
  }
}

function setupProfitLossPage() {
  const el = getProfitLossElements();
  if (!el.monthInput) return;

  if (el.loadBtn) {
    el.loadBtn.addEventListener("click", loadProfitLossData);
  }

  loadProfitLossData();
}

/* =========================
   ACTIVITY LOGS MODULE
========================= */

function getActivityLogElements() {
  return {
    search: document.getElementById("activitySearch"),
    refreshBtn: document.getElementById("refreshActivityLogsBtn"),
    message: document.getElementById("activityLogsMessage"),
    tableBody: document.getElementById("activityLogsTableBody")
  };
}

async function loadActivityLogs() {
  const el = getActivityLogElements();
  if (!el.tableBody) return;

  if (el.message) {
    el.message.style.color = "";
    el.message.textContent = "Loading activity logs...";
  }

  try {
    const response = await fetch("/api/activity-logs");
    const data = await response.json();

    if (!data.success) {
      if (el.message) {
        el.message.style.color = "#dc2626";
        el.message.textContent = data.message || "Failed to load activity logs.";
      }
      el.tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Failed to load logs.</td></tr>`;
      return;
    }

    const logs = data.logs || [];
    const searchValue = (el.search?.value || "").toLowerCase().trim();

    const filteredLogs = logs.filter((log) => {
      if (!searchValue) return true;
      return (
        String(log.action_type || "").toLowerCase().includes(searchValue) ||
        String(log.action_details || "").toLowerCase().includes(searchValue) ||
        String(log.created_at || "").toLowerCase().includes(searchValue)
      );
    });

    if (!filteredLogs.length) {
      el.tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No matching logs found.</td></tr>`;
    } else {
      el.tableBody.innerHTML = filteredLogs.map((log) => `
        <tr>
          <td>${log.id}</td>
          <td>${escapeHtml(log.action_type || "-")}</td>
          <td>${escapeHtml(log.action_details || "-")}</td>
          <td>${escapeHtml(log.created_at || "-")}</td>
        </tr>
      `).join("");
    }

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.textContent = `Loaded ${filteredLogs.length} activity log(s).`;
    }
  } catch (error) {
    console.error("Load activity logs error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while loading activity logs.";
    }
    el.tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Server error while loading logs.</td></tr>`;
  }
}

function setupActivityLogsPage() {
  const el = getActivityLogElements();
  if (!el.tableBody) return;

  if (el.refreshBtn) {
    el.refreshBtn.addEventListener("click", loadActivityLogs);
  }

  if (el.search) {
    el.search.addEventListener("input", loadActivityLogs);
  }

  loadActivityLogs();
}

/* =========================
   INCOME MODULE
========================= */

let editingIncomeId = null;

function getIncomeElements() {
  return {
    form: document.getElementById("incomeForm"),
    date: document.getElementById("incomeDate"),
    category: document.getElementById("incomeCategory"),
    name: document.getElementById("incomeName"),
    amount: document.getElementById("incomeAmount"),
    paymentMode: document.getElementById("incomePaymentMode"),
    customerSelect: document.getElementById("incomeCustomerSelect"),
    customerName: document.getElementById("incomeCustomerName"),
    notes: document.getElementById("incomeNotes"),
    message: document.getElementById("incomeFormMessage"),
    saveBtn: document.getElementById("saveIncomeBtn"),
    resetBtn: document.getElementById("resetIncomeBtn"),
    search: document.getElementById("incomeSearch"),
    categoryFilter: document.getElementById("incomeCategoryFilter"),
    startDate: document.getElementById("incomeStartDate"),
    endDate: document.getElementById("incomeEndDate"),
    searchBtn: document.getElementById("searchIncomeBtn"),
    refreshBtn: document.getElementById("refreshIncomeBtn"),

    totalAmount: document.getElementById("incomeTotalAmount"),
    tableBody: document.getElementById("incomeTableBody")
  };
}

function resetIncomeForm() {
  const el = getIncomeElements();
  if (!el.form) return;

  el.form.reset();
  editingIncomeId = null;

  if (el.date && !el.date.value) {
    el.date.value = getTodayValue();
  }

  // ✅ ADD THIS LINE
  if (el.customerSelect) el.customerSelect.value = "";

  if (el.saveBtn) {
    el.saveBtn.textContent = "Save Income";
  }

  if (el.message) {
    el.message.textContent = "";
  }
}

function getIncomePayload() {
  const el = getIncomeElements();

  return {
    income_date: el.date?.value || getTodayValue(),
    category: el.category?.value || "General",
    income_name: el.name?.value.trim() || "",
    amount: el.amount?.value || "0",
    payment_mode: el.paymentMode?.value || "Cash",
    customer_name: el.customerName?.value.trim() || "",
    notes: el.notes?.value.trim() || ""
  };
}

function validateIncomePayload(payload) {
  if (!payload.income_name) return "Income name is required.";
  if (Number(payload.amount) <= 0) return "Amount must be greater than 0.";
  return "";
}

async function loadIncomeList() {
  const el = getIncomeElements();
  if (!el.tableBody) return;

  try {
    const params = new URLSearchParams();

    if (el.search?.value) params.append("search", el.search.value);
    if (el.categoryFilter?.value) params.append("category", el.categoryFilter.value);
    if (el.startDate?.value) params.append("start_date", el.startDate.value);
    if (el.endDate?.value) params.append("end_date", el.endDate.value);

    const res = await fetch(`/api/income?${params.toString()}`);
    const data = await res.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="9">Failed to load income</td></tr>`;
      return;
    }

    const rows = data.income || [];

    el.totalAmount.textContent = formatCurrency(data.total_amount || 0);

    if (!rows.length) {
      el.tableBody.innerHTML = `<tr><td colspan="9">No income found</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.income_date}</td>
        <td>${r.category}</td>
        <td>${escapeHtml(r.income_name)}</td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${r.payment_mode}</td>
        <td>${escapeHtml(r.customer_name || "-")}</td>
        <td>${escapeHtml(r.notes || "-")}</td>
        <td>
          <button onclick="editIncome(${r.id})">Edit</button>
          <button onclick="deleteIncome(${r.id})">Delete</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
  }
}

async function saveIncome(e) {
  e.preventDefault();

  const el = getIncomeElements();
  const payload = getIncomePayload();

  const error = validateIncomePayload(payload);
  if (error) {
    el.message.textContent = error;
    el.message.style.color = "red";
    return;
  }

  try {
    const url = editingIncomeId ? `/api/income/${editingIncomeId}` : `/api/income`;
    const method = editingIncomeId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      el.message.textContent = data.message;
      el.message.style.color = "red";
      return;
    }

    el.message.textContent = data.message;
    el.message.style.color = "green";

    resetIncomeForm();
    loadIncomeList();

  } catch (err) {
    console.error(err);
  }
}

async function editIncome(id) {
  const el = getIncomeElements();

  const res = await fetch(`/api/income/${id}`);
  const data = await res.json();

  if (!data.success) return;

  const d = data.income;

  editingIncomeId = d.id;

  el.date.value = d.income_date;
  el.category.value = d.category;
  el.name.value = d.income_name;
  el.amount.value = d.amount;
  el.paymentMode.value = d.payment_mode;
  el.customerName.value = d.customer_name || "";
  el.notes.value = d.notes || "";

  el.saveBtn.textContent = "Update Income";
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;

  await fetch(`/api/income/${id}`, { method: "DELETE" });
  loadIncomeList();
}

async function loadIncomeCustomerOptions() {
  const el = getIncomeElements();
  if (!el.customerSelect) return;

  try {
    const res = await fetch("/api/customers");
    const data = await res.json();

    if (!data.success) return;

    const rows = data.customers || [];

    el.customerSelect.innerHTML =
      `<option value="">Choose customer</option>` +
      rows.map((c) => `
        <option
          value="${c.id}"
          data-name="${String(c.customer_name || "").replace(/"/g, "&quot;")}"
        >
          ${escapeHtml(c.customer_name)} (${escapeHtml(c.mobile_number || "-")})
        </option>
      `).join("");
  } catch (err) {
    console.error("Load customers for income failed:", err);
  }
}

function handleIncomeCustomerSelect() {
  const el = getIncomeElements();
  if (!el.customerSelect) return;

  const selected = el.customerSelect.options[el.customerSelect.selectedIndex];
  if (!selected || !selected.value) return;

  const name = selected.getAttribute("data-name") || "";

  if (el.customerName) el.customerName.value = name;
}

function setupIncomePage() {
  const el = getIncomeElements();
  if (!el.form) return;

  if (el.form) el.form.addEventListener("submit", saveIncome);
  if (el.resetBtn) el.resetBtn.addEventListener("click", resetIncomeForm);
  if (el.searchBtn) el.searchBtn.addEventListener("click", loadIncomeList);
  if (el.refreshBtn) el.refreshBtn.addEventListener("click", loadIncomeList);

  if (el.customerSelect) {
    el.customerSelect.addEventListener("change", handleIncomeCustomerSelect);
  }

  resetIncomeForm();
  loadIncomeCustomerOptions();
  loadIncomeList();
}

window.editIncome = editIncome;
window.deleteIncome = deleteIncome;

/* =========================
   OFFERS / WHATSAPP MODULE
========================= */

let editingOfferId = null;

function getOfferElements() {
  return {
    form: document.getElementById("offerForm"),
    customerSelect: document.getElementById("offerCustomerSelect"),
    customerName: document.getElementById("offerCustomerName"),
    mobileNumber: document.getElementById("offerMobileNumber"),
    offerType: document.getElementById("offerType"),
    offerTitle: document.getElementById("offerTitle"),
    offerMessage: document.getElementById("offerMessage"),
    formMessage: document.getElementById("offerFormMessage"),
    saveBtn: document.getElementById("saveOfferBtn"),
    resetBtn: document.getElementById("resetOfferBtn"),

    search: document.getElementById("offerSearch"),
    typeFilter: document.getElementById("offerTypeFilter"),
    searchBtn: document.getElementById("searchOffersBtn"),
    refreshBtn: document.getElementById("refreshOffersBtn"),

    tableBody: document.getElementById("offersTableBody")
  };
}

function resetOfferForm() {
  const el = getOfferElements();
  if (!el.form) return;

  el.form.reset();
  editingOfferId = null;

  if (el.saveBtn) {
    el.saveBtn.textContent = "Save Offer";
  }

  if (el.formMessage) {
    el.formMessage.textContent = "";
    el.formMessage.style.color = "";
  }
}

function getOfferPayload() {
  const el = getOfferElements();

  return {
    customer_name: el.customerName?.value.trim() || "",
    mobile_number: el.mobileNumber?.value.trim() || "",
    offer_type: el.offerType?.value || "General",
    offer_title: el.offerTitle?.value.trim() || "",
    offer_message: el.offerMessage?.value.trim() || ""
  };
}

function validateOfferPayload(payload) {
  if (!payload.mobile_number) return "Mobile number is required.";
  if (!payload.offer_title) return "Offer title is required.";
  if (!payload.offer_message) return "Offer message is required.";
  return "";
}

function buildWhatsAppLink(mobileNumber, message) {
  const cleanNumber = String(mobileNumber || "").replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message || "");
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

async function loadOffersList() {
  const el = getOfferElements();
  if (!el.tableBody) return;

  try {
    const params = new URLSearchParams();

    if (el.search?.value) params.append("search", el.search.value);
    if (el.typeFilter?.value) params.append("offer_type", el.typeFilter.value);

    const res = await fetch(`/api/offers-whatsapp?${params.toString()}`);
    const data = await res.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="8">Failed to load offers</td></tr>`;
      return;
    }

    const rows = data.offers || [];

    if (!rows.length) {
      el.tableBody.innerHTML = `<tr><td colspan="8">No offers found</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${escapeHtml(row.customer_name || "-")}</td>
        <td>${escapeHtml(row.mobile_number || "-")}</td>
        <td>${escapeHtml(row.offer_type || "-")}</td>
        <td>${escapeHtml(row.offer_title || "-")}</td>
        <td>${escapeHtml(row.offer_message || "-")}</td>
        <td>
          <a href="${buildWhatsAppLink(row.mobile_number, row.offer_message)}" target="_blank" class="action-btn module-link-btn">
            Open WhatsApp
          </a>
        </td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="secondary-btn" onclick="editOffer(${row.id})">Edit</button>
            <button type="button" class="danger-btn" onclick="deleteOffer(${row.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Load offers error:", err);
    el.tableBody.innerHTML = `<tr><td colspan="8">Server error while loading offers</td></tr>`;
  }
}

async function saveOffer(e) {
  e.preventDefault();

  const el = getOfferElements();
  const payload = getOfferPayload();

  const error = validateOfferPayload(payload);
  if (error) {
    if (el.formMessage) {
      el.formMessage.textContent = error;
      el.formMessage.style.color = "red";
    }
    return;
  }

  try {
    const url = editingOfferId ? `/api/offers-whatsapp/${editingOfferId}` : `/api/offers-whatsapp`;
    const method = editingOfferId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      if (el.formMessage) {
        el.formMessage.textContent = data.message || "Failed to save offer.";
        el.formMessage.style.color = "red";
      }
      return;
    }

    if (el.formMessage) {
      el.formMessage.textContent = data.message || "Offer saved successfully.";
      el.formMessage.style.color = "green";
    }

    resetOfferForm();
    loadOffersList();

  } catch (err) {
    console.error("Save offer error:", err);
    if (el.formMessage) {
      el.formMessage.textContent = "Server error while saving offer.";
      el.formMessage.style.color = "red";
    }
  }
}

async function editOffer(id) {
  const el = getOfferElements();

  try {
    const res = await fetch(`/api/offers-whatsapp/${id}`);
    const data = await res.json();

    if (!data.success || !data.offer) return;

    const row = data.offer;
    editingOfferId = row.id;

    if (el.customerName) el.customerName.value = row.customer_name || "";
    if (el.mobileNumber) el.mobileNumber.value = row.mobile_number || "";
    if (el.offerType) el.offerType.value = row.offer_type || "General";
    if (el.offerTitle) el.offerTitle.value = row.offer_title || "";
    if (el.offerMessage) el.offerMessage.value = row.offer_message || "";

    if (el.saveBtn) {
      el.saveBtn.textContent = "Update Offer";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (err) {
    console.error("Edit offer error:", err);
  }
}

async function deleteOffer(id) {
  if (!confirm("Delete this offer?")) return;

  try {
    await fetch(`/api/offers-whatsapp/${id}`, { method: "DELETE" });
    loadOffersList();
  } catch (err) {
    console.error("Delete offer error:", err);
  }
}

async function loadOfferCustomerOptions() {
  const el = getOfferElements();
  if (!el.customerSelect) return;

  try {
    const res = await fetch("/api/customers");
    const data = await res.json();

    if (!data.success) return;

    const rows = data.customers || [];

    el.customerSelect.innerHTML =
      `<option value="">Choose customer</option>` +
      rows.map((c) => `
        <option
          value="${c.id}"
          data-name="${String(c.customer_name || "").replace(/"/g, "&quot;")}"
          data-mobile="${String(c.whatsapp_number || c.mobile_number || "").replace(/"/g, "&quot;")}"
        >
          ${escapeHtml(c.customer_name)} (${escapeHtml(c.mobile_number)})
        </option>
      `).join("");
  } catch (err) {
    console.error("Load customers for offers failed:", err);
  }
}

function applyOfferQueryParams() {
  const el = getOfferElements();
  const params = new URLSearchParams(window.location.search);

  const customerName = params.get("customer_name") || "";
  const mobileNumber = params.get("mobile_number") || "";
  const offerType = params.get("offer_type") || "";
  const offerTitle = params.get("offer_title") || "";
  const offerMessage = params.get("offer_message") || "";

  if (customerName && el.customerName) el.customerName.value = customerName;
  if (mobileNumber && el.mobileNumber) el.mobileNumber.value = mobileNumber;
  if (offerType && el.offerType) el.offerType.value = offerType;
  if (offerTitle && el.offerTitle) el.offerTitle.value = offerTitle;
  if (offerMessage && el.offerMessage) el.offerMessage.value = offerMessage;
}

function setupOffersWhatsAppPage() {
  const el = getOfferElements();
  if (!el.form) return;

  if (el.form) el.form.addEventListener("submit", saveOffer);
  if (el.resetBtn) el.resetBtn.addEventListener("click", resetOfferForm);
  if (el.searchBtn) el.searchBtn.addEventListener("click", loadOffersList);
  if (el.refreshBtn) el.refreshBtn.addEventListener("click", loadOffersList);

    if (el.customerSelect) {
    el.customerSelect.addEventListener("change", handleOfferCustomerSelect);
  }

  resetOfferForm();
  applyOfferQueryParams();
  loadOfferCustomerOptions();
  loadOffersList();
}

function handleOfferCustomerSelect() {
  const el = getOfferElements();
  if (!el.customerSelect) return;

  const selected = el.customerSelect.options[el.customerSelect.selectedIndex];
  if (!selected || !selected.value) return;

  const name = selected.getAttribute("data-name") || "";
  const mobile = selected.getAttribute("data-mobile") || "";

  if (el.customerName) el.customerName.value = name;
  if (el.mobileNumber) el.mobileNumber.value = mobile;
}

window.editOffer = editOffer;
window.deleteOffer = deleteOffer;

/* =========================
   CUSTOMER MODULE
========================= */

let editingCustomerId = null;

function getCustomerElements() {
  return {
    form: document.getElementById("customerForm"),
    name: document.getElementById("customerName"),
    mobile: document.getElementById("customerMobile"),
    whatsapp: document.getElementById("customerWhatsapp"),
    birthday: document.getElementById("customerBirthday"),
    visits: document.getElementById("customerVisits"),
    service: document.getElementById("customerService"),
    address: document.getElementById("customerAddress"),
    notes: document.getElementById("customerNotes"),
    message: document.getElementById("customerMessage"),
    saveBtn: document.getElementById("saveCustomerBtn"),
    resetBtn: document.getElementById("resetCustomerBtn"),

    search: document.getElementById("customerSearch"),
    birthdayFilter: document.getElementById("customerBirthdayFilter"),
    searchBtn: document.getElementById("searchCustomerBtn"),
    tableBody: document.getElementById("customerTableBody")
  };
}

function resetCustomerForm() {
  const el = getCustomerElements();
  if (!el.form) return;

  el.form.reset();
  editingCustomerId = null;

  if (el.saveBtn) el.saveBtn.textContent = "Save Customer";
  if (el.message) el.message.textContent = "";
}

function getCustomerPayload() {
  const el = getCustomerElements();

  return {
    customer_name: el.name?.value.trim() || "",
    mobile_number: el.mobile?.value.trim() || "",
    whatsapp_number: el.whatsapp?.value.trim() || "",
    birthday: el.birthday?.value || "",
    visit_count: el.visits?.value || 0,
    last_service_used: el.service?.value || "General",
    address: el.address?.value || "",
    notes: el.notes?.value || ""
  };
}

function createBirthdayOffer(id) {
  const tableRows = document.querySelectorAll("#customerTableBody tr");

  let customerData = null;

  for (const row of tableRows) {
    const firstCell = row.children[0];
    if (firstCell && Number(firstCell.textContent) === Number(id)) {
      customerData = {
        id,
        name: row.children[1]?.textContent || "",
        mobile: row.children[2]?.textContent || ""
      };
      break;
    }
  }

  if (!customerData) {
    alert("Customer not found");
    return;
  }

  const params = new URLSearchParams({
    customer_name: customerData.name,
    mobile_number: customerData.mobile,
    offer_type: "Birthday",
    offer_title: "Birthday Special Offer",
    offer_message: `Happy Birthday ${customerData.name}! 🎉\n\nSpecial birthday offer available for you today at MVEXPRESS.\nVisit us and enjoy your customer benefit.`
  });

  window.location.href = `/offers-whatsapp.html?${params.toString()}`;
}

function createRepeatVisitOffer(id) {
  const tableRows = document.querySelectorAll("#customerTableBody tr");

  let customerData = null;

  for (const row of tableRows) {
    const firstCell = row.children[0];
    if (firstCell && Number(firstCell.textContent) === Number(id)) {
      customerData = {
        id,
        name: row.children[1]?.textContent || "",
        mobile: row.children[2]?.textContent || "",
        visits: row.children[4]?.textContent || "0"
      };
      break;
    }
  }

  if (!customerData) {
    alert("Customer not found");
    return;
  }

  const visitCount = Number(customerData.visits || 0);

  const params = new URLSearchParams({
    customer_name: customerData.name,
    mobile_number: customerData.mobile,
    offer_type: "Repeat Customer",
    offer_title: "Loyal Customer Special Offer",
    offer_message: `Hello ${customerData.name}! 🎉\n\nThank you for visiting MVEXPRESS ${visitCount} times.\nA special repeat customer offer is ready for you.\nVisit us again and enjoy your customer benefit.`
  });

  window.location.href = `/offers-whatsapp.html?${params.toString()}`;
}

function createFestivalOffer(id) {
  const tableRows = document.querySelectorAll("#customerTableBody tr");

  let customerData = null;

  for (const row of tableRows) {
    const firstCell = row.children[0];
    if (firstCell && Number(firstCell.textContent) === Number(id)) {
      customerData = {
        id,
        name: row.children[1]?.textContent || "",
        mobile: row.children[2]?.textContent || ""
      };
      break;
    }
  }

  if (!customerData) {
    alert("Customer not found");
    return;
  }

  const params = new URLSearchParams({
    customer_name: customerData.name,
    mobile_number: customerData.mobile,
    offer_type: "Festival",
    offer_title: "Festival Special Offer",
    offer_message: `Hello ${customerData.name}! 🎉\n\nFestival special offer is now available at MVEXPRESS.\nVisit us and enjoy your customer benefit on courier, printing, and other services.`
  });

  window.location.href = `/offers-whatsapp.html?${params.toString()}`;
}

function validateCustomer(payload) {
  if (!payload.customer_name) return "Name required";
  if (!payload.mobile_number) return "Mobile required";
  return "";
}

function isBirthdayToday(birthday) {
  if (!birthday) return false;

  const parts = String(birthday).split("-");
  if (parts.length !== 3) return false;

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return parts[1] === month && parts[2] === date;
}

function isBirthdayThisMonth(birthday) {
  if (!birthday) return false;

  const parts = String(birthday).split("-");
  if (parts.length !== 3) return false;

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return parts[1] === month;
}

function getBirthdayOfferButtonClass(birthday) {
  if (isBirthdayToday(birthday)) return "action-btn";
  if (isBirthdayThisMonth(birthday)) return "secondary-btn";
  return "";
}

function getRepeatOfferButtonClass(visitCount) {
  const visits = Number(visitCount || 0);
  if (visits >= 10) return "action-btn";
  if (visits >= 5) return "secondary-btn";
  return "";
}

function getCustomerBadges(customer) {
  const badges = [];
  const visits = Number(customer.visit_count || 0);

  if (isBirthdayToday(customer.birthday)) {
    badges.push(`<span class="action-btn" style="padding:4px 10px; font-size:12px;">Birthday Today</span>`);
  } else if (isBirthdayThisMonth(customer.birthday)) {
    badges.push(`<span class="secondary-btn" style="padding:4px 10px; font-size:12px;">Birthday This Month</span>`);
  }

  if (visits >= 10) {
    badges.push(`<span class="action-btn" style="padding:4px 10px; font-size:12px;">VIP Repeat</span>`);
  } else if (visits >= 5) {
    badges.push(`<span class="secondary-btn" style="padding:4px 10px; font-size:12px;">Loyal Customer</span>`);
  }

  return badges.join(" ");
}

async function loadCustomers() {
  const el = getCustomerElements();
  if (!el.tableBody) return;

  try {
    const search = el.search?.value || "";
    const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
    const data = await res.json();

    if (!data.success) {
      el.tableBody.innerHTML = `<tr><td colspan="7">Failed to load</td></tr>`;
      return;
    }

    let rows = data.customers || [];
    const birthdayFilter = el.birthdayFilter?.value || "All";

    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
    const todayDate = String(today.getDate()).padStart(2, "0");

    if (birthdayFilter === "Today") {
      rows = rows.filter(c => {
        if (!c.birthday) return false;
        const parts = String(c.birthday).split("-");
        if (parts.length !== 3) return false;
        return parts[1] === todayMonth && parts[2] === todayDate;
      });
    }

    if (birthdayFilter === "This Month") {
      rows = rows.filter(c => {
        if (!c.birthday) return false;
        const parts = String(c.birthday).split("-");
        if (parts.length !== 3) return false;
        return parts[1] === todayMonth;
      });
    }

    if (!rows.length) {
      el.tableBody.innerHTML = `<tr><td colspan="8">No customers</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = rows.map(c => `
  <tr>
    <td>${c.id}</td>
    <td>${escapeHtml(c.customer_name)}</td>
    <td>${c.mobile_number}</td>
    <td>${c.whatsapp_number || "-"}</td>
    <td>${c.visit_count}</td>
    <td>${c.last_service_used}</td>
    <td>${getCustomerBadges(c) || "-"}</td>
    <td>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="secondary-btn" onclick="editCustomer(${c.id})">Edit</button>
        <button type="button" class="danger-btn" onclick="deleteCustomer(${c.id})">Delete</button>
        <button
          type="button"
          class="${getBirthdayOfferButtonClass(c.birthday)}"
          onclick="createBirthdayOffer(${c.id})"
        >
          Birthday Offer
        </button>
        <button
          type="button"
          class="${getRepeatOfferButtonClass(c.visit_count)}"
          onclick="createRepeatVisitOffer(${c.id})"
        >
          Repeat Offer
        </button>
        <button
          type="button"
          class="secondary-btn"
          onclick="createFestivalOffer(${c.id})"
        >
          Festival Offer
        </button>
      </div>
    </td>
  </tr>
`).join("");

  } catch (err) {
    console.error(err);
  }
}

async function saveCustomer(e) {
  e.preventDefault();

  const el = getCustomerElements();
  const payload = getCustomerPayload();

  const error = validateCustomer(payload);
  if (error) {
    el.message.textContent = error;
    el.message.style.color = "red";
    return;
  }

  try {
    const url = editingCustomerId
      ? `/api/customers/${editingCustomerId}`
      : `/api/customers`;

    const method = editingCustomerId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      el.message.textContent = data.message;
      el.message.style.color = "red";
      return;
    }

    el.message.textContent = data.message;
    el.message.style.color = "green";

    resetCustomerForm();
    loadCustomers();

  } catch (err) {
    console.error(err);
  }
}

async function editCustomer(id) {
  const el = getCustomerElements();

  const res = await fetch(`/api/customers/${id}`);
  const data = await res.json();

  if (!data.success) return;

  const c = data.customer;

  editingCustomerId = c.id;

  el.name.value = c.customer_name;
  el.mobile.value = c.mobile_number;
  el.whatsapp.value = c.whatsapp_number || "";
  el.birthday.value = c.birthday || "";
  el.visits.value = c.visit_count || 0;
  el.service.value = c.last_service_used || "General";
  el.address.value = c.address || "";
  el.notes.value = c.notes || "";

  el.saveBtn.textContent = "Update Customer";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteCustomer(id) {
  if (!confirm("Delete customer?")) return;

  await fetch(`/api/customers/${id}`, { method: "DELETE" });
  loadCustomers();
}

function setupCustomerPage() {
  const el = getCustomerElements();
  if (!el.form) return;

  el.form.addEventListener("submit", saveCustomer);
  el.resetBtn.addEventListener("click", resetCustomerForm);
  el.searchBtn.addEventListener("click", loadCustomers);

  if (el.birthdayFilter) {
  el.birthdayFilter.addEventListener("change", loadCustomers);
}

  loadCustomers();
}

window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.createBirthdayOffer = createBirthdayOffer;
window.createRepeatVisitOffer = createRepeatVisitOffer;
window.createFestivalOffer = createFestivalOffer;

/* =========================
   PUBLIC CUSTOMER COMPLAINT FORM
========================= */

function getPublicComplaintElements() {
  return {
    chooser: document.getElementById("complaintChooserSection"),
    existingSection: document.getElementById("existingComplaintSection"),
    newSection: document.getElementById("newComplaintSection"),

    showExistingBtn: document.getElementById("showExistingComplaintBtn"),
    showNewBtn: document.getElementById("showNewComplaintBtn"),
    backExistingBtn: document.getElementById("backToChooserFromExistingBtn"),
    backNewBtn: document.getElementById("backToChooserFromNewBtn"),
    createNewFromExistingBtn: document.getElementById("createNewFromExistingBtn"),
    savedList: document.getElementById("formSavedComplaintList"),

    form: document.getElementById("publicComplaintForm"),
    priority: document.getElementById("publicPriority"),
    type: document.getElementById("publicComplaintType"),
    courier: document.getElementById("publicCourierName"),
    pod: document.getElementById("publicPodNumber"),
    reference: document.getElementById("publicReferenceNumber"),
    senderName: document.getElementById("publicSenderName"),
    senderPhone: document.getElementById("publicSenderPhone"),
    receiverName: document.getElementById("publicReceiverName"),
    receiverPhone: document.getElementById("publicReceiverPhone"),
    messageInput: document.getElementById("publicCustomerMessage"),
    message: document.getElementById("publicComplaintMessage")
  };
}

function showComplaintChooserView(view) {
  const el = getPublicComplaintElements();

  if (el.chooser) el.chooser.style.display = view === "chooser" ? "block" : "none";
  if (el.existingSection) el.existingSection.style.display = view === "existing" ? "block" : "none";
  if (el.newSection) el.newSection.style.display = view === "new" ? "block" : "none";
}

function renderComplaintFormSavedIds() {
  const el = getPublicComplaintElements();
  if (!el.savedList) return;

  const ids = getSavedComplaintIds();

  if (!ids.length) {
    el.savedList.innerHTML = `
      <p class="public-message" style="color:#dc2626;">
        No existing complaint found on this device.
      </p>
      <button type="button" class="public-submit" onclick="showComplaintChooserView('new')">
        Add New Complaint
      </button>
    `;
    return;
  }

  el.savedList.innerHTML = ids.map(id => `
    <div class="saved-complaint-item">
      <strong>${id}</strong>
      <a
        href="/complaint-status.html?complaint_id=${encodeURIComponent(id)}"
        class="public-submit"
        style="text-decoration:none; color:white;"
      >
        Check Status
      </a>
    </div>
  `).join("");
}

async function submitPublicComplaint(e) {
  e.preventDefault();

  const el = getPublicComplaintElements();
  if (!el.form) return;

  const payload = {
    complaint_type: el.type?.value || "General Issue",
    courier_name: el.courier?.value.trim() || "",
    pod_number: el.pod?.value.trim() || "",
    reference_number: el.reference?.value.trim() || "",
    sender_name: el.senderName?.value.trim() || "",
    sender_phone: el.senderPhone?.value.trim() || "",
    receiver_name: el.receiverName?.value.trim() || "",
    receiver_phone: el.receiverPhone?.value.trim() || "",
    customer_message: el.messageInput?.value.trim() || ""
  };

  if (!payload.customer_message) {
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Complaint details are required.";
    }
    return;
  }

  try {
    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
  if (el.message) {
    el.message.style.color = "#dc2626";

    if (data.complaint_id) {
      el.message.innerHTML = `
        ${data.message || "Existing complaint found."}<br><br>
        <a href="/complaint-status.html?complaint_id=${encodeURIComponent(data.complaint_id)}"
           class="public-submit"
           style="display:inline-block; text-decoration:none; color:white;">
           Check Existing Complaint Status
        </a>
      `;
    } else {
      el.message.innerHTML = `
        ⚠️ ${data.message || "Failed to submit complaint."}
      `;
    }
  }
  return;
}

    saveComplaintIdLocally(data.complaint_id);

    if (el.message) {
      el.message.style.color = "#166534";
      el.message.innerHTML = `
        Complaint submitted successfully.<br>
        Complaint ID: <strong>${data.complaint_id || "-"}</strong><br><br>

        <a href="/complaint-status.html?complaint_id=${encodeURIComponent(data.complaint_id || "")}"
           class="public-submit"
           style="display:inline-block; text-decoration:none; color:white;">
           Check Complaint Status
        </a>
      `;
    }

    renderComplaintFormSavedIds();
    el.form.reset();
  } catch (error) {
    console.error("Public complaint submit error:", error);
    if (el.message) {
      el.message.style.color = "#dc2626";
      el.message.textContent = "Server error while submitting complaint.";
    }
  }
}

function setupPublicComplaintForm() {
  const el = getPublicComplaintElements();

  if (el.showExistingBtn) {
    el.showExistingBtn.addEventListener("click", () => {
      renderComplaintFormSavedIds();
      showComplaintChooserView("existing");
    });
  }

  if (el.showNewBtn) {
    el.showNewBtn.addEventListener("click", () => {
      showComplaintChooserView("new");
    });
  }

  if (el.backExistingBtn) {
    el.backExistingBtn.addEventListener("click", () => {
      showComplaintChooserView("chooser");
    });
  }

  if (el.backNewBtn) {
    el.backNewBtn.addEventListener("click", () => {
      showComplaintChooserView("chooser");
    });
  }

  if (el.createNewFromExistingBtn) {
    el.createNewFromExistingBtn.addEventListener("click", () => {
      showComplaintChooserView("new");
    });
  }

  if (el.form) {
    el.form.addEventListener("submit", submitPublicComplaint);
  }

  showComplaintChooserView("chooser");
}

const complaintOptions = [
  "Delivery Delay",
  "Wrong Status",
  "Parcel Damage",
  "Parcel Missing",
  "Pickup Issue",
  "Payment Issue",
  "General Issue"
];

function setupComplaintDropdown() {
  const input = document.getElementById("publicComplaintType");
  const dropdown = document.getElementById("complaintDropdown");

  if (!input || !dropdown) return;

  input.addEventListener("focus", () => {
    renderDropdown(complaintOptions);
  });

  input.addEventListener("input", () => {
    const value = input.value.toLowerCase();
    const filtered = complaintOptions.filter((opt) =>
      opt.toLowerCase().includes(value)
    );
    renderDropdown(filtered);
  });

  function renderDropdown(list) {
    dropdown.innerHTML = "";

    if (list.length === 0) {
      dropdown.style.display = "none";
      return;
    }

    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "dropdown-item";
      div.textContent = item;

      div.onclick = () => {
        input.value = item;
        dropdown.style.display = "none";
      };

      dropdown.appendChild(div);
    });

    dropdown.style.display = "block";
  }

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
}

/* =========================
   PUBLIC COMPLAINT STATUS
========================= */

function getSavedComplaintIds() {
  try {
    return JSON.parse(localStorage.getItem("mvexpress_complaint_ids") || "[]");
  } catch {
    return [];
  }
}

function saveComplaintIdLocally(complaintId) {
  if (!complaintId) return;

  const ids = getSavedComplaintIds();
  const updated = [complaintId, ...ids.filter(id => id !== complaintId)].slice(0, 10);

  localStorage.setItem("mvexpress_complaint_ids", JSON.stringify(updated));
}

function getComplaintStatusElements() {
  return {
    form: document.getElementById("complaintStatusForm"),
    input: document.getElementById("complaintStatusId"),
    message: document.getElementById("complaintStatusMessage"),
    result: document.getElementById("complaintStatusResult"),
    savedList: document.getElementById("savedComplaintList"),
    id: document.getElementById("statusComplaintId"),
    status: document.getElementById("statusComplaintStatus"),
    statusPill: document.getElementById("statusComplaintStatusPill"),
    type: document.getElementById("statusComplaintType"),
    courier: document.getElementById("statusCourierName"),
    pod: document.getElementById("statusPodNumber"),
    customerMessage: document.getElementById("statusCustomerMessage"),
    adminNote: document.getElementById("statusAdminNote")
  };
}

function renderSavedComplaintIds() {
  const el = getComplaintStatusElements();
  if (!el.savedList) return;

  const ids = getSavedComplaintIds();

  if (!ids.length) {
    el.savedList.innerHTML = `<p class="public-message">No saved complaint found on this device.</p>`;
    return;
  }

  el.savedList.innerHTML = ids.map(id => `
    <div class="saved-complaint-item">
      <strong>${id}</strong>
      <button type="button" class="public-submit" onclick="checkSavedComplaint('${id}')">
        Check Status
      </button>
    </div>
  `).join("");
}

function checkSavedComplaint(id) {
  const el = getComplaintStatusElements();
  if (!el.input || !el.form) return;

  el.input.value = id;
  el.form.dispatchEvent(new Event("submit"));
}

async function checkComplaintStatus(e) {
  e.preventDefault();

  const el = getComplaintStatusElements();
  const complaintId = el.input?.value.trim() || "";

  if (!complaintId) {
    el.message.style.color = "#dc2626";
    el.message.textContent = "Please enter complaint ID.";
    return;
  }

  try {
    const response = await fetch(`/api/complaint-status?complaint_id=${encodeURIComponent(complaintId)}`);
    const data = await response.json();

    if (!data.success) {
      el.message.style.color = "#dc2626";
      el.message.textContent = data.message || "Complaint not found.";
      if (el.result) el.result.style.display = "none";
      return;
    }

    const c = data.complaint;

    saveComplaintIdLocally(c.complaint_id);
    renderSavedComplaintIds();

    el.message.style.color = "#166534";
    el.message.textContent = "Complaint found.";

    if (el.result) el.result.style.display = "block";
    if (el.id) el.id.textContent = c.complaint_id || "-";
    if (el.status) el.status.value = c.complaint_status || "-";
    if (el.statusPill) el.statusPill.textContent = c.complaint_status || "-";
    if (el.type) el.type.value = c.complaint_type || "-";
    if (el.courier) el.courier.value = c.courier_name || "-";
    if (el.pod) el.pod.value = c.pod_number || "-";
    if (el.customerMessage) el.customerMessage.value = c.customer_message || "-";
    if (el.adminNote) el.adminNote.value = c.admin_note || "No admin reply yet.";

    if (el.result) {
      el.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    console.error("Complaint status check error:", error);
    el.message.style.color = "#dc2626";
    el.message.textContent = "Server error while checking complaint status.";
  }
}

function setupComplaintStatusPage() {
  const el = getComplaintStatusElements();
  if (!el.form) return;

  renderSavedComplaintIds();

  const params = new URLSearchParams(window.location.search);
  const complaintId = params.get("complaint_id");

  if (complaintId && el.input) {
    el.input.value = complaintId;
  }

  el.form.addEventListener("submit", checkComplaintStatus);

  if (complaintId) {
    el.form.dispatchEvent(new Event("submit"));
  }
}

window.checkSavedComplaint = checkSavedComplaint;

/* =========================
   AUTO REFRESH + ALERT
========================= */

let lastComplaintCount = 0;
let alertSoundPlayed = false;

let complaintAudioUnlocked = false;
let complaintAudioContext = null;

function unlockComplaintSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    complaintAudioContext = complaintAudioContext || new AudioContext();

    if (complaintAudioContext.state === "suspended") {
      complaintAudioContext.resume();
    }

    complaintAudioUnlocked = true;
  } catch (error) {
    console.log("Audio unlock failed:", error);
  }
}

function playNewComplaintSound() {
  try {
    unlockComplaintSound();

    if (!complaintAudioContext) return;

    const oscillator = complaintAudioContext.createOscillator();
    const gain = complaintAudioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.001, complaintAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, complaintAudioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, complaintAudioContext.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(complaintAudioContext.destination);

    oscillator.start();
    oscillator.stop(complaintAudioContext.currentTime + 0.35);
  } catch (error) {
    console.log("Sound play failed:", error);
  }
}

async function checkNewComplaints() {
  try {
    const response = await fetch("/api/complaints");
    const data = await response.json();

    if (!data.success) return;

    const currentCount = (data.complaints || []).length;

    const badge = document.getElementById("newComplaintAlertBadge");

    // First load → just set count
    if (lastComplaintCount === 0) {
      lastComplaintCount = currentCount;
      return;
    }

    // New complaint detected
    if (currentCount > lastComplaintCount) {
      if (badge) {
        badge.style.display = "inline-block";
        badge.textContent = `New Complaint (${currentCount - lastComplaintCount})`;
      }

      // play sound only once per new batch
      if (!alertSoundPlayed) {
        playNewComplaintSound();
        alertSoundPlayed = true;
      }

      // reload cards automatically
      if (typeof loadComplaintsList === "function") {
        loadComplaintsList();
      }
    }

    lastComplaintCount = currentCount;
  } catch (err) {
    console.error("Auto refresh error:", err);
  }
}

function startComplaintAutoRefresh() {
  // check every 5 seconds
  setInterval(checkNewComplaints, 5000);
}

document.addEventListener("click", unlockComplaintSound, { once: true });
document.addEventListener("keydown", unlockComplaintSound, { once: true });

function sendWhatsAppReply(complaintId, phone, status) {
  if (!phone) {
    alert("No sender phone number available for this complaint.");
    return;
  }

  let cleanPhone = String(phone).replace(/\D/g, "");

  if (!cleanPhone.startsWith("91")) {
    cleanPhone = "91" + cleanPhone;
  }

  const statusText = String(status || "Open");

  let message = "";

  if (statusText === "Open") {
    message = `Hello,

Your complaint (${complaintId}) has been received by MVEXPRESS.

Current Status: Open

Our team will check your issue and update you soon.

- MVEXPRESS Support`;
  } else if (statusText === "In Progress") {
    message = `Hello,

Update for your complaint (${complaintId}):

Current Status: In Progress

Our team is currently checking your issue. We will update you once there is progress.

- MVEXPRESS Support`;
  } else if (statusText === "Resolved") {
    message = `Hello,

Your complaint (${complaintId}) has been resolved.

Current Status: Resolved

Thank you for your patience. Please contact MVEXPRESS if you need any further help.

- MVEXPRESS Support`;
  } else if (statusText === "Closed") {
    message = `Hello,

Your complaint (${complaintId}) has been closed.

Current Status: Closed

Thank you for contacting MVEXPRESS Support.

- MVEXPRESS Support`;
  } else {
    message = `Hello,

Regarding your complaint (${complaintId}):

Current Status: ${statusText}

Our team will update you soon.

- MVEXPRESS Support`;
  }

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function setupBackupSystem() {
  const btn = document.getElementById("createBackupBtn");
  const msg = document.getElementById("backupMessage");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (msg) {
      msg.style.color = "#6b7280";
      msg.textContent = "Creating backup...";
    }

    try {
      const res = await fetch("/api/backup-database", {
        method: "POST"
      });

      const data = await res.json();

      if (!data.success) {
        if (msg) {
          msg.style.color = "#dc2626";
          msg.textContent = data.message || "Backup failed.";
        }
        return;
      }

      if (msg) {
        msg.style.color = "#166534";
        msg.textContent = `Backup created: ${data.file}`;
      }

    } catch (err) {
      console.error(err);
      if (msg) {
        msg.style.color = "#dc2626";
        msg.textContent = "Server error during backup.";
      }
    }
  });
}

function loadBackupList() {
  const select = document.getElementById("restoreBackupSelect");
  if (!select) return;

  fetch("/api/list-backups")
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      select.innerHTML = "";

      if (data.backups.length === 0) {
        select.innerHTML = `<option value="">No backups found</option>`;
        return;
      }

      data.backups.forEach(file => {
        const opt = document.createElement("option");
        opt.value = file;
        opt.textContent = file;
        select.appendChild(opt);
      });
    })
    .catch(err => {
      console.error("Backup list error:", err);
    });
}

function setupRestoreSystem() {
  const btn = document.getElementById("restoreBackupBtn");
  const select = document.getElementById("restoreBackupSelect");
  const msg = document.getElementById("restoreBackupMessage");

  if (!btn || !select) return;

  btn.addEventListener("click", async () => {
    const backupFile = select.value;

    if (!backupFile) {
      if (msg) {
        msg.style.color = "#dc2626";
        msg.textContent = "Please choose a backup file first.";
      }
      return;
    }

    const confirmRestore = confirm(
      `Restore this backup?\n\n${backupFile}\n\nYour current database will be replaced, but an emergency backup will be created first.`
    );

    if (!confirmRestore) return;

    if (msg) {
      msg.style.color = "#6b7280";
      msg.textContent = "Restoring backup...";
    }

    try {
      const res = await fetch("/api/restore-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          backup_file: backupFile
        })
      });

      const data = await res.json();

      if (!data.success) {
        if (msg) {
          msg.style.color = "#dc2626";
          msg.textContent = data.message || "Restore failed.";
        }
        return;
      }

      if (msg) {
        msg.style.color = "#166534";
        msg.textContent = `${data.message} Emergency backup: ${data.emergency_backup}`;
      }

      alert("Restore completed. Please restart your server now.");

    } catch (err) {
      console.error("Restore error:", err);
      if (msg) {
        msg.style.color = "#dc2626";
        msg.textContent = "Server error during restore.";
      }
    }
  });
}

function setupExportComplaints() {
  const btn = document.getElementById("exportComplaintsBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const search = document.getElementById("complaintSearch")?.value.trim() || "";
    const status = document.getElementById("complaintStatusFilter")?.value || "All";

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (status) params.append("status", status);

    window.open(`/api/export-complaints?${params.toString()}`, "_blank");
  });
}

function setupExportPdf() {
  const btn = document.getElementById("exportComplaintsPdfBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const search = document.getElementById("complaintSearch")?.value.trim() || "";
    const status = document.getElementById("complaintStatusFilter")?.value || "All";

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (status) params.append("status", status);

    window.open(`/api/export-complaints-pdf?${params.toString()}`, "_blank");
  });
}