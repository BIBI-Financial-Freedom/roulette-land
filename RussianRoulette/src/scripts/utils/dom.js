/** DOM 유틸리티 */

export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

export function showOverlay(overlayId) {
  document.getElementById(overlayId).classList.add('active');
}

export function hideOverlay(overlayId) {
  document.getElementById(overlayId).classList.remove('active');
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
