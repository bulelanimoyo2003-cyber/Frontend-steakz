import { useEffect, useState } from 'react';
import api from '../api/axios';

interface BranchSales {
  branchId: number;
  branchName: string;
  totalSales: number;
  orderCount: number;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  salary?: number;
  branch?: { name: string };
}

interface Order {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  branch: { name: string };
}

export default function HQDashboard() {
  const [sales, setSales] = useState<BranchSales[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<BranchSales[]>('/hq/sales').then((response) => setSales(response.data)).catch(() => setError('Unable to load sales data.'));
    api.get<StaffMember[]>('/hq/staff').then((response) => setStaff(response.data)).catch(() => setError('Unable to load staff data.'));
    api.get<Order[]>('/hq/orders').then((response) => setOrders(response.data)).catch(() => setError('Unable to load order overview.'));
  }, []);

  const totalRevenue = sales.reduce((sum, branch) => sum + branch.totalSales, 0);
  const totalOrders = sales.reduce((sum, branch) => sum + branch.orderCount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>HQ Overview</h1>
        <p>Consolidated view across all 7 locations</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">€{totalRevenue.toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{staff.length}</div>
          <div className="stat-label">Total Staff</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">7</div>
          <div className="stat-label">Locations</div>
        </div>
      </div>

      <div className="section-title">Sales by Location</div>
      <table className="data-table">
        <thead>
          <tr><th>Location</th><th>Orders</th><th>Revenue</th></tr>
        </thead>
        <tbody>
          {sales.map((branch) => (
            <tr key={branch.branchId}>
              <td>{branch.branchName}</td>
              <td>{branch.orderCount}</td>
              <td><span className="price" style={{ fontSize: '0.95rem' }}>€{branch.totalSales.toFixed(2)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">Order Overview</div>
      {orders.length === 0 ? (
        <div className="empty-state">
          <span>📈</span>
          No recent orders available.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Order</th><th>Location</th><th>Status</th><th>Total</th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.branch.name}</td>
                <td><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                <td><span className="price">€{order.total.toFixed(2)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="section-title">Staff Overview</div>
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th><th>Salary</th></tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{member.role}</td>
              <td>{member.branch?.name ?? 'HQ'}</td>
              <td>{member.salary ? <span className="price" style={{ fontSize: '0.95rem' }}>€{member.salary}</span> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
