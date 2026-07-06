import { useEffect, createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar.jsx';
import BloodBankDashboard from './pages/BloodBankDashboard';
import BloodInventory from './pages/BloodInventory';
import ManageBloodInventoryPage from './pages/ManageBlood.jsx';
import ExpiryAlertsPage from './pages/ExpiryAlertsPage';
import RequestsLandingPage from './pages/RequestsLandingPage';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestSuccessPage from './pages/RequestSuccessPage';
import RequestsListPage from './pages/RequestsListPage';
import RequestDetailPage from './pages/RequestDetailPage';
import SmartForecastPage from './pages/SmartForecastPage';
import SmartReportPage from './pages/SmartReportPage';
import Auth from './pages/Auth.jsx';
import HospitalProfilePage from './pages/HospitalProfilePage.jsx';
import { getToken } from './lib/authStorage.js';
import { connectRealtime, disconnectRealtime } from './lib/realtimeClient.js';
import { NotificationsProvider } from './contexts/NotificationsContext.jsx';

export const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    return stored !== 'false';
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', String(next));
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

function ProtectedLayout() {
  const location = useLocation();
  const token = getToken();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    if (token) {
      connectRealtime();
    }
    return () => {
      disconnectRealtime();
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <NotificationsProvider>
      <div className="flex min-h-screen bg-[#F7F8FA] font-sans relative overflow-x-hidden">
        <Sidebar />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out`}
          style={{
            marginLeft: sidebarOpen ? '260px' : '64px',
            width: `calc(100vw - ${sidebarOpen ? '260px' : '64px'})`
          }}
        >
          <TopBar onToggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto" style={{ paddingTop: '24px', paddingLeft: '32px', paddingRight: '32px' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
}

function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<BloodBankDashboard />} />
            <Route path="/inventory" element={<BloodInventory />} />
            <Route path="/inventory/manage" element={<ManageBloodInventoryPage />} />
            <Route path="/add-remove" element={<ManageBloodInventoryPage />} />
            <Route path="/inventory/alerts" element={<ExpiryAlertsPage />} />
            <Route path="/requests" element={<RequestsLandingPage />} />
            <Route path="/requests/new" element={<CreateRequestPage />} />
            <Route path="/requests/success" element={<RequestSuccessPage />} />
            <Route path="/requests/list" element={<RequestsListPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/forecast" element={<SmartForecastPage />} />
            <Route path="/reports" element={<SmartReportPage />} />
            <Route path="/profile" element={<HospitalProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
}

export default App;
