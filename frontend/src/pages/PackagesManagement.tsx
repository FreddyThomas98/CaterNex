import React, { useState, useEffect } from 'react';
import { Package, Addon, UserRole } from '../types';
import { api } from '../services/api';
import { Package as PackageIcon, Sparkles, Plus, Check } from 'lucide-react';

interface PackagesManagementProps {
  userRole: UserRole;
}

export const PackagesManagement: React.FC<PackagesManagementProps> = ({ userRole }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pkgs, ads] = await Promise.all([
          api.getPackages(),
          api.getAddons()
        ]);
        setPackages(pkgs);
        setAddons(ads);
      } catch (err) {
        console.error('Failed to load packages', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page-wrapper">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '0.35rem' }}>
            Curated Banquets & Stalls
          </span>
          <h1 style={{ fontSize: '2rem', lineHeight: 1.15 }}>
            Packages & Add-on Stations
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage pre-assembled banquet packages and live event station add-ons.
          </p>
        </div>
      </div>

      {/* SECTION 1: CATERING PACKAGES */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
          Predefined Catering Packages
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {packages.map(pkg => (
            <div key={pkg.id} className="luxury-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--brand-emerald)' }}>
                    {pkg.name}
                  </h3>
                  <span className="badge badge-gold">Package</span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                  {pkg.description}
                </p>
              </div>

              <div style={{
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Base per person
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-emerald)' }}>
                  ₹{pkg.default_price} <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>/ person</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ADD-ON STATIONS */}
      <div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
          Live Stations & Premium Add-ons
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {addons.map(addon => (
            <div key={addon.id} className="luxury-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--brand-emerald)' }}>
                    {addon.name}
                  </h3>
                  <span className="badge badge-emerald">Live Station</span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '1rem' }}>
                  {addon.description}
                </p>
              </div>

              <div style={{
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {addon.pricing_unit}
                </span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-gold)' }}>
                  ₹{addon.selling_price.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
