import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemNotification } from '../../types/documents';

interface NotificationProps {
  notification: SystemNotification;
  onClose: () => void;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  notification,
  onClose,
  className = ''
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <motion.div
      className={`glass-card p-4 max-w-sm border-l-4 ${getColor()} ${className}`}
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-sm">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {notification.timestamp.toLocaleTimeString('es-MX')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200 flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

export default Notification;
