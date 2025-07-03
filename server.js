const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const departmentRoutes = require('./routes/departmentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const authRoutes = require('./routes/authRoutes');
const hrRoutes = require('./routes/hrRoutes');
const permissionsRoutes = require('./routes/permissionRoutes')

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use(async (req, res) => {
  await AuditLog.create({
    action: 'unauthorized_route_access',
    performedBy: req.user?._id,
    details: { path: req.originalUrl }
  });

  res.status(404).json({ message: 'Route not found' });
});


app.get('/', (req, res) => {
  res.send('StartupFlora Auth System API running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
