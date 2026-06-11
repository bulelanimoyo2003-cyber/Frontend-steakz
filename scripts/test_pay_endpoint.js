#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001/api';

async function test() {
  const tokenResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'steakz.city.centre.cashier@steakz.com', password: 'password123' }),
  });
  const tokenText = await tokenResponse.text();
  console.log('login status', tokenResponse.status);
  console.log('login body', tokenText);
  if (!tokenResponse.ok) return;
  const token = JSON.parse(tokenText).token;

  const ordersResponse = await fetch(`${BASE_URL}/cashier/orders`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const ordersText = await ordersResponse.text();
  console.log('orders status', ordersResponse.status);
  console.log('orders body', ordersText);

  const patchResponse = await fetch(`${BASE_URL}/cashier/orders/1/pay`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  const patchText = await patchResponse.text();
  console.log('patch status', patchResponse.status);
  console.log('patch body', patchText);
}

test().catch((e) => { console.error(e); process.exit(1); });
