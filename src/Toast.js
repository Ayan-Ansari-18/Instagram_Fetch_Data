import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
};

export default Toast;
