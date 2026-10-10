"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_LOGO);

  useEffect(() => {
    setImageSrc(src || FALLBACK_LOGO);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={128}
      height={128}
      className={className}
      onError={() => {
        if (imageSrc !== FALLBACK_LOGO) {
          setImageSrc(FALLBACK_LOGO);
        }
      }}
    />
  );
}