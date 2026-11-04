import React, { useState, useEffect } from 'react';

export default function AdminInventoryTab() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, totalStockValuation: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('levels'); // 'levels' | 'movements'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [movementType, setMovementType] = useState('Stock-In');
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [invRes, moveRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements')
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setProducts(data.products || []);
        if (data.summary) setSummary(data.summary);
      }
      if (moveRes.ok) {
        const moves = await moveRes.json();
        setMovements(Array.isArray(moves) ? moves : []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseInt(adjustmentQty, 10);
    if (isNaN(qty) || qty === 0) return alert('Please enter a valid non-zero adjustment quantity');

    try {
      setIsSubmitting(true);
      const finalChange = movementType === 'Stock-Out' || movementType === 'Damaged' ? -Math.abs(qty) : Math.abs(qty);
      const res = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantityChange: finalChange,
          movementType,
          reason: reasonInput || `${movementType} by Admin`,
          admin: 'Admin'
        })
      });

      if (res.ok) {
        setSelectedProduct(null);
        setAdjustmentQty('');
        setReasonInput('');
        fetchInventory();
      }
    } catch (err) {
      console.error('Adjustment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      {/* Header & Sub-tab navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Inventory & Stock Management</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Real-time stock valuation, manual adjustments, and audit ledger</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setSubTab('levels')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid ' + (subTab === 'levels' ? 'var(--orange, #ea580c)' : '#d1d5db'),
              backgroundColor: subTab === 'levels' ? 'var(--orange, #ea580c)' : '#ffffff',
              color: subTab === 'levels' ? '#ffffff' : '#374151',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setSubTab('movements')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid ' + (subTab === 'movements' ? 'var(--orange, #ea580c)' : '#d1d5db'),
              backgroundColor: subTab === 'movements' ? 'var(--orange, #ea580c)' : '#ffffff',
              color: subTab === 'movements' ? '#ffffff' : '#374151',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Movements Ledger ({movements.length})
          </button>
          <button
            type="button"
            onClick={fetchInventory}
            style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Inventory Valuation (COGS)</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
            Rs. {Math.round(summary.totalStockValuation || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Tracked SKUs</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
            {summary.totalProducts || 0}
          </div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Low Stock Alerts (&le; 5 units)</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
            {summary.lowStockCount || 0}
          </div>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Out of Stock</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
            {summary.outOfStockCount || 0}
          </div>
        </div>
      </div>

      {/* View 1: Stock Levels */}
      {subTab === 'levels' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Product</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Cost Price</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Available Units</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Inventory Status</th>
                <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const stock = p.stock || 0;
                const isOutOfStock = stock === 0;
                const isLowStock = stock > 0 && stock <= (p.low_stock_threshold || 5);

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: '700', color: '#111827' }}>{p.name}</div>
                      <div style={{ color: '#64748b', fontSize: '10.5px' }}>SKU: {p.sku || `SKU-${p.id}`}</div>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#4b5563' }}>{p.category}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#374151' }}>Rs. {p.costPrice || '0'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '800', color: '#111827', fontSize: '13px' }}>
                      {stock}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor: isOutOfStock ? '#fee2e2' : isLowStock ? '#ffedd5' : '#dcfce7',
                        color: isOutOfStock ? '#b91c1c' : isLowStock ? '#c2410c' : '#15803d'
                      }}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#111827', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Movements Ledger */}
      {subTab === 'movements' && (
        <div style={{ overflowX: 'auto' }}>
          {movements.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
              No inventory movements logged yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Product</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Previous</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Change</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>New Balance</th>
                  <th style={{ padding: '8px 10px', color: '#6b7280', fontWeight: '600' }}>Reason & Actor</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const isPositive = m.quantity_changed > 0;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: '600', color: '#111827' }}>
                        {m.product_name}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.previous_quantity}</td>
                      <td style={{ padding: '8px 10px', fontWeight: '700', color: isPositive ? '#16a34a' : '#dc2626' }}>
                        {isPositive ? `+${m.quantity_changed}` : m.quantity_changed}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: '800', color: '#111827' }}>{m.new_quantity}</td>
                      <td style={{ padding: '8px 10px', color: '#4b5563' }}>
                        {m.reason} <span style={{ color: '#9ca3af', fontSize: '10px' }}>({m.responsible_admin || 'Admin'})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Adjust Inventory</h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>{selectedProduct.name} &bull; Current: {selectedProduct.stock || 0} units</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Movement Type
                </label>
                <select
                  value={movementType}
                  onChange={e => setMovementType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}
                >
                  <option value="Stock-In">Stock-In (New Shipment Arrival)</option>
                  <option value="Stock-Out">Stock-Out (Offline Sale / Transfer)</option>
                  <option value="Manual Adjustment">Manual Audit Correction</option>
                  <option value="Damaged">Damaged / Expired Product</option>
                  <option value="Returned">Restored from Customer Return</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Units to Adjust
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={adjustmentQty}
                  onChange={e => setAdjustmentQty(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Reason / Supplier / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch PO #4489 from Trax Cargo"
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Recording...' : 'Record Adjustment'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
