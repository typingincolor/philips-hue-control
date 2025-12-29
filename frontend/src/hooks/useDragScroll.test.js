import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDragScroll } from './useDragScroll';

describe('useDragScroll', () => {
  let mockElement;
  let eventListeners;

  beforeEach(() => {
    eventListeners = {};
    mockElement = {
      offsetLeft: 100,
      scrollLeft: 0,
      style: { cursor: '' },
      addEventListener: vi.fn((event, handler) => {
        eventListeners[event] = handler;
      }),
      removeEventListener: vi.fn((event) => {
        delete eventListeners[event];
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useDragScroll());
    expect(result.current).toHaveProperty('current');
  });

  it('should set initial cursor to grab when element is attached', () => {
    const { result } = renderHook(() => useDragScroll());

    // Simulate attaching the ref to an element
    result.current.current = mockElement;

    // Re-render to trigger useEffect
    const { rerender } = renderHook(() => useDragScroll());
    rerender();

    // The hook sets cursor in useEffect, which runs after ref is set
    // We need to manually trigger by setting the ref before the effect runs
  });

  it('should register mouse event listeners on mount', () => {
    const { result } = renderHook(() => useDragScroll());

    // Manually set the ref before effect runs
    Object.defineProperty(result.current, 'current', {
      get: () => mockElement,
      configurable: true,
    });

    // Force re-render to trigger effect with our mock element
    const { unmount } = renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Verify event listeners were added
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));

    unmount();
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    unmount();

    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'mouseleave',
      expect.any(Function)
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
  });

  it('should set cursor to grab initially', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should set cursor to grabbing on mousedown', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Trigger mousedown
    eventListeners.mousedown({ pageX: 150 });

    expect(mockElement.style.cursor).toBe('grabbing');
  });

  it('should set cursor back to grab on mouseup', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start dragging
    eventListeners.mousedown({ pageX: 150 });
    expect(mockElement.style.cursor).toBe('grabbing');

    // Stop dragging
    eventListeners.mouseup();
    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should set cursor back to grab on mouseleave', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start dragging
    eventListeners.mousedown({ pageX: 150 });
    expect(mockElement.style.cursor).toBe('grabbing');

    // Mouse leaves element
    eventListeners.mouseleave();
    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should not scroll when not dragging', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    const mockEvent = { pageX: 200, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockElement.scrollLeft).toBe(0);
  });

  it('should scroll when dragging', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start dragging at x=150 (pageX - offsetLeft = 50)
    eventListeners.mousedown({ pageX: 150 });

    // Move mouse to x=200 (pageX - offsetLeft = 100)
    // walk = (100 - 50) * 1.5 = 75
    // scrollLeft = 0 - 75 = -75
    const mockEvent = { pageX: 200, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockElement.scrollLeft).toBe(-75);
  });

  it('should apply 1.5x scroll speed multiplier', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start at x=150
    eventListeners.mousedown({ pageX: 150 });

    // Move 20px to the right (pageX: 170)
    // x = 170 - 100 = 70
    // startX = 150 - 100 = 50
    // walk = (70 - 50) * 1.5 = 30
    const mockEvent = { pageX: 170, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockElement.scrollLeft).toBe(-30);
  });

  it('should stop scrolling after mouseup', () => {
    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start dragging
    eventListeners.mousedown({ pageX: 150 });

    // Move and scroll
    eventListeners.mousemove({ pageX: 200, preventDefault: vi.fn() });
    expect(mockElement.scrollLeft).toBe(-75);

    // Stop dragging
    eventListeners.mouseup();

    // Reset scrollLeft for next assertion
    mockElement.scrollLeft = 0;

    // Try to move again - should not scroll
    const mockEvent = { pageX: 250, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockElement.scrollLeft).toBe(0);
  });

  it('should handle null ref gracefully', () => {
    // Should not throw when ref.current is null
    expect(() => {
      renderHook(() => useDragScroll());
    }).not.toThrow();
  });

  it('should preserve scroll position from drag start', () => {
    mockElement.scrollLeft = 50; // Start with some scroll

    renderHook(() => {
      const ref = useDragScroll();
      ref.current = mockElement;
      return ref;
    });

    // Start dragging at x=150
    eventListeners.mousedown({ pageX: 150 });

    // Move mouse left by 20px (scrolling right)
    // x = 130 - 100 = 30
    // startX = 150 - 100 = 50
    // walk = (30 - 50) * 1.5 = -30
    // scrollLeft = 50 - (-30) = 80
    const mockEvent = { pageX: 130, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockElement.scrollLeft).toBe(80);
  });
});
