import React, { useState, useEffect } from 'react';

export default function AdminIntegrationsTab() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggle = async (intg) => {
    try {
      const nextEnabled = !intg.is_enabled;
      const res = await fetch(`/api/integrations/${intg.integration_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: intg.config || {},
          is_enabled: nextEnabled
        })
      });
      if (res.ok) {
        setIntegrations(prev => prev.map(i => i.integration_key === intg.integration_key ? { ...i, is_enabled: nextEnabled } : i));
      }
    } catch (err) {
      console.error('Error toggling integration:', err);
    }
  };

  const openConfigModal = (intg) => {
    setSelectedIntegration(intg);
    setApiKeyInput(intg.config?.apiKey || intg.config?.token || intg.config?.pixelId || '');
    setWebhookUrlInput(intg.config?.webhookUrl || '');
    setSaveStatus('');
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    if (!selectedIntegration) return;
    try {
      setSaveStatus('Testing & saving...');
      const updatedConfig = {
        ...selectedIntegration.config,
        apiKey: apiKeyInput,
        webhookUrl: webhookUrlInput
      };
      const res = await fetch(`/api/integrations/${selectedIntegration.integration_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: updatedConfig,
          is_enabled: selectedIntegration.is_enabled
        })
      });
      if (res.ok) {
        setSaveStatus('Integration connected & verified!');
        setIntegrations(prev => prev.map(i => i.integration_key === selectedIntegration.integration_key ? { ...i, config: updatedConfig } : i));
        setTimeout(() => setSelectedIntegration(null), 1200);
      }
    } catch (err) {
      setSaveStatus('Failed to connect API');
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Integrations & External APIs</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Centralized connection management for couriers, payment gateways, WhatsApp, and marketing pixels</p>
        </div>
        <button
          type="button"
          onClick={fetchIntegrations}
          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Loading integrations...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {integrations.map(intg => {
            const isEnabled = Boolean(intg.is_enabled);
            return (
              <div key={intg.integration_key} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{intg.category}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      backgroundColor: isEnabled ? '#dcfce7' : '#fee2e2',
                      color: isEnabled ? '#15803d' : '#b91c1c'
                    }}>
                      {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{intg.name}</h4>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Status: <strong style={{ color: '#16a34a' }}>{intg.status || 'Configured'}</strong>
                  </div>
                  {intg.last_tested_at && (
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                      Verified: {new Date(intg.last_tested_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(intg)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isEnabled ? 'Turn Off' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openConfigModal(intg)}
                    style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#111827', color: '#ffffff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configure Integration Modal */}
      {selectedIntegration && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Configure {selectedIntegration.name}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Credentials stored securely on the backend server</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  API Token / Secret Key / Merchant ID
                </label>
                <input
                  type="password"
                  placeholder="Enter API Key or Token..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Webhook URL / Endpoint Callback
                </label>
                <input
                  type="text"
                  placeholder="/api/webhooks/..."
                  value={webhookUrlInput}
                  onChange={e => setWebhookUrlInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>{saveStatus}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedIntegration(null)}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save & Test
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
