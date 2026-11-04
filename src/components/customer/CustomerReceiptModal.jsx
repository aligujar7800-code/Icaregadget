import React from 'react';

export default function CustomerReceiptModal({ order, user, storeDetails, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    const printElement = document.getElementById('printable-receipt');
    if (!printElement) {
      window.print();
      return;
    }

    // Isolate printing inside an invisible iframe to print exactly 1 copy without parent document repetition
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
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Order #${order.id || ''}</title>
          <style>
            @page {
              size: auto;
              margin: 8mm 8mm;
            }
            * {
              box-sizing: border-box;
            }
            :root {
              --orange: #ea580c;
            }
            html, body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #printable-receipt {
              width: 100% !important;
              max-width: 100% !important;
              padding: 4px 6px !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${printElement.outerHTML}
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
    }, 200);
  };

  const parseNum = (val) => {
    if (!val) return 0;
    const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  };

  const grandTotal = parseNum(order.price || order.total);
  const items = order.items && order.items.length > 0
    ? order.items
    : [{ name: order.productName || 'Gadget Order', quantity: 1, price: order.price }];

  // Calculate sum of items (quantity * unit price)
  const calculatedItemsSubtotal = items.reduce((acc, it) => {
    const qty = parseInt(it.quantity || 1, 10) || 1;
    const unitPrice = parseNum(it.price || order.price);
    return acc + (qty * unitPrice);
  }, 0);

  // Resolve subtotal: prefer order.subtotal if valid, otherwise use items sum
  const rawSubtotal = parseNum(order.subtotal);
  const subtotal = (rawSubtotal > 0 && rawSubtotal >= grandTotal)
    ? rawSubtotal
    : (calculatedItemsSubtotal > 0 ? calculatedItemsSubtotal : grandTotal);

  // Resolve discount: check order.discountAmount / order.discount_amount or infer difference
  const rawDiscount = parseNum(order.discountAmount || order.discount_amount);
  const discountAmount = rawDiscount > 0
    ? rawDiscount
    : Math.max(0, subtotal - grandTotal);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 99999
      }}
    >
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm 8mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            max-height: 100vh !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 4px 6px !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
        className="receipt-modal-content"
      >
        {/* Top Control Bar (Hidden during print) */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Official Purchase Receipt</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: 'var(--orange, #ea580c)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* ================= PRINTABLE RECEIPT BODY ================= */}
        <div style={{ padding: '32px 36px', color: '#0f172a' }} id="printable-receipt">
          
          {/* Store Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', color: '#0f172a' }}>
                  I CARE <span style={{ color: 'var(--orange, #ea580c)' }}>GADGET</span>
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Premium Gadgets, Original Chargers & Authentic Accessories
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Phone / WhatsApp: +92 319 0229789 &bull; Web: icaregadget.com
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--orange, #ea580c)' }}>
                INVOICE
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                #{order.id}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Date: {order.date || new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Billing & Order Meta Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '24px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                Billed To
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>
                {order.userName || user?.name || 'Valued Customer'}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '2px' }}>
                {order.userEmail || user?.email}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#475569' }}>
                {order.phone || user?.phone || 'Phone verified'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                Shipping Destination & Payment
              </div>
              <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: '1.4' }}>
                {order.shippingAddress || user?.address || 'Standard Delivery Address'}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1'
                }}>
                  {order.paymentMethod || 'Cash on Delivery'}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: (order.status || '').toLowerCase() === 'delivered' ? '#dcfce7' : '#fef3c7',
                  color: (order.status || '').toLowerCase() === 'delivered' ? '#15803d' : '#b45309'
                }}>
                  Status: {order.status || 'Pending'}
                </span>
              </div>
              {order.trackingNumber && (
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                  Courier: <strong>{order.courier || 'Partner'}</strong> (CN: {order.trackingNumber})
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div style={{ marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '10px 12px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>#</th>
                  <th style={{ padding: '10px 12px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Item Description</th>
                  <th style={{ padding: '10px 12px', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px 12px', fontSize: '0.8rem', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const qty = parseInt(it.quantity || 1, 10) || 1;
                  const unitPrice = parseNum(it.price || order.price);
                  const rowTotal = qty * unitPrice;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '0.825rem', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a' }}>{it.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Authentic Original Gadget &bull; Verified Stock</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>{qty}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', textAlign: 'right', color: '#475569' }}>Rs. {unitPrice.toLocaleString()}</td>
                      <td style={{ padding: '12px', fontSize: '0.875rem', fontWeight: '700', textAlign: 'right', color: '#0f172a' }}>Rs. {rowTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Shipping / Courier:</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>FREE</span>
              </div>
              {discountAmount > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803d', fontWeight: '700' }}>
                  <span>Discount / Promo{order.couponCode ? ` (${order.couponCode})` : ''}:</span>
                  <span>- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Discount / Promo:</span>
                  <span>Rs. 0</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid #0f172a',
                fontSize: '1.15rem',
                fontWeight: '900',
                color: '#0f172a'
              }}>
                <span>Total Payable:</span>
                <span style={{ color: 'var(--orange, #ea580c)' }}>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Stamp */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '20px',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div>
              <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Warranty & Support Guarantee</div>
              <div>&bull; 7-day hassle-free replacement warranty on manufacturing faults.</div>
              <div>&bull; Original packaging and invoice receipt required for warranty claims.</div>
              <div>&bull; For immediate support, WhatsApp our help desk at +92 319 0229789.</div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{
                display: 'inline-block',
                border: '2px solid #15803d',
                color: '#15803d',
                borderRadius: '8px',
                padding: '4px 10px',
                fontWeight: '800',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transform: 'rotate(-4deg)'
              }}>
                ✓ VERIFIED ORIGINAL
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>
                I Care Gadget Store
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
