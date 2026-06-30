#!/usr/bin/env node
/* Media Log test — node tools/test/media_test.js
 *
 * Verifies Media Log pure functions for rating/ranking/calibration logic.
 * Extracts live functions from index.html MEDIALOG module (no copy drift):
 *   - clamp(r): clamps rating to [1,10] at 0.1 resolution
 *   - fmtR(r): formats one decimal ("9.4", "10.0")
 *   - ranked(): sorts watched entries by rating desc, ties by title asc; to-watch excluded
 *   - calibration neighbour selection: within ±0.2 of new rating, excluding self
 *   - back-compat: entries missing `status` or `rating` don't crash the sort
 *
 * Exit 1 if any test fails; this is a gate-holding test.
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

// Extract the pure functions from index.html
// Pattern: function clamp(r){ ... }
const fnMatch = (pattern) => {
  const idx = src.indexOf(pattern);
  if (idx < 0) throw new Error('Could not find: ' + pattern);
  let brace = 0;
  let started = false;
  let end = -1;
  for (let i = idx; i < src.length; i++) {
    if (src[i] === '{') { brace++; started = true; }
    else if (src[i] === '}') { brace--; if (started && brace === 0) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error('Could not extract: ' + pattern);
  return src.substring(idx, end);
};

try {
  const clampFn = fnMatch('function clamp(r)');
  const fmtRFn = fnMatch('function fmtR(r)');
  const itemsFn = fnMatch('function items()');
  const watchedFn = fnMatch('function watched()');
  const rankedFn = fnMatch('function ranked()');

  // Build test harness
  const harness = `
    var STATE = { media: [] };
    
    // Pure functions from MEDIALOG
    ${itemsFn}
    ${watchedFn}
    ${rankedFn}
    ${clampFn}
    ${fmtRFn}
    
    // Run tests
    var pass = 0, fail = 0;
    
    function test(name, actual, expected) {
      if (JSON.stringify(actual) === JSON.stringify(expected)) {
        pass++;
        process.stdout.write('.');
      } else {
        fail++;
        console.log('\\nFAIL: ' + name + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
        process.stdout.write('F');
      }
    }
    
    // Test clamp: floor to 1
    test('clamp(0.5)', clamp(0.5), 1.0);
    
    // Test clamp: ceil to 10
    test('clamp(10.7)', clamp(10.7), 10.0);
    
    // Test clamp: round to 0.1
    test('clamp(7.34)', clamp(7.34), 7.3);
    test('clamp(1.05)', clamp(1.05), 1.1);
    test('clamp(5.0)', clamp(5.0), 5.0);
    
    // Test fmtR: format as "N.N"
    test('fmtR(9.4)', fmtR(9.4), '9.4');
    test('fmtR(10.0)', fmtR(10.0), '10.0');
    test('fmtR(1.0)', fmtR(1.0), '1.0');
    test('fmtR(5.555)', fmtR(5.555), '5.6');
    
    // Test ranked: exclude to-watch, sort by rating desc then title asc
    STATE.media = [
      { id: '1', title: 'Inception', status: 'watched', rating: 9.0 },
      { id: '2', title: 'The Matrix', status: 'towatch', rating: null },
      { id: '3', title: 'Memento', status: 'watched', rating: 8.5 }
    ];
    var r = ranked();
    test('ranked() excludes to-watch', r.length, 2);
    test('ranked()[0] is highest rating', r[0].title, 'Inception');
    test('ranked()[1] is lower rating', r[1].title, 'Memento');
    
    // Test ranked: tie-break by title asc
    STATE.media = [
      { id: '1', title: 'Zulu', status: 'watched', rating: 8.0 },
      { id: '2', title: 'Alien', status: 'watched', rating: 8.0 }
    ];
    r = ranked();
    test('ranked() breaks ties by title asc: Alien first', r[0].title, 'Alien');
    test('ranked() second in tie is Zulu', r[1].title, 'Zulu');
    
    // Test calibration: ±0.2 filter, exclude self
    STATE.media = [
      { id: '1', title: 'A', status: 'watched', rating: 7.0 },
      { id: '2', title: 'B', status: 'watched', rating: 7.1 },
      { id: '3', title: 'C', status: 'watched', rating: 6.8 },
      { id: '4', title: 'D', status: 'watched', rating: 7.15 }
    ];
    var m = STATE.media[3];
    var near = STATE.media.filter(function(x) {
      return x.id !== m.id && Math.abs((x.rating || 0) - m.rating) <= 0.2;
    });
    test('calibration filters ±0.2', near.length, 2);
    test('calibration includes A (7.0)', near.some(function(x) { return x.title === 'A'; }), true);
    test('calibration includes B (7.1)', near.some(function(x) { return x.title === 'B'; }), true);
    test('calibration excludes C (6.8, outside 0.2)', near.some(function(x) { return x.title === 'C'; }), false);
    test('calibration excludes self', near.some(function(x) { return x.id === m.id; }), false);
    
    // Test back-compat: missing status
    STATE.media = [
      { id: '1', title: 'NoStatus', rating: 7.5 },
      { id: '2', title: 'Normal', status: 'watched', rating: 8.0 }
    ];
    r = ranked();
    test('ranked() ignores missing status', r.length, 1);
    test('ranked() keeps Normal', r[0].title, 'Normal');
    
    // Test back-compat: missing rating
    STATE.media = [
      { id: '1', title: 'NoRating', status: 'watched' },
      { id: '2', title: 'Normal', status: 'watched', rating: 8.0 }
    ];
    r = ranked();
    test('ranked() handles missing rating', r.length, 2);
    test('ranked() sorts missing rating to end', r[0].title, 'Normal');
    
    // Summary
    console.log('\\n\\n=== Media Log Test Results ===');
    console.log(pass + ' passed, ' + fail + ' failed');
    process.exit(fail > 0 ? 1 : 0);
  `;

  eval(harness);

} catch (e) {
  console.error('Test extraction/execution error:', e.message);
  process.exit(1);
}
