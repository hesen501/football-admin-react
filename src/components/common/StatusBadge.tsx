import React from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const TONE_MAP: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  CONFIRMED: 'success',
  PAID: 'success',
  COMPLETED: 'success',
  PENDING: 'warning',
  MAINTENANCE: 'warning',
  SUSPENDED: 'danger',
  CANCELLED: 'danger',
  FAILED: 'danger',
  INACTIVE: 'muted',
  REFUNDED: 'info',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const tone = TONE_MAP[status] || 'muted';
  return <span className={`badge badge-${tone}`}>{status.replace(/_/g, ' ')}</span>;
};

export default StatusBadge;
