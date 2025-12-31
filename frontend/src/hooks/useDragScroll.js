import { useRef, useEffect } from 'react';

/**
 * Hook for drag-to-scroll functionality
 * Enables horizontal scrolling via mouse drag and touch on mobile
 */
export const useDragScroll = () => {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if event target is an interactive element that should handle its own events
    const isInteractiveElement = (target) => {
      if (!target || !target.tagName) return false;
      const tagName = target.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'button' || tagName === 'select' || tagName === 'textarea';
    };

    // Mouse handlers
    const handleMouseDown = (e) => {
      // Don't capture events from interactive elements
      if (isInteractiveElement(e.target)) return;

      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      el.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      el.scrollLeft = scrollLeft.current - walk;
    };

    // Touch handlers for mobile/touchscreen
    const handleTouchStart = (e) => {
      // Don't capture events from interactive elements
      if (isInteractiveElement(e.target)) return;

      isDragging.current = true;
      startX.current = e.touches[0].pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    const handleTouchMove = (e) => {
      if (!isDragging.current) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      el.scrollLeft = scrollLeft.current - walk;
    };

    el.style.cursor = 'grab';

    // Mouse events
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousemove', handleMouseMove);

    // Touch events
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return ref;
};
