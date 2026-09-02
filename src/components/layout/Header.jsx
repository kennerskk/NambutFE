import React, { useRef } from 'react';
import { Save, Sparkles, Type, MousePointerClick, Magnet, Download, Upload, LogIn, LayoutTemplate, Image as ImageIcon, Circle, Square, Triangle, RectangleHorizontal } from 'lucide-react';
import { TEMPLATES } from '../../templates';

export default function Header({ 
  user, 
  onLoginClick, 
  isSnapEnabled, 
  onToggleSnap, 
  onAddElement, 
  onExport, 
  onImport, 
  onSave, 
  isSaving,
  onApplyTemplate
}) {

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '250px' }}>
        <Sparkles className="logo-icon" color="#3b82f6" />
        <h1 className="logo">Nambut</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px', border: '1px solid var(--surface-border)', alignItems: 'center' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={() => onAddElement('text')} title="Add Text">
          <Type size={20} />
        </button>
        
        {/* Shapes Dropdown */}
        <select 
          className="sidebar-input" 
          style={{ width: '100px', padding: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}
          onChange={(e) => {
            if (e.target.value) onAddElement('shape', e.target.value);
            e.target.value = ''; // Reset
          }}
          title="Add Shape"
        >
          <option value="">Shapes...</option>
          <option value="square">Square</option>
          <option value="circle">Circle</option>
          <option value="pill">Pill</option>
          <option value="triangle">Triangle</option>
        </select>

        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={() => onAddElement('image')} title="Add Image">
          <ImageIcon size={20} />
        </button>
        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={() => onAddElement('button')} title="Add Button">
          <MousePointerClick size={20} />
        </button>
        <div style={{ width: '1px', background: 'var(--surface-border)', margin: '0 4px' }} />
        <button className={`btn ${isSnapEnabled ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={onToggleSnap} title="Toggle Snap">
          <Magnet size={20} />
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '250px', justifyContent: 'flex-end' }}>
        
        <select 
          className="sidebar-input" 
          style={{ width: 'auto', padding: '0.4rem', fontSize: '0.85rem' }}
          onChange={(e) => {
            if (e.target.value) onApplyTemplate(e.target.value);
            e.target.value = ''; // reset after apply
          }}
        >
          <option value="">Templates</option>
          {Object.entries(TEMPLATES).map(([key, tpl]) => (
            <option key={key} value={key}>{tpl.name}</option>
          ))}
        </select>

        <div style={{ width: '1px', background: 'var(--surface-border)', height: '24px' }} />

        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={onExport} title="Export Script">
          <Download size={18} />
        </button>
        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={onImport} title="Import Script">
          <Upload size={18} />
        </button>

        <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={onSave} disabled={isSaving} title="Save Design">
          <Save size={18} />
        </button>
        
        {user ? (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginLeft: '4px' }} title={user.username}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        ) : (
          <button className="btn btn-outline" style={{ padding: '0.4rem', marginLeft: '4px' }} onClick={onLoginClick} title="Login">
            <LogIn size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
