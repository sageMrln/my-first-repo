#!/usr/bin/env node
/* Sound engine test —  node tools/test/sound_test.js
 *
 * Verifies the MRLN_SFX Web Audio engine: all sound methods exist, mute is respected,
 * and a burst of rapid calls is throttled without throwing or spawning runaway nodes
 * (Akashi's guardrails). Extracts the live engine from index.html (no copy drift). */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const a = src.indexOf('var MRLN_SFX = (function()');
const b = src.indexOf('})();', a) + 5;
if (a < 0 || b < 5) { console.error('could not locate MRLN_SFX'); process.exit(2); }

// minimal Web Audio stub
let clock = 0, nodesCreated = 0, lastFreq = 0;
const node = () => { nodesCreated++; return { type: '', detune: { value: 0 }, frequency: { set value(v) { lastFreq = v; }, get value() { return lastFreq; } }, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 }, connect() {}, disconnect() {}, start() {}, stop() {}, set onended(f) {} }; };
global.window = { AudioContext: function () { return { get currentTime() { return clock; }, state: 'running', createOscillator: node, createGain: node, destination: {}, resume() {}, suspend() {} }; }, matchMedia: () => ({ matches: false }) };
global.Math.random = () => 0.5;
eval(src.slice(a, b));

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? '✓' : '✗ FAIL') + '  ' + name); }

const methods = ['tap', 'tick', 'toggle', 'remove', 'coin', 'error', 'success', 'save', 'modal', 'unlock', 'streak', 'panel', 'ping', 'slide', 'suspend', 'resume', 'setOn', 'isOn'];
check('all sound methods present', methods.every(m => typeof MRLN_SFX[m] === 'function'));

// slider pull: pitch must rise monotonically with the value fraction (0 → 1)
MRLN_SFX.setOn(true); Math.random = () => 0;   // kill detune jitter for a clean read
function slideFreq(frac) { clock += 1; MRLN_SFX.slide(frac); return lastFreq; }
const f0 = slideFreq(0), f25 = slideFreq(0.25), f50 = slideFreq(0.5), f100 = slideFreq(1);
check('slide pitch rises with value (0<.25<.5<1)', f0 < f25 && f25 < f50 && f50 < f100);

// burst at the same clock → throttle should keep node creation bounded (not 1 per call)
nodesCreated = 0; let threw = false;
try { for (let i = 0; i < 60; i++) MRLN_SFX.tap(); } catch (e) { threw = true; }
check('60 rapid taps do not throw', !threw);
check('throttle bounds node creation (< 60)', nodesCreated < 60);

// mute
MRLN_SFX.setOn(false);
check('mute sets isOn() false', MRLN_SFX.isOn() === false);
nodesCreated = 0; clock += 1000; MRLN_SFX.success();
check('no sound created while muted', nodesCreated === 0);
MRLN_SFX.setOn(true); check('unmute restores isOn() true', MRLN_SFX.isOn() === true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
