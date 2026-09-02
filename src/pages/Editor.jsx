import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import Canvas from '../Canvas';
import { api } from '../api/client';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AuthModal from '../components/modals/AuthModal';
import Modal from '../components/ui/Modal';
import { TEMPLATES } from '../templates';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardId = id || 'default-card';
  
  const [deviceElements, setDeviceElements] = useState({ desktop: [], tablet: [], mobile: [] });
  const [settings, setSettings] = useState({
    backgroundColor: '#f8fafc',
    backgroundImage: 'none',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center'
  });
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Card Management States
  const [myCards, setMyCards] = useState([]);
  const [showMyCardsModal, setShowMyCardsModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Card Management States
  const [myCards, setMyCards] = useState([]);
  const [showMyCardsModal, setShowMyCardsModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Initial Data Fetch & Server Wakeup
  const [isLoading, setIsLoading] = useState(true);

  // History & Clipboard
  const [clipboard, setClipboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        await api.ping(); // Wake up server
        
        if (localStorage.getItem('token')) {
          try {
            const data = await api.getMe();
            setUser(data.user);
          } catch (err) {
            localStorage.removeItem('token');
          }
        }

        const card = await api.getCard(cardId);
        if (card.desktopElements) {
          setDeviceElements({
            desktop: card.desktopElements || [],
            tablet: card.tabletElements || [],
            mobile: card.mobileElements || []
          });
          if (card.settings) setSettings(card.settings);
          
          [...(card.desktopElements || []), ...(card.tabletElements || []), ...(card.mobileElements || [])].forEach(el => {
            if (el.style?.fontFamily) loadFont(el.style.fontFamily);
          });
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [cardId]);

  // History tracking
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false; return;
    }
    if (history.length === 0 && deviceElements.desktop.length === 0) return;
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(deviceElements)));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [deviceElements]);

  const loadFont = (fontFamily) => {
    if (!fontFamily || fontFamily === 'inherit') return;
    const fontId = `font-${fontFamily.replace(/\s+/g, '-')}`;
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,700;1,400;1,700&display=swap`;
      document.head.appendChild(link);
    }
  };

  const handleSaveDesign = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSaving(true);
    try {
      await api.saveCard(cardId, {
        title: 'My Business Card',
        settings,
        desktopElements: deviceElements.desktop,
        tabletElements: deviceElements.tablet,
        mobileElements: deviceElements.mobile
      });
      setShowToast('✅ Saved Successfully!');
      setTimeout(() => setShowToast(''), 3000);
      
      // If we just saved successfully, we might want to refresh the cards list if it was open
      if (showMyCardsModal) fetchMyCards();
    } catch (err) {
      if (err.error === 'LIMIT_REACHED') {
        setShowLimitModal(true);
      } else {
        alert(err.error || 'Failed to save');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fetchMyCards = async () => {
    try {
      const cards = await api.getMyCards();
      setMyCards(cards);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarClick = () => {
    fetchMyCards();
    setShowMyCardsModal(true);
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      await api.deleteCard(cardToDelete.id);
      setMyCards(prev => prev.filter(c => c.id !== cardToDelete.id));
      if (cardId === cardToDelete.id) {
        navigate('/'); // Redirect to new card if deleted the current one
      }
      setCardToDelete(null);
    } catch (err) {
      alert(err.error || 'Failed to delete');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/view/${cardId}`;
    navigator.clipboard.writeText(url);
    setShowToast('🔗 Link copied to clipboard!');
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    handleSaveDesign();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      
      // Globally prevent browser default for Ctrl+D (Bookmark) and Ctrl+S (Save)
      if (isCmdOrCtrl && (key === 'd' || key === 's')) {
        e.preventDefault();
      }

      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable;
      if (isInput) return; // Let native browser events handle text editing (except D and S)

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        selectedIds.forEach(id => handleDeleteElement(id));
        setSelectedIds([]);
      }
      
      if (isCmdOrCtrl) {
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (key === 'c') {
          e.preventDefault();
          if (selectedIds.length > 0) setClipboard(deviceElements[previewMode].filter(el => selectedIds.includes(el.id)));
        } else if (key === 'v') {
          e.preventDefault();
          handleDuplicate(clipboard);
        } else if (key === 'd') {
          e.preventDefault();
          if (selectedIds.length > 0) handleDuplicate(deviceElements[previewMode].filter(el => selectedIds.includes(el.id)));
        } else if (key === 's') {
          e.preventDefault();
          handleSaveDesign();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, history, historyIndex, previewMode, clipboard, deviceElements]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex - 1);
      setDeviceElements(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setHistoryIndex(historyIndex + 1);
      setDeviceElements(history[historyIndex + 1]);
    }
  };

  const handleDuplicate = (itemsToCopy) => {
    if (itemsToCopy.length === 0) return;
    const maxZ = deviceElements[previewMode].reduce((max, el) => Math.max(max, el.z || 1), 0);
    const newElements = itemsToCopy.map((item, index) => ({
      ...item, id: Math.random().toString(36).substr(2, 9), x: item.x + 20, y: item.y + 20, z: maxZ + 1 + index
    }));
    setDeviceElements(prev => ({ ...prev, [previewMode]: [...prev[previewMode], ...newElements] }));
    setSelectedIds(newElements.map(el => el.id));
  };

  const handleUpdateElement = useCallback((updatedElement) => {
    if (updatedElement.style?.fontFamily) loadFont(updatedElement.style.fontFamily);
    setDeviceElements(prev => ({ ...prev, [previewMode]: prev[previewMode].map(el => el.id === updatedElement.id ? updatedElement : el) }));
  }, [previewMode]);

  const handleDeleteElement = (id) => {
    setDeviceElements(prev => ({ ...prev, [previewMode]: prev[previewMode].filter(el => el.id !== id) }));
  };

  const handleLayerChange = (id, direction) => {
    setDeviceElements(prev => {
      const currentList = prev[previewMode];
      const elIdx = currentList.findIndex(e => e.id === id);
      if (elIdx === -1) return prev;
      const newElements = [...currentList];
      newElements[elIdx].z = (newElements[elIdx].z || 1) + (direction === 'forward' ? 1 : -1);
      return { ...prev, [previewMode]: newElements };
    });
  };

  const handleAddElement = (type, payload) => {
    let content = 'New Element';
    let w = 200; let h = 50;
    let baseStyle = { fontFamily: 'Inter', fontWeight: type === 'text' ? 'normal' : 'bold', color: type === 'button' ? '#fff' : '#0f172a' };
    let actualType = type;

    if (type === 'text') { content = 'Text Block'; w = 200; h = 50; }
    if (type === 'button') { content = 'Click Me'; w = 150; h = 50; }
    if (type === 'image') { content = payload || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'; w = 200; h = 200; }
    
    if (type === 'shape' || type === 'card') {
      actualType = 'card';
      content = ''; w = 200; h = 200;
      baseStyle.background = 'var(--surface)';
      
      if (payload === 'circle') baseStyle.borderRadius = '50%';
      else if (payload === 'pill') baseStyle.borderRadius = '9999px';
      else if (payload === 'triangle') baseStyle.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      else baseStyle.borderRadius = '12px'; // square/card default
    }

    const maxZ = deviceElements[previewMode].reduce((max, el) => Math.max(max, el.z || 1), 0);
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: actualType, content,
      x: previewMode === 'mobile' ? 50 : 1050 / 2 - (w/2),
      y: previewMode === 'mobile' ? 50 : 600 / 2 - (h/2),
      w, h, z: maxZ + 1, locked: false,
      style: baseStyle
    };
    setDeviceElements(prev => ({ ...prev, [previewMode]: [...prev[previewMode], newElement] }));
    setSelectedIds([newElement.id]);
    setIsSidebarOpen(true);
  };

  const handleExportScript = () => {
    const script = btoa(encodeURIComponent(JSON.stringify({ deviceElements, settings })));
    navigator.clipboard.writeText(script);
    setShowToast('✅ Script copied to clipboard!');
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleImportScript = () => {
    const script = prompt("Paste your Card Script here:");
    if (!script) return;
    try {
      const data = JSON.parse(decodeURIComponent(atob(script)));
      if (data.deviceElements) setDeviceElements(data.deviceElements);
      if (data.settings) setSettings(data.settings);
      setShowToast('✅ Card imported successfully!');
      setTimeout(() => setShowToast(''), 3000);
    } catch(err) {
      alert("Invalid script format");
    }
  };

  const handleApplyTemplate = (templateKey) => {
    const tpl = TEMPLATES[templateKey];
    if (tpl) {
      if (confirm(`Apply "${tpl.name}" template? This will replace your current design.`)) {
        setSettings(tpl.settings);
        setDeviceElements({ desktop: tpl.desktopElements, tablet: [], mobile: [] });
        setSelectedIds([]);
        setHistory([]);
        setHistoryIndex(-1);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 style={{ color: 'var(--text-main)', marginTop: '1rem' }}>Waking up server...</h2>
      </div>
    );
  }

  const currentElements = deviceElements[previewMode];
  const primarySelectedElement = selectedIds.length > 0 ? currentElements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div className="app">
      {showToast && <div className={`toast show`}>{showToast}</div>}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleAuthSuccess} 
        />
      )}

      {!isPreviewMode && (
        <Header 
          user={user}
          onLoginClick={() => setShowAuthModal(true)}
          isSnapEnabled={isSnapEnabled}
          onToggleSnap={() => setIsSnapEnabled(!isSnapEnabled)}
          onAddElement={handleAddElement}
          onExport={handleExportScript}
          onImport={handleImportScript}
          onSave={handleSaveDesign}
          isSaving={isSaving}
          onApplyTemplate={handleApplyTemplate}
          onShare={handleShare}
          onPreview={() => setIsPreviewMode(true)}
          onAvatarClick={handleAvatarClick}
        />
      )}
      
      <main className="app-main">
        <div className="canvas-wrapper">
          <div className={`preview-container preview-${previewMode}`}>
            <Canvas 
              elements={currentElements} 
              settings={settings}
              onUpdateElement={handleUpdateElement} 
              onDeleteElement={handleDeleteElement}
              onLayerChange={handleLayerChange}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              isSnapEnabled={isSnapEnabled}
            />
          </div>
          {!isSidebarOpen && (
            <button className="fab" onClick={() => setIsSidebarOpen(true)} title="Open Properties">
              <Settings2 size={24} />
            </button>
          )}
        </div>
        
        {!isPreviewMode && (
          <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            selectedIds={selectedIds}
            primarySelectedElement={primarySelectedElement}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            settings={settings}
            setSettings={setSettings}
            onUpdateElement={handleUpdateElement}
            onDeleteSelected={(id) => { handleDeleteElement(id); setSelectedIds([]); }}
            onDeleteAllSelected={() => { selectedIds.forEach(id => handleDeleteElement(id)); setSelectedIds([]); }}
          />
        )}
      </main>

      {isPreviewMode && (
        <button 
          className="btn btn-primary"
          style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, padding: '12px 24px', borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => setIsPreviewMode(false)}
        >
          Exit Preview
        </button>
      )}

      {/* Modals */}
      <Modal isOpen={showMyCardsModal} onClose={() => setShowMyCardsModal(false)} title="My Cards">
        {myCards.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>You don't have any saved cards yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myCards.map(card => (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--surface-border)', borderRadius: '8px', background: 'var(--bg-main)' }}>
                <div 
                  style={{ flex: 1, cursor: 'pointer', fontWeight: '500', color: 'var(--text-main)' }} 
                  onClick={() => { setShowMyCardsModal(false); navigate(`/card/${card.id}`); }}
                >
                  {card.title} <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({new Date(card.updated_at).toLocaleDateString()})</span>
                </div>
                <button className="btn btn-outline" style={{ border: 'none', color: 'var(--danger)', padding: '4px 8px' }} onClick={() => setCardToDelete(card)}>Delete</button>
              </div>
            ))}
            {myCards.length < 3 && (
              <button className="btn btn-primary" style={{ marginTop: '8px', width: '100%' }} onClick={() => { setShowMyCardsModal(false); navigate('/'); }}>+ Create New Card</button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!cardToDelete} onClose={() => setCardToDelete(null)} title="Confirm Delete">
        <p style={{ color: 'var(--text-main)', marginBottom: '20px' }}>Are you sure you want to delete this card? This action cannot be undone.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setCardToDelete(null)}>Cancel</button>
          <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmDeleteCard}>Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} title="Limit Reached">
        <p style={{ color: 'var(--text-main)', marginBottom: '20px' }}>You can only create a maximum of 3 cards. Please delete an existing card before creating a new one.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => setShowLimitModal(false)}>Understood</button>
        </div>
      </Modal>

    </div>
  );
}
