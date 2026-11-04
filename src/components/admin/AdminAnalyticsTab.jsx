import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';

export default function AdminAnalyticsTab() {
  const { orders = [], products = [], expenses = [] } = useStore();
  const [filterPeriod, setFilterPeriod] = useState('all');

  const parsePrice = (str) => {
    if (!str) return 0;
    const cleaned = String(str).replace(/^[^\d]+/, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Filter orders by selected period
  const now = new Date();
  const filteredOrders = orders.filter(o => {
    if (filterPeriod === 'all') return true;
    const orderDate = new Date(o.date || o.created_at || now);
    const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
    if (filterPeriod === 'weekly') return diffDays <= 7;
    if (filterPeriod === 'monthly') return diffDays <= 30;
    return true;
  });

  const totalSales = filteredOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled').reduce((sum, o) => sum + parsePrice(o.price), 0);
  const deliveredSales = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').reduce((sum, o) => sum + parsePrice(o.price), 0);
  const totalOrdersCount = filteredOrders.length;
  const deliveredOrdersCount = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const cancelledOrdersCount = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  const returnRate = totalOrdersCount > 0 ? ((cancelledOrdersCount / totalOrdersCount) * 100).toFixed(1) : 0;

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const estCogs = deliveredSales * 0.55;
  const grossProfit = Math.max(0, deliveredSales - estCogs);
  const netProfit = grossProfit - totalExpenseAmount;

  // Robust category resolver to accurately match items to catalog or product names
  const resolveCategory = (itemOrName) => {
    if (!itemOrName) return 'Accessories';
    if (typeof itemOrName === 'object' && itemOrName.category) return itemOrName.category;

    const rawName = typeof itemOrName === 'string' ? itemOrName : (itemOrName.name || itemOrName.title || '');
    const cleanName = rawName.replace(/^\d+x\s*/i, '').trim().toLowerCase();

    // 1. Direct ID match in products catalog
    if (typeof itemOrName === 'object' && itemOrName.id) {
      const matchById = products.find(p => Number(p.id) === Number(itemOrName.id));
      if (matchById && matchById.category) return matchById.category;
    }

    // 2. Direct or substring name match in catalog
    const matchByName = products.find(p => {
      const pName = (p.name || '').trim().toLowerCase();
      return pName === cleanName || (cleanName && pName.includes(cleanName)) || (pName && cleanName.includes(pName));
    });
    if (matchByName && matchByName.category) return matchByName.category;

    // 3. Smart device & accessories keyword detection
    if (/iphone|samsung|pixel|phone|mobile|oneplus|xiaomi|redmi|oppo|vivo|realme|infinix/i.test(cleanName)) {
      return 'Mobiles';
    }
    if (/airpod|earbud|headphone|speaker|audio|sound|buds|mic|handsfree/i.test(cleanName)) {
      return 'Audio';
    }
    if (/watch|band|wearable|fitbit/i.test(cleanName)) {
      return 'Wearables';
    }
    if (/case|cover|glass|protector|charger|cable|adapter|stand|powerbank|magsafe/i.test(cleanName)) {
      return 'Accessories';
    }
    return 'Accessories';
  };

  // Category sales breakdown
  const categoryMap = {};
  const activeOrders = filteredOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');

  activeOrders.forEach(o => {
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
        const cat = resolveCategory(item);
        const itemQty = Number(item.quantity) || 1;
        const itemPrice = parsePrice(item.price);
        const itemRevenue = itemPrice * itemQty;
        const rev = itemRevenue > 0 ? itemRevenue : (parsePrice(o.price) / orderItems.length);
        categoryMap[cat] = (categoryMap[cat] || 0) + rev;
      });
    } else {
      const cat = resolveCategory(o.productName);
      categoryMap[cat] = (categoryMap[cat] || 0) + parsePrice(o.price);
    }
  });

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>Analytics & Reports</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>Comprehensive sales metrics, profit & loss reconciliation, and product category performance</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'monthly', 'weekly'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPeriod(p)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid ' + (filterPeriod === p ? 'var(--orange, #ea580c)' : '#d1d5db'),
                backgroundColor: filterPeriod === p ? 'var(--orange, #ea580c)' : '#ffffff',
                color: filterPeriod === p ? '#ffffff' : '#374151',
                fontSize: '11.5px',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Total Gross Bookings</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>Rs. {Math.round(totalSales).toLocaleString()}</div>
          <span style={{ fontSize: '10.5px', color: '#6b7280' }}>{totalOrdersCount} Total Orders Placed</span>
        </div>

        <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Delivered & Collected Sales</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>Rs. {Math.round(deliveredSales).toLocaleString()}</div>
          <span style={{ fontSize: '10.5px', color: '#6b7280' }}>{deliveredOrdersCount} Successfully Delivered</span>
        </div>

        <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Net Profit (After COGS & Exp)</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>Rs. {Math.round(netProfit).toLocaleString()}</div>
          <span style={{ fontSize: '10.5px', color: '#6b7280' }}>Expenses: Rs. {Math.round(totalExpenseAmount).toLocaleString()}</span>
        </div>

        <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Cancellation & Return Rate</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>{returnRate}%</div>
          <span style={{ fontSize: '10.5px', color: '#6b7280' }}>{cancelledOrdersCount} Cancelled Orders</span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontWeight: '700', fontSize: '12px', color: '#111827' }}>
          Sales Breakdown by Product Category
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: '600' }}>Revenue Generated</th>
              <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: '600' }}>Share of Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryMap).length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>No sales data available yet.</td>
              </tr>
            ) : (
              Object.entries(categoryMap).map(([cat, rev]) => {
                const share = totalSales > 0 ? ((rev / totalSales) * 100).toFixed(1) : 0;
                return (
                  <tr key={cat} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', color: '#111827' }}>{cat}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#16a34a' }}>Rs. {Math.round(rev).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', color: '#4b5563' }}>{share}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
