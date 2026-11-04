import React, { useState, useEffect } from 'react';

export default function AdminShippingTab() {
  const [shipping, setShipping] = useState({
    couriers: [
      { name: 'PostEx', enabled: true, cod: true },
      { name: 'Trax', enabled: true, cod: true },
      { name: 'TCS', enabled: true, cod: true },
      { name: 'Leopards', enabled: true, cod: true },
      { name: 'M&P', enabled: true, cod: true },
      { name: 'Call Courier', enabled: true, cod: true },
      { name: 'Rider / Own Delivery', enabled: true, cod: true }
    ],
    city_rates: { 'Faisalabad': 150, 'Lahore': 200, 'Karachi': 250, 'Islamabad': 200, 'Rawalpindi': 200, 'Default': 250 },
    free_shipping_min: 5000,
    default_courier: 'PostEx',
    cod_enabled: true
  });

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityRate, setNewCityRate] = useState('');

  const fetchShipping = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shipping');
      if (res.ok) {
        const data = await res.json();
        setShipping(prev => ({
          ...prev,
          ...data,
          couriers: Array.isArray(data.couriers) && data.couriers.length > 0 ? data.couriers : prev.couriers,
          city_rates: data.city_rates && Object.keys(data.city_rates).length > 0 ? data.city_rates : prev.city_rates
        }));
      }
    } catch (err) {
      console.error('Error fetching shipping:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, []);

  const handleToggleCourier = (index) => {
    setShipping(prev => {
      const next = [...prev.couriers];
      next[index] = { ...next[index], enabled: !next[index].enabled };
      return { ...prev, couriers: next };
    });
  };

  const handleAddCityRate = (e) => {
    e.preventDefault();
    if (!newCityName || !newCityRate) return;
    setShipping(prev => ({
      ...prev,
      city_rates: { ...prev.city_rates, [newCityName.trim()]: parseFloat(newCityRate) || 200 }
    }));
    setNewCityName('');
    setNewCityRate('');
  };

  const handleRemoveCityRate = (city) => {
    setShipping(prev => {
      const copy = { ...prev.city_rates };
      delete copy[city];
      return { ...prev, city_rates: copy };
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('Saving settings...');
      const res = await fetch('/api/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couriers: shipping.couriers,
          cityRates: shipping.city_rates,
          freeShippingMin: parseFloat(shipping.free_shipping_min) || 5000,
          defaultCourier: shipping.default_courier,
          codEnabled: shipping.cod_enabled
        })
      });
      if (res.ok) {
        setSaveStatus('Shipping settings saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      setSaveStatus('Failed to save settings');
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Shipping & Courier Settings</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Manage delivery partners, city delivery rates, free shipping thresholds, and COD rules</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>{saveStatus}</span>
          <button
            type="button"
            onClick={handleSaveSettings}
            style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Save All Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Card 1: Courier Partners */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 12px', color: '#111827' }}>Authorized Courier Partners</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shipping.couriers.map((c, idx) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '12px', color: '#111827' }}>{c.name}</div>
                  <span style={{ fontSize: '10.5px', color: c.cod ? '#16a34a' : '#64748b' }}>Cash on Delivery Supported</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleCourier(idx)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: c.enabled ? '#dcfce7' : '#fee2e2',
                      color: c.enabled ? '#15803d' : '#b91c1c',
                      cursor: 'pointer'
                    }}
                  >
                    {c.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Default Dispatch Partner
            </label>
            <select
              value={shipping.default_courier}
              onChange={e => setShipping(prev => ({ ...prev, default_courier: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
            >
              {shipping.couriers.filter(c => c.enabled).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Card 2: City Delivery Rates & Rules */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 12px', color: '#111827' }}>City Shipping Rates (PKR)</h3>

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {Object.entries(shipping.city_rates).map(([city, rate]) => (
              <div key={city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '11.5px' }}>
                <span style={{ fontWeight: 600, color: '#111827' }}>{city}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>Rs. {rate}</span>
                  {city !== 'Default' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCityRate(city)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add City Rate Form */}
          <form onSubmit={handleAddCityRate} style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="City (e.g. Multan)"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
              style={{ flex: 2, padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none' }}
            />
            <input
              type="number"
              placeholder="Rate Rs."
              value={newCityRate}
              onChange={e => setNewCityRate(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
            >
              Add
            </button>
          </form>

          {/* Free Shipping Threshold */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Free Shipping Threshold (PKR)
            </label>
            <input
              type="number"
              value={shipping.free_shipping_min}
              onChange={e => setShipping(prev => ({ ...prev, free_shipping_min: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Orders equal to or above this total get automatic Free Delivery across Pakistan.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
