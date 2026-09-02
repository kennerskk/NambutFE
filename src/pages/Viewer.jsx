import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link as LinkIcon, X } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaGithub, FaDiscord } from 'react-icons/fa';
import { api } from '../api/client';

const getSocialIcon = (url) => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('instagram.com')) return <FaInstagram size={24} />;
  if (lowerUrl.includes('facebook.com')) return <FaFacebook size={24} />;
  if (lowerUrl.includes('linkedin.com')) return <FaLinkedin size={24} />;
  if (lowerUrl.includes('github.com')) return <FaGithub size={24} />;
  if (lowerUrl.includes('discord.')) return <FaDiscord size={24} />;
  if (lowerUrl.startsWith('http')) return <LinkIcon size={24} />;
  return null;
};

export default function Viewer() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAd, setShowAd] = useState(true);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const data = await api.getCard(id);
        setCard(data);
        
        // Load fonts
        [...(data.desktopElements || []), ...(data.mobileElements || [])].forEach(el => {
            if (el.style?.fontFamily) {
              const fontId = `font-${el.style.fontFamily.replace(/\s+/g, '-')}`;
              if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${el.style.fontFamily.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,700;1,400;1,700&display=swap`;
                document.head.appendChild(link);
              }
            }
          });
      } catch (err) {
        if (err.status === 404) {
          setError('Card not found');
        } else {
          setError('Network error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCard();
  }, [id]);

  const targetWidth = 1050;
  const targetHeight = 600;
  
  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / targetWidth;
      const scaleY = window.innerHeight / targetHeight;
      setScale(Math.min(scaleX, scaleY) * 0.95); 
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2 style={{ color: 'var(--text-main)' }}>Loading Business Card...</h2>
      </div>
    );
  }

  if (error || !card) {
    return <div className="loading-screen"><h2 style={{ color: 'var(--danger)' }}>{error || 'Card not found'}</h2></div>;
  }

  const elements = card.desktopElements || [];

  const bgStr = card.settings?.backgroundColor || '#f8fafc';
  const isGradient = bgStr.includes('gradient');

  const canvasStyle = {
    background: bgStr,
    backgroundImage: card.settings?.backgroundImage && card.settings.backgroundImage !== 'none' 
      ? `url(${card.settings.backgroundImage})` 
      : (isGradient ? bgStr : 'none'),
    backgroundSize: card.settings?.backgroundSize || (card.settings?.backgroundImage ? 'auto' : 'cover'),
    backgroundRepeat: card.settings?.backgroundRepeat || (card.settings?.backgroundImage ? 'repeat' : 'no-repeat'),
    backgroundAttachment: card.settings?.backgroundAttachment || 'fixed',
    backgroundPosition: card.settings?.backgroundPosition || 'center',
    width: `${targetWidth}px`,
    height: `${targetHeight}px`,
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderRadius: '12px'
  };

  const handleElementClick = (element) => {
    if (element.link) {
      window.open(element.link, '_blank');
      return;
    }
    // Fallback for older buttons where content is the url
    if (element.type === 'button') {
      const plainText = typeof element.content === 'string' ? element.content.replace(/<[^>]+>/g, '') : '';
      if (plainText.startsWith('http')) {
        window.open(plainText, '_blank');
      }
    }
  };

  const sortedElements = [...elements].sort((a, b) => (a.z || 1) - (b.z || 1));

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      overflow: 'hidden'
    }}>
      <div style={canvasStyle}>
      {sortedElements.map(el => {
        const defaultStyles = {
          text: { fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center' },
          button: { background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', padding: '10px' },
          card: { background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', padding: '16px' },
          image: { objectFit: 'cover', borderRadius: '8px' }
        };

        const style = {
          position: 'absolute',
          left: el.x,
          top: el.y,
          width: el.w,
          height: el.h,
          zIndex: el.z || 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontFamily: el.style?.fontFamily || 'inherit',
          fontWeight: el.style?.fontWeight || defaultStyles[el.type]?.fontWeight || 'normal',
          fontStyle: el.style?.fontStyle || 'normal',
          textDecoration: el.style?.textDecoration || 'none',
          textAlign: el.style?.textAlign || 'center',
          fontSize: el.style?.fontSize || defaultStyles[el.type]?.fontSize || 'inherit',
          ...defaultStyles[el.type],
          ...el.style
        };

        const plainText = typeof el.content === 'string' ? el.content.replace(/<[^>]+>/g, '') : '';
        const urlForIcon = el.link || plainText;
        const SocialIcon = el.type === 'button' ? getSocialIcon(urlForIcon) : null;

        if (el.type === 'image') {
          return <img key={el.id} src={el.content} alt="" style={{...style, pointerEvents: 'none'}} />;
        }

        return (
          <div 
            key={el.id} 
            style={style} 
            className={el.type === 'card' ? 'glass' : ''}
            onClick={() => handleElementClick(el)}
          >
            {SocialIcon && <div>{SocialIcon}</div>}
            {(!SocialIcon || (el.link ? plainText !== el.link : plainText !== el.content)) && (
              <span dangerouslySetInnerHTML={{ __html: el.content }} />
            )}
          </div>
        );
      })}
      </div>
      
      {/* Advertisement Banner */}
      {showAd && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '8px 12px 8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          color: '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          fontWeight: '500'
        }}>
          <a href="https://nambut-fe.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✨ Create your own card at <span style={{ color: '#3b82f6' }}>nambut-fe.vercel.app</span>
          </a>
          <div style={{ width: '1px', height: '14px', background: '#e5e7eb' }}></div>
          <button 
            onClick={() => setShowAd(false)}
            style={{ 
              background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
              borderRadius: '50%'
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
