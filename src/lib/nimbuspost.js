// src/lib/nimbuspost.js
// ✅ NimbusPost Partner API v2 — https://api-v2.nimbuspost.com

const NIMBUS_BASE_URL = (
  process.env.NIMBUS_BASE_URL || 'https://api-v2.nimbuspost.com'
).replace(/\/$/, '');

const API_KEY    = process.env.NIMBUS_API_KEY;    // npk_xxx
const API_SECRET = process.env.NIMBUS_API_SECRET; // secret

function getHeaders() {
  if (!API_KEY || !API_SECRET) {
    throw new Error('NIMBUS_API_KEY and NIMBUS_API_SECRET are required in .env');
  }

  return {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    'x-api-key':    API_KEY,
    'x-api-secret': API_SECRET,
  };
}

function getErrorMessage(data) {
  if (!data) return 'Unknown error';
  if (typeof data === 'string') return data;
  return (
    data?.error?.detail   ||
    data?.error?.title    ||
    data?.error?.message  ||
    data?.message         ||
    JSON.stringify(data)
  );
}

async function nimbusRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url    = `${NIMBUS_BASE_URL}${path}`;
  const body   = (method !== 'GET' && options.body) ? JSON.stringify(options.body) : undefined;

  console.log('🚚 Nimbus V2 request:', {
    url,
    method,
    hasBody: !!body,
    apiKeyPrefix: API_KEY?.substring(0, 12) + '...',
  });

  const res = await fetch(url, {
    method,
    cache:   'no-store',
    headers: getHeaders(),
    body,
  });

  const text = await res.text();

  let data = {};
  try { data = text ? JSON.parse(text) : {}; }
  catch {
    data = { success: false, error: { detail: text.substring(0, 300) } };
  }

  console.log('🚚 Nimbus V2 response:', {
    status:  res.status,
    success: data?.success,
    data:    JSON.stringify(data).substring(0, 500),
  });

  if (!res.ok || data?.success === false) {
    throw new Error(`Nimbus HTTP ${res.status}: ${getErrorMessage(data)}`);
  }

  return data;
}

/* ═══════════════════════════════════════════════════════
   BUILD ORDER PAYLOAD — V2 format (snake_case)
════════════════════════════════════════════════════════ */
function buildOrderPayload(order) {
  const totalAmount = Math.round(Number(order.totalPrice || 0));
  const isCOD       = order.paymentMethod === 'COD';
  const address     = order.shippingAddress || {};

  return {
    order_number: order.orderNumber
      ? `ABW-${order.orderNumber}`
      : (order.id?.slice(-10)?.toUpperCase() || `TMP-${Date.now()}`),

    order_type:  'b2c',
    payment_mode: isCOD ? 'cod' : 'prepaid',
    order_collectable_amount: isCOD ? totalAmount : 0,

    warehouse_id: process.env.NIMBUS_WAREHOUSE_ID || process.env.NIMBUS_WAREHOUSE_NAME || 'Primary',

    shipping_address: {
      name:        address.name    || 'Customer',
      email:       order.user?.email || '',
      address:     address.address || '',
      address_opt: '',
      pincode:     parseInt(address.pincode) || 0,
      city:        address.city    || '',
      state:       address.state   || '',
      country:     'India',
      phone:       parseInt(String(address.phone || '').replace(/\D/g, '').slice(-10)) || 0,
    },

    items: (order.orderItems || []).map((item, i) => ({
      name:  item.name || 'Product',
      qty:   Number(item.quantity || 1),
      price: Math.round(Number(item.price || 0)),
      sku:   item.productId || `SKU-${i + 1}`,
    })),

    package: {
  weight: Number(process.env.NIMBUS_DEFAULT_WEIGHT  || 0.5),  // ✅ in KG
  length: Number(process.env.NIMBUS_DEFAULT_LENGTH  || 15),   // cm
  width:  Number(process.env.NIMBUS_DEFAULT_BREADTH || 12),   // cm
  height: Number(process.env.NIMBUS_DEFAULT_HEIGHT  || 10),   // cm
},
  };
}

/* ═══════════════════════════════════════════════════════
   CREATE SHIPMENT (Order + Book in one call)
   Uses POST /v2/shipments (create + book together)
════════════════════════════════════════════════════════ */
export async function createShipment(order) {
  const payload = buildOrderPayload(order);
  console.log('🚚 Shipment payload:', JSON.stringify(payload, null, 2));

  // ✅ V2 uses /v2/shipments to create+book in one call
  const data = await nimbusRequest('/v2/shipments', {
    method: 'POST',
    body:   payload,
  });

  const d = data?.data || {};

  return {
    awb:         d?.awb            || d?.awb_number || null,
    courierId:   d?.courier_id     || null,
    courierName: d?.courier_name   || d?.courier    || null,
    shipmentId:  d?.shipment_id    || d?.id         || null,
    orderId:     d?.order_id       || null,
    label:       d?.label_url      || d?.label      || null,
    raw:         data,
  };
}

