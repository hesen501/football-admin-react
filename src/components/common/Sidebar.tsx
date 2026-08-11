import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Goal,
  Calendar,
  Clock,
  Users,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  // User administration is SUPER_ADMIN-only server-side (see UserPolicy) —
  // VENUE_MANAGER holds no users.* permission, so the nav item would only
  // ever 403 for them.
  const isSuperAdmin = Boolean(user?.roles?.includes('SUPER_ADMIN'));

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Venues', path: '/venues', icon: MapPin },
    { label: 'Fields', path: '/fields', icon: Goal },
    { label: 'Bookings', path: '/bookings', icon: Calendar },
    { label: 'Schedule', path: '/schedule', icon: Clock },
    ...(isSuperAdmin ? [{ label: 'Users', path: '/users', icon: Users }] : []),
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <ShieldCheck size={22} />
        </div>
        <span className="logo-title">Venue Admin</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              end={item.path === '/'}
            >
              <span className="nav-icon">
                <Icon size={20} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
