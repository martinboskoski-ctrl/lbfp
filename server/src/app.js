import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import fileRoutes from './routes/file.routes.js';
import userRoutes from './routes/user.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import poRoutes from './routes/po.routes.js';
import terkoviRoutes from './routes/terkovi.routes.js';
import agreementRoutes from './routes/agreement.routes.js';
import leadRoutes from './routes/lead.routes.js';
import procedureRoutes from './routes/procedure.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import requestRoutes from './routes/request.routes.js';
import leaveBalanceRoutes from './routes/leaveBalance.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import productionReportRoutes from './routes/productionReport.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import lhcRoutes from './routes/lhc.routes.js';
import { dispatchReminders } from './controllers/agreement.controller.js';
import { autoCloseCampaigns } from './controllers/lhc.controller.js';

// Validate required environment variables
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const app = express();
const server = createServer(app);
initSocket(server);

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/files',         fileRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/po',            poRoutes);
app.use('/api/terkovi',       terkoviRoutes);
app.use('/api/agreements',    agreementRoutes);
app.use('/api/leads',         leadRoutes);
app.use('/api/procedures',    procedureRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests',        requestRoutes);
app.use('/api/leave-balances',  leaveBalanceRoutes);
app.use('/api/shifts',          shiftRoutes);
app.use('/api/maintenance',     maintenanceRoutes);
app.use('/api/production-reports', productionReportRoutes);
app.use('/api/employees',       employeeRoutes);
app.use('/api/lhc',             lhcRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Agreement reminders — fire once on boot (delayed) and every hour after.
    const ONE_HOUR = 60 * 60 * 1000;
    const runReminders = async () => {
      try {
        const n = await dispatchReminders();
        if (n > 0) console.log(`[reminders] dispatched ${n} agreement notifications`);
      } catch (e) {
        console.error('[reminders] failed:', e.message);
      }
    };
    setTimeout(runReminders, 30_000);
    setInterval(runReminders, ONE_HOUR);

    const runLhcAutoClose = async () => {
      try {
        const n = await autoCloseCampaigns();
        if (n > 0) console.log(`[lhc] auto-closed ${n} campaigns`);
      } catch (e) {
        console.error('[lhc] auto-close failed:', e.message);
      }
    };
    setTimeout(runLhcAutoClose, 45_000);
    setInterval(runLhcAutoClose, ONE_HOUR);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

export default app;
