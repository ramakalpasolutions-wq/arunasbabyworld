// src/lib/nimbuspost.js

const NIMBUS_BASE_URL = (
  process.env.NIMBUS_BASE_URL || 'https://ship.nimbuspost.com/api'
).replace(/\/$/, '');

const NIMBUS_API_KEY = process.env.NIMBUS_API_KEY;

function getErrorMessage(data) {
  return data?.message || data?.error || JSON.stringify(data) || 'Unknown Nimbus error';
}

function isSuccess(data) {
  return data?.status === true || data?.status === 1 || data?.status === 'success' || data?.success === true;
}

function getNimbusHeaders() {
  if (!NIMBUS_API_KEY) throw new Error('NIMBUS_API_KEY is required. Set it in .env');
  return { 'NP-API-KEY': NIMBUS_API_KEY };
}

function objectToFormData(obj) {
  const form = new FormData();
  function append(data, prefix) {
    if (data === null || data === undefined) return;
    if (Array.isArray(data)) {
      data.forEach((item, i) => append(item, prefix ? `${prefix}[${i}]` : `${i}`));
    } else if (typeof data === 'object' && !(data instanceof File)) {
      Object.keys(data).forEach(key => {
        append(data[key], prefix ? `${prefix}[${key}]` : key);
      });
    } else {
      form.append(prefix, String(data ?? ''));
    }
  }
  append(obj, '');
  return form;
}

async function nimbusRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url    = `${NIMBUS_BASE_URL}${path}`;
  const body   = (method !== 'GET' && options.body) ? objectToFormData(options.body) : undefined;

  console.log('🚚 Nimbus:', { url, method, key: NIMBUS_API_KEY?.substring(0, 12) + '...' });

  const res = await fetch(url, {
    method,
    cache: 'no-store',
    headers: getNimbusHeaders(),
    body,
  });

  const text = await res.text();

  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    data = { status: false, message: text.substring(0, 300) };
  }

  console.log('🚚 Nimbus response:', JSON.stringify(data, null, 2));

  if (!res.ok && res.status !== 200) {
    throw new Error(`Nimbus HTTP ${res.status}: ${getErrorMessage(data)}`);
  }

  return data;
}

function buildPayload(order) {
  const total = Math.round(Number(order.totalPrice || 0));
  const isCOD = order.paymentMethod === 'COD';

  return {
    order_number:       order.orderNumber ? `ABW-${order.orderNumber}` : order.id?.slice(-10)?.toUpperCase(),
    payment_type:       isCOD ? 'COD' : 'Prepaid',
    package_weight:     Number(process.env.NIMBUS_DEFAULT_WEIGHT  || 0.5),
    package_length:     Number(process.env.NIMBUS_DEFAULT_LENGTH  || 15),
    package_breadth:    Number(process.env.NIMBUS_DEFAULT_BREADTH || 12),
    package_height:     Number(process.env.NIMBUS_DEFAULT_HEIGHT  || 10),
    order_amount:       total,
    collectable_amount: isCOD ? total : 0,
    consignee_name:     order.shippingAddress?.name    || 'Customer',
    consignee_address:  order.shippingAddress?.address || '',
    consignee_address2: '',
    consignee_city:     order.shippingAddress?.city    || '',
    consignee_state:    order.shippingAddress?.state   || '',
    consignee_zip:      String(order.shippingAddress?.pincode || ''),
    consignee_phone:    String(order.shippingAddress?.phone   || ''),
    warehouse_name:     process.env.NIMBUS_WAREHOUSE_NAME || 'Primary',
    ...(process.env.NIMBUS_COURIER_ID ? { courier_id: process.env.NIMBUS_COURIER_ID } : {}),
  };
}

export async function createShipment(order) {
  const payload = buildPayload(order);
  console.log('🚚 Payload:', JSON.stringify(payload, null, 2));

  // Try standard endpoint first
  const data = await nimbusRequest('/shipment', { method: 'POST', body: payload });

  if (!isSuccess(data)) {
    throw new Error(`Shipment failed: ${getErrorMessage(data)}`);
  }

  const d = data?.data || data?.result || data;
  return {
    awb: d?.awb_number || d?.awb || d?.awbNumber || d?.waybill || null,
    courierId: d?.courier_id || d?.courierId || null,
    courierName: d?.courier_name || d?.courierName || d?.courier || null,
    shipmentId: d?.shipment_id || d?.shipmentId || d?.id || null,
    label: d?.label || d?.label_url || null,
    raw: data,
  };
}

export async function trackShipment(awb) {
  if (!awb) throw new Error('AWB required');
  const data = await nimbusRequest(`/tracking/${awb}`, { method: 'GET' });
  const d = data?.data || data?.result || data;
  return {
    current_status: d?.current_status || d?.status || null,
    current_timestamp: d?.current_timestamp || d?.updated_at || null,
    tracking_data: d?.tracking_data || d?.scans || d?.events || [],
  };
}

export async function cancelShipment(awb) {
  if (!awb) throw new Error('AWB required');
  return nimbusRequest('/shipment/cancel', { method: 'POST', body: { awb } });
}

export async function startBooking(awb) {
  if (!awb) throw new Error('AWB required');
  return nimbusRequest('/shipment/book', { method: 'POST', body: { awb } });
}

export async function listWarehouses() {
  return nimbusRequest('/warehouse', { method: 'GET' });
}