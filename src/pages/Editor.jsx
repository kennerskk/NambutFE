import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import Canvas from '../Canvas';
import { api } from '../api/client';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AuthModal from '../components/modals/AuthModal';

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
    } catch (err) {
      alert(err.error || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    handleSaveDesign();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        selectedIds.forEach(id => handleDeleteElement(id));
        setSelectedIds([]);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'c') {
          e.preventDefault();
          if (selectedIds.length > 0) setClipboard(deviceElements[previewMode].filter(el => selectedIds.includes(el.id)));
        } else if (e.key === 'v') {
          e.preventDefault();
          handleDuplicate(clipboard);
        } else if (e.key === 'd') {
          e.preventDefault();
          if (selectedIds.length > 0) handleDuplicate(deviceElements[previewMode].filter(el => selectedIds.includes(el.id)));
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

  const handleAddElement = (type) => {
    let content = 'New Element';
    let w = 200; let h = 50;
    if (type === 'text') { content = 'Text Block'; w = 200; h = 50; }
    if (type === 'card') { content = 'Card'; w = 300; h = 200; }
    if (type === 'button') { content = 'Click Me'; w = 150; h = 50; }
    if (type === 'image') { content = ''; w = 200; h = 200; }

    const maxZ = deviceElements[previewMode].reduce((max, el) => Math.max(max, el.z || 1), 0);
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type, content,
      x: previewMode === 'mobile' ? 50 : 1050 / 2 - (w/2),
      y: previewMode === 'mobile' ? 50 : 600 / 2 - (h/2),
      w, h, z: maxZ + 1, locked: false,
      style: { fontFamily: 'Inter', fontWeight: type === 'text' ? 'normal' : 'bold', color: type === 'button' ? '#fff' : '#0f172a' }
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
      />
      
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
      </main>
    </div>
  );
}
