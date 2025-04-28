import { useEffect } from "react";
import { useLocation } from "react-router";

export const ScrollRestoration = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`scrollPosition-${pathname}`);
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    }

    const onScroll = () => {
      sessionStorage.setItem(`scrollPosition-${pathname}`, String(window.scrollY));
    };

    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
};