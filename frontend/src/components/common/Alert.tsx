import React from 'react';

interface Props {
  type: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<Props> = ({ type, message, onClose }) => (
  <div className={`alert alert-${type}`}>
    <span>{message}</span>
    {onClose && (
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
    )}
  </div>
);
