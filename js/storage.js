import { createEmptyProfile } from "./model.js";

const VERSIONS_KEY = "argumap_versions";
const PROFILE_KEY = "argumap_profile";
const defaultStore = () => globalThis.localStorage;

function readJSON(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadVersions(store = defaultStore()) {
  const v = readJSON(store, VERSIONS_KEY, []);
  return Array.isArray(v) ? v : [];
}

export function saveVersion(arg, store = defaultStore()) {
  const all = loadVersions(store);
  all.unshift(arg);
  store.setItem(VERSIONS_KEY, JSON.stringify(all));
  return all;
}

export function loadProfile(store = defaultStore()) {
  return readJSON(store, PROFILE_KEY, createEmptyProfile());
}

export function saveProfile(profile, store = defaultStore()) {
  store.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearAll(store = defaultStore()) {
  store.removeItem(VERSIONS_KEY);
  store.removeItem(PROFILE_KEY);
}
