(async () => {
  try {
    const base = 'http://127.0.0.1:3001/api';
    const chefEmail = 'steakz.city.centre.chef@steakz.com';
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: chefEmail, password: 'password123' }),
    });
    const login = await loginRes.json();
    console.log('login', loginRes.status, login.token ? 'OK' : 'FAIL');
    const ordersRes = await fetch(base + '/chef/orders', {
      headers: { Authorization: 'Bearer ' + login.token },
    });
    const orders = await ordersRes.json();
    console.log('orders count', orders.length, orders.map((o) => ({ id: o.id, status: o.status })).slice(0, 10));
    const prep = orders.find((o) => o.status === 'PREPARING');
    if (!prep) {
      console.log('no PREPARING order');
      return;
    }
    const patchRes = await fetch(base + '/chef/orders/' + prep.id + '/done', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + login.token },
    });
    const patch = await patchRes.json();
    console.log('patch', patchRes.status, patch);
    const againRes = await fetch(base + '/chef/orders', {
      headers: { Authorization: 'Bearer ' + login.token },
    });
    const again = await againRes.json();
    console.log('after count', again.length, again.map((o) => ({ id: o.id, status: o.status })).slice(0, 10));
  } catch (err) {
    console.error('error', err);
  }
})();
