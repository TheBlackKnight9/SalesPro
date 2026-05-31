"use client";

import React from "react";

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogoIcon: React.FC<AppLogoProps> = ({ className = "h-9 w-9", size }) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-lg shadow-sm border border-[var(--color-border)] dark:border-transparent ${className}`}
      style={size ? { width: size, height: size } : {}}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        fill="none" 
        className="h-full w-full"
      >
        <rect width="100" height="100" className="hidden dark:block fill-black" />
        <circle cx="50" cy="50" r="8" className="stroke-black dark:stroke-white" strokeWidth="4" />
        <circle cx="50" cy="25" r="6" className="stroke-black dark:stroke-white" strokeWidth="4" />
        <circle cx="50" cy="75" r="6" className="stroke-black dark:stroke-white" strokeWidth="4" />
        <circle cx="25" cy="50" r="6" className="stroke-black dark:stroke-white" strokeWidth="4" />
        <circle cx="75" cy="50" r="6" className="stroke-black dark:stroke-white" strokeWidth="4" />
        <path 
          d="M50 31V42M50 58V69M31 50H42M58 50H69" 
          className="stroke-black dark:stroke-white" 
          strokeWidth="4" 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
};

export const AppLogo: React.FC<AppLogoProps & { withText?: boolean }> = ({ 
  className, 
  size, 
  withText = true 
}) => {
  return (
    <div className="flex items-center gap-2.5">
      <AppLogoIcon className={className} size={size} />
      {withText && (
        <span className="text-[17px] font-black tracking-tight text-[var(--color-text-primary)]">
          SalesPro <span className="text-[var(--color-text-secondary)]">CRM</span>
        </span>
      )}
    </div>
  );
};
