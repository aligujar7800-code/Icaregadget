export const COURIER_OPTIONS = [
  'PostEx',
  'TCS',
  'Leopards',
  'Trax',
  'Call Courier',
  'M&P',
  'Blue-EX',
  'Other'
];

export const getCourierTrackingUrl = (courier = '', trackingNumber = '') => {
  if (!trackingNumber) return null;
  const c = String(courier).toLowerCase().trim();
  const tn = encodeURIComponent(String(trackingNumber).trim());

  if (c.includes('postex')) {
    return `https://postex.pk/tracking?tracking_number=${tn}`;
  }
  if (c.includes('tcs')) {
    return `https://www.tcsexpress.com/track/${tn}`;
  }
  if (c.includes('leopard')) {
    return `https://leopardscourier.com/tracking?track_numbers=${tn}`;
  }
  if (c.includes('trax')) {
    return `https://trax.pk/tracking?tracking_no=${tn}`;
  }
  if (c.includes('call courier') || c.includes('callcourier')) {
    return `https://cod.callcourier.com.pk/Booking/AfterSavePrint/${tn}`;
  }
  if (c.includes('m&p') || c.includes('muller') || c.includes('mp')) {
    return `https://mulphilog.com/tracking?consignment=${tn}`;
  }
  if (c.includes('blue')) {
    return `https://www.blue-ex.com/tracking?trackno=${tn}`;
  }
  return null;
};

export const getCourierBrandStyle = (courier = '') => {
  const c = String(courier).toLowerCase().trim();
  if (c.includes('postex')) {
    return { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9', icon: '🟣' };
  }
  if (c.includes('tcs')) {
    return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', icon: '🔴' };
  }
  if (c.includes('leopard')) {
    return { bg: '#fefce8', border: '#fef08a', text: '#854d0e', icon: '🟡' };
  }
  if (c.includes('trax')) {
    return { bg: '#fff7ed', border: '#ffedd5', text: '#c2410c', icon: '🟠' };
  }
  if (c.includes('call courier') || c.includes('callcourier')) {
    return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', icon: '🟢' };
  }
  if (c.includes('m&p') || c.includes('muller')) {
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: '🔵' };
  }
  return { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155', icon: '📦' };
};
