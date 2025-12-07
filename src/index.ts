
/**
 * Datastar Persist Plugin - Simple Sequential Implementation
 * Handles data-persist attributes for automatic signal persistence to storage
 * No throttling - saves immediately on every signal change
 */
import { attribute } from "datastar";
import { effect, getPath, mergePatch, beginBatch, endBatch } from 'datastar';

interface PersistConfig {
  storage: Storage;
  storageKey: string;
  signals: string[];
  isWildcard: boolean;
}

const DEFAULT_STORAGE_KEY = "datastar";

function getStorage(isSession: boolean): Storage | null {
  try {
    const storage = isSession ? sessionStorage : localStorage;
    const testKey = "__test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function parseConfig(key: string | null, value: any, mods: Map<string, Set<string>>, el: HTMLElement): PersistConfig | null {
  const isSession = mods.has("session");
  const storage = getStorage(isSession);
  if (!storage) return null;

  const storageKey = key ? `${DEFAULT_STORAGE_KEY}-${key}` : DEFAULT_STORAGE_KEY;

  let signals: string[] = [];
  let isWildcard = false;

  // Get raw attribute value from element
  let rawValue = value;
  if (value === undefined || value === null || (typeof value !== 'string')) {
    rawValue = el.getAttribute('data-persist') || el.getAttribute('data-persist:' + (key || '')) || '';
  }

  const trimmedValue = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (trimmedValue) {
    signals = trimmedValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    isWildcard = true;
  }

  return { storage, storageKey, signals, isWildcard };
}

function loadFromStorage(config: PersistConfig): void {
  try {
    const stored = config.storage.getItem(config.storageKey);
    if (!stored) return;

    const data = JSON.parse(stored);
    if (!data || typeof data !== "object") return;

    beginBatch();
    try {
      if (config.isWildcard) {
        mergePatch(data);
      } else {
        const patch = Object.fromEntries(
          config.signals.filter((signal) => signal in data).map((signal) => [signal, data[signal]])
        );
        if (Object.keys(patch).length > 0) {
          mergePatch(patch);
        }
      }
    } finally {
      endBatch();
    }
  } catch {
    // Silent fail on storage errors
  }
}

function getSignalsFromElement(el: HTMLElement): string[] {
  const signals: string[] = [];

  // Scan for data-signals:signalName attributes
  for (const attr of el.attributes) {
    if (attr.name.startsWith("data-signals:")) {
      const signalName = attr.name.substring("data-signals:".length);
      if (signalName) signals.push(signalName);
    }
  }

  // Check for data-signals="{...}" syntax
  const signalsAttr = el.getAttribute("data-signals");
  if (signalsAttr) {
    try {
      const keyMatches = signalsAttr.matchAll(/(\w+)\s*:/g);
      for (const match of keyMatches) {
        if (match[1] && !signals.includes(match[1])) {
          signals.push(match[1]);
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return signals;
}

function saveToStorage(config: PersistConfig, signalData: Record<string, any>): void {
  try {
    const stored = config.storage.getItem(config.storageKey);
    const existing = stored ? JSON.parse(stored) : {};
    const merged = { ...existing, ...signalData };

    if (Object.keys(merged).length > 0) {
      config.storage.setItem(config.storageKey, JSON.stringify(merged));
    }
  } catch {
    // Storage quota exceeded or other errors
  }
}

console.log('[Persist Plugin] Loaded');

attribute({
  name: 'persist',
  requirement: 'optional',
  apply({ el, key, mods, value }) {
    console.log('[Persist Plugin] Apply called', { el, key, value });
    const config = parseConfig(key ?? null, value, mods, el as HTMLElement);
    if (!config) {
      console.warn('[Persist Plugin] No config');
      return;
    }
    console.log('[Persist Plugin] Config:', config);

    // Step 1: Load data from storage
    loadFromStorage(config);

    // Step 2: Watch signals and save on change
    const cleanup = effect(() => {
      const signals = config.isWildcard ? getSignalsFromElement(el as HTMLElement) : config.signals;
      const data: Record<string, any> = {};

      // Collect current signal values
      for (const signal of signals) {
        try {
          data[signal] = getPath(signal);
        } catch {
          // Signal not found, skip
        }
      }

      // Step 3: Save immediately to storage
      if (Object.keys(data).length > 0) {
        saveToStorage(config, data);
      }
    });

    return cleanup;
  },
});
