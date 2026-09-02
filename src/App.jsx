import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Editor from './pages/Editor';
import Viewer from './pages/Viewer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/card/:id" element={<Editor />} />
      <Route path="/view/:id" element={<Viewer />} />
    </Routes>
  );
}

export default App;
