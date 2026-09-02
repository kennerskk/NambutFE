import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Trash2, Lock, Unlock, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import ElementRenderer from './components/elements/ElementRenderer';

const Canvas = ({ elements, settings, onUpdateElement, onDeleteElement, onLayerChange, selectedIds, setSelectedIds, isSnapEnabled }) => {
  const [dragGuides, setDragGuides] = useState({ x: null, y: null });

  const bgStr = settings?.backgroundColor || '#0b0f19';
  const isGradient = bgStr.includes('gradient');
  
  const canvasStyle = {
    background: bgStr,
    backgroundImage: settings?.backgroundImage && settings.backgroundImage !== 'none' 
      ? `url(${settings.backgroundImage})` 
      : (isGradient ? bgStr : 'none'),
    backgroundSize: settings?.backgroundSize || (settings?.backgroundImage ? 'auto' : 'cover'),
    backgroundRepeat: settings?.backgroundRepeat || (settings?.backgroundImage ? 'repeat' : 'no-repeat'),
    backgroundAttachment: settings?.backgroundAttachment || 'fixed',
    backgroundPosition: settings?.backgroundPosition || 'center'
  };

  // Sort elements by z-index for rendering
  const sortedElements = [...elements].sort((a, b) => (a.z || 1) - (b.z || 1));

  const handleCanvasClick = () => {
    setSelectedIds([]);
  };

  const handleElementClick = (e, id) => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sId => sId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div 
      className="canvas-container" 
      onClick={handleCanvasClick}
      style={canvasStyle}
      id="canvas-container"
    >
      {/* Smart Guides (Center Canvas) */}
      {dragGuides.x !== null && (
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: dragGuides.x, width: '1px', background: '#ec4899', zIndex: 9999 }} />
      )}
      {dragGuides.y !== null && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: dragGuides.y, height: '1px', background: '#ec4899', zIndex: 9999 }} />
      )}

      {sortedElements.map((el) => {
        const isSelected = selectedIds.includes(el.id);
        const isLocked = el.locked === true;
        const zIndex = el.z || 1;

        return (
          <Rnd
            key={el.id}
            className={`canvas-element ${isSelected ? 'element-selected' : ''}`}
            size={{ width: el.w, height: el.h }}
            position={{ x: el.x, y: el.y }}
            disableDragging={isLocked}
            enableResizing={!isLocked}
            dragGrid={isSnapEnabled ? [10, 10] : [1, 1]}
            resizeGrid={isSnapEnabled ? [10, 10] : [1, 1]}
            style={{ zIndex: isSelected ? zIndex + 1000 : zIndex }} // Bring selected to front visually temporarily
            onDrag={(e, d) => {
              if (isSnapEnabled) {
                const container = document.getElementById('canvas-container');
                if (container) {
                  const bounds = container.getBoundingClientRect();
                  const centerX = bounds.width / 2;
                  const centerY = bounds.height / 2;
                  const elCenterX = d.x + (el.w / 2);
                  const elCenterY = d.y + (el.h / 2);
                  
                  let newGuides = { x: null, y: null };
                  // Snap to center within 10px threshold
                  if (Math.abs(elCenterX - centerX) < 15) newGuides.x = centerX;
                  if (Math.abs(elCenterY - centerY) < 15) newGuides.y = centerY;
                  
                  setDragGuides(newGuides);
                }
              }
              
              // Note: Visual dragging for multi-select is skipped here for performance,
              // but we apply the delta position onDragStop.
            }}
            onDragStop={(e, d) => {
              setDragGuides({ x: null, y: null });
              
              let finalX = d.x;
              let finalY = d.y;
              if (dragGuides.x !== null) finalX = dragGuides.x - (el.w / 2);
              if (dragGuides.y !== null) finalY = dragGuides.y - (el.h / 2);
              
              const deltaX = finalX - el.x;
              const deltaY = finalY - el.y;

              // If this element is part of a multi-select, move all selected elements
              if (selectedIds.includes(el.id) && selectedIds.length > 1) {
                const updatedGroup = elements.filter(e => selectedIds.includes(e.id)).map(e => ({
                  ...e,
                  x: e.x + deltaX,
                  y: e.y + deltaY
                }));
                // Call update for each
                updatedGroup.forEach(updatedEl => onUpdateElement(updatedEl));
              } else {
                onUpdateElement({ ...el, x: finalX, y: finalY });
              }
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onUpdateElement({
                ...el,
                w: parseInt(ref.style.width),
                h: parseInt(ref.style.height),
                ...position,
              });
            }}
            bounds="parent"
            onMouseDownCapture={(e) => {
              // Select on mouse down so it feels responsive before dragging
              if (!selectedIds.includes(el.id) && !e.shiftKey) {
                 setSelectedIds([el.id]);
              }
            }}
            onClick={(e) => handleElementClick(e, el.id)}
          >
            <div className="canvas-element-inner" style={{ width: '100%', height: '100%' }}>
              <ElementRenderer 
                element={el} 
                isSelected={isSelected} 
                onUpdate={onUpdateElement}
              />
            </div>
            
            {/* Canva-style floating toolbar (only show on the primary selected or if single selected) */}
            {isSelected && selectedIds[selectedIds.length - 1] === el.id && (
              <div className="element-floating-toolbar" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <button 
                  className="btn btn-outline" 
                  title="Bring Forward"
                  onClick={() => onLayerChange(el.id, 'forward')}
                >
                  <ArrowUpToLine size={16} />
                </button>
                <button 
                  className="btn btn-outline" 
                  title="Send Backward"
                  onClick={() => onLayerChange(el.id, 'backward')}
                >
                  <ArrowDownToLine size={16} />
                </button>
                <div style={{ width: '1px', background: 'var(--surface-border)', margin: '4px' }} />
                <button 
                  className="btn btn-outline" 
                  title={isLocked ? "Unlock" : "Lock"}
                  onClick={() => {
                    // Lock/Unlock all selected
                    selectedIds.forEach(sId => {
                      const selEl = elements.find(e => e.id === sId);
                      if(selEl) onUpdateElement({ ...selEl, locked: !isLocked });
                    });
                  }}
                >
                  {isLocked ? <Lock size={16} color="#3b82f6" /> : <Unlock size={16} />}
                </button>
                <button 
                  className="btn btn-outline" 
                  title="Delete"
                  onClick={() => {
                    selectedIds.forEach(sId => onDeleteElement(sId));
                    setSelectedIds([]);
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            )}
          </Rnd>
        );
      })}
    </div>
  );
};

export default Canvas;
