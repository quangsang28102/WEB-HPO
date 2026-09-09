import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result=await build({entryPoints:[fileURLToPath(new URL('../robot.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const {Robot}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
test('greeting bends shoulder and elbow with a locked wrist, then returns to rest',()=>{
 const robot=new Robot();
 assert.equal(robot.elbows[1].parent,robot.arms[1]);
 assert.equal(robot.wrists[1].parent,robot.elbows[1]);
 robot.wave();assert.equal(robot.wave(),false);
 for(let i=0;i<60;i++)robot.update(1/60,i/60,{x:0,y:0},false);
 assert(robot.arms[1].rotation.z>1);
 assert(robot.elbows[1].rotation.z>1);
 assert.deepEqual(robot.wrists[1].rotation.toArray().slice(0,3),[0,0,0]);
 for(let i=60;i<240;i++) {
   robot.update(1/60,i/60,{x:0,y:0},false);
   assert.deepEqual(robot.wrists[1].rotation.toArray().slice(0,3),[0,0,0]);
 }
 assert.equal(robot.isWaving,false);
 assert.equal(robot.elbows[1].rotation.z,0);
 assert.equal(robot.wrists[1].rotation.z,0);
 robot.wave();robot.update(.8,0,{x:0,y:0},false);robot.resetPose();
 assert.equal(robot.isWaving,false);assert.equal(robot.elbows[1].rotation.z,0);
});

test('greeting transitions smoothly and only sweeps the forearm gently',()=>{
 const robot=new Robot();robot.wave();
 let previousShoulder=.13, previousElbow=0;
 const sweep=[];
 for(let i=0;i<240;i++) {
  robot.update(1/60,i/60,{x:0,y:0},false);
  const shoulder=robot.arms[1].rotation.z, elbow=robot.elbows[1].rotation.z;
  assert(Math.abs(shoulder-previousShoulder)<.06);
  assert(Math.abs(elbow-previousElbow)<.08);
  assert.deepEqual(robot.wrists[1].rotation.toArray().slice(0,3),[0,0,0]);
  if(i>=75&&i<140)sweep.push(elbow);
  previousShoulder=shoulder;previousElbow=elbow;
 }
 assert(Math.max(...sweep)-Math.min(...sweep)>.35);
 assert.equal(robot.isWaving,false);
});

test('raised greeting presents the palm to the viewer without rotating the wrist',()=>{
 const robot=new Robot();
 for(const time of [1.2,1.5,1.9,2.3]) {
  robot.setGreetingPose(1,time);robot.group.updateMatrixWorld(true);
  const palm=robot.wrists[1].getObjectByName('palm');
  const normal=robot.group.position.clone().set(0,0,-1).transformDirection(palm.matrixWorld);
  assert(normal.z>.85,'palm should face forward');
  assert.deepEqual(robot.wrists[1].rotation.toArray().slice(0,3),[0,0,0]);
 }
 robot.resetPose();assert.equal(robot.elbows[1].rotation.y,0);
});

test('both eyes share blink progress and gaze, including reduced motion and reset',()=>{
 const robot=new Robot();
 const left=robot.head.getObjectByName('eye-left'), right=robot.head.getObjectByName('eye-right');
 const geometry=Array.from(left.geometry.attributes.position.array);
 let sawBlink=false, sawGaze=false;
 for(let i=0;i<900;i++) {
  robot.update(1/60,i/60,{x:.4,y:.2},false);
  assert.equal(left.material.uniforms.closure.value,right.material.uniforms.closure.value);
  assert.equal(left.material.uniforms.gaze.value,right.material.uniforms.gaze.value);
  sawBlink ||= robot.blinkProgress>.9;
  sawGaze ||= left.material.uniforms.gaze.value.length()>.02;
 }
 assert(sawBlink&&sawGaze);
 assert.deepEqual(left.scale.toArray(),[1,1,1]);
 assert.deepEqual(Array.from(left.geometry.attributes.position.array),geometry);
 robot.setBlink(1);robot.update(1/60,0,{x:1,y:1},true);
 assert.equal(robot.blinkProgress,0);
 assert.equal(left.material.uniforms.gaze.value.length(),0);
 robot.setBlink(1);robot.resetPose();assert.equal(robot.blinkProgress,0);
});
