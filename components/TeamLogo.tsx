"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_LOGO = "/teams/default.png";

type TeamLogoProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export default function TeamLogo({
  src,
  alt,
  className,
}: TeamLogoProps) {
  // Remember which src failed to load instead of copying src into state:
  // a new src is tried automatically, without an extra render.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src && src !== failedSrc ? src : FALLBACK_LOGO;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={128}
      height={128}
      className={className}
      onError={() => {
        if (imageSrc !== FALLBACK_LOGO) setFailedSrc(imageSrc);
      }}
    />
  );
}
