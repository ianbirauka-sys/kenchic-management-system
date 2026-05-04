require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const farmerRoutes = require('./routes/farmer.routes');
const employeeRoutes = require('./routes/employee.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Kenchic API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});