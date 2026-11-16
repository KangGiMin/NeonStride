import { HUD } from "../config/interface.js";

export const formatScore = (score) => String(score).padStart(HUD.digits, "0");
export const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export const formatDistance = (distance) =>
  `${Math.floor(distance).toLocaleString("ko-KR")} m`;
