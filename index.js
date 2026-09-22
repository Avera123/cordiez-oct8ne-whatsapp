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

  //POST Candidates Status: 
  // #1 Get Token
  // https://cdn.microsite.janisqa.in/candidates?token={{orderData.token}}

  const orderId = summary.commerceId ?? ''; // el id de la orden en OMS

  const token = await generateCandidatesToken(orderId);
  console.log('Token generado:', token);

  const oct8neResult = await sendOct8neTemplate({
    targetNumber: order.customer?.phone ?? '',
    customerName: order.customer?.firstName ?? 'Cliente',
    orderNumber: order.commerceId,
    landingCandidate: 'https://cdn.microsite.janisqa.in/candidates?token={{' + token + '}}'
  });

  return res.status(200).json({ received: true, order: summary, oct8neResult: oct8neResult });
});

// POST Message Candidates:
const oct8neApi = axios.create({
  baseURL: 'https://messaging-usa-api.oct8ne.com/api/v1.0',
  timeout: 15000,
  headers: {
    'x-oct8ne-token': process.env.OCT8NE_TOKEN,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const BASE_URL = 'https://public.oms.janisqa.in/api';
async function generateCandidatesToken(orderId) {
  const { data } = await axios.post(`${BASE_URL}/ProcessOrderWithCandidates`, {
    orderId,
  },
    {
      headers: {
        'janis-api-key': process.env.JANIS_API_KEY,
        'janis-api-secret': process.env.JANIS_API_SECRET,
        'janis-client': process.env.JANIS_CLIENT,
      },
    });

  if (!data?.payload?.token) {
    throw new Error(data?.payload?.message || 'No se pudo generar el token');
  }

  return data.payload.token;
}


async function sendOct8neTemplate({
  targetNumber,
  customerName,
  orderNumber,
  landingCandidate
}) {
  const payload = {
    template: {
      name: 'ecomm_productos_faltantes_sustitucion',
      namespace: '37633915_9dfc_4733_8e8e_1ed01a03e8cf',
      language: 'ES_AR',
    },
    targets: [
      {
        number: targetNumber,
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: customerName,
              },
              {
                type: 'text',
                text: orderNumber,
              },
              {
                type: 'text',
                text: landingCandidate
              }
            ],
          },
        ],
      },
    ],
  };

  const { data } = await oct8neApi.post(
    '/whatsapp/templates/21060/4/5493512364727',
    payload,
    {
      params: {
        testMode: 0,
        campaign: 'test',
      },
    }
  );

  return data;
}

// TODO: Get Token URL Candidates

// Get Order JANIS
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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Service is running on http://localhost:${PORT}`);
});