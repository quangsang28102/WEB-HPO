import * as THREE from 'three';
import { EyeMotion } from './eye-motion';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Expression = 'happy' | 'neutral' | 'thinking';

/** Procedural model. Public methods can be called by a future chat controller. */
export class Robot {
  readonly group = new THREE.Group();
  readonly head = new THREE.Group();
  readonly torso = new THREE.Group();
  readonly arms = [new THREE.Group(), new THREE.Group()];
  readonly elbows = [new THREE.Group(), new THREE.Group()];
  readonly wrists = [new THREE.Group(), new THREE.Group()];
  readonly legs = [new THREE.Group(), new THREE.Group()];
  private eyes: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  private eyeMotion = new EyeMotion();
  private mouth!: THREE.Mesh;
  private expression: Expression = 'happy';
  private waveTime = -1;
  private white = new THREE.MeshStandardMaterial({ color: '#e8f0ef', metalness: .35, roughness: .29 });
  private dark = new THREE.MeshStandardMaterial({ color: '#283b41', metalness: .7, roughness: .35 });
  private silver = new THREE.MeshStandardMaterial({ color: '#8aafb5', metalness: .75, roughness: .26 });
  private cyan = new THREE.MeshStandardMaterial({ color: '#adfff6', emissive: '#69ffe6', emissiveIntensity: .85 });

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
    this.group.scale.z = 1.18;
    this.torso.scale.z = 1.2;
    // Reference proportions: helmet is about 42% of height, twice chest width.
    this.head.position.y = 3.51;
    // A broad crown and rounded sides, with full depth at the back of the helmet.
    const shellGeometry = new THREE.SphereGeometry(1,64,40);
    const shellPositions = shellGeometry.attributes.position;
    const rounded = (value: number) => Math.sign(value)*Math.abs(value)**(2/2.6);
    for(let i=0;i<shellPositions.count;i++) {
      shellPositions.setXYZ(i,rounded(shellPositions.getX(i)),.91*rounded(shellPositions.getY(i)),.84*rounded(shellPositions.getZ(i)));
    }
    shellGeometry.computeVertexNormals();
    const helmet=new THREE.Mesh(shellGeometry,this.white);this.head.add(helmet);
    helmet.castShadow=true;
    // Thin curved patches follow the helmet surface: no stacked protruding boxes.
    const faceZ = (x: number, y: number) => .84 * Math.max(0,1-Math.abs(x)**2.6-Math.abs(y/.91)**2.6)**(1/2.6);
    const facePatch = (width: number, height: number, lift: number, material: THREE.Material) => {
      const vertices: number[] = [0,-.07,faceZ(0,-.07)+lift];
      const indices: number[] = [];
      const segments=64, rings=12;
      for(let r=1;r<=rings;r++) for(let i=0;i<segments;i++) {
        const angle=i/segments*Math.PI*2;
        const x=width*.5*r/rings*Math.sign(Math.cos(angle))*Math.abs(Math.cos(angle))**.5;
        const y=height*.5*r/rings*Math.sign(Math.sin(angle))*Math.abs(Math.sin(angle))**.5-.07;
        vertices.push(x,y,faceZ(x,y)+lift);
        const current=1+(r-1)*segments+i, next=1+(r-1)*segments+(i+1)%segments;
        if(r===1) indices.push(0,current,next);
        else { const previous=current-segments, previousNext=next-segments; indices.push(previous,current,next,previous,next,previousNext); }
      }
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
      geometry.setIndex(indices);geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,material);this.head.add(mesh);
    };
    facePatch(1.56,1.19,.008,this.silver);
    const visor = new THREE.MeshPhysicalMaterial({ color:'#071b20', metalness:.15, roughness:.24, clearcoat:1 });
    facePatch(1.46,1.09,.014,visor);
    for (const side of [-1, 1]) {
      // The shader closes vertically on the curved face without moving the eye width.
      const eyeX=side*.32, eyeY=.04;
      const geometry=new THREE.PlaneGeometry(2.4,2.4,24,24);
      const positions=geometry.attributes.position;
      for(let i=0;i<positions.count;i++) {
        const x=positions.getX(i)*.132, y=positions.getY(i)*.225;
        positions.setXYZ(i,x,y,faceZ(eyeX+x,eyeY+y)-faceZ(eyeX,eyeY)+.024);
      }
      geometry.computeVertexNormals();
      const eyeMaterial=new THREE.ShaderMaterial({
        toneMapped:false, transparent:true, depthWrite:false,
        uniforms:{
          closure:{value:0},
          gaze:{value:this.eyeMotion.gaze},
          cream:{value:new THREE.Color('#fff1df')},
          green:{value:new THREE.Color('#64e2bb')},
          ink:{value:new THREE.Color('#080e0d')},
        },
        vertexShader:`varying vec2 eyeUv; void main(){ eyeUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader:`
          varying vec2 eyeUv;
          uniform float closure;
          uniform vec2 gaze;
          uniform vec3 cream, green, ink;
          void main(){
            vec2 p=(eyeUv*2.0-1.0)*1.2;
            float height=mix(1.0,.05,closure);
            float curve=closure*.07*(1.0-p.x*p.x);
            vec2 shape=vec2(p.x,(p.y-curve)/height);
            float edge=length(shape);
            float aa=max(fwidth(edge),.002);
            float fill=1.0-smoothstep(1.0-aa,1.0+aa,edge);
            float rim=smoothstep(.87-aa,.87+aa,edge);
            vec2 look=p-gaze;
            float pupil=1.0-smoothstep(.97,1.03,length((look-vec2(.12,.025))/vec2(.49,.69)));
            // Pupil stays full-sized behind the moving lids and fades as they close.
            float visibility=1.0-closure;
            vec3 color=mix(cream,ink,pupil*visibility);
            float glint=1.0-smoothstep(.10,.14,length((look-vec2(-.02,.35))*vec2(1.0,1.35)));
            float smallGlint=1.0-smoothstep(.04,.07,length(look-vec2(.27,-.28)));
            color=mix(color,vec3(1.0),max(glint,smallGlint)*pupil*visibility);
            color=mix(color,green,max(rim,smoothstep(.85,1.0,closure)));
            // Small local halo gives the rim a glow without a full-screen bloom pass.
            float distanceOutside=max(0.0,edge-1.0)*height;
            float halo=exp(-pow(distanceOutside/.055,2.0))*.30;
            halo*=1.0-smoothstep(1.02,1.17,abs(p.x));
            float alpha=max(fill,halo);
            color=mix(green,color,fill);
            if(alpha<.005) discard;
            gl_FragColor=vec4(color,alpha);
            #include <colorspace_fragment>
          }`,
      });
      const eye=new THREE.Mesh(geometry,eyeMaterial);
      eye.name=side<0?'eye-left':'eye-right';
      eye.position.set(eyeX,eyeY,faceZ(eyeX,eyeY));
      this.head.add(eye);this.eyes.push(eye);
      const ear=cylinder(this.head,.30,.12,[side*.97,-.055,-.04]);ear.rotation.z=Math.PI/2;
      const cap=cylinder(this.head,.25,.10,[side*1.035,-.055,-.04],this.white);cap.rotation.z=Math.PI/2;
      box(this.head,[.025,.24,.045],[side*1.091,-.04,.025],this.cyan,.01);
    }
    const smilePoints=[[-.14,-.26],[-.07,-.315],[.04,-.325],[.14,-.275]];
    const smile=new THREE.CatmullRomCurve3(smilePoints.map(([x,y])=>new THREE.Vector3(x,y,faceZ(x,y)+.025)));
    this.mouth=new THREE.Mesh(new THREE.TubeGeometry(smile,24,.012,8,false),this.cyan);this.head.add(this.mouth);
    // Inset panel lines define the crown in the reference helmet.
    for(const side of [-1,1]) {
      const points=[];
      for(let i=0;i<=24;i++) {
        const angle=.35+i/24*1.8;
        const x=side*.50;
        const section=(1-Math.abs(x)**2.6)**(1/2.6);
        points.push(new THREE.Vector3(x,.91*section*rounded(Math.sin(angle)),.84*section*rounded(Math.cos(angle))));
      }
      this.head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.007,5,false),this.silver));
    }
    this.torso.position.y = 2.04;
    cylinder(this.torso,.145,.34,[0,.57,0],this.dark);
    for (const y of [.44,.52,.60,.68]) cylinder(this.torso,.18,.035,[0,y,0],this.silver);
    cylinder(this.torso,.235,.055,[0,.405,0],this.white);
    box(this.torso,[.99,.89,.69],[0,0,0],this.white,.25);
    box(this.torso,[.76,.055,.54],[0,-.36,.015],this.silver,.02);
    const badge = cylinder(this.torso,.225,.045,[0,.06,.355],new THREE.MeshStandardMaterial({color:'#4668dc',metalness:.35,roughness:.25}));badge.rotation.x=Math.PI/2;
    const emblem = new THREE.Shape(); emblem.moveTo(-.115,-.065);emblem.lineTo(-.045,.075);emblem.lineTo(.015,-.015);emblem.lineTo(.105,.085);emblem.lineTo(.055,-.075);emblem.lineTo(-.005,-.025);emblem.closePath();
    const mark = new THREE.Mesh(new THREE.ShapeGeometry(emblem),new THREE.MeshStandardMaterial({color:'#e8f17e',emissive:'#d7e25c',emissiveIntensity:.3}));mark.position.set(0,.06,.382);this.torso.add(mark);
    for(let i=0;i<3;i++)box(this.torso,[.075,.025,.015],[(i-1)*.12,-.24,.345],i===0?this.cyan:this.dark,.007);
    cylinder(this.group,.25,.24,[0,1.46,0],this.dark);
    for (const y of [1.39,1.46,1.53]) cylinder(this.group,.265,.027,[0,y,0],this.silver);
    box(this.group,[.78,.3,.74],[0,1.3,0],this.white,.1);
    // Layered hinge housings expose a dark bearing, silver rim and axle cap.
    const hinge = (parent: THREE.Object3D, radius: number, y: number, z = 0) => {
      sphere(parent,radius,[0,y,z],this.dark);
      for (const side of [-1,1]) {
        const rim=cylinder(parent,radius*.86,.045,[side*radius*.78,y,z],this.silver);
        rim.rotation.z=Math.PI/2;
        const cap=cylinder(parent,radius*.58,.05,[side*radius*.94,y,z],this.white);
        cap.rotation.z=Math.PI/2;
        const axle=cylinder(parent,radius*.23,.055,[side*radius*1.1,y,z],this.dark);
        axle.rotation.z=Math.PI/2;
      }
    };
    for(let i=0;i<2;i++) {
      const side=i===0?-1:1;
      const arm=this.arms[i];arm.position.set(side*.67,2.32,0);arm.rotation.z=side*.13;
      hinge(arm,.205,0);
      const shoulderCover=cylinder(arm,.15,.035,[0,0,.165],this.silver);shoulderCover.rotation.x=Math.PI/2;
      const shoulderInset=cylinder(arm,.105,.04,[0,0,.185],this.white);shoulderInset.rotation.x=Math.PI/2;
      cylinder(arm,.085,.36,[0,-.29,0],this.dark);
      box(arm,[.29,.29,.33],[0,-.29,0],this.white,.1);
      const elbow=this.elbows[i];elbow.position.y=-.56;arm.add(elbow);
      hinge(elbow,.135,0);
      cylinder(elbow,.075,.27,[0,-.22,0],this.silver);
      box(elbow,[.30,.34,.34],[0,-.25,.015],this.white,.09);
      box(elbow,[.15,.05,.025],[0,-.26,.195],this.silver,.015);
      const wrist=this.wrists[i];wrist.position.y=-.505;elbow.add(wrist);
      sphere(wrist,.09,[0,0,0],this.silver);
      cylinder(wrist,.10,.045,[0,-.01,0],this.dark);
      box(wrist,[.23,.19,.18],[0,-.135,.02],this.white,.055);
      // Palm faces local -Z; forearm supination presents it during the greeting.
      const palm=box(wrist,[.17,.125,.025],[0,-.14,-.075],this.silver,.025);
      palm.name='palm';
      box(wrist,[.12,.012,.008],[0,-.16,-.091],this.dark,.004);
      for(let f=0;f<3;f++) {
        const x=(f-1)*.076;
        box(wrist,[.055,.075,.085],[x,-.26,.015],this.silver,.02);
        sphere(wrist,.028,[x,-.31,0],this.dark);
        box(wrist,[.052,.07,.075],[x,-.355,-.025],this.white,.02);
      }
      const thumb=box(wrist,[.08,.16,.10],[-side*.15,-.15,.07],this.white,.035);thumb.rotation.z=-side*.45;
      const leg=this.legs[i];leg.position.set(side*.265,1.18,0);
      hinge(leg,.17,0);
      cylinder(leg,.085,.34,[0,-.23,0],this.silver);
      box(leg,[.35,.26,.4],[0,-.24,0],this.white,.1);
      hinge(leg,.165,-.48,.035);
      box(leg,[.19,.15,.07],[0,-.49,.19],this.silver,.04);
      box(leg,[.4,.31,.43],[side*.025,-.74,0],this.white,.11);
      box(leg,[.22,.05,.025],[side*.025,-.76,.23],this.silver,.01);
      hinge(leg,.115,-.955,.015);
      box(leg,[.49,.25,.7],[side*.03,-1.035,.13],this.white,.09);
      box(leg,[.5,.075,.7],[side*.03,-1.137,.13],this.dark,.025);
    }
  }

  get isWaving() { return this.waveTime >= 0; }
  wave() { if(this.isWaving) return false; this.waveTime=0;return true; }
  setGreetingPose(amount: number, time = 0, elbowAmount = amount) {
    // Raise, settle, two gentle forearm sweeps, then lower. The wrist stays locked.
    const swayWindow=THREE.MathUtils.smootherstep(time,.95,1.2)*(1-THREE.MathUtils.smootherstep(time,2.4,2.65));
    const sway=Math.sin((time-.95)*Math.PI*2*1.15)*swayWindow;
    this.arms[1].rotation.set(-amount*.24,0,.13+amount*(.98+sway*.035));
    // Bend first, then roll around the forearm's own axis; no wrist rotation.
    this.elbows[1].rotation.set(-elbowAmount*.08,elbowAmount*Math.PI,elbowAmount*(1.57+sway*.25),'ZXY');
    this.wrists[1].rotation.set(0,0,0);
  }
  setBlink(closure: number) {
    const amount=THREE.MathUtils.clamp(closure,0,1);
    this.eyes.forEach(eye=>{ eye.material.uniforms.closure.value=amount; });
  }
  get blinkProgress() { return this.eyes[0].material.uniforms.closure.value as number; }
  setExpression(expression: Expression) { this.expression=expression;this.mouth.visible=expression!=='thinking';this.mouth.scale.y=expression==='neutral'?.35:1; }
  resetPose() { this.eyeMotion.reset();this.setBlink(0);this.waveTime=-1;this.group.position.y=0;this.group.rotation.set(0,0,0);this.legs.forEach(leg=>leg.rotation.set(0,0,0));this.head.rotation.set(0,0,0);this.arms.forEach((arm,i)=>arm.rotation.set(0,0,i===0?-.13:.13));this.elbows.forEach(joint=>joint.rotation.set(0,0,0));this.wrists.forEach(joint=>joint.rotation.set(0,0,0));this.setExpression('happy'); }
  update(dt: number, time: number, pointer: THREE.Vector2, reducedMotion: boolean, walking = false) {
    const smooth=1-Math.exp(-dt*5);
    this.group.position.y=reducedMotion?0:Math.sin(time*1.8)*.025;
    this.head.rotation.y=THREE.MathUtils.lerp(this.head.rotation.y,reducedMotion?0:pointer.x*.16,smooth);
    this.head.rotation.x=THREE.MathUtils.lerp(this.head.rotation.x,reducedMotion?0:-pointer.y*.09,smooth);
    this.eyeMotion.update(dt,reducedMotion,pointer);
    this.setBlink(this.eyeMotion.blinkProgress);
    if(this.waveTime>=0) {
      this.waveTime+=dt;
      const t=this.waveTime;
      const envelope=THREE.MathUtils.smootherstep(t,0,.85)*(1-THREE.MathUtils.smootherstep(t,2.65,3.5));
      const elbowEnvelope=THREE.MathUtils.smootherstep(t,.12,1.0)*(1-THREE.MathUtils.smootherstep(t,2.55,3.4));
      this.setGreetingPose(envelope,t,elbowEnvelope);
      if(t>=3.5){this.waveTime=-1;this.setGreetingPose(0);}
    } else this.arms[1].rotation.z=.13+(reducedMotion?0:Math.sin(time*1.8)*.025);
    this.arms[0].rotation.z=-.13-(reducedMotion?0:Math.sin(time*1.8)*.025);
    const stride=walking&&!reducedMotion?Math.sin(time*8)*.42:0;
    this.legs.forEach((leg,i)=>leg.rotation.x=THREE.MathUtils.lerp(leg.rotation.x,i===0?stride:-stride,smooth));
    this.arms[0].rotation.x=THREE.MathUtils.lerp(this.arms[0].rotation.x,-stride*.75,smooth);
    if(!this.isWaving)this.arms[1].rotation.x=THREE.MathUtils.lerp(this.arms[1].rotation.x,stride*.75,smooth);
    if(walking&&!reducedMotion)this.group.position.y=Math.abs(Math.sin(time*8))*.055;
  }
}
