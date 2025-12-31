import { useRef, useCallback } from 'react';

/**
 * Hook for drag-to-scroll functionality
 * Enables horizontal scrolling via mouse drag and touch on mobile
 * Returns a callback ref that should be passed to the scrollable element
 */
export const useDragScroll = () => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const elementRef = useRef(null);
  const cleanupRef = useRef(null);

  // Check if event target is an input element that needs its own drag behavior
  const isInputElement = (target) => {
    if (!target || !target.tagName) return false;
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'select' || tagName === 'textarea';
  };

  // Callback ref that sets up event listeners when element is attached
  const setRef = useCallback((el) => {
    // Clean up previous element if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    elementRef.current = el;

    if (!el) return;

    // Mouse handlers
    const handleMouseDown = (e) => {
      if (isInputElement(e.target)) return;

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
      if (isInputElement(e.target)) return;

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

    // Add event listeners
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Store cleanup function
    cleanupRef.current = () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return setRef;
};
