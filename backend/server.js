require("dotenv").config({ path: "./.env" });
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const { loadConfig } = require("./utils/configStore");
const { initSocket } = require("./sockets/socketServer");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { generalLimiter } = require("./middleware/rateLimiter");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const agencyRoutes = require("./routes/agencyRoutes");
const caregiverRoutes = require("./routes/caregiverRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const messageRoutes = require("./routes/messageRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const familyRoutes = require("./routes/familyRoutes");
const referralRoutes = require("./routes/referralRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const healthLogRoutes = require("./routes/healthLogRoutesV2");
const attendanceRoutes = require("./routes/attendanceRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const careReportRoutes = require("./routes/careReportRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const emergencyAlertRoutes = require("./routes/emergencyAlertRoutes");

// Cron Jobs
const { startBookingStatusJob } = require("./jobs/bookingStatusJob");
const { startTrustScoreJob } = require("./jobs/trustScoreJob");
const { startMedicationReminderJob } = require("./jobs/medicationReminderJob");

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();

// Global request logger for debugging
app.use((req, res, next) => {
  console.log(`➡️ [INCOMING] ${req.method} ${req.path}`);
  next();
});

const httpServer = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = initSocket(httpServer);

// Attach io to req for use in controllers
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
    ].filter(Boolean),
    credentials: true,
  }),
);
// app.use(generalLimiter); // Removed comment temporarily to enable limiter
app.use(generalLimiter);

// ─── Stripe Webhook (raw body — MUST be before express.json) ──────────────────
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize());

// ─── Routes ───────────────────────────────────────────────────────────────────
console.log("🛣️ Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/caregivers", caregiverRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/health-logs", healthLogRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/care-reports", careReportRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/emergency-alerts", emergencyAlertRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "CareConnect API is running 🚀",
    env: process.env.NODE_ENV,
  });
});

// ─── Route Debugging ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`🔍 No match for: ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5005;

const start = async () => {
  await connectDB();
  await loadConfig();

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${PORT} is already in use. Please kill the process using it and restart.`,
      );
    } else {
      console.error("❌ Server error:", err);
    }
    process.exit(1);
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      `\n🚀 CareConnect server [PID: ${process.pid}] running on port ${PORT}`,
    );
    console.log(`📡 Socket.io ready`);
  });

  // Start cron jobs
  if (process.env.NODE_ENV !== "test") {
    startBookingStatusJob();
    startTrustScoreJob();
    startMedicationReminderJob();
  }
};

start();

module.exports = app;
