import { SwipeAction } from '../types';

let actions: SwipeAction[] = [];
const listeners = new Set<(a: SwipeAction[]) => void>();

export function addSwipeAction(a: SwipeAction) {
  actions = [...actions, a];
  listeners.forEach((l) => l(actions));
}

export function getSwipeHistory() {
  return actions;
}

export function subscribeSwipeHistory(listener: (a: SwipeAction[]) => void) {
  listeners.add(listener);
  listener(actions);
  return () => listeners.delete(listener);
}

