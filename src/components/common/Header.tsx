import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User as UserIcon } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.email || 'Admin';

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="header-title">Football Venue Management</h1>
      </div>
      <div className="header-right">
        <div className="user-badge" title={user?.email}>
          <div className="user-avatar">
            <UserIcon size={16} />
          </div>
          <span>{displayName}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign Out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
