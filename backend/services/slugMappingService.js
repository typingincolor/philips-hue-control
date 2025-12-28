/**
 * Slug Mapping Service - Generates stable, human-readable slugs for device IDs
 * Maps between slugs and internal UUIDs for each service
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SLUG_MAPPING');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SlugMappingServiceClass {
  constructor() {
    // Mapping: serviceId → { uuid → slug }
    this._uuidToSlug = new Map();
    // Reverse mapping: serviceId → { slug → uuid }
    this._slugToUuid = new Map();
    // Track used slugs per service to handle collisions
    this._usedSlugs = new Map();

    this._filePath = path.join(__dirname, '..', 'data', 'slug-mappings.json');
    this._loaded = false;
  }

  /**
   * Load mappings from file
   */
  _load() {
    if (this._loaded) return;

    try {
      if (fs.existsSync(this._filePath)) {
        const contents = fs.readFileSync(this._filePath, 'utf8');
        if (contents && contents.trim()) {
          const data = JSON.parse(contents);

          // Restore mappings
          for (const [serviceId, mappings] of Object.entries(data)) {
            const uuidMap = new Map();
            const slugMap = new Map();
            const usedSet = new Set();

            for (const [uuid, slug] of Object.entries(mappings)) {
              uuidMap.set(uuid, slug);
              slugMap.set(slug, uuid);
              usedSet.add(slug);
            }

            this._uuidToSlug.set(serviceId, uuidMap);
            this._slugToUuid.set(serviceId, slugMap);
            this._usedSlugs.set(serviceId, usedSet);
          }

          logger.info('Loaded slug mappings', { services: Object.keys(data).length });
        }
      }
    } catch (error) {
      logger.warn('Failed to load slug mappings', { error: error.message });
    }

    this._loaded = true;
  }

  /**
   * Save mappings to file
   */
  _save() {
    try {
      const dir = path.dirname(this._filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {};
      for (const [serviceId, uuidMap] of this._uuidToSlug.entries()) {
        data[serviceId] = Object.fromEntries(uuidMap);
      }

      fs.writeFileSync(this._filePath, JSON.stringify(data, null, 2));
      logger.debug('Saved slug mappings');
    } catch (error) {
      logger.warn('Failed to save slug mappings', { error: error.message });
    }
  }

  /**
   * Generate a URL-safe slug from a name
   * @param {string} name - Device/room name
   * @returns {string} URL-safe slug
   */
  _generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/['']/g, '') // Remove apostrophes
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  /**
   * Get or create a slug for a UUID
   * @param {string} serviceId - Service identifier (e.g., 'hue')
   * @param {string} uuid - Internal UUID
   * @param {string} name - Human-readable name for slug generation
   * @returns {string} Stable slug
   */
  getSlug(serviceId, uuid, name) {
    this._load();

    // Check if we already have a mapping
    const uuidMap = this._uuidToSlug.get(serviceId);
    if (uuidMap?.has(uuid)) {
      return uuidMap.get(uuid);
    }

    // Generate a new slug
    const baseSlug = this._generateSlug(name) || 'device';
    let slug = baseSlug;
    let counter = 1;

    // Ensure maps exist for this service
    if (!this._uuidToSlug.has(serviceId)) {
      this._uuidToSlug.set(serviceId, new Map());
      this._slugToUuid.set(serviceId, new Map());
      this._usedSlugs.set(serviceId, new Set());
    }

    const usedSlugs = this._usedSlugs.get(serviceId);

    // Handle collisions
    while (usedSlugs.has(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Store the mapping
    this._uuidToSlug.get(serviceId).set(uuid, slug);
    this._slugToUuid.get(serviceId).set(slug, uuid);
    usedSlugs.add(slug);

    logger.debug('Created slug mapping', { serviceId, uuid: uuid.substring(0, 8), slug });

    // Persist
    this._save();

    return slug;
  }

  /**
   * Get UUID from a slug
   * @param {string} serviceId - Service identifier
   * @param {string} slug - Slug to look up
   * @returns {string|null} UUID or null if not found
   */
  getUuid(serviceId, slug) {
    this._load();

    const slugMap = this._slugToUuid.get(serviceId);
    return slugMap?.get(slug) || null;
  }

  /**
   * Check if a slug exists
   * @param {string} serviceId - Service identifier
   * @param {string} slug - Slug to check
   * @returns {boolean}
   */
  hasSlug(serviceId, slug) {
    this._load();

    const slugMap = this._slugToUuid.get(serviceId);
    return slugMap?.has(slug) || false;
  }

  /**
   * Clear all mappings (for testing)
   */
  clear() {
    this._uuidToSlug.clear();
    this._slugToUuid.clear();
    this._usedSlugs.clear();
    this._loaded = false;
  }

  /**
   * Set file path (for testing)
   */
  setFilePath(filePath) {
    this._filePath = filePath;
    this._loaded = false;
  }
}

const slugMappingService = new SlugMappingServiceClass();
export default slugMappingService;
