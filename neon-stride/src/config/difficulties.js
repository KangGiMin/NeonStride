import { RULES } from "./rules.js";

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({
    label: "쉬움",
    initialSpeed: RULES.initialSpeed,
    maxSpeed: RULES.maxSpeed,
    acceleration: RULES.acceleration,
    revealDistance: 150,
    eventLead: 1.8,
    spacing: 2.35,
    description: "기존 속도 · 여유롭게 시작하는 질주",
  }),
  normal: Object.freeze({
    label: "보통",
    initialSpeed: 19,
    maxSpeed: 38,
    acceleration: 0.075,
    revealDistance: 125,
    eventLead: 1.35,
    spacing: 2.1,
    description: "쉬움보다 빠르게 · 리듬을 타는 질주",
  }),
  hard: Object.freeze({
    label: "어려움",
    initialSpeed: 31,
    maxSpeed: 53,
    acceleration: 0.11,
    revealDistance: 80,
    eventLead: 0.95,
    spacing: 1.7,
    description: "순발력 트레이닝 · 빠른 판단이 필요한 질주",
  }),
  extreme: Object.freeze({
    label: "매우 어려움",
    initialSpeed: 48,
    maxSpeed: 76,
    acceleration: 0.17,
    revealDistance: 42,
    eventLead: 0.56,
    spacing: 1.4,
    description: "한순간의 반응 · 극한 속도의 질주",
  }),
});
export const DEFAULT_DIFFICULTY = "easy";
