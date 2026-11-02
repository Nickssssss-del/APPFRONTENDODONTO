import { useRef, useState, useEffect } from 'react';

const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setInView(entry.isIntersecting);
    }, options);
    const element = ref.current;
    if (element) {
      observer.observe(element);
    }
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return [ref, inView] as const;
};

export default useIntersectionObserver;