type Listener = () => void;

type Preferences = {
  personalizedRatio: number; // 0..1
};

let state: Preferences = {
  personalizedRatio: 0.6,
};

const listeners = new Set<Listener>();

export function getPreferences(): Preferences {
  return { ...state };
}

export function setPersonalizedRatio(ratio: number) {
  state = { ...state, personalizedRatio: Math.max(0, Math.min(1, ratio)) };
  listeners.forEach((l) => l());
}

export function subscribePreferences(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

