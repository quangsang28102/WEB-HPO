import './style.css';
import * as THREE from 'three';
import { Robot } from './robot';

// Shared companion: its position is controlled only by CSS, even while scrolling.
if (!document.getElementById('hpo-robot')) {
  const companion = document.createElement('button');
  companion.id = 'hpo-robot';
  companion.type = 'button';
  companion.setAttribute('aria-label', 'Robot Hiệp Phát — chạm để vẫy tay');
  companion.title = 'Chạm để chào robot!';
  companion.innerHTML = `<svg class="hpo-robot-fallback" viewBox="0 0 140 200" aria-hidden="true"><g stroke="#8aafb5" stroke-width="3" fill="#e8f0ef"><rect x="35" y="95" width="70" height="56" rx="18"/><rect x="21" y="24" width="98" height="77" rx="25"/><rect x="29" y="34" width="82" height="55" rx="18" fill="#102d35"/><path d="M43 151v30h19v-30m16 0v30h19v-30M33 108l-13 39m87-39 13 39" stroke-width="14" stroke-linecap="round"/></g><g stroke="#adfff6" stroke-width="6" stroke-linecap="round" fill="none"><path d="M49 53v12m42-12v12M59 76q11 9 22 0"/></g><circle cx="70" cy="120" r="12" fill="#4668dc"/></svg><canvas aria-hidden="true"></canvas>`;
  document.body.append(companion);
  const canvas = companion.querySelector('canvas')!;
  try {
    start(companion, canvas);
  } catch (error) {
    // Keep a visible robot when the browser cannot create a WebGL context.
    companion.classList.remove('is-ready');
    console.warn('Robot 3D không khả dụng; hiển thị hình thay thế.', error);
  }
}

function start(companion: HTMLButtonElement, canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 30);
  camera.position.set(.3, 2.25, 9.5);
  camera.lookAt(0, 1.95, 0);
  const robot = new Robot();
  scene.add(robot.group);
  scene.add(new THREE.HemisphereLight('#d8faff', '#66777c', 3));
  const key = new THREE.DirectionalLight('#fff4df', 4.2);
  key.position.set(-3, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7bfff1', 2.5);
  rim.position.set(4, 4, -3);
  scene.add(rim);
  const pointer = new THREE.Vector2();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = 0, time = 0, lost = false;
  function render() { renderer.render(scene, camera); }
  function resize() {
    const { width, height } = companion.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!lost) render();
  }
  new ResizeObserver(resize).observe(companion);
  resize();
  companion.classList.add('is-ready');
  function animate(now: number) {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    time += dt;
    robot.update(dt, time, pointer, media.matches);
    render();
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame);
    if (document.hidden || lost) return;
    if (media.matches) {
      robot.resetPose();
      robot.update(0, time, pointer, true);
      render();
    } else {
      last = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }
  companion.addEventListener('click', () => {
    if (lost) return;
    if (media.matches) {
      robot.arms[1].rotation.z = robot.arms[1].rotation.z > 1 ? .13 : 2.5;
      render();
    } else robot.wave();
  });
  companion.addEventListener('pointermove', event => {
    const rect = companion.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
  });
  companion.addEventListener('pointerleave', () => pointer.set(0, 0));
  document.addEventListener('visibilitychange', resume);
  media.addEventListener('change', resume);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    companion.classList.remove('is-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    resize();
    companion.classList.add('is-ready');
    resume();
  });
  resume();
}