/* ═══════════════════════════════════════════════════════
   CREATE ORDER ONLY (no booking)
   Uses POST /v2/orders
════════════════════════════════════════════════════════ */
export async function createOrder(order) {
  const payload = buildOrderPayload(order);
  console.log('📦 Order payload:', JSON.stringify(payload, null, 2));

  const data = await nimbusRequest('/v2/orders', {
    method: 'POST',
    body:   payload,
  });

  const d = data?.data || {};
  return {
    orderId:     d?.order_id     || null,
    orderNumber: d?.order_number || null,
    orderStatus: d?.order_status || null,
    raw:         data,
  };
}

/* ═══════════════════════════════════════════════════════
   BOOK AN EXISTING ORDER
   Uses POST /v2/shipments/book
════════════════════════════════════════════════════════ */
export async function bookShipment(orderId) {
  if (!orderId) throw new Error('orderId is required');

  const data = await nimbusRequest('/v2/shipments/book', {
    method: 'POST',
    body:   { order_id: orderId },
  });

  const d = data?.data || {};
  return {
    awb:         d?.awb          || null,
    courierName: d?.courier_name || null,
    shipmentId:  d?.shipment_id  || null,
    raw:         data,
  };
}

/* ═══════════════════════════════════════════════════════
   TRACK SHIPMENT
   Uses GET /v2/tracking/{awb}
════════════════════════════════════════════════════════ */
export async function trackShipment(awb) {
  if (!awb) throw new Error('AWB is required');

  const data = await nimbusRequest(`/v2/tracking/${awb}`, {
    method: 'GET',
  });

  const d = data?.data || {};

  // Normalize tracking data (V2 uses camelCase for tracking)
  return {
    current_status:    d?.currentStatus    || d?.status         || null,
    current_timestamp: d?.lastUpdatedAt    || d?.updatedAt      || null,
    tracking_data:     d?.trackingHistory  || d?.events         || d?.scans || [],
    courierName:       d?.courierName      || null,
    orderId:           d?.orderId          || null,
    raw:               data,
  };
}

/* ═══════════════════════════════════════════════════════
   BULK TRACK (up to 100 AWBs)
   Uses POST /v2/tracking/bulk
════════════════════════════════════════════════════════ */
export async function trackShipmentBulk(awbs = []) {
  if (!Array.isArray(awbs) || awbs.length === 0) {
    throw new Error('AWBs array is required');
  }
  if (awbs.length > 100) {
    throw new Error('Max 100 AWBs per request');
  }

  const data = await nimbusRequest('/v2/tracking/bulk', {
    method: 'POST',
    body:   { awbs },
  });

  return data?.data || { tracked: [], notFound: [] };
}

/* ═══════════════════════════════════════════════════════
   CANCEL SHIPMENT
   Uses POST /v2/shipments/cancel
════════════════════════════════════════════════════════ */
export async function cancelShipment(awb) {
  if (!awb) throw new Error('AWB is required');

  return nimbusRequest('/v2/shipments/cancel', {
    method: 'POST',
    body:   { awbs: [awb] },
  });
}

/* ═══════════════════════════════════════════════════════
   REQUEST PICKUP
   Uses POST /v2/shipments/pickup
════════════════════════════════════════════════════════ */
export async function requestPickup(awbs = []) {
  if (!Array.isArray(awbs) || awbs.length === 0) {
    throw new Error('AWBs required');
  }

  return nimbusRequest('/v2/shipments/pickup', {
    method: 'POST',
    body:   { awbs },
  });
}

/* ═══════════════════════════════════════════════════════
   GENERATE LABELS
   Uses POST /v2/shipments/labels
════════════════════════════════════════════════════════ */
export async function generateLabels(awbs = []) {
  if (!Array.isArray(awbs) || awbs.length === 0) {
    throw new Error('AWBs required');
  }

  return nimbusRequest('/v2/shipments/labels', {
    method: 'POST',
    body:   { awbs },
  });
}

/* ═══════════════════════════════════════════════════════
   LIST WAREHOUSES
   Uses GET /v2/warehouses
════════════════════════════════════════════════════════ */
export async function listWarehouses() {
  return nimbusRequest('/v2/warehouses', { method: 'GET' });
}

/* ═══════════════════════════════════════════════════════
   GET WALLET BALANCE
   Uses GET /v2/wallet/balance
════════════════════════════════════════════════════════ */
export async function getWalletBalance() {
  return nimbusRequest('/v2/wallet/balance', { method: 'GET' });
}

/* ═══════════════════════════════════════════════════════
   CHECK SERVICEABILITY & RATES
   Uses POST /v2/serviceability
════════════════════════════════════════════════════════ */
export async function checkServiceability({ originPincode, destinationPincode, weight, paymentMode = 'prepaid', codAmount = 0 }) {
  return nimbusRequest('/v2/serviceability', {
    method: 'POST',
    body: {
      origin_pincode:      originPincode,
      destination_pincode: destinationPincode,
      weight:              weight,           // in grams
      payment_mode:        paymentMode,
      cod_amount:          codAmount,
    },
  });
}

/* ═══════════════════════════════════════════════════════
   LIST COURIERS
   Uses GET /v2/couriers
════════════════════════════════════════════════════════ */
export async function listCouriers() {
  return nimbusRequest('/v2/couriers', { method: 'GET' });
}