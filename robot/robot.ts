import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Expression = 'happy' | 'neutral' | 'thinking';

/** Procedural model. Public methods can be called by a future chat controller. */
export class Robot {
  readonly group = new THREE.Group();
  readonly head = new THREE.Group();
  readonly torso = new THREE.Group();
  readonly arms = [new THREE.Group(), new THREE.Group()];
  readonly legs = [new THREE.Group(), new THREE.Group()];
  private eyes: THREE.Mesh[] = [];
  private mouth!: THREE.Mesh;
  private expression: Expression = 'happy';
  private waveTime = -1;
  private white = new THREE.MeshStandardMaterial({ color: '#e8f0ef', metalness: .35, roughness: .29 });
  private dark = new THREE.MeshStandardMaterial({ color: '#283b41', metalness: .7, roughness: .35 });
  private silver = new THREE.MeshStandardMaterial({ color: '#8aafb5', metalness: .75, roughness: .26 });
  private cyan = new THREE.MeshStandardMaterial({ color: '#adfff6', emissive: '#69ffe6', emissiveIntensity: 2.2 });

  constructor() {
    const box = (parent: THREE.Object3D, size: number[], pos: number[], mat = this.white, radius = .1) => {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 4, radius), mat);
      mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const sphere = (parent: THREE.Object3D, radius: number, pos: number[], mat = this.dark) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), mat);
      mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; parent.add(mesh); return mesh;
    };
    const cylinder = (parent: THREE.Object3D, radius: number, depth: number, pos: number[], mat = this.silver) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 40), mat);
      mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; parent.add(mesh); return mesh;
    };
    this.group.add(this.head, this.torso, ...this.arms, ...this.legs);
    this.head.position.y = 3.18;
    box(this.head, [1.73, 1.46, 1.18], [0, 0, 0], this.white, .4);
    box(this.head, [1.5, 1.18, .2], [0, -.025, .56], this.silver, .33);
    const visor = new THREE.MeshPhysicalMaterial({ color:'#071b20', metalness:.25, roughness:.23, clearcoat:1 });
    box(this.head, [1.38, 1.07, .21], [0, -.025, .63], visor, .3);
    for (const side of [-1, 1]) {
      const eye=new THREE.Mesh(new THREE.CapsuleGeometry(.087,.16,6,16),this.cyan);eye.scale.z=.3;eye.position.set(side*.32,.06,.765);this.head.add(eye);this.eyes.push(eye);
      const ear = cylinder(this.head, .34, .16, [side * .9, -.025, 0]); ear.rotation.z = Math.PI / 2;
      const earCap = cylinder(this.head, .27, .19, [side * .96, -.025, 0], this.white); earCap.rotation.z = Math.PI / 2;
      box(this.head, [.035,.29,.07], [side*1.062,0,.08], this.cyan, .015);
      box(this.head, [.035,.25,.025], [side*.57,.58,.4], this.silver,.01);
    }
    const smile = new THREE.CatmullRomCurve3([new THREE.Vector3(-.14,-.22,.758),new THREE.Vector3(-.07,-.285,.77),new THREE.Vector3(.04,-.295,.77),new THREE.Vector3(.14,-.235,.758)]);
    this.mouth = new THREE.Mesh(new THREE.TubeGeometry(smile,24,.016,8,false),this.cyan); this.head.add(this.mouth);
    cylinder(this.head, .12,.025,[0,.745,0],this.dark);
    this.torso.position.y = 2.04;
    cylinder(this.torso,.19,.25,[0,.46,0],this.dark);
    box(this.torso,[.99,.89,.69],[0,0,0],this.white,.25);
    box(this.torso,[.76,.055,.54],[0,-.36,.015],this.silver,.02);
    const badge = cylinder(this.torso,.225,.045,[0,.06,.355],new THREE.MeshStandardMaterial({color:'#4668dc',metalness:.35,roughness:.25}));badge.rotation.x=Math.PI/2;
    const emblem = new THREE.Shape(); emblem.moveTo(-.115,-.065);emblem.lineTo(-.045,.075);emblem.lineTo(.015,-.015);emblem.lineTo(.105,.085);emblem.lineTo(.055,-.075);emblem.lineTo(-.005,-.025);emblem.closePath();
    const mark = new THREE.Mesh(new THREE.ShapeGeometry(emblem),new THREE.MeshStandardMaterial({color:'#e8f17e',emissive:'#d7e25c',emissiveIntensity:.3}));mark.position.set(0,.06,.382);this.torso.add(mark);
    for(let i=0;i<3;i++)box(this.torso,[.075,.025,.015],[(i-1)*.12,-.24,.345],i===0?this.cyan:this.dark,.007);
    cylinder(this.group,.25,.24,[0,1.46,0],this.dark);
    box(this.group,[.78,.3,.59],[0,1.3,0],this.white,.1);
    for(let i=0;i<2;i++) {
      const side=i===0?-1:1;
      const arm=this.arms[i];arm.position.set(side*.67,2.32,0);arm.rotation.z=side*.13;
      sphere(arm,.205,[0,0,0],this.silver);
      box(arm,[.31,.45,.35],[0,-.28,0],this.white,.12);
      sphere(arm,.145,[0,-.56,0]);
      box(arm,[.34,.44,.38],[0,-.8,.015],this.white,.1);
      box(arm,[.17,.07,.035],[0,-.82,.21],this.silver,.02);
      sphere(arm,.1,[0,-1.065,0],this.silver);
      box(arm,[.25,.22,.22],[0,-1.21,.02],this.white,.06);
      for(let f=0;f<3;f++)box(arm,[.06,.14,.1],[(f-1)*.083,-1.37,.05],this.silver,.025);
      const thumb=box(arm,[.09,.19,.12],[-side*.17,-1.22,.07],this.white,.04);thumb.rotation.z=-side*.45;
      const leg=this.legs[i];leg.position.set(side*.265,1.18,0);
      sphere(leg,.17,[0,0,0]);
      box(leg,[.35,.39,.4],[0,-.23,0],this.white,.11);
      sphere(leg,.165,[0,-.48,.035],this.silver);
      box(leg,[.28,.21,.09],[0,-.49,.17],this.dark,.05);
      box(leg,[.4,.42,.43],[side*.025,-.75,0],this.white,.11);
      box(leg,[.22,.05,.025],[side*.025,-.76,.23],this.silver,.01);
      box(leg,[.49,.25,.7],[side*.03,-1.035,.13],this.white,.09);
      box(leg,[.5,.075,.7],[side*.03,-1.137,.13],this.dark,.025);
    }
  }

  get isWaving() { return this.waveTime >= 0; }
  wave() { if(this.isWaving) return false; this.waveTime=0;return true; }
  setExpression(expression: Expression) { this.expression=expression;this.mouth.visible=expression!=='thinking';this.mouth.scale.y=expression==='neutral'?.35:1; }
  resetPose() { this.waveTime=-1;this.group.position.y=0;this.group.rotation.set(0,0,0);this.legs.forEach(leg=>leg.rotation.set(0,0,0));this.head.rotation.set(0,0,0);this.arms.forEach((arm,i)=>arm.rotation.set(0,0,i===0?-.13:.13));this.setExpression('happy'); }
  update(dt: number, time: number, pointer: THREE.Vector2, reducedMotion: boolean, walking = false) {
    const smooth=1-Math.exp(-dt*5);
    this.group.position.y=reducedMotion?0:Math.sin(time*1.8)*.025;
    this.head.rotation.y=THREE.MathUtils.lerp(this.head.rotation.y,reducedMotion?0:pointer.x*.16,smooth);
    this.head.rotation.x=THREE.MathUtils.lerp(this.head.rotation.x,reducedMotion?0:-pointer.y*.09,smooth);
    const blink = !reducedMotion && time%4.8>4.62 ? .12 : 1;
    this.eyes.forEach((eye,i)=>eye.scale.y=blink*(this.expression==='thinking'&&i===1?.5:1));
    if(this.waveTime>=0) {
      this.waveTime+=dt;
      const t=this.waveTime;
      const envelope=t<.65?THREE.MathUtils.smoothstep(t,0,.65):1-THREE.MathUtils.smoothstep(t,2.1,2.8);
      this.arms[1].rotation.z=.13+envelope*(2.5+Math.sin(t*11)*.22);
      this.arms[1].rotation.x=-envelope*.18;
      if(t>=2.8){this.waveTime=-1;this.arms[1].rotation.set(0,0,.13);}
    } else this.arms[1].rotation.z=.13+(reducedMotion?0:Math.sin(time*1.8)*.025);
    this.arms[0].rotation.z=-.13-(reducedMotion?0:Math.sin(time*1.8)*.025);
    const stride=walking&&!reducedMotion?Math.sin(time*8)*.42:0;
    this.legs.forEach((leg,i)=>leg.rotation.x=THREE.MathUtils.lerp(leg.rotation.x,i===0?stride:-stride,smooth));
    this.arms[0].rotation.x=THREE.MathUtils.lerp(this.arms[0].rotation.x,-stride*.75,smooth);
    if(!this.isWaving)this.arms[1].rotation.x=THREE.MathUtils.lerp(this.arms[1].rotation.x,stride*.75,smooth);
    if(walking&&!reducedMotion)this.group.position.y=Math.abs(Math.sin(time*8))*.055;
  }
}
