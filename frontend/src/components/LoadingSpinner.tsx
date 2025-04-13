import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-3',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-blue-200 rounded-full`}></div>
        <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>
      <div className="text-gray-600 text-sm">{message}</div>
    </div>
  );
};

export default LoadingSpinner; 