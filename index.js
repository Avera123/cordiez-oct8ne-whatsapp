import express from 'express';
import axios from 'axios';

const JANIS_API_KEY="b1693a65-794e-41a7-9bff-1811d4601f7d"
const JANIS_API_SECRET="4t63TSxARBqARzuQ4zJaNU8yNo2PKzsq6o4IOgSSqdTTsxGbFmvsR8yY2txxGOxJ"
const JANIS_BASE_URL="https://oms.janisqa.in/api"
const JANIS_CLIENT="lindo"
const OCT8NE_TOKEN="4F8C6DDC4B9B48228C81738991A79DD5"

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Health check endpoint
app.post('/whatsapp', async (req, res) => {

  console.info({ "WebHook Info": req.body });

  if(req?.body?.setup == 'true'){
    return res.status(200); 
  }

  const order = await getOrder(req.body.metadata.id);
  const eventName = req.body.eventName ?? '';
  const commerceId = req.body.metadata.commerceId ?? '';

  // Aquí puedes utilizar order.customer y order.items.
  const summary = {
    id: order.id,
    commerceId: commerceId,
    status: eventName,
    itemsCount: Array.isArray(order.items) ? order.items.length : 0,
  };

  console.info({ "Get Order Info": summary });

  //POST Candidates Status: 
  // #1 Get Token
  // https://cdn.microsite.janisqa.in/candidates?token={{orderData.token}}

  //const orderId = req.body.metadata.id ?? ''; // el id de la orden en OMS
  const token = req.body.metadata.itemsCandidatesToken ?? ''

  console.log('Token generado:', token);

  console.log({
    targetNumber: order.customer?.phone ?? '',
    customerName: order.customer?.firstName ?? 'Cliente',
    orderNumber: order.commerceId,
    landingCandidate: 'https://cdn.microsite.janisqa.in/candidates?token={{' + token + '}}'
  })

  switch (eventName) {
    case "pending-candidates-confirmation":
      const oct8neResult = await sendOct8neTemplateCandidates({
        targetNumber: order.customer?.phone ?? '',
        customerName: order.customer?.firstName ?? 'Cliente',
        orderNumber: order.commerceId,
        landingCandidate: 'https://cdn.microsite.janisqa.in/candidates?token={{' + token + '}}'
      });

      console.info(oct8neResult)

      break;

    case "on way":
      const oct8neResultOnWay = await sendOct8neTemplateOnWay({
        targetNumber: order.customer?.phone ?? '',
        customerName: order.customer?.firstName ?? 'Cliente',
        orderNumber: order.commerceId
      });

      console.info(oct8neResultOnWay)

      break;

    case "picking":
      const oct8neResultOnPrepare = await sendOct8neTemplateOnPrepare({
        targetNumber: order.customer?.phone ?? '',
        customerName: order.customer?.firstName ?? 'Cliente',
        orderNumber: order.commerceId
      });

      console.info(oct8neResultOnPrepare)

      break;

    default:
      break;
  }

  return res.status(200).json({ received: true, order: summary });
});

// POST Message Candidates:
const oct8neApi = axios.create({
  baseURL: 'https://messaging-usa-api.oct8ne.com/api/v1.0',
  timeout: 15000,
  headers: {
    'x-oct8ne-token': process.env.OCT8NE_TOKEN || OCT8NE_TOKEN,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// POST CANDIDATES TEMPLATE
async function sendOct8neTemplateCandidates({
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

// POST ON WAY ORDER
async function sendOct8neTemplateOnWay({
  targetNumber,
  customerName,
  orderNumber
}) {
  const payload = {
    "template": {
      "name": "pedido_en_camino",
      "namespace": "37633915_9dfc_4733_8e8e_1ed01a03e8cf",
      "language": "ES_AR"
    },
    "targets": [
      {
        "number": targetNumber,
        "components": [
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
            ],
          },
        ]
      }
    ]
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

// POST ON PREPARE ORDER
async function sendOct8neTemplateOnPrepare({
  targetNumber,
  customerName,
  orderNumber
}) {
  const payload = {
    "template": {
      "name": "pedido_en_camino",
      "namespace": "37633915_9dfc_4733_8e8e_1ed01a03e8cf",
      "language": "ES_AR"
    },
    "targets": [
      {
        "number": targetNumber,
        "components": [
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": customerName
              },
              {
                "type": "text",
                "text": orderNumber
              }
            ]
          },
        ]
      }
    ]
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

// Get Order JANIS
const janisApi = axios.create({
  baseURL: process.env.JANIS_BASE_URL || JANIS_BASE_URL,
  timeout: 15000,
  headers: {
    'janis-client': process.env.JANIS_CLIENT || JANIS_CLIENT,
    'janis-api-key': process.env.JANIS_API_KEY || JANIS_API_KEY,
    'janis-api-secret': process.env.JANIS_API_SECRET || JANIS_API_SECRET,
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