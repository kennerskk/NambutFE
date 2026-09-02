import React, { useState, useEffect } from 'react';
import ColorInput from './ColorInput';

export default function GradientPicker({ value, onChange }) {
  const [type, setType] = useState('solid'); // 'solid' | 'linear'
  const [color1, setColor1] = useState('#3b82f6');
  const [color2, setColor2] = useState('#8b5cf6');
  const [stop1, setStop1] = useState(0);
  const [stop2, setStop2] = useState(100);
  const [angle, setAngle] = useState(135);

  // Parse existing background if it's a gradient
  useEffect(() => {
    if (!value) return;
    if (value.includes('linear-gradient')) {
      setType('linear');
      // Simple parser for linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)
      const match = value.match(/linear-gradient\((.+?)deg,\s*(.+?)\s+(\d+)%,\s*(.+?)\s+(\d+)%\)/);
      if (match) {
        setAngle(parseInt(match[1]));
        setColor1(match[2]);
        setStop1(parseInt(match[3]));
        setColor2(match[4]);
        setStop2(parseInt(match[5]));
      }
    } else {
      setType('solid');
      setColor1(value);
    }
  }, [value]);

  const handleUpdate = (newType, c1, s1, c2, s2, a) => {
    if (newType === 'solid') {
      onChange(c1);
    } else {
      onChange(`linear-gradient(${a}deg, ${c1} ${s1}%, ${c2} ${s2}%)`);
    }
  };

  return (
    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button 
          className={`btn ${type === 'solid' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
          onClick={() => { setType('solid'); handleUpdate('solid', color1, stop1, color2, stop2, angle); }}
        >
          Solid
        </button>
        <button 
          className={`btn ${type === 'linear' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
          onClick={() => { setType('linear'); handleUpdate('linear', color1, stop1, color2, stop2, angle); }}
        >
          Gradient
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '120px' }}>
          <ColorInput 
            label="Color 1" 
            value={color1} 
            onChange={(c) => { setColor1(c); handleUpdate(type, c, stop1, color2, stop2, angle); }} 
          />
          {type === 'linear' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stop</span>
              <input type="range" min="0" max="100" style={{ flex: 1 }} className="sidebar-input" value={stop1} onChange={(e) => { setStop1(e.target.value); handleUpdate(type, color1, e.target.value, color2, stop2, angle); }} />
            </div>
          )}
        </div>

        {type === 'linear' && (
          <div style={{ flex: 1, minWidth: '120px' }}>
            <ColorInput 
              label="Color 2" 
              value={color2} 
              onChange={(c) => { setColor2(c); handleUpdate(type, color1, stop1, c, stop2, angle); }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stop</span>
              <input type="range" min="0" max="100" style={{ flex: 1 }} className="sidebar-input" value={stop2} onChange={(e) => { setStop2(e.target.value); handleUpdate(type, color1, stop1, color2, e.target.value, angle); }} />
            </div>
          </div>
        )}
      </div>

      {type === 'linear' && (
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Angle ({angle}°)</label>
          <input type="range" min="0" max="360" className="sidebar-input" style={{ width: '100%' }} value={angle} onChange={(e) => { setAngle(e.target.value); handleUpdate(type, color1, stop1, color2, stop2, e.target.value); }} />
        </div>
      )}
    </div>
  );
}
