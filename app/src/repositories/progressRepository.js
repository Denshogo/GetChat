import { STORAGE_KEYS } from "../constants.js";
import { loadJson, saveJson } from "../storage.js";

const DEFAULT_PROGRESS = {
  points: 0,
  awarded_events: {},
  updated_at: null,
};

export class ProgressRepository {
  get() {
    const data = loadJson(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
    return {
      points: Number(data.points ?? 0),
      awarded_events: data.awarded_events ?? {},
      updated_at: data.updated_at ?? null,
    };
  }

  getPoints() {
    return this.get().points;
  }

  awardOnce(eventKey, points) {
    const state = this.get();
    if (state.awarded_events[eventKey]) {
      return false;
    }

    const next = {
      ...state,
      points: state.points + points,
      awarded_events: {
        ...state.awarded_events,
        [eventKey]: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };

    saveJson(STORAGE_KEYS.PROGRESS, next);
    return true;
  }
}
