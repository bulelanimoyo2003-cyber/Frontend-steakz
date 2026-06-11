#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001/api';

async function test() {
  try {
    // Use a valid cashier token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJzdGVha3ouY2l0eS5jZW50cmUuY2FzaGllckBzdGVha3ouY29tIiwicm9sZSI6IkNBU0hJRVIiLCJicmFuY2hJZCI6MSwiaWF0IjoxNzE4MzI4NDc4fQ.JV2l1EW-VHY1eFVD1-abjlbZEjBJH6bsmA0VhTVeGMc';
    
    console.log('Testing PATCH /api/cashier/orders/4/pay');
    
    const res = await fetch(`${BASE_URL}/cashier/orders/4/pay`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
    
    if (res.ok) {
      console.log('✓ SUCCESS');
    } else {
      console.log('✗ FAILED');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
