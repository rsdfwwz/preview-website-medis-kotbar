import React, { useState } from 'react';
import { HeartPulse } from 'lucide-react';

interface HospitalLogoProps {
  className?: string;
  imgClassName?: string;
  showBadge?: boolean;
}

export function HospitalLogo({
  className = 'h-10 w-10',
  imgClassName = 'h-full w-full object-contain',
  showBadge = false,
}: HospitalLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-[#8B1515] text-white ${className}`}
      >
        <HeartPulse className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${
        showBadge ? 'rounded-xl bg-[#8B1515] p-1.5' : 'rounded-xl'
      } ${className}`}
    >
      <img
        src="/logo-rskbr.svg"
        alt="Logo RS Kota Baru"
        className={imgClassName}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default HospitalLogo;