import React, { useState, useEffect } from 'react';

interface SalonLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  logoUrl?: string;
  altText?: string;
}

export const SalonLogo: React.FC<SalonLogoProps> = ({
  size = 'md',
  className = '',
  showBorder = true,
  logoUrl,
  altText = 'Lashm.anya Logo',
}) => {
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return logoUrl || '/assets/lashmanya_logo.jpg';
  });

  useEffect(() => {
    if (logoUrl) {
      setCurrentSrc(logoUrl);
      setImgError(false);
    } else {
      setCurrentSrc('/assets/lashmanya_logo.jpg');
    }
  }, [logoUrl]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl',
  }[size];

  const borderClass = showBorder ? 'ring-1 ring-[#E8DFD6] shadow-2xs' : '';

  if (!imgError && currentSrc) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 bg-[#FAF6F0] flex items-center justify-center ${sizeClasses} ${borderClass} ${className}`}
      >
        <img
          src={currentSrc}
          alt={altText}
          onError={() => {
            if (currentSrc !== '/assets/lashmanya_logo.jpg') {
              setCurrentSrc('/assets/lashmanya_logo.jpg');
            } else {
              setImgError(true);
            }
          }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Graceful vector SVG fallback with eyelashes & typography
  return (
    <div
      className={`relative rounded-full shrink-0 bg-gradient-to-br from-[#FAF6F0] via-[#F4EFEB] to-[#EAE0D5] flex items-center justify-center text-[#483F38] ${sizeClasses} ${borderClass} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[85%] h-[85%] text-[#483F38]"
        fill="currentColor"
      >
        {/* Soft decorative ring */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#D8C8B8" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Stylized delicate lash curves */}
        <path
          d="M25,44 Q50,30 75,44"
          fill="none"
          stroke="#483F38"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lashes */}
        <path d="M32,41 Q28,33 26,30" fill="none" stroke="#483F38" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M41,37 Q39,28 38,24" fill="none" stroke="#483F38" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50,35 Q50,25 50,22" fill="none" stroke="#483F38" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M59,37 Q61,28 62,24" fill="none" stroke="#483F38" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M68,41 Q72,33 74,30" fill="none" stroke="#483F38" strokeWidth="1.5" strokeLinecap="round" />
        {/* Stylized L */}
        <text
          x="50"
          y="74"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="30"
          fontStyle="italic"
          fontWeight="500"
          textAnchor="middle"
          fill="#483F38"
        >
          L
        </text>
      </svg>
    </div>
  );
};
