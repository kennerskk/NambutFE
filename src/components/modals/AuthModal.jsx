import React, { useState } from 'react';
import { api } from '../../api/client';

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      let data;
      if (isLogin) {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, password);
      }
      
      localStorage.setItem('token', data.token);
      onSuccess(data.user, data.token);
    } catch (err) {
      setError(err.error || 'Authentication failed');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginTop: 0 }}>{isLogin ? 'Login to Save' : 'Create Account'}</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="sidebar-label">Username</label>
            <input 
              type="text" 
              className="sidebar-input" 
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="sidebar-label">Password</label>
            <input 
              type="password" 
              className="sidebar-input" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <p 
          style={{ textAlign: 'center', fontSize: '14px', cursor: 'pointer', color: 'var(--primary)' }} 
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
        <button 
          className="btn btn-outline" 
          style={{ width: '100%', marginTop: '1rem' }} 
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
