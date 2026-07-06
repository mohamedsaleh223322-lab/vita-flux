import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Droplet, 
  Package, 
  AlertTriangle, 
  ClipboardList, 
  LineChart, 
  FileBarChart,
  LogOut,
  Menu,
  Building2
} from 'lucide-react';
import icon from '../../assets/icon 3.png';
import { clearSession } from '../../lib/authStorage.js';
import { disconnectRealtime } from '../../lib/realtimeClient.js';
import { useSidebar } from '../../App.jsx';

const navItems = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { id: 'inventory', path: '/inventory', label: 'Blood Inventory', icon: Droplet, exact: true },
  { id: 'manage-inventory', path: '/inventory/manage', label: 'Manage Inventory', icon: Package, exact: true },
  { id: 'expiry', path: '/inventory/alerts', label: 'Expiry & Alerts', icon: AlertTriangle },
  { id: 'requests', path: '/requests', label: 'Requests', icon: ClipboardList },
  { id: 'forecast', path: '/forecast', label: 'Smart Forecast', icon: LineChart, exact: true },
  { id: 'reports', path: '/reports', label: 'Reports', icon: FileBarChart },
  { id: 'hospital-profile', path: '/profile', label: 'Hospital Profile', icon: Building2, exact: true },
];

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const isCollapsed = !sidebarOpen;
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    disconnectRealtime();
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <>
      {/* Mobile Toggle - visible only on small screens */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-gray-100"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Sidebar Container */}
      <div 
        className={`
          flex flex-col h-screen bg-[#0F1B2D] pt-8 pb-8 justify-between flex-shrink-0 transition-all duration-300 ease-in-out z-40
          fixed top-0 left-0
          ${sidebarOpen 
            ? 'w-[260px] px-6 translate-x-0' 
            : 'w-[64px] px-2 -translate-x-full md:translate-x-0'
          }
        `}
      >
        {/* Brand Section */}
        <div className="flex flex-col gap-6">
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'px-2 pt-2 pb-5 border-b border-white/10'}`} style={{ gap: 8 }}>
            <img src={icon} alt="Vita Flux Logo" style={{ width: '40px', height: '40px' }} className="object-contain flex-shrink-0" />
            {!isCollapsed && (
              <h1 style={{ fontSize: '22px' }} className="leading-none tracking-tight whitespace-nowrap overflow-hidden">
                <span style={{ color: '#ffffff', fontWeight: 700 }}>Vita</span>
                <span style={{ color: '#E53E3E', fontWeight: 700, marginLeft: '6px' }}>Flux</span>
              </h1>
            )}
          </div>
 
          {/* Navigation Section */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`
                    relative flex items-center h-[50px] rounded-[10px] transition-all duration-200 ease-in-out text-left group
                    ${isCollapsed ? 'justify-center px-0 w-[50px] mx-auto' : 'px-[18px] w-full gap-[10px]'}
                    ${isActive 
                      ? 'text-white font-bold' 
                      : 'text-[#94A3B8] font-medium hover:bg-white/5 hover:text-white'
                    }
                  `}
                  style={isActive ? {
                    backgroundColor: 'rgba(220, 38, 38, 0.15)',
                    borderLeft: '4px solid #E53E3E'
                  } : {
                    borderLeft: '4px solid transparent'
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon 
                    className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-white'}`} 
                    strokeWidth={2}
                  />
                  
                  {!isCollapsed && (
                    <span className="text-[15px] whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Section */}
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className={`
              flex items-center h-[50px] rounded-[10px] transition-all duration-200 ease-in-out text-left bg-transparent text-[#94A3B8] font-medium hover:bg-white/5 hover:text-white group
              ${isCollapsed ? 'justify-center px-0 w-[50px] mx-auto' : 'px-[18px] w-full gap-[10px]'}
            `}
            style={{
              borderLeft: '4px solid transparent'
            }}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={`w-[18px] h-[18px] flex-shrink-0 text-[#94A3B8] group-hover:text-white transition-colors`} strokeWidth={2} />
            {!isCollapsed && (
              <span className="text-[15px] group-hover:text-white transition-colors whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
