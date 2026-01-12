import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 7.5L10 1.67L17.5 7.5V16.67C17.5 17.13 17.32 17.56 17 17.88C16.68 18.2 16.25 18.33 15.83 18.33H4.17C3.71 18.33 3.28 18.15 2.96 17.83C2.64 17.51 2.5 17.08 2.5 16.67V7.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 18.33V10H12.5V18.33" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="3.33" width="15" height="15" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M2.5 7.5H17.5" stroke={color} strokeWidth="1.5"/>
    <path d="M6.67 1.67V5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13.33 1.67V5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const ArchiveIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M16.67 6.67V16.67C16.67 17.58 15.92 18.33 15 18.33H5C4.08 18.33 3.33 17.58 3.33 16.67V6.67" stroke={color} strokeWidth="1.5"/>
    <rect x="1.67" y="1.67" width="16.67" height="5" rx="1" stroke={color} strokeWidth="1.5"/>
    <path d="M8.33 11.67H11.67" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11.67 1.67H5C4.08 1.67 3.33 2.42 3.33 3.33V16.67C3.33 17.58 4.08 18.33 5 18.33H15C15.92 18.33 16.67 17.58 16.67 16.67V6.67L11.67 1.67Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.67 1.67V6.67H16.67" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.67 10H13.33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.67 13.33H13.33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const LabIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6.67 1.67V6.67L2.5 15C2.08 15.83 2.67 16.67 3.58 16.67H16.42C17.33 16.67 17.92 15.83 17.5 15L13.33 6.67V1.67" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 1.67H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7.5 10H12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="1.67" y="3.33" width="16.67" height="13.33" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M1.67 7.5H18.33" stroke={color} strokeWidth="1.5"/>
    <path d="M5 12.5H8.33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="6.67" r="3.33" stroke={color} strokeWidth="1.5"/>
    <path d="M3.33 16.67C3.33 14.09 6.32 12.08 10 12.08C13.68 12.08 16.67 14.09 16.67 16.67" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const HelpIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8.33" stroke={color} strokeWidth="1.5"/>
    <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5C11.38 5 12.5 6.12 12.5 7.5C12.5 8.88 11.38 10 10 10V11.67" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="14.17" r="0.83" fill={color}/>
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 20, color = '#FB3748', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 17.5H4.17C3.71 17.5 3.28 17.32 2.96 17C2.64 16.68 2.5 16.25 2.5 15.83V4.17C2.5 3.71 2.68 3.28 3 2.96C3.32 2.64 3.75 2.5 4.17 2.5H7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.33 14.17L17.5 10L13.33 5.83" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 10H7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CollapseIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 6H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 18H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21C13.55 21.3 13.3 21.55 12.99 21.71C12.68 21.88 12.34 21.97 12 21.97C11.66 21.97 11.32 21.88 11.01 21.71C10.7 21.55 10.45 21.3 10.27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.17" cy="9.17" r="5.83" stroke={color} strokeWidth="1.5"/>
    <path d="M16.67 16.67L13.33 13.33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 24, color = '#FFC043', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 18.99C1.56 19.33 1.66 19.67 1.84 19.96C2.02 20.26 2.28 20.5 2.59 20.67C2.9 20.84 3.25 20.93 3.61 20.93H20.39C20.75 20.93 21.1 20.84 21.41 20.67C21.72 20.5 21.98 20.26 22.16 19.96C22.34 19.67 22.44 19.33 22.45 18.99C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.52 3.56 13.26 3.32 12.95 3.15C12.64 2.98 12.29 2.89 11.94 2.89C11.59 2.89 11.24 2.98 10.93 3.15C10.62 3.32 10.36 3.56 10.18 3.86H10.29Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="17" r="1" fill="white"/>
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 12, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 20, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="3.33" y="8.33" width="13.33" height="10" rx="2" stroke={color} strokeWidth="1.5"/>
    <path d="M5.83 8.33V5.83C5.83 4.73 6.27 3.67 7.05 2.89C7.83 2.11 8.89 1.67 10 1.67C11.11 1.67 12.17 2.11 12.95 2.89C13.73 3.67 14.17 4.73 14.17 5.83V8.33" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="13.33" r="1.67" fill={color}/>
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 16, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.67" stroke={color} strokeWidth="1.2"/>
    <path d="M8 7.33V10.67" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="8" cy="5.33" r="0.67" fill={color}/>
  </svg>
);

export const HealthcareIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V5" stroke="url(#healthcare_gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 2V5" stroke="url(#healthcare_gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#healthcare_gradient)" strokeWidth="1.5"/>
    <path d="M3 9H21" stroke="url(#healthcare_gradient)" strokeWidth="1.5"/>
    <path d="M12 13V17" stroke="url(#healthcare_gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 15H14" stroke="url(#healthcare_gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <defs>
      <linearGradient id="healthcare_gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#03A5FF"/>
        <stop offset="1" stopColor="#1FC16B"/>
      </linearGradient>
    </defs>
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 20, color = '#EF4444', className }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.37 3.84C16.94 3.39 16.43 3.04 15.87 2.79C15.31 2.54 14.71 2.42 14.1 2.42C13.49 2.42 12.89 2.54 12.33 2.79C11.77 3.04 11.26 3.39 10.83 3.84L10 4.71L9.17 3.84C8.29 2.92 7.09 2.42 5.84 2.42C4.59 2.42 3.39 2.92 2.51 3.84C1.63 4.76 1.14 6 1.14 7.29C1.14 8.58 1.63 9.82 2.51 10.74L3.34 11.61L10 18.54L16.66 11.61L17.49 10.74C17.93 10.29 18.27 9.77 18.51 9.19C18.75 8.62 18.87 8 18.87 7.38C18.87 6.76 18.75 6.14 18.51 5.57C18.27 4.99 17.93 4.47 17.49 4.02L17.37 3.84Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
