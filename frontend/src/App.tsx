import React, { useState } from 'react';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { NewQuotation } from './pages/NewQuotation';
import { QuotationsList } from './pages/QuotationsList';
import { ClientManagement } from './pages/ClientManagement';
import { EventManagement } from './pages/EventManagement';
import { MenuManagement } from './pages/MenuManagement';
import { CostingManagement } from './pages/CostingManagement';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bandco_user');
    const token = localStorage.getItem('bandco_token');
    if (saved && token) {
      try {
        const u = JSON.parse(saved);
        return { ...u, role: 'ADMIN' };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<string>('new-quotation');
  const [viewParams, setViewParams] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNavigate = (view: string, params?: any) => {
    setViewParams(params || null);
    setCurrentView(view);
  };

  const handleLogout = () => {
    localStorage.removeItem('bandco_token');
    localStorage.removeItem('bandco_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user) => {
          const adminUser: User = { ...user, role: 'ADMIN', max_discount_pct: 100.0 };
          setCurrentUser(adminUser);
          localStorage.setItem('bandco_user', JSON.stringify(adminUser));
          handleNavigate('new-quotation');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => handleNavigate(view)}
        userRole="ADMIN"
        isOpen={sidebarOpen}
      />

      <div className="main-content">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {currentView === 'new-quotation' && (
            <NewQuotation
              userRole="ADMIN"
              editQuotationId={viewParams?.quotationId || null}
              onQuotationSaved={() => handleNavigate('quotations')}
              onResetEdit={() => setViewParams(null)}
            />
          )}

          {currentView === 'quotations' && (
            <QuotationsList
              userRole="ADMIN"
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'events' && (
            <EventManagement
              userRole="ADMIN"
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'clients' && (
            <ClientManagement
              userRole="ADMIN"
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'menu' && (
            <MenuManagement userRole="ADMIN" />
          )}

          {currentView === 'costing' && (
            <CostingManagement userRole="ADMIN" />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
