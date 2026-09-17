import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Health check endpoint
app.post('/whatsapp', async (req, res) => {

  console.info(req.body)

  const order = await getOrder(req.body.metadata.id);

  // Aquí puedes utilizar order.customer y order.items.
  const summary = {
    id: order.id,
    commerceId: order.commerceId,
    status: order.status,
    itemsCount: Array.isArray(order.items) ? order.items.length : 0,
  };

  console.log({summary})

  return res.status(200).json({ received: true, order: summary });
});

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

const janisApi = axios.create({
  baseURL: process.env.JANIS_BASE_URL || 'https://oms.janisqa.in/api',
  timeout: 15000,
  headers: {
    'janis-client': process.env.JANIS_CLIENT,
    'janis-api-key': process.env.JANIS_API_KEY,
    'janis-api-secret': process.env.JANIS_API_SECRET,
    Accept: 'application/json',
  },
});

async function getOrder(orderId) {
  const { data } = await janisApi.get(
    `/order/${encodeURIComponent(orderId)}`,
    { signal: AbortSignal.timeout(15000) }
  );

  return data;
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${PORT}`);
});