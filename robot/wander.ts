import { MathUtils, Vector2 } from 'three';

/** Screen-space route; heading rotates the actual 3D model, not its canvas. */
export class Wander {
  readonly target = new Vector2();
  heading = 0;
  walking = false;
  private rest = 1.2;
  private hasTarget = false;
  constructor(private random: () => number = Math.random) {}

  pause(seconds = 1.2) { this.rest = seconds; this.hasTarget = false; this.walking = false; }

  update(dt: number, position: Vector2, width: number, height: number, paused: boolean) {
    this.walking = false;
    if (paused) return;
    dt = Math.min(dt, .1);
    if (this.rest > 0) { this.rest -= dt; return; }
    if (!this.hasTarget) {
      for (let attempt = 0; attempt < 8; attempt++) {
        this.target.set(this.random() * width, this.random() * height);
        if (position.distanceTo(this.target) > Math.min(120, Math.max(width, height) * .3)) break;
      }
      this.hasTarget = true;
    }
    this.target.set(MathUtils.clamp(this.target.x, 0, width), MathUtils.clamp(this.target.y, 0, height));
    const dx = this.target.x - position.x, dy = this.target.y - position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) { this.pause(.8 + this.random() * 1.8); return; }
    // Down-screen = facing the viewer; up-screen = showing the robot's back.
    const desired = Math.atan2(dx, dy);
    const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += MathUtils.clamp(difference, -dt * 3.5, dt * 3.5);
    if (Math.abs(difference) > .35) return;
    const step = Math.min(distance, dt * 48);
    position.x += dx / distance * step;
    position.y += dy / distance * step;
    this.walking = true;
  }
}
