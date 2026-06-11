import React from 'react';

export default function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: React.ReactNode; bg?: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: bg ?? 'var(--primary)' }}>{icon}</div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}
