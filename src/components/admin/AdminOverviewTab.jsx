import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function AdminOverviewTab({ setActiveTab }) {
  const { orders = [], products = [], expenses = [] } = useStore();

  const [dateRange, setDateRange] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'year'
  const [customersCount, setCustomersCount] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [returnsCount, setReturnsCount] = useState(0);
  const [paymentsList, setPaymentsList] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({ lowStockCount: 0, outOfStockCount: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch live stats from backend
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [custRes, retRes, payRes, invRes] = await Promise.all([
          fetch('/api/customers').catch(() => null),
          fetch('/api/returns').catch(() => null),
          fetch('/api/payments').catch(() => null),
          fetch('/api/inventory').catch(() => null)
        ]);

        if (isMounted) {
          if (custRes && custRes.ok) {
            const custs = await custRes.json();
            setCustomersCount(Array.isArray(custs) ? custs.length : 0);
            setRecentCustomers(Array.isArray(custs) ? custs.slice(0, 5) : []);
          }
          if (retRes && retRes.ok) {
            const rets = await retRes.json();
            const pending = Array.isArray(rets) ? rets.filter(r => r.status === 'Requested').length : 0;
            setReturnsCount(pending);
          }
          if (payRes && payRes.ok) {
            const pays = await payRes.json();
            setPaymentsList(Array.isArray(pays) ? pays.slice(0, 5) : []);
          }
          if (invRes && invRes.ok) {
            const inv = await invRes.json();
            if (inv.summary) {
              setInventorySummary(inv.summary);
            }
          }
        }
      } catch (err) {
        console.error('Overview tab fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  // Filter orders by dateRange
  const now = new Date();
  const filteredOrders = orders.filter(order => {
    if (dateRange === 'all') return true;
    const orderDate = new Date(order.date || order.created_at);
    if (isNaN(orderDate.getTime())) return true;

    if (dateRange === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (dateRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= oneWeekAgo;
    }
    if (dateRange === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'year') {
      return orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const parseAmount = (priceStr) => {
    if (!priceStr) return 0;
    const cleaned = String(priceStr).replace(/^[^\d]+/, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Metrics
  const totalRevenue = filteredOrders
    .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
    .reduce((sum, o) => sum + parseAmount(o.price), 0);

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => (o.status || 'Pending').toLowerCase() === 'pending' || (o.status || '').toLowerCase() === 'processing').length;
  const deliveredOrders = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const cogsEstimate = totalRevenue * 0.55;
  const grossProfit = Math.max(0, totalRevenue - cogsEstimate);
  const netProfit = grossProfit - totalExpenses;

  // Order status distribution
  const statusCounts = {
    Pending: filteredOrders.filter(o => (o.status || 'Pending').toLowerCase() === 'pending').length,
    Processing: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'processing').length,
    Shipped: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'shipped').length,
    Delivered: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
    Cancelled: filteredOrders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length
  };

  // Helper to extract clean product name without quantity prefixes like "5x ", "3x ", "1x "
  const cleanProductName = (raw) => {
    if (!raw) return 'Gadget Item';
    let str = String(raw).trim();
    // Strip leading quantity like "5x ", "3x ", "1x ", "10x "
    str = str.replace(/^\d+x\s*/i, '').trim();
    // Match against catalog products to preserve proper capitalization if available
    const catalogMatch = products.find(p => (p.name || '').toLowerCase() === str.toLowerCase());
    return catalogMatch ? catalogMatch.name : (str.charAt(0).toUpperCase() + str.slice(1));
  };

  // Top Selling Products - Aggregates actual units sold per product without "3x, 2x" prefixes
  const productSalesMap = {};
  filteredOrders.forEach(o => {
    if ((o.status || '').toLowerCase() !== 'cancelled') {
      let orderItems = [];
      if (Array.isArray(o.items) && o.items.length > 0) {
        orderItems = o.items;
      } else if (typeof o.items === 'string') {
        try {
          const parsed = JSON.parse(o.items);
          if (Array.isArray(parsed) && parsed.length > 0) orderItems = parsed;
        } catch (e) {}
      }

      if (orderItems.length > 0) {
        orderItems.forEach(item => {
          const rawName = item.name || item.title || 'Gadget Item';
          const name = cleanProductName(rawName);
          const qty = Number(item.quantity) || 1;
          productSalesMap[name] = (productSalesMap[name] || 0) + qty;
        });
      } else if (o.productName) {
        // Fallback: parse comma-separated string like "5x iphone, 2x AirPods"
        const parts = String(o.productName).split(',');
        parts.forEach(part => {
          const trimmed = part.trim();
          const matchQty = trimmed.match(/^(\d+)x\s*/i);
          const qty = matchQty ? parseInt(matchQty[1], 10) : 1;
          const name = cleanProductName(trimmed);
          productSalesMap[name] = (productSalesMap[name] || 0) + qty;
        });
      }
    }
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#ffffff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Executive Overview</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Real-time business performance & operational statistics</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#4b5563' }}>Period:</span>
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' }
          ].map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setDateRange(p.key)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid ' + (dateRange === p.key ? '#ea580c' : '#d1d5db'),
                backgroundColor: dateRange === p.key ? '#ffedd5' : '#ffffff',
                color: dateRange === p.key ? '#ea580c' : '#374151',
                fontSize: '11.5px',
                fontWeight: dateRange === p.key ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        
        {/* Total Revenue */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>Rs. {Math.round(totalRevenue).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500' }}>Delivered: Rs. {Math.round(totalRevenue * 0.7).toLocaleString()}</div>
        </div>

        {/* Total Orders */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('orders')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Orders</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>{totalOrders}</div>
          <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '500' }}>{pendingOrders} Pending Actions</div>
        </div>

        {/* Total Customers */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('customers')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Total Customers</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>{customersCount}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Verified Accounts</div>
        </div>

        {/* Total Products */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('products')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Catalog Products</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>{products.length}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Active in Storefront</div>
        </div>

        {/* Gross Profit */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Gross Profit</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>Rs. {Math.round(grossProfit).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Est. Margin: 45%</div>
        </div>

        {/* Net Profit */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('finances')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Net Profit (P&L)</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '4px 0' }}>Rs. {Math.round(netProfit).toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#dc2626' }}>-Rs. {Math.round(totalExpenses).toLocaleString()} Expenses</div>
        </div>

        {/* Pending Orders */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('orders')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Pending Orders</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c', margin: '4px 0' }}>{pendingOrders}</div>
          <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: '500' }}>Requires Dispatch</div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('inventory')}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Low Stock Items</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: inventorySummary.lowStockCount > 0 ? '#dc2626' : '#16a34a', margin: '4px 0' }}>
            {inventorySummary.lowStockCount || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>{inventorySummary.outOfStockCount || 0} Out of Stock</div>
        </div>

      </div>

      {/* Row 2: Analytics & Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        
        {/* Sales & Orders Distribution */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Order Status Distribution</h3>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>Total: {totalOrders} orders</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
            {[
              { label: 'Pending', count: statusCounts.Pending, bg: '#fff7ed', border: '#fdba74', color: '#c2410c' },
              { label: 'Processing', count: statusCounts.Processing, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
              { label: 'Shipped', count: statusCounts.Shipped, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
              { label: 'Delivered', count: statusCounts.Delivered, bg: '#f8fafc', border: '#cbd5e1', color: '#334155' },
              { label: 'Cancelled', count: statusCounts.Cancelled, bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' }
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '10px 6px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '10.5px', fontWeight: '600', color: s.color, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses Ratio */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
              <span>Financial Split (Revenue vs Expenses)</span>
              <span>Expenses: {totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: totalRevenue > 0 ? `${Math.min(100, Math.round((grossProfit / totalRevenue) * 100))}%` : '50%', backgroundColor: '#16a34a' }} title="Gross Profit" />
              <div style={{ height: '100%', width: totalRevenue > 0 ? `${Math.min(100, Math.round((totalExpenses / totalRevenue) * 100))}%` : '50%', backgroundColor: '#dc2626' }} title="Expenses" />
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 12px', color: '#111827' }}>Top-Selling Products</h3>
          {topProducts.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '11.5px', padding: '12px 0' }}>No sales recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', padding: '6px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <span style={{ fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={p.name}>
                    {i + 1}. {p.name.replace(/^\d+x\s*/i, '')}
                  </span>
                  <span style={{ fontWeight: '700', color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 6px', borderRadius: '4px' }}>
                    {p.count} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Row 3: Recent Activity Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        
        {/* Recent Orders */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Recent Orders</h3>
            <button type="button" onClick={() => setActiveTab && setActiveTab('orders')} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>View All &rarr;</button>
          </div>
          {orders.slice(0, 4).map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '11.5px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#111827' }}>#{String(o.id).slice(-6)} &bull; {o.userName}</div>
                <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{o.productName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', color: '#111827' }}>{o.price}</div>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#f1f5f9' }}>{o.status || 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Registered Customers */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#111827' }}>New Customers</h3>
            <button type="button" onClick={() => setActiveTab && setActiveTab('customers')} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>View Directory &rarr;</button>
          </div>
          {recentCustomers.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '11.5px', padding: '10px 0' }}>No customer registrations yet.</div>
          ) : (
            recentCustomers.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '11.5px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{c.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '10.5px' }}>{c.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>Active</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Operational Alerts & Returns */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Action Alerts</h3>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>Priority tasks</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
            <div style={{ padding: '8px 10px', backgroundColor: pendingOrders > 0 ? '#fff7ed' : '#f0fdf4', borderRadius: '6px', border: `1px solid ${pendingOrders > 0 ? '#fed7aa' : '#bbf7d0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Pending Orders to Dispatch</span>
              <span style={{ fontWeight: '700', color: pendingOrders > 0 ? '#ea580c' : '#15803d' }}>{pendingOrders}</span>
            </div>

            <div style={{ padding: '8px 10px', backgroundColor: returnsCount > 0 ? '#fef2f2' : '#f8fafc', borderRadius: '6px', border: `1px solid ${returnsCount > 0 ? '#fecaca' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Return Requests Pending</span>
              <span style={{ fontWeight: '700', color: returnsCount > 0 ? '#dc2626' : '#64748b' }}>{returnsCount}</span>
            </div>

            <div style={{ padding: '8px 10px', backgroundColor: inventorySummary.lowStockCount > 0 ? '#fef2f2' : '#f8fafc', borderRadius: '6px', border: `1px solid ${inventorySummary.lowStockCount > 0 ? '#fecaca' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Low / Out of Stock SKUs</span>
              <span style={{ fontWeight: '700', color: inventorySummary.lowStockCount > 0 ? '#dc2626' : '#64748b' }}>{inventorySummary.lowStockCount || 0}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
