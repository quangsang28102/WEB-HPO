import './style.css';
import * as THREE from 'three';
import { RobotStage, fallback } from './scene';
import { Wander } from './wander';
import { createViewer } from './viewer';

function mount() {
  if (document.getElementById('hpo-robot')) return;
  const companion = document.createElement('button');
  companion.id = 'hpo-robot';
  companion.type = 'button';
  companion.setAttribute('aria-label', 'Robot Hiệp Phát — nhấn để xem 3D, kéo hoặc dùng phím mũi tên để di chuyển');
  companion.setAttribute('aria-haspopup', 'dialog');
  companion.setAttribute('aria-controls', 'hpo-robot-viewer');
  companion.setAttribute('aria-expanded', 'false');
  companion.title = 'Kéo để di chuyển · Nhấn để xem 3D';
  companion.innerHTML = fallback;
  document.body.append(companion);

  const position = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const wander = new Wander();
  try {
    const savedSpeed = localStorage.getItem('hpo-robot-speed');
    if (savedSpeed !== null) wander.setSpeed(Number(savedSpeed));
  } catch { /* Storage can be unavailable; keep the default speed. */ }
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let stage: RobotStage | undefined;
  let frame = 0, last = 0, time = 0;
  let paused = false, hovered = false, keyboardFocused = false;
  let width = 0, height = 0, minX = 8, minY = 8;
  let drag: { id: number; x: number; y: number; offsetX: number; offsetY: number; moved: boolean } | undefined;
  let suppressClick = false;
  const viewer = createViewer(companion, () => {
    wander.pause();
    resume();
  }, value => { paused = value; }, wander.speed, value => {
    wander.setSpeed(value);
    try { localStorage.setItem('hpo-robot-speed', String(wander.speed)); } catch { /* Optional preference. */ }
  });

  function place() {
    position.x = THREE.MathUtils.clamp(position.x, 0, width);
    position.y = THREE.MathUtils.clamp(position.y, 0, height);
    companion.style.transform = `translate3d(${position.x + minX}px, ${position.y + minY}px, 0)`;
  }
  function resize(initial = false) {
    const viewport = window.visualViewport;
    minX = (viewport?.offsetLeft || 0) + 8;
    minY = (viewport?.offsetTop || 0) + 8;
    width = Math.max(0, (viewport?.width || innerWidth) - companion.offsetWidth - 16);
    height = Math.max(0, (viewport?.height || innerHeight) - companion.offsetHeight - 16);
    if (initial) position.set(0, height);
    place();
  }
  resize(true);
  new ResizeObserver(() => resize()).observe(companion);
  window.addEventListener('resize', () => resize());
  window.visualViewport?.addEventListener('resize', () => resize());
  window.visualViewport?.addEventListener('scroll', () => resize());

  try {
    stage = new RobotStage(companion);
    stage.onRestore = resume;
  } catch (error) {
    console.warn('Robot 3D không khả dụng; hiển thị hình thay thế.', error);
  }

  function animate(now: number) {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    time += dt;
    if (viewer.isOpen) viewer.tick(dt, time, false);
    else {
      wander.update(dt, position, width, height, paused || hovered || keyboardFocused || !!drag || !!stage?.lost, !drag);
      place();
      if (stage && !stage.lost) {
        stage.robot.group.rotation.y = wander.heading;
        if (!drag && !stage.robot.isWaving && wander.takeGreeting()) stage.robot.wave();
        stage.robot.update(dt, time, pointer, false, wander.walking);
        stage.render();
      }
    }
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame);
    if (document.hidden) return;
    if (media.matches) {
      stage?.robot.resetPose();
      stage?.render();
      viewer.resetMotion();
      viewer.tick(0, time, true);
    } else {
      last = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }

  companion.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    suppressClick = false;
    keyboardFocused = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
      offsetX: event.clientX - position.x - minX, offsetY: event.clientY - position.y - minY, moved: false };
    companion.setPointerCapture(event.pointerId);
    wander.pause();
  });
  companion.addEventListener('pointermove', event => {
    if (drag && event.pointerId === drag.id) {
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      drag.moved = true;
      companion.classList.add('is-dragging');
      const nextX = event.clientX - drag.offsetX - minX;
      const nextY = event.clientY - drag.offsetY - minY;
      const dx = nextX - position.x, dy = nextY - position.y;
      if (Math.hypot(dx, dy) > 1) {
        const desired = Math.atan2(dx, dy);
        wander.heading += Math.atan2(Math.sin(desired - wander.heading), Math.cos(desired - wander.heading)) * .3;
      }
      position.set(nextX, nextY);
      place();
      if (stage) {
        stage.robot.group.rotation.y = wander.heading;
        stage.render();
      }
    } else {
      const rect = companion.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    }
  });
  function endDrag(event?: PointerEvent) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const current = drag;
    drag = undefined;
    suppressClick = current.moved;
    if (companion.hasPointerCapture(current.id)) companion.releasePointerCapture(current.id);
    companion.classList.remove('is-dragging');
    wander.pause();
  }
  companion.addEventListener('pointerup', endDrag);
  companion.addEventListener('pointercancel', endDrag);
  companion.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('blur', () => { endDrag(); hovered = false; });
  companion.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    suppressClick = false;
    viewer.open();
  });
  companion.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hovered = true; });
  companion.addEventListener('pointerleave', () => { hovered = false; pointer.set(0, 0); });
  companion.addEventListener('focus', () => { keyboardFocused = companion.matches(':focus-visible'); });
  companion.addEventListener('blur', () => { keyboardFocused = false; });
  companion.addEventListener('keydown', event => {
    const delta: Record<string, [number, number]> = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] };
    if (!delta[event.key]) return;
    event.preventDefault();
    keyboardFocused = true;
    const [dx, dy] = delta[event.key];
    position.x += dx;
    position.y += dy;
    wander.heading = Math.atan2(dx, dy);
    place();
    if (stage) { stage.robot.group.rotation.y = wander.heading; stage.render(); }
    wander.pause();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) endDrag(); resume(); });
  media.addEventListener('change', resume);
  resume();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();
