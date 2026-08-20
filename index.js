import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// A sample resource route
app.get('/api/v1/welcome', (req, res) => {
  res.json({ message: 'Welcome to your Node.js microservice!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${PORT}`);
});