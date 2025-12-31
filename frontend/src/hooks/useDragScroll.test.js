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

  it('should return a callback ref function', () => {
    const { result } = renderHook(() => useDragScroll());
    expect(typeof result.current).toBe('function');
  });

  it('should set initial cursor to grab when element is attached', () => {
    const { result } = renderHook(() => useDragScroll());

    // Call the callback ref with the mock element
    result.current(mockElement);

    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should register mouse event listeners when callback is called', () => {
    const { result } = renderHook(() => useDragScroll());

    // Call the callback ref with the mock element
    result.current(mockElement);

    // Verify event listeners were added
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should remove event listeners when callback is called with null', () => {
    const { result } = renderHook(() => useDragScroll());

    // Attach element
    result.current(mockElement);

    // Detach element
    result.current(null);

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      'mouseleave',
      expect.any(Function)
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should set cursor to grab initially', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should set cursor to grabbing on mousedown', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Trigger mousedown
    eventListeners.mousedown({ pageX: 150, target: {} });

    expect(mockElement.style.cursor).toBe('grabbing');
  });

  it('should set cursor back to grab on mouseup', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start dragging
    eventListeners.mousedown({ pageX: 150, target: {} });
    expect(mockElement.style.cursor).toBe('grabbing');

    // Stop dragging
    eventListeners.mouseup();
    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should set cursor back to grab on mouseleave', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start dragging
    eventListeners.mousedown({ pageX: 150, target: {} });
    expect(mockElement.style.cursor).toBe('grabbing');

    // Mouse leaves element
    eventListeners.mouseleave();
    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should not scroll when not dragging', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    const mockEvent = { pageX: 200, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockElement.scrollLeft).toBe(0);
  });

  it('should scroll when dragging', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start dragging at x=150 (pageX - offsetLeft = 50)
    eventListeners.mousedown({ pageX: 150, target: {} });

    // Move mouse to x=200 (pageX - offsetLeft = 100)
    // walk = (100 - 50) * 1.5 = 75
    // scrollLeft = 0 - 75 = -75
    const mockEvent = { pageX: 200, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockElement.scrollLeft).toBe(-75);
  });

  it('should apply 1.5x scroll speed multiplier', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start at x=150
    eventListeners.mousedown({ pageX: 150, target: {} });

    // Move 20px to the right (pageX: 170)
    // x = 170 - 100 = 70
    // startX = 150 - 100 = 50
    // walk = (70 - 50) * 1.5 = 30
    const mockEvent = { pageX: 170, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockElement.scrollLeft).toBe(-30);
  });

  it('should stop scrolling after mouseup', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start dragging
    eventListeners.mousedown({ pageX: 150, target: {} });

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

  it('should handle null element gracefully', () => {
    const { result } = renderHook(() => useDragScroll());
    // Should not throw when called with null
    expect(() => {
      result.current(null);
    }).not.toThrow();
  });

  it('should preserve scroll position from drag start', () => {
    mockElement.scrollLeft = 50; // Start with some scroll

    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Start dragging at x=150
    eventListeners.mousedown({ pageX: 150, target: {} });

    // Move mouse left by 20px (scrolling right)
    // x = 130 - 100 = 30
    // startX = 150 - 100 = 50
    // walk = (30 - 50) * 1.5 = -30
    // scrollLeft = 50 - (-30) = 80
    const mockEvent = { pageX: 130, preventDefault: vi.fn() };
    eventListeners.mousemove(mockEvent);

    expect(mockElement.scrollLeft).toBe(80);
  });

  it('should not capture events from input elements', () => {
    const { result } = renderHook(() => useDragScroll());
    result.current(mockElement);

    // Trigger mousedown on an input element
    eventListeners.mousedown({ pageX: 150, target: { tagName: 'INPUT' } });

    // Cursor should not change to grabbing (event was ignored)
    expect(mockElement.style.cursor).toBe('grab');
  });
});
