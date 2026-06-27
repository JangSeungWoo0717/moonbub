import { createConfig } from "./model.js";

const CONFIG_KEY = "gachalab_config";
const defaultStore = () => globalThis.localStorage;

export function loadConfig(store = defaultStore()) {
  try {
    const raw = store.getItem(CONFIG_KEY);
    if (!raw) return createConfig();
    return createConfig(JSON.parse(raw));
  } catch {
    return createConfig();
  }
}

export function saveConfig(config, store = defaultStore()) {
  store.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export function clearConfig(store = defaultStore()) {
  store.removeItem(CONFIG_KEY);
}
