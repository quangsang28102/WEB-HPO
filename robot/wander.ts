import { MathUtils, Vector2 } from 'three';

/** Screen-space route; heading rotates the actual 3D model, not its canvas. */
export class Wander {
  readonly target = new Vector2();
  heading = 0;
  walking = false;
  private rest = 4;
  private travelTime = 0;
  private speedMultiplier = 1;
  private greetingPending = false;

  /** Keep the widget on the nearest viewport edge, including after manual moves. */
  snapToEdge(position: Vector2, width: number, height: number) {
    position.set(MathUtils.clamp(position.x, 0, width), MathUtils.clamp(position.y, 0, height));
    const distances = [position.x, width - position.x, position.y, height - position.y];
    switch (distances.indexOf(Math.min(...distances))) {
      case 0: position.x = 0; break;
      case 1: position.x = width; break;
      case 2: position.y = 0; break;
      case 3: position.y = height; break;
    }
  }

  get speed() { return this.speedMultiplier; }
  setSpeed(value: number) {
    if (Number.isFinite(value)) this.speedMultiplier = MathUtils.clamp(value, .5, 2);
  }

  pause(seconds = 5) {
    if (this.travelTime > 0 || this.walking) this.greetingPending = true;
    this.rest = seconds; this.travelTime = 0; this.walking = false;
  }

  takeGreeting() {
    if (!this.greetingPending || this.walking || Math.abs(Math.atan2(Math.sin(this.heading), Math.cos(this.heading))) > .08) return false;
    this.greetingPending = false;
    return true;
  }

  private turnToward(desired: number, dt: number) {
    const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += MathUtils.clamp(difference, -dt * 3.5, dt * 3.5);
    return Math.abs(difference) < .01;
  }

  update(dt: number, position: Vector2, width: number, height: number, paused: boolean, faceWhenPaused = true) {
    if (paused && this.walking) this.pause();
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
    this.snapToEdge(position, width, height);
    // Clockwise, targeting only the next corner so routes never cut across the screen.
    if (width === 0) this.target.set(0, position.y < height ? height : 0);
    else if (height === 0) this.target.set(position.x < width ? width : 0, 0);
    else if (position.y === 0 && position.x < width) this.target.set(width, 0);
    else if (position.x === width && position.y < height) this.target.set(width, height);
    else if (position.y === height && position.x > 0) this.target.set(0, height);
    else this.target.set(0, 0);
    const dx = this.target.x - position.x, dy = this.target.y - position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0 || this.travelTime >= 3) { this.pause(5); return; }
    // Down-screen = facing the viewer; up-screen = showing the robot's back.
    const desired = Math.atan2(dx, dy);
    const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
    this.heading += MathUtils.clamp(difference, -dt * 3.5, dt * 3.5);
    if (Math.abs(difference) > .35) return;
    const step = Math.min(distance, dt * 60 * this.speedMultiplier);
    if (step === distance) position.copy(this.target);
    else {
      position.x += dx / distance * step;
      position.y += dy / distance * step;
    }
    this.travelTime += dt;
    this.walking = true;
  }
}
