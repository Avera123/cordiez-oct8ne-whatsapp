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

  getOrder('6a98623a3a29ad5ef4c786ca')
  .then(order => console.log(order))
  .catch(error => console.error(error.message));
});

async function getOrder(orderId) {
  const response = await fetch(
    `https://oms.janisqa.in/api/order/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      headers: {
        'janis-client': 'lindo',
        'janis-api-key': '4537413a-c306-446e-885b-d53d02b5a123',
        'janis-api-secret': 'yeiVKJxdB5tviojY4uWpAiCqpfaJ2lwhAsiT3gF2cBKHMA25eLWvJar9AYoRbecr',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${PORT}`);
});