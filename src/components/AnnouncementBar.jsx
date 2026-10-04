import React from 'react';
import { Truck, Package, ShieldCheck } from 'lucide-react';

export default function AnnouncementBar() {
  const items = [
    { icon: Truck, text: 'Free delivery on orders over Rs. 5,000' },
    { icon: Package, text: 'Cash on Delivery Available' },
    { icon: ShieldCheck, text: '6-Month Warranty on All Products' },
  ];

  // Repeat items for seamless, continuous marquee looping
  const loopItems = [...items, ...items, ...items, ...items];

  return (
    <div className="announcement-bar" role="region" aria-label="Announcements">
      <div className="announcement-bar__track">
        {loopItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <span key={index} className="announcement-bar__item">
              <Icon className="announcement-bar__icon" size={14} strokeWidth={2} />
              <span>{item.text}</span>
              <span className="announcement-bar__divider">•</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
