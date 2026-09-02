import React, { useRef } from 'react';

const parseColor = (color) => {
  if (!color) return { hex: '#000000', alpha: 1 };
  if (color.startsWith('#')) {
    if (color.length === 9) {
      // #RRGGBBAA
      const hex = color.substring(0, 7);
      const alpha = parseInt(color.substring(7, 9), 16) / 255;
      return { hex, alpha };
    }
    return { hex: color.substring(0,7), alpha: 1 };
  }
  if (color.startsWith('rgba')) {
    const parts = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (parts) {
      const r = parseInt(parts[1]);
      const g = parseInt(parts[2]);
      const b = parseInt(parts[3]);
      const a = parts[4] !== undefined ? parseFloat(parts[4]) : 1;
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      return { hex, alpha: a };
    }
  }
  return { hex: '#000000', alpha: 1 };
};

const hexToRgba = (hex, a = 1) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length >= 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default function ColorInput({ label, value, onChange }) {
  const { hex, alpha } = parseColor(value);
  const colorInputRef = useRef(null);

  const handleHexChange = (e) => {
    onChange(hexToRgba(e.target.value, alpha));
  };

  const handleAlphaChange = (e) => {
    onChange(hexToRgba(hex, e.target.value / 100));
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{label}</label>}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          style={{ 
            width: '32px', height: '32px', borderRadius: '6px', 
            background: value, border: '1px solid var(--surface-border)', 
            cursor: 'pointer', position: 'relative', overflow: 'hidden' 
          }}
          onClick={() => colorInputRef.current?.click()}
        >
          {/* Checkerboard pattern for transparency */}
          <div style={{ position: 'absolute', inset: 0, background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAn/w4H8cmoYRQxXgMow4fIozR0U+HwEACk4QAVn6B9sAAAAASUVORK5CYII=)', zIndex: -1 }}></div>
          <div style={{ position: 'absolute', inset: 0, background: value }}></div>
          <input 
            type="color" 
            ref={colorInputRef} 
            value={hex} 
            onChange={handleHexChange} 
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </div>
        <input 
          type="text" 
          className="sidebar-input" 
          style={{ flex: 1, padding: '6px 8px', fontSize: '13px' }} 
          value={hex} 
          onChange={(e) => onChange(e.target.value)} 
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>A</span>
        <input 
          type="range" 
          min="0" max="100" 
          className="sidebar-input" 
          style={{ flex: 1 }} 
          value={Math.round(alpha * 100)} 
          onChange={handleAlphaChange} 
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>
          {Math.round(alpha * 100)}%
        </span>
      </div>
    </div>
  );
}
