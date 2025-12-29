/**
 * Request Context - Provides request-scoped storage using AsyncLocalStorage
 * Allows services to access request context (like demoMode) without explicit parameter passing
 */

import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Run a function within a request context
 * @param {Object} context - Context object to store (e.g., { demoMode: true })
 * @param {Function} fn - Function to run within the context
 * @returns {*} Result of the function
 */
export function runWithContext(context, fn) {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Get the current request context
 * @returns {Object|undefined} Current context or undefined if not in a context
 */
export function getContext() {
  return asyncLocalStorage.getStore();
}

/**
 * Check if currently in demo mode
 * @returns {boolean} True if in demo mode context
 */
export function isDemoMode() {
  const context = getContext();
  return context?.demoMode || false;
}

export default {
  runWithContext,
  getContext,
  isDemoMode,
};
