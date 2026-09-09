import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const result=await build({entryPoints:[fileURLToPath(new URL('../eye-motion.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'esm'});
const {EyeMotion}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const advance=(motion,seconds)=>{for(let i=0;i<Math.round(seconds*1000);i++)motion.update(.001,false,{x:0,y:0});};

test('cubic blink closes, holds briefly, and opens more slowly',()=>{
  const motion=new EyeMotion(()=>.5);
  advance(motion,3.5);assert(motion.blinkProgress<.00001);
  advance(motion,.025);assert(Math.abs(motion.blinkProgress-.0625)<.001);
  advance(motion,.025);assert(Math.abs(motion.blinkProgress-.5)<.001);
  advance(motion,.05);assert(Math.abs(motion.blinkProgress-1)<.001);
  advance(motion,.05);assert.equal(motion.blinkProgress,1);
  advance(motion,.07);assert(motion.blinkProgress>0&&motion.blinkProgress<1);
  advance(motion,.075);assert.equal(motion.blinkProgress,0);
});

test('random timing stays within requested ranges and double blinks do not chain',()=>{
  let seed=813;
  const motion=new EyeMotion(()=>((seed=(1664525*seed+1013904223)>>>0)/2**32));
  const runs=[];
  let previous=0, current={kind:'open',duration:0};
  for(let i=0;i<120000;i++){
    motion.update(.001,false,{x:0,y:0});
    const value=motion.blinkProgress;
    assert(value>=0&&value<=1);
    const kind=value===0?'open':value===1?'hold':value>previous?'close':'reopen';
    if(kind!==current.kind){runs.push(current);current={kind,duration:0};}
    current.duration+=.001;previous=value;
  }
  let doubles=0, regular=0;
  for(let i=0;i<runs.length;i++){
    const {kind,duration}=runs[i];
    const within=(min,max)=>assert(duration>=min-.003&&duration<=max+.003,`${kind}: ${duration}`);
    if(kind==='close')within(.08,.12);
    if(kind==='hold')within(.04,.08);
    if(kind==='reopen')within(.10,.15);
    if(kind==='open'){
      if(duration<1){within(.10,.18);doubles++;assert(runs[i+4]?.duration>=1);}
      else{within(2,5);regular++;}
    }
  }
  assert(doubles>0&&regular>doubles);
});

test('reduced motion opens and freezes eyes, then resumes after a fresh rest',()=>{
  const motion=new EyeMotion(()=>.5);
  advance(motion,3.62);assert.equal(motion.blinkProgress,1);
  motion.update(.016,true,{x:1,y:1});
  assert.equal(motion.blinkProgress,0);assert.equal(motion.gaze.length(),0);
  for(let i=0;i<300;i++)motion.update(.05,true,{x:1,y:1});
  advance(motion,2);assert.equal(motion.blinkProgress,0);
  assert(motion.gaze.length()>0);
});
