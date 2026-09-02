import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaGithub, FaDiscord } from 'react-icons/fa';

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

const ElementRenderer = ({ element, onUpdate, isSelected }) => {
  const { type, content, style } = element;
  const contentEditableRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    if (!isEditing) setLocalContent(content);
  }, [content, isEditing]);

  const defaultStyles = {
    text: { fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center' },
    button: { background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', padding: '10px' },
    card: { background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--surface-border)', padding: '16px' },
    image: { objectFit: 'cover', width: '100%', height: '100%', borderRadius: '8px' }
  };

  const combinedStyle = {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: style.fontFamily || 'inherit',
    fontWeight: style.fontWeight || defaultStyles[type]?.fontWeight || 'normal',
    fontStyle: style.fontStyle || 'normal',
    textDecoration: style.textDecoration || 'none',
    textAlign: style.textAlign || 'center',
    fontSize: style.fontSize || defaultStyles[type]?.fontSize || 'inherit',
    outline: 'none',
    ...defaultStyles[type],
    ...style
  };

  const handleDoubleClick = (e) => {
    if (type !== 'image') {
      e.stopPropagation();
      setIsEditing(true);
      setTimeout(() => {
        if (contentEditableRef.current) {
          contentEditableRef.current.focus();
          document.execCommand('selectAll', false, null);
        }
      }, 50);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (contentEditableRef.current) {
        onUpdate({ ...element, content: contentEditableRef.current.innerHTML });
      }
    }
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') contentEditableRef.current?.blur();
  };

  const onMouseDown = (e) => {
    if (isEditing) e.stopPropagation();
  };

  if (type === 'image') {
    return <img src={content || 'https://via.placeholder.com/300'} alt="Element" style={{ ...combinedStyle, pointerEvents: 'none' }} />;
  }

  // Detect social icon based on raw text (strip html tags if any)
  const plainText = typeof localContent === 'string' ? localContent.replace(/<[^>]+>/g, '') : '';
  const SocialIcon = type === 'button' ? getSocialIcon(plainText) : null;

  return (
    <div
      ref={contentEditableRef}
      style={{ ...combinedStyle, cursor: isEditing ? 'text' : 'pointer' }}
      className={type === 'card' ? 'glass' : ''}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={onMouseDown}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
    >
      {SocialIcon && <div contentEditable={false} style={{display: 'flex', alignItems: 'center'}}>{SocialIcon}</div>}
      <span dangerouslySetInnerHTML={{ __html: localContent }} />
    </div>
  );
};

export default ElementRenderer;
