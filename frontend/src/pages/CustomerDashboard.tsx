import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Booking {
  id: number;
  date: string;
  status: string;
  guestCount: number;
  table: { tableNumber: number; branch: { name: string } };
}

interface OrderItem {
  menuItem: { name: string };
  quantity: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  branch: { name: string };
  items: OrderItem[];
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchCustomerData = async () => {
      try {
        const [bookingsResp, ordersResp] = await Promise.all([
          api.get<Booking[]>('/customer/bookings'),
          api.get<Order[]>('/customer/orders'),
        ]);

        if (!mounted) {
          return;
        }

        setBookings(bookingsResp.data);
        setOrders(ordersResp.data);
      } catch {
        if (mounted) {
          setError('Unable to load reservations or orders.');
          setSuccess('');
        }
      }
    };

    fetchCustomerData();
    const refreshInterval = setInterval(fetchCustomerData, 10000);
    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  async function cancelBooking(id: number) {
    try {
      await api.delete(`/customer/bookings/${id}`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
      setError('');
      setSuccess('Reservation cancelled successfully.');
    } catch {
      setError('Unable to cancel reservation.');
      setSuccess('');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Account</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      <div className="section-title">Reservations</div>
      {bookings.length === 0 ? (
        <div className="empty-state">
          <span>📅</span>
          No reservations yet.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Table</th>
              <th>Guests</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.table.branch.name}</td>
                <td>Table {booking.table.tableNumber}</td>
                <td>{booking.guestCount}</td>
                <td>{new Date(booking.date).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                </td>
                <td>
                  {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => cancelBooking(booking.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-title">Order History</div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <span>🍷</span>
          No orders yet.
        </div>
      ) : (
        <div className="card-grid">
          {orders.map((order) => (
            <div className="card" key={order.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div>
                  <span className="card-label">Order #{order.id}</span>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.1rem', color: 'var(--text-secondary)' }}>
                    {order.branch.name} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                  <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
                  <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {order.paymentStatus || 'UNPAID'}
                  </span>
                </div>
              </div>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.8 }}>
                {order.items.map((item, index) => (
                  <li key={index}>{item.menuItem.name} × {item.quantity}</li>
                ))}
              </ul>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <span className="price">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
