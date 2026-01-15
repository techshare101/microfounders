"use client";

import { useEffect, useState } from "react";

export function useParallax(intensity = 8) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setOffset(y / intensity);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [intensity]);

  return offset;
}
