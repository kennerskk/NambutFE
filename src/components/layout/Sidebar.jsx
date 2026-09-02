import React from 'react';
import { LayoutPanelLeft, X, Monitor, Tablet, Smartphone, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ArrowUpToLine, Minus, ArrowDownToLine } from 'lucide-react';
import GradientPicker from './GradientPicker';

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Oswald', 'Playfair Display', 'Merriweather', 'Nunito', 'Poppins',
  'Prompt', 'Kanit', 'Sarabun', 'Mali', 'Chakra Petch', 'Bai Jamjuree'
];

export default function Sidebar({
  isOpen,
  onClose,
  selectedIds,
  primarySelectedElement,
  previewMode,
  setPreviewMode,
  settings,
  setSettings,
  onUpdateElement,
  onDeleteSelected,
  onDeleteAllSelected
}) {
  return (
    <div className={`properties-sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <LayoutPanelLeft size={16} />
            {selectedIds.length > 1 ? 'Multiple Selection' : (primarySelectedElement ? 'Element Properties' : 'Card Properties')}
          </h2>
          <button className="btn btn-outline" style={{ padding: '4px', border: 'none' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {selectedIds.length > 1 ? (
        <div style={{ textAlign: 'center', opacity: 0.7, padding: '20px' }}>
          {selectedIds.length} elements selected.<br/><br/>
          <button className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={onDeleteAllSelected}>
            <Trash2 size={16} style={{ marginRight: '8px' }}/> Delete All Selected
          </button>
        </div>
      ) : !primarySelectedElement ? (
        <div style={{ display: isOpen ? 'block' : 'none' }}>
          <div className="sidebar-section" style={{ marginBottom: '1rem' }}>
            <label className="sidebar-label">Background / Fill</label>
            <GradientPicker 
              value={settings.backgroundColor || '#ffffff'}
              onChange={(newBg) => setSettings({...settings, backgroundColor: newBg})}
            />
          </div>

          <div className="sidebar-section" style={{ marginBottom: '1rem' }}>
            <label className="sidebar-label">Background Image (URL)</label>
            <input type="text" className="sidebar-input" value={settings.backgroundImage === 'none' ? '' : settings.backgroundImage} onChange={(e) => setSettings({...settings, backgroundImage: e.target.value || 'none'})} placeholder="https://..." />
          </div>
        </div>
      ) : (
        <div style={{ display: isOpen ? 'block' : 'none' }}>
          {(primarySelectedElement.type === 'text' || primarySelectedElement.type === 'button' || primarySelectedElement.type === 'card') && (
            <div className="sidebar-section" style={{ marginBottom: '1.5rem', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
              <label className="sidebar-label" style={{ marginBottom: '8px' }}>Typography</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select className="sidebar-input" style={{ flex: 2 }} value={primarySelectedElement.style?.fontFamily || 'Inter'} onChange={(e) => onUpdateElement({ ...primarySelectedElement, style: { ...primarySelectedElement.style, fontFamily: e.target.value }})}>
                  {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
                <input 
                  type="number" 
                  className="sidebar-input" 
                  style={{ flex: 1 }} 
                  placeholder="Size" 
                  value={parseInt(primarySelectedElement.style?.fontSize) || ''} 
                  onChange={(e) => onUpdateElement({ ...primarySelectedElement, style: { ...primarySelectedElement.style, fontSize: e.target.value ? `${e.target.value}px` : '' }})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <button className={`btn ${primarySelectedElement.style?.fontWeight === 'bold' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, fontWeight: primarySelectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' }})} title="Bold"><Bold size={16} /></button>
                <button className={`btn ${primarySelectedElement.style?.fontStyle === 'italic' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, fontStyle: primarySelectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' }})} title="Italic"><Italic size={16} /></button>
                <button className={`btn ${primarySelectedElement.style?.textDecoration === 'underline' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, textDecoration: primarySelectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' }})} title="Underline"><Underline size={16} /></button>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <button className={`btn ${primarySelectedElement.style?.textAlign === 'left' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, textAlign: 'left', justifyContent: 'flex-start' }})} title="Align Left"><AlignLeft size={16} /></button>
                <button className={`btn ${(!primarySelectedElement.style?.textAlign || primarySelectedElement.style?.textAlign === 'center') ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, textAlign: 'center', justifyContent: 'center' }})} title="Align Center"><AlignCenter size={16} /></button>
                <button className={`btn ${primarySelectedElement.style?.textAlign === 'right' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, textAlign: 'right', justifyContent: 'flex-end' }})} title="Align Right"><AlignRight size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button className={`btn ${primarySelectedElement.style?.alignItems === 'flex-start' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, alignItems: 'flex-start' }})} title="Align Top"><ArrowUpToLine size={16} /></button>
                <button className={`btn ${(!primarySelectedElement.style?.alignItems || primarySelectedElement.style?.alignItems === 'center') ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, alignItems: 'center' }})} title="Align Middle"><Minus size={16} /></button>
                <button className={`btn ${primarySelectedElement.style?.alignItems === 'flex-end' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem', flex: 1, borderRadius: '4px' }} onClick={() => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, alignItems: 'flex-end' }})} title="Align Bottom"><ArrowDownToLine size={16} /></button>
              </div>
            </div>
          )}
          
          <div className="sidebar-section" style={{ marginBottom: '1.5rem' }}>
            <label className="sidebar-label">Background / Fill</label>
            <GradientPicker 
              value={primarySelectedElement.style?.background || '#000000'}
              onChange={(newBg) => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, background: newBg }})}
            />
          </div>

          <div className="sidebar-section" style={{ marginBottom: '1.5rem' }}>
            <label className="sidebar-label">Text Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="color" className="sidebar-input" style={{ flex: '0 0 50px', padding: '0', height: '36px' }} value={primarySelectedElement.style?.color || '#000000'} onChange={(e) => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, color: e.target.value }})} />
              <input type="text" className="sidebar-input" style={{ flex: 1 }} value={primarySelectedElement.style?.color || ''} onChange={(e) => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, color: e.target.value }})} />
            </div>
          </div>

          <div className="sidebar-section" style={{ marginBottom: '1.5rem' }}>
            <label className="sidebar-label">Opacity</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" max="100" 
                className="sidebar-input" 
                style={{ flex: 1, padding: 0, cursor: 'pointer', height: '4px' }} 
                value={(primarySelectedElement.style?.opacity !== undefined ? primarySelectedElement.style.opacity : 1) * 100} 
                onChange={(e) => onUpdateElement({...primarySelectedElement, style: { ...primarySelectedElement.style, opacity: e.target.value / 100 }})} 
              />
              <span style={{ fontSize: '12px', width: '35px', textAlign: 'right' }}>
                {Math.round((primarySelectedElement.style?.opacity !== undefined ? primarySelectedElement.style.opacity : 1) * 100)}%
              </span>
            </div>
          </div>
          
          {primarySelectedElement.type === 'image' && (
            <div className="sidebar-section" style={{ marginBottom: '1.5rem' }}>
              <label className="sidebar-label">Image URL</label>
              <input type="text" className="sidebar-input" value={primarySelectedElement.content || ''} onChange={(e) => onUpdateElement({...primarySelectedElement, content: e.target.value})} />
            </div>
          )}

          <button className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={() => onDeleteSelected(primarySelectedElement.id)}>
            <Trash2 size={16} /> Delete Element (Del)
          </button>
        </div>
      )}
    </div>
  );
}
