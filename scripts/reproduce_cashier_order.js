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
    console.log('Login status:', loginRes.status);
    console.log(loginBody);
    if (!loginBody.token) return;
    const token = loginBody.token;

    console.log('\nFetching menu...');
    const menuRes = await fetch(`${base}/cashier/menu`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const menu = await menuRes.json();
    console.log('Menu status:', menuRes.status);
    console.log(menu);

    if (!Array.isArray(menu) || menu.length === 0) {
      console.log('No menu items to order');
      return;
    }

    const item = menu[0];
    console.log('\nPosting order for item id', item.id);
    const orderRes = await fetch(`${base}/cashier/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ menuItemId: item.id, quantity: 2 }] }),
    });
    const orderBody = await orderRes.json();
    console.log('Order status:', orderRes.status);
    console.log(orderBody);
  } catch (e) {
    console.error('Script error', e);
  }
})();
