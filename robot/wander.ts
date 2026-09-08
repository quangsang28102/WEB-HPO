import { MathUtils, Vector2 } from 'three';

/** Screen-space route; heading rotates the actual 3D model, not its canvas. */
export class Wander {
  readonly target = new Vector2();
  heading = 0;
  walking = false;
  private rest = 4;
  private travelTime = 0;
  private speedMultiplier = 1;
  private hasTarget = false;
  constructor(private random: () => number = Math.random) {}

  get speed() { return this.speedMultiplier; }
  setSpeed(value: number) {
    if (Number.isFinite(value)) this.speedMultiplier = MathUtils.clamp(value, .5, 2);
  }

  pause(seconds = 5) { this.rest = seconds; this.travelTime = 0; this.hasTarget = false; this.walking = false; }

  private turnToward(desired: number, dt: number) {
    const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += MathUtils.clamp(difference, -dt * 3.5, dt * 3.5);
    return Math.abs(difference) < .01;
  }

  update(dt: number, position: Vector2, width: number, height: number, paused: boolean, faceWhenPaused = true) {
    this.walking = false;
    dt = Math.min(dt, .1);
    if (paused) {
      if (faceWhenPaused) this.turnToward(0, dt);
      return;
    }
    if (this.rest > 0) {
      // Hold the full rest after the front is visible, rather than spending it turning.
      if (this.turnToward(0, dt)) this.rest -= dt;
      return;
    }
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
    if (distance < 2 || this.travelTime >= 3) { this.pause(5 + this.random() * 3); return; }
    // Down-screen = facing the viewer; up-screen = showing the robot's back.
    const desired = Math.atan2(dx, dy);
    const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += MathUtils.clamp(difference, -dt * 3.5, dt * 3.5);
    if (Math.abs(difference) > .35) return;
    const step = Math.min(distance, dt * 60 * this.speedMultiplier);
    position.x += dx / distance * step;
    position.y += dy / distance * step;
    this.travelTime += dt;
    this.walking = true;
  }
}
