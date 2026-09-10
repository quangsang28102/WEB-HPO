import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RobotStage } from './scene';

export function createViewer(companion: HTMLButtonElement, welcomeVoiceUrl: string, onChange: () => void, setPaused: (paused: boolean) => void, initialSpeed: number, setSpeed: (speed: number) => void) {
  const dialog = document.createElement('dialog');
  dialog.id = 'hpo-robot-viewer';
  dialog.setAttribute('aria-labelledby', 'hpo-robot-title');
  dialog.innerHTML = `
    <header class="hpo-viewer-header">
      <div><p class="hpo-eyebrow">HIỆP PHÁT COMPANION</p><h2 id="hpo-robot-title">Gặp gỡ robot của bạn</h2></div>
      <button type="button" class="hpo-close" aria-label="Đóng cửa sổ" autofocus>×</button>
    </header>
    <div class="hpo-viewer-body">
      <section class="hpo-model-panel" aria-label="Xem mô hình robot 3D">
        <div class="hpo-model-caption"><span>Mô hình 3D</span><span>360°</span></div>
        <div class="hpo-model-stage" role="img" aria-label="Robot 3D, kéo để xoay và cuộn để thu phóng"></div>
        <p class="hpo-model-hint">Kéo để xoay · Cuộn hoặc chụm hai ngón để thu phóng</p>
        <div class="hpo-model-tools" aria-label="Điều khiển mô hình">
          <button type="button" data-action="left" aria-label="Xoay sang trái">↶</button>
          <button type="button" data-action="right" aria-label="Xoay sang phải">↷</button>
          <button type="button" data-action="in" aria-label="Phóng to">+</button>
          <button type="button" data-action="out" aria-label="Thu nhỏ">−</button>
          <button type="button" data-action="reset">Đặt lại</button>
          <button type="button" data-action="wave">Vẫy tay</button>
        </div>
        <div class="hpo-speed-control">
          <div class="hpo-speed-label"><label for="hpo-robot-speed">Tốc độ di chuyển</label><output for="hpo-robot-speed" id="hpo-robot-speed-value"></output></div>
          <input id="hpo-robot-speed" type="range" min="0.5" max="2" step="0.1" aria-describedby="hpo-speed-hint">
          <div class="hpo-speed-scale" aria-hidden="true"><span>Chậm</span><span>Nhanh</span></div>
          <p id="hpo-speed-hint">Đi một đoạn, dừng lại và nhìn bạn. Tốc độ áp dụng khi robot đi dạo ngoài trang.</p>
        </div>
      </section>
      <section class="hpo-chat-panel" aria-labelledby="hpo-chat-title">
        <div class="hpo-chat-heading"><h3 id="hpo-chat-title">Trò chuyện cùng robot</h3><span class="hpo-soon">Sắp có</span></div>
        <div class="hpo-chat-messages" role="log" aria-label="Tin nhắn">
          <p class="hpo-chat-welcome">Xin chào! Tôi là robot Hiệp Phát.</p>
          <p>Bạn có thể khám phá mô hình 3D bên cạnh. Tính năng trò chuyện sẽ có mặt tại đây trong thời gian tới.</p>
        </div>
        <a class="hpo-enroll-cta" href="https://hpo.edu.vn/dang-ky-hoc/">
          <span>Đăng ký học</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
        <label class="hpo-wander-option"><input type="checkbox" checked> Cho robot tự đi dạo</label>
        <form class="hpo-chat-form">
          <label for="hpo-chat-input">Tin nhắn của bạn</label>
          <div class="hpo-chat-compose"><input id="hpo-chat-input" type="text" placeholder="Trò chuyện sắp ra mắt" disabled><button type="submit" disabled>Gửi</button></div>
        </form>
      </section>
    </div>`;
  document.body.append(dialog);
  const host = dialog.querySelector<HTMLElement>('.hpo-model-stage')!;
  let stage: RobotStage | undefined;
  let controls: OrbitControls | undefined;
  let previousOverflow = '';
  const welcomeVoice = new Audio(welcomeVoiceUrl);
  welcomeVoice.id = 'hpo-robot-welcome-voice';
  welcomeVoice.preload = 'auto';
  dialog.append(welcomeVoice);
  const pointer = new THREE.Vector2();
  const speedInput = dialog.querySelector<HTMLInputElement>('#hpo-robot-speed')!;
  const speedOutput = dialog.querySelector<HTMLOutputElement>('#hpo-robot-speed-value')!;
  const showSpeed = () => {
    speedOutput.value = `${Number(speedInput.value).toFixed(1)}×`;
    speedInput.setAttribute('aria-valuetext', `${Number(speedInput.value).toFixed(1)} lần tốc độ bình thường`);
  };
  speedInput.value = String(initialSpeed);
  showSpeed();
  speedInput.addEventListener('input', () => {
    showSpeed();
    setSpeed(Number(speedInput.value));
  });

  dialog.querySelector('.hpo-close')!.addEventListener('click', () => dialog.close());
  let backdropDown = false;
  const outside = (event: PointerEvent | MouseEvent) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) dialog.close(); });
  dialog.addEventListener('close', () => {
    welcomeVoice.pause();
    welcomeVoice.currentTime = 0;
    controls?.dispose();
    controls = undefined;
    stage?.dispose();
    stage = undefined;
    document.documentElement.style.overflow = previousOverflow;
    companion.setAttribute('aria-expanded', 'false');
    companion.focus({ preventScroll: true });
    onChange();
  });
  dialog.querySelector('form')!.addEventListener('submit', event => event.preventDefault());
  dialog.querySelector<HTMLInputElement>('.hpo-wander-option input')!.addEventListener('change', event => {
    setPaused(!(event.target as HTMLInputElement).checked);
  });
  dialog.querySelector('.hpo-model-tools')!.addEventListener('click', event => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset.action;
    if (!stage || !controls || !action) return;
    if (action === 'reset') controls.reset();
    else if (action === 'wave') {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stage.robot.setGreetingPose(stage.robot.arms[1].rotation.z > 1 ? 0 : 1);
      } else stage.robot.wave();
    } else {
      const offset = stage.camera.position.clone().sub(controls.target);
      if (action === 'left' || action === 'right') offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), action === 'left' ? -.3 : .3);
      else offset.setLength(THREE.MathUtils.clamp(offset.length() * (action === 'in' ? .85 : 1.15), controls.minDistance, controls.maxDistance));
      stage.camera.position.copy(controls.target).add(offset);
      controls.update();
    }
    stage.render();
  });

  return {
    get isOpen() { return dialog.open; },
    open() {
      if (dialog.open) return;
      previousOverflow = document.documentElement.style.overflow;
      dialog.showModal();
      welcomeVoice.currentTime = 0;
      welcomeVoice.play().catch(() => {
        // Some browsers may still block playback despite the initiating click.
      });
      document.documentElement.style.overflow = 'hidden';
      companion.setAttribute('aria-expanded', 'true');
      try {
        stage = new RobotStage(host);
        controls = new OrbitControls(stage.camera, stage.renderer.domElement);
        controls.target.set(0, 1.95, 0);
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 17;
        controls.minPolarAngle = .15;
        controls.maxPolarAngle = Math.PI - .15;
        controls.update();
        controls.saveState();
        controls.addEventListener('change', () => stage?.render());
        stage.onRestore = onChange;
        dialog.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => { button.disabled = false; });
        dialog.querySelector('.hpo-model-hint')!.textContent = 'Kéo để xoay · Cuộn hoặc chụm hai ngón để thu phóng';
      } catch (error) {
        console.warn('Không thể mở mô hình 3D.', error);
        dialog.querySelector('.hpo-model-hint')!.textContent = '3D không khả dụng trên trình duyệt này. Đang hiển thị hình thay thế.';
        dialog.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => { button.disabled = true; });
      }
      onChange();
    },
    tick(dt: number, time: number, reduced: boolean) {
      if (!dialog.open || !stage || stage.lost) return;
      stage.robot.update(dt, time, pointer, reduced);
      stage.render();
    },
    resetMotion() { stage?.robot.resetPose(); },
  };
}
