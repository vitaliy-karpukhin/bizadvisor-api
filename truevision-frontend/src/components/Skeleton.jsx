import React from 'react';

export default function Skeleton({ width = '100%', height = '16px', radius = '8px', style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
  );
}

export function SkeletonCard({ children, style = {} }) {
  return (
    <div style={{
      background: '#151B28', border: '1px solid #1E2530',
      borderRadius: '16px', padding: '1.25rem', ...style,
    }}>
      {children}
    </div>
  );
}
