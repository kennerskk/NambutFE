export const TEMPLATES = {
  blank: {
    name: 'Blank',
    settings: { backgroundColor: '#f8fafc', backgroundImage: 'none' },
    desktopElements: []
  },
  minimal: {
    name: 'Minimal Clean',
    settings: { backgroundColor: '#ffffff', backgroundImage: 'none', textColor: '#1a1a1a' },
    desktopElements: [
      { id: 'm1', type: 'text', content: 'JANE DOE', x: 80, y: 220, w: 400, h: 60, z: 1, style: { fontSize: '48px', fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'left', color: '#0f172a' } },
      { id: 'm2', type: 'text', content: 'Creative Director', x: 80, y: 290, w: 400, h: 40, z: 2, style: { fontSize: '20px', fontFamily: 'Inter', fontWeight: 'normal', textAlign: 'left', color: '#64748b' } },
      { id: 'm3', type: 'button', content: 'https://linkedin.com/in/jane', x: 80, y: 350, w: 150, h: 50, z: 3, style: { background: '#0f172a', color: '#ffffff', borderRadius: '8px' } },
      { id: 'm4', type: 'image', content: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop', x: 600, y: 100, w: 350, h: 400, z: 4, style: { borderRadius: '24px', objectFit: 'cover' } }
    ]
  },
  creative: {
    name: 'Creative Gradient',
    settings: { backgroundColor: '#0f172a', backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #d946ef 100%)', textColor: '#ffffff' },
    desktopElements: [
      { id: 'c1', type: 'card', content: '', x: 325, y: 100, w: 400, h: 400, z: 1, style: { background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.2)' } },
      { id: 'c2', type: 'text', content: 'JOHN SMITH', x: 325, y: 220, w: 400, h: 60, z: 2, style: { fontSize: '42px', fontFamily: 'Poppins', fontWeight: 'bold', textAlign: 'center', color: '#ffffff' } },
      { id: 'c3', type: 'text', content: 'Full Stack Developer', x: 325, y: 280, w: 400, h: 40, z: 3, style: { fontSize: '18px', fontFamily: 'Poppins', fontWeight: 'normal', textAlign: 'center', color: '#e2e8f0' } },
      { id: 'c4', type: 'button', content: 'https://github.com/john', x: 450, y: 340, w: 150, h: 50, z: 4, style: { background: '#ffffff', color: '#0f172a', borderRadius: '50px' } }
    ]
  }
};
