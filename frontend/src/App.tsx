import React, { useState, useEffect } from 'react';
import { User, Tenant } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { NewQuotation } from './pages/NewQuotation';
import { QuotationsList } from './pages/QuotationsList';
import { ClientManagement } from './pages/ClientManagement';
import { EventManagement } from './pages/EventManagement';
import { MenuManagement } from './pages/MenuManagement';
import { CostingManagement } from './pages/CostingManagement';
import { CutleryManagement } from './pages/CutleryManagement';
import { ProcurementPage } from './pages/ProcurementPage';
import { SuperAdminPortal } from './pages/SuperAdminPortal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('catering_user') || localStorage.getItem('bandco_user');
    const token = localStorage.getItem('catering_token') || localStorage.getItem('bandco_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeTenant, setActiveTenant] = useState<Tenant | null>(() => {
    const savedTenant = localStorage.getItem('active_tenant');
    if (savedTenant) {
      try {
        return JSON.parse(savedTenant);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [currentView, setCurrentView] = useState<string>(() => {
    const saved = localStorage.getItem('catering_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'USER') return 'quotations';
      } catch {}
    }
    return 'new-quotation';
  });
  const [viewParams, setViewParams] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load tenants and settings
  const refreshTenants = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'SUPER_ADMIN') {
        const tList = await api.getTenants();
        setAllTenants(tList);
      } else {
        const s = await api.getSettings();
        if (s && s.company_name) {
          const tObj: Tenant = {
            id: s.id || 1,
            name: s.company_name,
            slug: 'tenant',
            tagline: s.tagline,
            logo_path: s.logo_path,
            phone1: s.phone1,
            phone2: s.phone2,
            email: s.email,
            location1: s.location1,
            location2: s.location2,
            website: s.website,
            gst_number: s.gst_number,
            quotation_prefix: s.quotation_prefix || 'QT-',
            default_terms: s.default_terms,
            currency_symbol: s.currency_symbol || '₹',
            date_format: s.date_format || 'DD/MM/YYYY',
            is_active: 1
          };
          setActiveTenant(tObj);
          localStorage.setItem('active_tenant', JSON.stringify(tObj));
          localStorage.setItem('active_tenant_id', String(tObj.id));
        }
      }
    } catch (err) {
      console.error('Failed to load active tenant details', err);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, [currentUser]);

  const handleNavigate = (view: string, params?: any) => {
    const role = currentUser?.role || 'ADMIN';
    if (role === 'USER' && (view === 'new-quotation' || view === 'costing')) {
      setCurrentView('quotations');
      return;
    }
    setViewParams(params || null);
    setCurrentView(view);
  };

  const handleLogout = () => {
    localStorage.removeItem('catering_token');
    localStorage.removeItem('catering_user');
    localStorage.removeItem('active_tenant');
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('bandco_token');
    localStorage.removeItem('bandco_user');
    setCurrentUser(null);
    setActiveTenant(null);
  };

  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={(user, token, tenant) => {
          setCurrentUser(user);
          if (tenant) {
            setActiveTenant(tenant);
          }
          if (user.role === 'SUPER_ADMIN') {
            // Handled directly
          } else if (user.role === 'USER') {
            setCurrentView('quotations');
          } else {
            setCurrentView('new-quotation');
          }
        }}
      />
    );
  }

  // Super Admin does NOT use the daily catering ERP app
  if (currentUser.role === 'SUPER_ADMIN') {
    return (
      <SuperAdminPortal onLogout={handleLogout} />
    );
  }

  const role = currentUser.role || 'ADMIN';
  const effectiveView = (role === 'USER' && (currentView === 'new-quotation' || currentView === 'costing'))
    ? 'quotations'
    : currentView;

  return (
    <div className="app-container">
      <Sidebar
        currentView={effectiveView}
        onNavigate={(view) => handleNavigate(view)}
        userRole={role}
        activeTenant={activeTenant}
        isOpen={sidebarOpen}
      />

      <div className="main-content">
        <Navbar
          currentUser={currentUser}
          activeTenant={activeTenant}
          allTenants={allTenants}
          onLogout={handleLogout}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {effectiveView === 'procurement' && (
            <ProcurementPage />
          )}

          {effectiveView === 'new-quotation' && (
            <NewQuotation
              userRole={role as any}
              editQuotationId={viewParams?.quotationId || null}
              onQuotationSaved={() => handleNavigate('quotations')}
              onResetEdit={() => setViewParams(null)}
            />
          )}

          {effectiveView === 'quotations' && (
            <QuotationsList
              userRole={role as any}
              onNavigate={handleNavigate}
            />
          )}

          {effectiveView === 'events' && (
            <EventManagement
              userRole={role as any}
              onNavigate={handleNavigate}
            />
          )}

          {effectiveView === 'clients' && (
            <ClientManagement
              userRole={role as any}
              onNavigate={handleNavigate}
            />
          )}

          {effectiveView === 'menu' && (
            <MenuManagement userRole={role as any} defaultTab="dishes" />
          )}

          {effectiveView === 'ingredients' && (
            <MenuManagement userRole={role as any} defaultTab="ingredients" />
          )}

          {effectiveView === 'cutlery' && (
            <CutleryManagement userRole={role as any} />
          )}

          {effectiveView === 'costing' && (
            <CostingManagement userRole={role as any} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
