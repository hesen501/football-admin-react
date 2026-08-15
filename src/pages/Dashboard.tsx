import React, { useEffect, useState } from 'react';
import { Users, MapPin, Goal, CalendarCheck, DollarSign, PiggyBank } from 'lucide-react';
import { getDashboardStats, getRecentBookings } from '../api/dashboard';
import { DashboardStats } from '../types/dashboard';
import { Booking } from '../types/booking';
import { useNotification } from '../hooks/useNotification';
import { getErrorMessage } from '../utils/errors';
import StatusBadge from '../components/common/StatusBadge';

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const Dashboard: React.FC = () => {
  const { showToast } = useNotification();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [statsResult, bookingsResult] = await Promise.all([
          getDashboardStats(),
          getRecentBookings(10),
        ]);
        if (!cancelled) {
          setStats(statsResult);
          setRecentBookings(bookingsResult);
        }
      } catch (err) {
        if (!cancelled) showToast(getErrorMessage(err, 'İdarə paneli yüklənə bilmədi'), 'error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Ümumi Baxış</h2>
          <p className="page-subtitle">Futbol Məkanları İdarəetmə Sisteminə xoş gəlmisiniz</p>
        </div>
      </div>

      {isLoading ? (
        <div className="page-card table-loading">
          <span className="spinner" />
        </div>
      ) : stats ? (
        <>
          <div className="stat-grid">
            {stats.total_users !== null && (
              <StatCard icon={<Users size={20} />} label="Ümumi İstifadəçilər" value={stats.total_users} />
            )}
            <StatCard icon={<MapPin size={20} />} label="Ümumi Məkanlar" value={stats.total_venues} />
            <StatCard icon={<Goal size={20} />} label="Ümumi Sahələr" value={stats.total_fields} />
            <StatCard icon={<CalendarCheck size={20} />} label="Ümumi Rezervasiyalar" value={stats.total_bookings} />
            <StatCard
              icon={<DollarSign size={20} />}
              label="Ümumi Gəlir"
              value={currency(stats.total_revenue)}
            />
            <StatCard
              icon={<PiggyBank size={20} />}
              label="Platforma Komissiyası"
              value={currency(stats.total_commission)}
            />
          </div>

          <div className="page-card" style={{ marginBottom: '28px' }}>
            <div className="page-header">
              <div>
                <h2 className="page-title" style={{ fontSize: '1.15rem' }}>
                  Rezervasiya Statuslarının Bölgüsü
                </h2>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.entries(stats.booking_status_breakdown).map(([status, count]) => (
                <div
                  key={status}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <StatusBadge status={status} />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="page-card">
            <div className="page-header">
              <div>
                <h2 className="page-title" style={{ fontSize: '1.15rem' }}>
                  Son Rezervasiyalar
                </h2>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Müştəri</th>
                    <th>Sahə / Məkan</th>
                    <th>Başlama Vaxtı</th>
                    <th>Status</th>
                    <th>Ödəniş</th>
                    <th>Ümumi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        Son rezervasiya yoxdur
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.user?.name || '—'}</td>
                        <td>
                          {booking.field?.name || '—'}
                          <div className="cell-muted">{booking.field?.venue?.name}</div>
                        </td>
                        <td>{formatDateTime(booking.start_time)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                        <td>
                          <StatusBadge status={booking.payment_status} />
                        </td>
                        <td>{currency(booking.total_price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({
  icon,
  label,
  value,
}) => (
  <div className="stat-card">
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-value">{value}</div>
  </div>
);

export default Dashboard;
