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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TransitOps backend running on port ${PORT}`);
});
