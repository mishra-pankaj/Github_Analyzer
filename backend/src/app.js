const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/profiles', require('./routes/profiles.routes'));
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app