import * as THREE from 'three';
import { Robot } from './robot';

export const fallback = `<svg class="hpo-robot-fallback" viewBox="0 0 140 200" aria-hidden="true"><g stroke="#8aafb5" stroke-width="3" fill="#e8f0ef"><rect x="35" y="95" width="70" height="56" rx="18"/><rect x="21" y="24" width="98" height="77" rx="25"/><rect x="29" y="34" width="82" height="55" rx="18" fill="#102d35"/><path d="M43 151v30h19v-30m16 0v30h19v-30M33 108l-13 39m87-39 13 39" stroke-width="14" stroke-linecap="round"/></g><g stroke="#adfff6" stroke-width="6" stroke-linecap="round" fill="none"><path d="M49 53v12m42-12v12M59 76q11 9 22 0"/></g><circle cx="70" cy="120" r="12" fill="#4668dc"/></svg>`;

/** A stage owns its GPU resources and resize/context listeners. */
export class RobotStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(35, 1, .1, 60);
  readonly robot: Robot;
  lost = false;
  onRestore = () => {};
  private observer: ResizeObserver;
  private events = new AbortController();
  private shadow: THREE.Mesh;

  constructor(readonly host: HTMLElement) {
    host.innerHTML = `${fallback}<canvas aria-hidden="true"></canvas>`;
    const canvas = host.querySelector('canvas')!;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.camera.position.set(0, 2.25, 10);
    this.camera.lookAt(0, 1.95, 0);
    this.robot = new Robot();
    // Soft ground contact shadow stays on the floor while the body bobs and turns.
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { strength: { value: .52 } },
      vertexShader: `varying vec2 shadowUv; void main() { shadowUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 shadowUv; uniform float strength; void main() { float r=length((shadowUv-.5)*2.0); float alpha=pow(1.0-smoothstep(0.0,1.0,r),1.3)*strength; gl_FragColor=vec4(.035,.065,.075,alpha); }`,
    });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.55,1.85),shadowMaterial);
    this.shadow.rotation.x=-Math.PI/2;
    this.shadow.position.set(.10,-.015,.10);
    this.scene.add(this.shadow);
    this.scene.add(this.robot.group, new THREE.HemisphereLight('#d8faff', '#66777c', 3));
    const key = new THREE.DirectionalLight('#fff4df', 4.2);
    key.position.set(-3, 7, 5);
    const rim = new THREE.DirectionalLight('#7bfff1', 2.5);
    rim.position.set(4, 4, -3);
    this.scene.add(key, rim);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      this.lost = true;
      host.classList.remove('is-ready');
    }, { signal: this.events.signal });
    canvas.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      this.resize();
      host.classList.add('is-ready');
      this.onRestore();
    }, { signal: this.events.signal });
    this.resize();
    host.classList.add('is-ready');
  }

  resize() {
    const width = this.host.clientWidth, height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    const lift = Math.max(0,this.robot.group.position.y);
    this.shadow.scale.setScalar(1+lift*2);
    (this.shadow.material as THREE.ShaderMaterial).uniforms.strength.value=.52-lift*.7;
    if (!this.lost) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.events.abort();
    this.observer.disconnect();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.host.classList.remove('is-ready');
    this.host.innerHTML = fallback;
  }
}
