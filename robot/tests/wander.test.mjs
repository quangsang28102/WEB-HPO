import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Vector2 } from 'three';
import { fileURLToPath } from 'node:url';

const result = await build({
  entryPoints: [fileURLToPath(new URL('../wander.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { Wander } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

test('paused movement preserves position and resumes after the drop rest', () => {
  const wander = new Wander(() => .9);
  const position = new Vector2(20, 20);
  wander.pause(2);
  for (let i = 0; i < 100; i++) wander.update(.1, position, 600, 400, true);
  assert.deepEqual(position.toArray(), [20, 20]);
  for (let i = 0; i < 19; i++) wander.update(.1, position, 600, 400, false);
  assert.deepEqual(position.toArray(), [20, 20]);
  for (let i = 0; i < 30; i++) wander.update(.1, position, 600, 400, false);
  assert(position.distanceTo(new Vector2(20, 20)) > 20);
});

test('turns the model toward its route before walking, with bounded angular speed', () => {
  let index = 0;
  const wander = new Wander(() => [0.5, 0][index++ % 2]);
  const position = new Vector2(300, 200);
  wander.pause(0);
  wander.update(.1, position, 600, 400, false);
  assert.equal(wander.walking, false);
  assert.deepEqual(position.toArray(), [300, 200]);
  assert(Math.abs(wander.heading) <= .35 + 1e-10);
  for (let i = 0; i < 12; i++) wander.update(.1, position, 600, 400, false);
  assert(Math.abs(wander.heading - Math.PI) < .01);
  assert(position.y < 200, 'upward route presents the robot back');
});

test('long random walk stays in bounds, explores all quadrants, and caps long frames', () => {
  let seed = 42;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const wander = new Wander(random);
  const position = new Vector2(300, 200);
  const quadrants = new Set();
  for (let i = 0; i < 20000; i++) {
    const before = position.clone();
    wander.update(i % 100 === 0 ? 10 : .1, position, 600, 400, false);
    assert(position.x >= 0 && position.x <= 600 && position.y >= 0 && position.y <= 400);
    assert(position.distanceTo(before) <= 8.000001);
    quadrants.add(`${position.x >= 300},${position.y >= 200}`);
  }
  assert.equal(quadrants.size, 4);
});

test('zero-sized viewport stays finite and stationary', () => {
  const wander = new Wander(() => .5);
  const position = new Vector2();
  for (let i = 0; i < 100; i++) wander.update(.1, position, 0, 0, false);
  assert.deepEqual(position.toArray(), [0, 0]);
  assert(Number.isFinite(wander.heading));
});

test('short trips stop and show the front for at least five seconds', () => {
  let index = 0;
  const wander = new Wander(() => [.5, 0][index++ % 2]);
  const position = new Vector2(500, 1000);
  wander.pause(0);
  let walkingFrames = 0;
  for (let i = 0; i < 100; i++) {
    wander.update(.1, position, 1000, 1200, false);
    if (wander.walking) walkingFrames++;
    else if (walkingFrames > 0) break;
  }
  assert(walkingFrames >= 29 && walkingFrames <= 31);
  const stopped = position.clone();
  for (let i = 0; i < 12; i++) wander.update(.1, position, 1000, 1200, false);
  assert(Math.abs(Math.sin(wander.heading)) < .01 && Math.cos(wander.heading) > .99);
  for (let i = 0; i < 45; i++) {
    wander.update(.1, position, 1000, 1200, false);
    assert.deepEqual(position.toArray(), stopped.toArray());
    assert.equal(wander.walking, false);
  }
});

test('speed setting affects distance immediately without shortening the rest', () => {
  const wander = new Wander(() => 1);
  const position = new Vector2(600, 0);
  wander.pause(0);
  wander.setSpeed(.5);
  wander.update(.1, position, 600, 1000, false);
  assert.equal(position.y, 3);
  wander.setSpeed(2);
  wander.update(.1, position, 600, 1000, false);
  assert.equal(position.y, 15);
  wander.pause(5);
  const stopped = position.clone();
  for (let i = 0; i < 49; i++) wander.update(.1, position, 600, 1000, false);
  assert.deepEqual(position.toArray(), stopped.toArray());
  wander.setSpeed(NaN);
  assert.equal(wander.speed, 2);
  wander.setSpeed(99);
  assert.equal(wander.speed, 2);
  wander.setSpeed(-1);
  assert.equal(wander.speed, .5);
});

test('hover and pause face forward but dragging retains its heading', () => {
  const wander = new Wander();
  const position = new Vector2(20, 20);
  wander.heading = Math.PI;
  wander.update(.1, position, 600, 400, true, false);
  assert.equal(wander.heading, Math.PI);
  for (let i = 0; i < 12; i++) wander.update(.1, position, 600, 400, true);
  assert(Math.abs(wander.heading) < .01);
  assert.deepEqual(position.toArray(), [20, 20]);
});

test('each completed route offers one greeting after facing front', () => {
  const wander=new Wander(()=>.9), position=new Vector2(20,20);
  wander.pause(0);
  let greetings=0, walked=false;
  for(let i=0;i<100;i++) {
    wander.update(.1,position,600,400,false);
    walked ||= wander.walking;
    if(wander.takeGreeting()) { greetings++; assert.equal(wander.walking,false); assert(Math.abs(wander.heading)<.08); }
  }
  assert(walked);assert.equal(greetings,1);assert.equal(wander.takeGreeting(),false);
});

test('hover stop queues one greeting and keeps enough rest to finish it', () => {
  const wander=new Wander(()=>.9), position=new Vector2(20,20);
  wander.pause(0);
  for(let i=0;i<30&&!wander.walking;i++)wander.update(.1,position,600,400,false);
  assert(wander.walking);
  const stopped=position.clone();
  let greetings=0;
  for(let i=0;i<30;i++) {
    wander.update(.1,position,600,400,true);
    if(wander.takeGreeting())greetings++;
  }
  assert.equal(greetings,1);
  for(let i=0;i<29;i++)wander.update(.1,position,600,400,false);
  assert.deepEqual(position.toArray(),stopped.toArray());
});
