import { useRef, useState, useEffect } from 'react';

const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setInView(entry.isIntersecting);
    }, options);
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return [ref, inView];
};

export default useIntersectionObserver;