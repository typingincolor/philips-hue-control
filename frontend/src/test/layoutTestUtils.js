/**
 * Visual Layout Test Utilities
 *
 * Provides utilities for testing responsive layout behavior in unit tests.
 * Since jsdom doesn't compute real layouts, we test:
 * - CSS class presence (layout classes)
 * - CSS custom properties (grid columns, spacing)
 * - Media query matching (responsive breakpoints)
 * - Element structure (overlap prevention via DOM order)
 */

import { vi } from 'vitest';

/**
 * Target viewports matching E2E tests and device requirements
 */
export const VIEWPORTS = {
  ipad: { width: 1024, height: 768, name: 'iPad' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  raspberryPi: { width: 800, height: 480, name: 'Raspberry Pi 7"' },
};

/**
 * Expected grid layouts for each viewport
 */
export const EXPECTED_LAYOUTS = {
  ipad: { columns: 4, rows: 2 },
  iphone14: { columns: 2, rows: 4 },
  raspberryPi: { columns: 4, rows: 2 },
};

/**
 * Layout constants
 */
export const LAYOUT_CONSTANTS = {
  MIN_BUTTON_SIZE: 44,
  MIN_EDGE_SPACING: 16,
  MIN_COMPONENT_GAP: 8,
  TOOLBAR_HEIGHT: 56,
  NAV_HEIGHT: 120,
  SPACING_TOLERANCE: 10,
};

/**
 * Creates a matchMedia mock for a specific viewport width
 * @param {number} width - Viewport width in pixels
 * @returns {function} matchMedia mock function
 */
export function createMatchMediaMock(width) {
  return (query) => {
    // Parse common media queries
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
    const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);

    let matches = true;

    if (minWidthMatch) {
      const minWidth = parseInt(minWidthMatch[1], 10);
      matches = matches && width >= minWidth;
    }

    if (maxWidthMatch) {
      const maxWidth = parseInt(maxWidthMatch[1], 10);
      matches = matches && width <= maxWidth;
    }

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  };
}

/**
 * Sets up window.matchMedia mock for a viewport
 * @param {string} viewportKey - Key from VIEWPORTS object (e.g., 'ipad', 'iphone14')
 */
export function setupViewport(viewportKey) {
  const viewport = VIEWPORTS[viewportKey];
  if (!viewport) {
    throw new Error(`Unknown viewport: ${viewportKey}. Use: ${Object.keys(VIEWPORTS).join(', ')}`);
  }

  window.matchMedia = createMatchMediaMock(viewport.width);
  window.innerWidth = viewport.width;
  window.innerHeight = viewport.height;

  return viewport;
}

/**
 * Resets viewport mock to default (desktop-like)
 */
export function resetViewport() {
  window.matchMedia = createMatchMediaMock(1280);
  window.innerWidth = 1280;
  window.innerHeight = 800;
}

/**
 * Gets computed style value for an element
 * Note: In jsdom, computed styles may not reflect real CSS values
 * @param {HTMLElement} element
 * @param {string} property - CSS property name
 * @returns {string} Property value
 */
