"use client";

import { useEffect, useState } from "react";

export function useParallax(desktopIntensity = 14, mobileIntensity = 22) {
  const [offset, setOffset] = useState(0);
  const [intensity, setIntensity] = useState(desktopIntensity);

  useEffect(() => {
    // Determine intensity based on screen width
    const updateIntensity = () => {
      const isMobile = window.innerWidth < 640;
      setIntensity(isMobile ? mobileIntensity : desktopIntensity);
    };

    updateIntensity();
    window.addEventListener("resize", updateIntensity);

    return () => window.removeEventListener("resize", updateIntensity);
  }, [desktopIntensity, mobileIntensity]);

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
