require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const { verifyJWT, requireRole } = require('./middleware/auth');
const { login } = require('./controllers/authController');

app.post('/api/auth/login', login);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example protected endpoint
app.get('/api/protected', verifyJWT, (req, res) => {
  res.json({ message: 'You have access to a protected route!', user: req.user });
});

// Example RBAC endpoint
app.get('/api/admin-only', verifyJWT, requireRole(['FleetManager']), (req, res) => {
  res.json({ message: 'Welcome, Fleet Manager!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TransitOps backend running on port ${PORT}`);
});