export function getComputedStyleValue(element, property) {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Checks if an element has a specific CSS class
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

/**
 * Gets the grid column count from CSS grid-template-columns
 * @param {HTMLElement} gridElement
 * @returns {number} Number of columns
 */
export function getGridColumnCount(gridElement) {
  const gridTemplateColumns = getComputedStyleValue(gridElement, 'grid-template-columns');
  if (!gridTemplateColumns || gridTemplateColumns === 'none') {
    return 1;
  }
  // Count the number of column values (space-separated)
  return gridTemplateColumns.split(/\s+/).filter(Boolean).length;
}

/**
 * Assertion helpers for layout testing
 */
export const layoutAssertions = {
  /**
   * Asserts that element has required layout classes
   * @param {HTMLElement} element
   * @param {string[]} requiredClasses
   */
  hasLayoutClasses(element, requiredClasses) {
    const missingClasses = requiredClasses.filter((cls) => !element.classList.contains(cls));
    if (missingClasses.length > 0) {
      throw new Error(`Element missing required layout classes: ${missingClasses.join(', ')}`);
    }
    return true;
  },

  /**
   * Asserts element is present in DOM
   * @param {HTMLElement|null} element
   * @param {string} name - Element description for error message
   */
  isPresent(element, name = 'Element') {
    if (!element) {
      throw new Error(`${name} is not present in the DOM`);
    }
    return true;
  },

  /**
   * Asserts elements are in correct DOM order (for avoiding overlap via stacking)
   * @param {HTMLElement} firstElement - Should appear before secondElement
   * @param {HTMLElement} secondElement
   */
  isDOMOrderedBefore(firstElement, secondElement) {
    const position = firstElement.compareDocumentPosition(secondElement);
    // DOCUMENT_POSITION_FOLLOWING = 4, meaning secondElement follows firstElement
    if (!(position & 4)) {
      throw new Error('Elements are not in expected DOM order');
    }
    return true;
  },

  /**
   * Asserts element has minimum dimensions via style/class checks
   * Note: jsdom doesn't compute actual dimensions, so we check CSS classes/styles
   * @param {HTMLElement} element
   * @param {object} options
   * @param {number} [options.minWidth]
   * @param {number} [options.minHeight]
   */
  hasMinimumDimensions(element, { minWidth, minHeight }) {
    const style = window.getComputedStyle(element);

    if (minWidth !== undefined) {
      const widthValue = parseInt(style.minWidth, 10);
      if (!isNaN(widthValue) && widthValue < minWidth) {
        throw new Error(
          `Element min-width (${widthValue}px) is less than required (${minWidth}px)`
        );
      }
    }

    if (minHeight !== undefined) {
      const heightValue = parseInt(style.minHeight, 10);
      if (!isNaN(heightValue) && heightValue < minHeight) {
        throw new Error(
          `Element min-height (${heightValue}px) is less than required (${minHeight}px)`
        );
      }
    }

    return true;
  },
};

/**
 * Creates a mock bounding client rect for testing
 * @param {object} rect - Rectangle properties
 * @returns {DOMRect-like object}
 */
export function createMockRect({ x = 0, y = 0, width = 100, height = 100 }) {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({ x, y, width, height }),
  };
}

/**
 * Checks if two rectangles overlap
 * @param {DOMRect} rect1
 * @param {DOMRect} rect2
 * @returns {boolean}
 */
export function rectsOverlap(rect1, rect2) {
  return !(
    rect1.right <= rect2.left ||
    rect1.left >= rect2.right ||
    rect1.bottom <= rect2.top ||
    rect1.top >= rect2.bottom
  );
}

/**
 * Checks if rect1 is fully contained within rect2
 * @param {DOMRect} inner
 * @param {DOMRect} outer
 * @returns {boolean}
 */
export function isContainedWithin(inner, outer) {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

/**
 * Calculates spacing between two rectangles
 * @param {DOMRect} rect1
 * @param {DOMRect} rect2
 * @param {'horizontal'|'vertical'} direction
 * @returns {number} Gap in pixels (negative if overlapping)
 */
export function calculateGap(rect1, rect2, direction) {
  if (direction === 'horizontal') {
    // rect1 on left, rect2 on right
    if (rect1.right <= rect2.left) {
      return rect2.left - rect1.right;
    }
    // rect2 on left, rect1 on right
    if (rect2.right <= rect1.left) {
      return rect1.left - rect2.right;
    }
    // Overlapping
    return -Math.min(rect1.right - rect2.left, rect2.right - rect1.left);
  } else {
    // rect1 on top, rect2 on bottom
    if (rect1.bottom <= rect2.top) {
      return rect2.top - rect1.bottom;
    }
    // rect2 on top, rect1 on bottom
    if (rect2.bottom <= rect1.top) {
      return rect1.top - rect2.bottom;
    }
    // Overlapping
    return -Math.min(rect1.bottom - rect2.top, rect2.bottom - rect1.top);
  }
}

/**
 * Helper to run a test across all viewports
 * @param {function} testFn - Test function receiving (viewportKey, viewport) params
 */
export function forEachViewport(testFn) {
  return Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    testFn(key, viewport);
  });
}

/**
 * Creates describe blocks for each viewport
 * Usage: describeForEachViewport((viewportKey, viewport) => { ... test cases ... })
 */
export function describeForEachViewport(describeFn, testSuite) {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    describeFn(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      testSuite(key, viewport);
    });
  });
}
