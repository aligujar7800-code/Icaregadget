import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export default function AdminFinancesTab() {
  const { 
    orders = [], 
    expenses = [], 
    addExpense, 
    deleteExpense, 
    products = [],
    getAccountingSummary 
  } = useStore();

  const [accountingSummary, setAccountingSummary] = useState(null);
  const [returns, setReturns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'orders' | 'delivered' | 'refunds' | 'expenses' | 'settlements'
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all'); // 'all' | 'bank' | 'cash'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'month' | 'week'

  // Right-side Action Panel states
  const [actionTab, setActionTab] = useState('expense'); // 'expense' | 'settlement'

  // Log Expense form state
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState('Marketing & Ads');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidFrom, setExpensePaidFrom] = useState('Cash in Hand');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);

  // COD Settlement form state
  const [courierName, setCourierName] = useState('PostEx');
  const [settleAmount, setSettleAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState('Bank Account');
  const [refNumber, setRefNumber] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Fetch accounting summary, refunds, and payments
  const fetchAllFinancialData = async () => {
    try {
      setLoading(true);
      const [accRes, retRes, payRes] = await Promise.all([
        getAccountingSummary ? getAccountingSummary().catch(() => null) : fetch('/api/accounting-summary').then(r => r.json()).catch(() => null),
        fetch('/api/returns').then(r => r.json()).catch(() => []),
        fetch('/api/payments').then(r => r.json()).catch(() => [])
      ]);

      if (accRes && accRes.success) {
        setAccountingSummary(accRes);
      }
      setReturns(Array.isArray(retRes) ? retRes : []);
      setPayments(Array.isArray(payRes) ? payRes : []);
    } catch (err) {
      console.error('Error fetching unified financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFinancialData();
  }, [orders.length, expenses.length]);

  const parseNum = (str) => {
    if (!str) return 0;
    const cleaned = String(str).replace(/^[^\d]+/, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Helper to format currency
  const fmt = (val) => Number(val || 0).toLocaleString();

  // Handle Log Expense submission
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) return alert('Enter a valid expense amount');
    try {
      setIsLoggingExpense(true);
      await addExpense({
        date: expenseDate,
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        paidFrom: expensePaidFrom,
        supplierName: expenseSupplier.trim(),
        note: expenseNote.trim()
      });
      setExpenseAmount('');
      setExpenseNote('');
      setExpenseSupplier('');
      await fetchAllFinancialData();
    } catch (err) {
      console.error('Failed to log expense:', err);
      alert('Failed to log expense');
    } finally {
      setIsLoggingExpense(false);
    }
  };

  // Handle Courier Settlement submission
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    if (!settleAmount || parseFloat(settleAmount) <= 0) return alert('Enter a valid settlement amount');
    try {
      setIsSettling(true);
      const res = await fetch('/api/payments/cod-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierName,
          amount: parseFloat(settleAmount),
          depositAccount,
          referenceNumber: refNumber || `SETTLE-${Date.now()}`,
          note: settleNote
        })
      });
      if (res.ok) {
        setSettleAmount('');
        setRefNumber('');
        setSettleNote('');
        alert('Courier COD settlement recorded successfully!');
        await fetchAllFinancialData();
      }
    } catch (err) {
      console.error('Settlement error:', err);
    } finally {
      setIsSettling(false);
    }
  };

  // Build the Unified Master Financial Ledger
  const now = new Date();
  const masterLedger = [];

  // 1. Orders (Sales & Collections)
  orders.forEach(o => {
    const rawPrice = parseNum(o.price);
    const st = (o.status || 'Pending').toLowerCase();
    const isDelivered = st === 'delivered';
    const isCancelled = st === 'cancelled';
    const orderDate = new Date(o.date || o.created_at || now);

    let badge = { label: `Order ${o.status || 'Pending'}`, bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    if (isDelivered) {
      badge = { label: 'Order Delivered', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    } else if (isCancelled) {
      badge = { label: 'Order Cancelled', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    }

    masterLedger.push({
      id: `ord-${o.id}`,
      rawDate: isNaN(orderDate.getTime()) ? now : orderDate,
      dateFormatted: o.date || (isNaN(orderDate.getTime()) ? 'Recent' : orderDate.toLocaleDateString()),
      type: 'order',
      subType: isDelivered ? 'delivered' : (isCancelled ? 'cancelled' : 'pending'),
      badge,
      title: `Order #${o.id} • ${o.productName || 'Purchase'}`,
      description: Array.isArray(o.items) && o.items.length > 0 
        ? o.items.map(it => `${it.quantity || 1}x ${it.name}`).join(', ')
        : (o.productName || 'Product items'),
      entity: o.userName || 'Customer',
      account: o.paymentMethod || 'Cash on Delivery',
      inflow: isDelivered ? rawPrice : 0,
      outflow: 0,
      pendingAmount: !isDelivered && !isCancelled ? rawPrice : 0,
      status: o.status || 'Pending',
      original: o
    });
  });

  // 2. Refunds (from returns_refunds)
  returns.filter(r => (r.status || '').toLowerCase() === 'refunded' || Number(r.refund_amount) > 0).forEach(r => {
    const rDate = new Date(r.updated_at || r.created_at || now);
    const amt = Number(r.refund_amount) || 0;

    masterLedger.push({
      id: `ref-${r.id}`,
      rawDate: isNaN(rDate.getTime()) ? now : rDate,
      dateFormatted: isNaN(rDate.getTime()) ? 'Recent' : rDate.toLocaleDateString(),
      type: 'refund',
      subType: 'refund',
      badge: { label: 'Refund Issued', bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
      title: `Refund for Order #${r.order_id}`,
      description: r.admin_notes || r.reason || `Refund processed for ${r.product_details || 'item'}`,
      entity: r.user_name || 'Customer',
      account: 'Bank Account (Payout)',
      inflow: 0,
      outflow: amt,
      pendingAmount: 0,
      status: 'Refunded',
      original: r
    });
  });

  // 3. Operating Expenses
  expenses.forEach(exp => {
    const eDate = new Date(exp.date || now);
    const amt = Number(exp.amount) || 0;

    masterLedger.push({
      id: `exp-${exp.id}`,
      rawDate: isNaN(eDate.getTime()) ? now : eDate,
      dateFormatted: exp.date || (isNaN(eDate.getTime()) ? 'Recent' : eDate.toLocaleDateString()),
      type: 'expense',
      subType: 'expense',
      badge: { label: exp.category || 'Expense', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
      title: `${exp.category} Spend`,
      description: exp.note || (exp.supplierName ? `Vendor: ${exp.supplierName}` : `${exp.category} operating cost`),
      entity: exp.supplierName || exp.category || 'Vendor',
      account: exp.paidFrom || 'Cash in Hand',
      inflow: 0,
      outflow: amt,
      pendingAmount: 0,
      status: 'Paid',
      original: exp
    });
  });

  // 4. Financial Transactions (Courier Settlements)
  payments.filter(p => p.transaction_type !== 'Refund').forEach(p => {
    const pDate = new Date(p.created_at || now);
    const amt = Number(p.amount) || 0;

    masterLedger.push({
      id: `pay-${p.id}`,
      rawDate: isNaN(pDate.getTime()) ? now : pDate,
      dateFormatted: isNaN(pDate.getTime()) ? 'Recent' : pDate.toLocaleDateString(),
      type: 'settlement',
      subType: 'settlement',
      badge: { label: p.transaction_type || 'COD Settlement', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
      title: `${p.transaction_type || 'Settlement'} • Ref ${p.transaction_ref || p.id}`,
      description: p.note || `Courier payout deposit (${p.payment_method || 'Bank Transfer'})`,
      entity: p.transaction_ref || 'Courier Partner',
      account: p.account || 'Bank Account',
      inflow: amt,
      outflow: 0,
      pendingAmount: 0,
      status: p.status || 'Completed',
      original: p
    });
  });

  // Sort master ledger newest first
  masterLedger.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Filter master ledger by category pills, accounts, period, and search query
  const filteredLedger = masterLedger.filter(item => {
    // 1. Period Filter
    if (periodFilter !== 'all') {
      const diffDays = (now - item.rawDate) / (1000 * 60 * 60 * 24);
      if (periodFilter === 'week' && diffDays > 7) return false;
      if (periodFilter === 'month' && diffDays > 30) return false;
    }

    // 2. Type Filter
    if (activeFilter === 'orders' && item.type !== 'order') return false;
    if (activeFilter === 'delivered' && item.subType !== 'delivered') return false;
    if (activeFilter === 'refunds' && item.type !== 'refund') return false;
    if (activeFilter === 'expenses' && item.type !== 'expense') return false;
    if (activeFilter === 'settlements' && item.type !== 'settlement') return false;

    // 3. Account Filter
    if (accountFilter === 'bank' && !item.account.toLowerCase().includes('bank')) return false;
    if (accountFilter === 'cash' && !item.account.toLowerCase().includes('cash')) return false;

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchEntity = item.entity.toLowerCase().includes(q);
      const matchAccount = item.account.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchEntity && !matchAccount) return false;
    }

    return true;
  });

  // Calculations for current executive snapshot
  const totalGrossBookings = orders.filter(o => (o.status || '').toLowerCase() !== 'cancelled').reduce((sum, o) => sum + parseNum(o.price), 0);
  const totalDeliveredRevenue = accountingSummary?.deliveredRevenue || orders.filter(o => (o.status || '').toLowerCase() === 'delivered').reduce((sum, o) => sum + parseNum(o.price), 0);
  const totalDeliveredCOGS = accountingSummary?.deliveredCOGS || 0;
  const totalRefunds = accountingSummary?.totalRefunds || returns.filter(r => (r.status || '').toLowerCase() === 'refunded').reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);
  const totalOperatingExpenses = accountingSummary?.totalExpenses || expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const grossProfit = Math.max(0, totalDeliveredRevenue - totalDeliveredCOGS - totalRefunds);
  const netProfit = grossProfit - totalOperatingExpenses;
  const grossMargin = totalDeliveredRevenue > 0 ? ((grossProfit / totalDeliveredRevenue) * 100).toFixed(1) : 0;

  // Print Financial Statement in an isolated clean document
  const handlePrintStatement = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const printDate = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const rowsHtml = filteredLedger.map((row, idx) => {
      const inflowText = row.inflow > 0 ? `+ PKR ${Number(row.inflow).toLocaleString()}` : (row.pendingAmount > 0 ? `(PKR ${Number(row.pendingAmount).toLocaleString()})` : '—');
      const outflowText = row.outflow > 0 ? `- PKR ${Number(row.outflow).toLocaleString()}` : '—';
      const inflowColor = row.inflow > 0 ? '#15803d' : '#94a3b8';
      const outflowColor = row.outflow > 0 ? '#dc2626' : '#94a3b8';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 7px 10px; font-size: 11px; color: #475569; white-space: nowrap;">${row.dateFormatted}</td>
          <td style="padding: 7px 10px; font-size: 11px; white-space: nowrap;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 10px; background-color: ${row.badge.bg}; color: ${row.badge.color}; border: 1px solid ${row.badge.border};">
              ${row.badge.label}
            </span>
          </td>
          <td style="padding: 7px 10px; font-size: 11px;">
            <div style="font-weight: 700; color: #0f172a;">${row.title}</div>
            <div style="font-size: 10px; color: #64748b;">${row.description}</div>
          </td>
          <td style="padding: 7px 10px; font-size: 11px; color: #334155;">${row.entity}</td>
          <td style="padding: 7px 10px; font-size: 11px; color: #64748b;">${row.account}</td>
          <td style="padding: 7px 10px; font-size: 11px; text-align: right; font-weight: 700; color: ${inflowColor}; white-space: nowrap;">${inflowText}</td>
          <td style="padding: 7px 10px; font-size: 11px; text-align: right; font-weight: 700; color: ${outflowColor}; white-space: nowrap;">${outflowText}</td>
        </tr>
      `;
    }).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial & Order Statement - I CARE</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 10mm;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .statement-wrap {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
          </style>
        </head>
        <body>
          <div class="statement-wrap">
            
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">
              <div>
                <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.5px; color: #ea580c; display: flex; align-items: center; gap: 6px;">
                  I CARE
                  <span style="font-size: 12px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 99px;">Financial Audit Report</span>
                </div>
                <div style="font-size: 11px; color: #475569; margin-top: 3px;">
                  Official Master Statement: Orders, Delivered Collections, Refunds & Expenses
                </div>
              </div>
              <div style="text-align: right; font-size: 11px; color: #64748b;">
                <div><strong>Generated:</strong> ${printDate}</div>
                <div><strong>Filter:</strong> ${activeFilter.toUpperCase()} • ${accountFilter.toUpperCase()}</div>
                <div><strong>Total Entries:</strong> ${filteredLedger.length} Records</div>
              </div>
            </div>

            <!-- Executive Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #15803d; text-transform: uppercase;">Delivered Revenue</div>
                <div style="font-size: 14px; font-weight: 800; color: #14532d; margin-top: 3px;">PKR ${fmt(totalDeliveredRevenue)}</div>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Wholesale COGS</div>
                <div style="font-size: 14px; font-weight: 800; color: #334155; margin-top: 3px;">PKR ${fmt(totalDeliveredCOGS)}</div>
              </div>

              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #b91c1c; text-transform: uppercase;">Refunds Deducted</div>
                <div style="font-size: 14px; font-weight: 800; color: #991b1b; margin-top: 3px;">- PKR ${fmt(totalRefunds)}</div>
              </div>

              <div style="background: #fdf4ff; border: 1px solid #f0abfc; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #86198f; text-transform: uppercase;">Operating Expenses</div>
                <div style="font-size: 14px; font-weight: 800; color: #701a75; margin-top: 3px;">PKR ${fmt(totalOperatingExpenses)}</div>
              </div>

              <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 9.5px; font-weight: 700; color: #c2410c; text-transform: uppercase;">Net Profit</div>
                <div style="font-size: 14px; font-weight: 900; color: #9a3412; margin-top: 3px;">PKR ${fmt(netProfit)}</div>
              </div>
            </div>

            <!-- Ledger Table -->
            <table style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff;">
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase;">Date</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase;">Type</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase;">Ref & Description</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase;">Customer / Vendor</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase;">Account</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: right; text-transform: uppercase;">Inflow (+)</th>
                  <th style="padding: 8px 10px; font-size: 10px; font-weight: 700; text-align: right; text-transform: uppercase;">Outflow (-)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94a3b8;">No transactions found</td></tr>'}
              </tbody>
            </table>

            <!-- Footer -->
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
              <div>Official I CARE Ledger Report • System Verified</div>
              <div>Page 1 of 1</div>
            </div>

          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (err) {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ===== 1. EXECUTIVE FINANCIAL HEALTH SUMMARY ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        
        {/* Delivered Collections (Inflow) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d' }}></span>
            Delivered Sales (Cash In)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
            PKR {fmt(totalDeliveredRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            Gross Orders: PKR {fmt(totalGrossBookings)}
          </div>
        </div>

        {/* COGS Wholesale Cost */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Cost of Goods (COGS)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
            PKR {fmt(totalDeliveredCOGS)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            Direct product purchase cost
          </div>
        </div>

        {/* Total Refunds Issued */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b91c1c' }}></span>
            Refunds Deducted
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#b91c1c', marginTop: '6px' }}>
            - PKR {fmt(totalRefunds)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            {returns.filter(r => (r.status || '').toLowerCase() === 'refunded').length} approved return refunds
          </div>
        </div>

        {/* Operating Expenses */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Operating Expenses
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '6px' }}>
            PKR {fmt(totalOperatingExpenses)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            {expenses.length} logged expenses (Ads/Rent/Courier)
          </div>
        </div>

        {/* Net Operational Profit */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '10.5px', fontWeight: '700', color: netProfit >= 0 ? '#ea580c' : '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Net Operational Profit
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: netProfit >= 0 ? '#111827' : '#b91c1c', marginTop: '6px' }}>
            PKR {fmt(netProfit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            Margin: <strong>{grossMargin}%</strong> (Revenue - COGS - Exp - Refunds)
          </div>
        </div>

      </div>

      {/* ===== 2. MAIN WORKSPACE: UNIFIED STATEMENT (LEFT) + ACTION PANEL (RIGHT) ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: THE MASTER FINANCIAL & ORDERS STATEMENT */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '18px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#111827' }}>
                Unified Financial & Order Statement
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#6b7280' }}>
                Single centralized ledger consolidating sales, delivered collections, approved refunds, expenses, and settlements.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handlePrintStatement}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Print Statement</span>
              </button>
              <button
                type="button"
                onClick={fetchAllFinancialData}
                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Search, Filter Tabs & Account Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            
            {/* Top row: Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: `All Activity (${masterLedger.length})` },
                { id: 'delivered', label: 'Delivered Sales (+)' },
                { id: 'orders', label: `All Orders (${orders.length})` },
                { id: 'refunds', label: `Refunds (${returns.filter(r => (r.status || '').toLowerCase() === 'refunded').length})` },
                { id: 'expenses', label: `Expenses (${expenses.length})` },
                { id: 'settlements', label: `COD Settlements (${payments.filter(p => p.transaction_type !== 'Refund').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: '1px solid ' + (activeFilter === f.id ? 'var(--orange, #ea580c)' : '#e2e8f0'),
                    backgroundColor: activeFilter === f.id ? 'var(--orange, #ea580c)' : '#f8fafc',
                    color: activeFilter === f.id ? '#ffffff' : '#475569',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Bottom row: Search input + Account dropdown + Period tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Search */}
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Search by ID, customer, note..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 26px 6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '11.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '11px' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Account & Period Dropdowns */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={accountFilter}
                  onChange={e => setAccountFilter(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="all">All Accounts (Cash + Bank)</option>
                  <option value="bank">Bank Account Only</option>
                  <option value="cash">Cash in Hand Only</option>
                </select>

                <select
                  value={periodFilter}
                  onChange={e => setPeriodFilter(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="all">All Time</option>
                  <option value="month">Last 30 Days</option>
                  <option value="week">Last 7 Days</option>
                </select>
              </div>

            </div>

          </div>

          {/* Master Table */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
              Consolidating master financial records...
            </div>
          ) : filteredLedger.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
              No matching records found in this view.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '9px 10px', color: '#64748b', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '9px 10px', color: '#64748b', fontWeight: '600' }}>Event / Type</th>
                    <th style={{ padding: '9px 10px', color: '#64748b', fontWeight: '600' }}>Reference & Description</th>
                    <th style={{ padding: '9px 10px', color: '#64748b', fontWeight: '600' }}>Customer / Payee</th>
                    <th style={{ padding: '9px 10px', color: '#64748b', fontWeight: '600' }}>Account</th>
                    <th style={{ padding: '9px 10px', color: '#15803d', fontWeight: '600', textAlign: 'right' }}>Inflow (+)</th>
                    <th style={{ padding: '9px 10px', color: '#b91c1c', fontWeight: '600', textAlign: 'right' }}>Outflow (-)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      
                      {/* Date */}
                      <td style={{ padding: '9px 10px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {row.dateFormatted}
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          backgroundColor: row.badge.bg,
                          color: row.badge.color,
                          border: `1px solid ${row.badge.border}`
                        }}>
                          {row.badge.label}
                        </span>
                      </td>

                      {/* Ref & Description */}
                      <td style={{ padding: '9px 10px', maxWidth: '240px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{row.title}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.description}
                        </div>
                      </td>

                      {/* Customer / Entity */}
                      <td style={{ padding: '9px 10px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {row.entity}
                      </td>

                      {/* Account */}
                      <td style={{ padding: '9px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {row.account}
                      </td>

                      {/* Inflow (+) */}
                      <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {row.inflow > 0 ? (
                          <span style={{ fontWeight: '700', color: '#16a34a' }}>
                            + PKR {fmt(row.inflow)}
                          </span>
                        ) : row.pendingAmount > 0 ? (
                          <span style={{ fontSize: '10.5px', color: '#b45309' }} title="Pending Delivery">
                            (PKR {fmt(row.pendingAmount)})
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Outflow (-) */}
                      <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {row.outflow > 0 ? (
                          <span style={{ fontWeight: '700', color: '#dc2626' }}>
                            - PKR {fmt(row.outflow)}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INTEGRATED FINANCIAL ACTION HUB */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card: Actions (Log Expense OR Record Settlement) */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            
            {/* Toggle header between Expense and COD Settlement */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActionTab('expense')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: actionTab === 'expense' ? '#111827' : '#f1f5f9',
                  color: actionTab === 'expense' ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Log Expense
              </button>
              <button
                type="button"
                onClick={() => setActionTab('settlement')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: actionTab === 'settlement' ? '#15803d' : '#f1f5f9',
                  color: actionTab === 'settlement' ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + COD Payout
              </button>
            </div>

            {/* TAB A: LOG EXPENSE FORM */}
            {actionTab === 'expense' && (
              <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Fast Preset Chips */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {[
                    { label: 'Meta Ads', cat: 'Marketing & Ads', src: 'Bank Account' },
                    { label: 'Courier', cat: 'Courier Fees', src: 'Cash in Hand' },
                    { label: 'Packaging', cat: 'Packaging', src: 'Cash in Hand' },
                    { label: 'Rent/Bills', cat: 'Rent & Bills', src: 'Bank Account' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setExpenseCategory(p.cat);
                        setExpensePaidFrom(p.src);
                      }}
                      style={{ padding: '2px 7px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '10.5px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Date</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Paid From</label>
                    <select
                      value={expensePaidFrom}
                      onChange={e => setExpensePaidFrom(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="Marketing & Ads">Marketing & Meta/TikTok Ads</option>
                    <option value="Courier Fees">Courier Freight & RTO Charges</option>
                    <option value="Packaging">Packaging Bags & Tape</option>
                    <option value="Rent & Bills">Shop Rent & Utilities</option>
                    <option value="Supplier Payment">Supplier Stock Payment</option>
                    <option value="Salaries">Staff Salaries & Wages</option>
                    <option value="Other">Miscellaneous / Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Amount (PKR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Description / Vendor Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Meta ad campaign recharge"
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingExpense}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#111827', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                >
                  {isLoggingExpense ? 'Saving...' : 'Record Expense Entry'}
                </button>
              </form>
            )}

            {/* TAB B: RECORD COURIER COD SETTLEMENT FORM */}
            {actionTab === 'settlement' && (
              <form onSubmit={handleSettlementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Courier Partner</label>
                  <select
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#fff' }}
                  >
                    <option value="PostEx">PostEx</option>
                    <option value="Trax">Trax Logistics</option>
                    <option value="Leopards">Leopards Courier</option>
                    <option value="TCS">TCS Express</option>
                    <option value="Call Courier">Call Courier</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Amount (PKR) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={settleAmount}
                      onChange={e => setSettleAmount(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Deposit Account</label>
                    <select
                      value={depositAccount}
                      onChange={e => setDepositAccount(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', backgroundColor: '#fff' }}
                    >
                      <option value="Bank Account">Bank Account</option>
                      <option value="Cash in Hand">Cash in Hand</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Payment Reference / TXN #</label>
                  <input
                    type="text"
                    placeholder="e.g. TR-948210 / PostEx Payout"
                    value={refNumber}
                    onChange={e => setRefNumber(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '3px' }}>Internal Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly COD settlement received"
                    value={settleNote}
                    onChange={e => setSettleNote(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSettling}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#15803d', color: '#ffffff', border: 'none', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                >
                  {isSettling ? 'Recording...' : 'Deposit Settlement'}
                </button>
              </form>
            )}

          </div>

          {/* Supplier Directory Quick Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 10px 0', color: '#111827' }}>
              Wholesale Catalog & COGS Valuation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>Active Products in Catalog:</span>
                <strong>{products.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span>Inventory Valuation:</span>
                <strong>PKR {fmt(products.reduce((acc, p) => acc + (parseNum(p.costPrice) * (Number(p.stock) || 0)), 0))}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span>Delivered Wholesale COGS:</span>
                <strong style={{ color: '#ea580c' }}>PKR {fmt(totalDeliveredCOGS)}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
