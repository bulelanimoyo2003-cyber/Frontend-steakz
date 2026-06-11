(async () => {
  try {
    const base = 'http://localhost:3001/api';
    const email = 'steakz.city.centre.cashier@steakz.com';
    const password = 'password123';

    console.log('Logging in...');
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await loginRes.json();
    if (!loginBody.token) {
      console.error('Login failed', loginBody);
      return;
    }
    const token = loginBody.token;

    // create order
    const menuRes = await fetch(`${base}/cashier/menu`, { headers: { Authorization: `Bearer ${token}` } });
    const menu = await menuRes.json();
    const item = menu[0];

    console.log('Creating order...');
    const orderRes = await fetch(`${base}/cashier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ menuItemId: item.id, quantity: 1 }] }),
    });
    const orderBody = await orderRes.json();
    console.log('Order created:', orderRes.status, orderBody);

    // fetch orders
    const ordersRes = await fetch(`${base}/cashier/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const orders = await ordersRes.json();
    console.log('Recent orders count:', orders.length);
    const latest = orders[0];
    console.log('Latest order id:', latest.id, 'paymentStatus:', latest.paymentStatus);

    // mark paid
    console.log('Marking paid for order', latest.id);
    const payRes = await fetch(`${base}/cashier/orders/${latest.id}/pay`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payBody = await payRes.json();
    console.log('Pay response:', payRes.status, payBody);

    // confirm persisted
    const confirmRes = await fetch(`${base}/cashier/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const confirmOrders = await confirmRes.json();
    const confirmed = confirmOrders.find((o) => o.id === latest.id);
    console.log('Confirmed paymentStatus:', confirmed?.paymentStatus);

  } catch (e) {
    console.error('Verification script error', e);
  }
})();
