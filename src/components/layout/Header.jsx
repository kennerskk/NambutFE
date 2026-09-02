import React from 'react';
import { Save, Sparkles, Type, Square, Image as ImageIcon, MousePointerClick, Magnet, Download, Upload, LogIn } from 'lucide-react';

export default function Header({ 
  user, 
  onLoginClick, 
  isSnapEnabled, 
  onToggleSnap, 
  onAddElement, 
  onExport, 
  onImport, 
  onSave, 
  isSaving 
}) {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '250px' }}>
        <Sparkles className="logo-icon" color="#3b82f6" />
        <h1 className="logo">Profoliot <span style={{ fontSize: '12px', color: '#64748b' }}>Business</span></h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={() => onAddElement('text')} title="Add Text">
          <Type size={20} />
        </button>
        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }} onClick={() => onAddElement('card')} title="Add Shape/Card">
          <Square size={20} />
        </button>
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
        <button className="btn btn-outline" onClick={onExport} title="Export Script">
          <Download size={16} />
        </button>
        <button className="btn btn-outline" onClick={onImport} title="Import Script">
          <Upload size={16} />
        </button>

        <button className="btn btn-primary" onClick={onSave} disabled={isSaving}>
          <Save size={18} style={{ marginRight: '6px' }} />
          {isSaving ? 'Saving...' : 'Save Design'}
        </button>
        
        {user ? (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }} title={user.username}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        ) : (
          <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={onLoginClick} title="Login">
            <LogIn size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
