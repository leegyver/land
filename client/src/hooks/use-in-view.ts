import { useState, useEffect, useRef } from "react";

export function useInView<T extends HTMLElement>({
  threshold = 0,
  rootMargin = "0px",
  triggerOnce = true,
}: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
} = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, inView };
}
