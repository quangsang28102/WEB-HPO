import { Vector2 } from 'three';

type Phase = 'open' | 'closing' | 'closed' | 'opening' | 'double-gap';
const easeInOutCubic = (t: number) => t < .5 ? 4*t*t*t : 1-((-2*t+2)**3)/2;

/** One clock and gaze vector drive both eyes. Durations are in seconds. */
export class EyeMotion {
  blinkProgress = 0;
  readonly gaze = new Vector2();
  private phase: Phase = 'open';
  private elapsed = 0;
  private duration = 0;
  private gazeTime = 0;
  private doublePending = false;
  private reduced = false;

  constructor(private random: () => number = Math.random) { this.reset(); }
  private between(min: number, max: number) { return min+(max-min)*this.random(); }
  private enter(phase: Phase, duration: number) { this.phase=phase; this.duration=duration; this.elapsed=0; }

  reset() {
    this.blinkProgress=0; this.doublePending=false; this.gazeTime=0;
    this.gaze.set(0,0); this.enter('open',this.between(2,5));
  }

  update(dt: number, reducedMotion: boolean, pointer: { x: number; y: number }) {
    if (reducedMotion) {
      if (!this.reduced) this.reset();
      this.reduced=true;
      return;
    }
    this.reduced=false;
    let remaining=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
    this.gazeTime+=remaining;
    const smooth=1-Math.exp(-remaining*3);
    const x=Math.sin(this.gazeTime*.77)*.09+Math.sin(this.gazeTime*1.31)*.025+Math.max(-1,Math.min(1,pointer.x))*.08;
    const y=Math.sin(this.gazeTime*.63)*.05+Math.max(-1,Math.min(1,pointer.y))*.05;
    this.gaze.lerp(new Vector2(x,y),smooth);

    while (remaining > 0) {
      const step=Math.min(remaining,this.duration-this.elapsed);
      this.elapsed+=step; remaining-=step;
      if (this.elapsed < this.duration) break;
      switch (this.phase) {
        case 'open':
          this.doublePending=this.random()<.2;
          this.enter('closing',this.between(.08,.12)); break;
        case 'double-gap': this.enter('closing',this.between(.08,.12)); break;
        case 'closing': this.enter('closed',this.between(.04,.08)); break;
        case 'closed': this.enter('opening',this.between(.10,.15)); break;
        case 'opening':
          if (this.doublePending) {
            this.doublePending=false;
            this.enter('double-gap',this.between(.10,.18));
          } else this.enter('open',this.between(2,5));
          break;
      }
    }
    const t=this.elapsed/this.duration;
    this.blinkProgress=this.phase==='closing'?easeInOutCubic(t):
      this.phase==='closed'?1:this.phase==='opening'?1-easeInOutCubic(t):0;
  }
}
