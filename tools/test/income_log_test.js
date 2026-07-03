#!/usr/bin/env node
/* Monthly Income Log — derivation + precedence guard.   node tools/test/income_log_test.js
 *
 * The app's entire finance model reads MODEL.income {low,avg,high}. This feature makes those
 * figures DERIVED from the months a user actually logs, instead of a guess. The math and the
 * precedence rule are load-bearing — a wrong median or a precedence slip silently corrupts the
 * hero "left over", the cash-flow sim, the savings projection, the tier and the Klarna surplus.
 * We extract the LIVE functions from index.html (no copy drift) and exercise them with a mock
 * MODEL. A FAIL here = every downstream number could be wrong.
 *
 * Locks in the decisions (Arthur spec):
 *   - typical = MEDIAN of the last-12 window (min = low, max = high, mean shown separately)
 *   - derived REPLACES the guess only at >= INCOME_MIN_MONTHS (3) logged months
 *   - a fresh manual statement (guessTs newer than the latest logged month) wins until a newer
 *     month is logged; logging that month hands control back to history
 *   - zero months count (a missed cheque is real data; the median absorbs it honestly)
 *   - logging the same ym twice REPLACES, never duplicates
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

function extractFn(name){
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('cannot find function ' + name);
  let depth = 0, i = src.indexOf('{', start);
  for (let j = i; j < src.length; j++){
    if (src[j] === '{') depth++;
    else if (src[j] === '}'){ depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced ' + name);
}
function extractVar(name){
  // pull `var INCOME_MIN_MONTHS = 3, INCOME_WINDOW = 12;`
  const m = src.match(new RegExp('var\\s+INCOME_MIN_MONTHS[^;]*;'));
  if (!m) throw new Error('cannot find INCOME_* consts');
  return m[0];
}

const FNS = ['ymNow','ymPrev','ymValid','incomeEntries','_median','deriveIncome',
             'recomputeIncome','incomeIsDerived','logIncomeMonth','deleteIncomeMonth','incomeUseHistory']
  .map(extractFn).join('\n');

// Sandbox: provide MODEL + the handful of stubs the log/mutator functions call.
function makeEnv(){
  const env = {
    MODEL: { income:{low:0,avg:0,high:0}, incomeGuess:{low:0,avg:0,high:0}, incomeGuessTs:0, incomeLog:[] },
    pad2(n){ return (n<10?'0':'') + n; },
    t(s){ return s; }, fmtN(n){ return String(n); }, curInfo(){ return {sym:'kr'}; },
    logChange(){}, refreshFinance(){}, autosave(){}, ymLabel(ym){ return ym; },
    window: {},
    Date: Date, Math: Math, Number: Number, String: String, Array: Array, isFinite: isFinite
  };
  const code = extractVar() + '\n' + FNS + '\n' +
    'return { setLog:function(l){ MODEL.incomeLog=l; }, setGuess:function(g,ts){ MODEL.incomeGuess=g; MODEL.incomeGuessTs=ts; },' +
    ' getIncome:function(){ return MODEL.income; }, MODEL:MODEL,' +
    ' deriveIncome:deriveIncome, recomputeIncome:recomputeIncome, incomeIsDerived:incomeIsDerived,' +
    ' logIncomeMonth:logIncomeMonth, deleteIncomeMonth:deleteIncomeMonth, incomeUseHistory:incomeUseHistory,' +
    ' ymPrev:ymPrev, ymValid:ymValid, _median:_median };';
  const fn = new Function('MODEL','pad2','t','fmtN','curInfo','logChange','refreshFinance','autosave','ymLabel','window', code);
  return fn(env.MODEL, env.pad2, env.t, env.fmtN, env.curInfo, env.logChange, env.refreshFinance, env.autosave, env.ymLabel, env.window);
}

let pass = 0, fail = 0;
function check(name, cond, detail){ cond ? (pass++, console.log('✓  ' + name)) : (fail++, console.log('✗ FAIL  ' + name + (detail ? '\n        ' + detail : ''))); }
function entries(amts, baseTs){ return amts.map(function(a,i){ var mo=i+1; return { ym:'2026-'+(mo<10?'0':'')+mo, amt:a, ts:(baseTs||1000)+i, est:false }; }); }

// ---------- _median ----------
let E = makeEnv();
check('median: odd count -> middle', E._median([10,30,20]) === 20);
check('median: even count -> rounded mean of middle two', E._median([10,20,30,40]) === 25);
check('median: single', E._median([7]) === 7);
check('median: empty -> 0', E._median([]) === 0);

// ---------- deriveIncome threshold ----------
E = makeEnv(); E.setLog(entries([3000,3200]));
check('derive: null below 3 months', E.deriveIncome() === null);
E = makeEnv(); E.setLog(entries([3000,3200,2800]));
let d = E.deriveIncome();
check('derive: fires at exactly 3 months', d !== null);
check('derive: low = min', d && d.low === 2800, JSON.stringify(d));
check('derive: high = max', d && d.high === 3200, JSON.stringify(d));
check('derive: typical = median (3000)', d && d.avg === 3000, JSON.stringify(d));
check('derive: mean is separate ((3000+3200+2800)/3=3000)', d && d.mean === 3000, JSON.stringify(d));

// median resists a freak bonus where mean would be skewed
E = makeEnv(); E.setLog(entries([3000,3000,3000,12000]));   // one huge bonus month
d = E.deriveIncome();
check('derive: median ignores a freak bonus (=3000, not mean 5250)', d && d.avg === 3000, JSON.stringify(d));
check('derive: high still captures the bonus (12000)', d && d.high === 12000);

// ---------- window cap ----------
E = makeEnv();
let many = []; for (let i=0;i<15;i++){ many.push({ ym:'2025-'+(i<9?'0'+(i+1):(i+1)), amt: (i<3?100:3000), ts:1000+i, est:false }); }
// first 3 (the low 100s) fall outside the last-12 window -> min should be 3000, not 100
// build 15 valid months across 2025-2026
E = makeEnv();
let win=[]; for(let i=0;i<15;i++){ var y=2025+Math.floor(i/12), mo=(i%12)+1; win.push({ ym:y+'-'+(mo<10?'0':'')+mo, amt:(i<3?100:3000), ts:1000+i, est:false }); }
E.setLog(win);
d = E.deriveIncome();
check('window: only last 12 counted (early 100s excluded -> low 3000)', d && d.low === 3000, JSON.stringify(d));
check('window: window size capped at 12', d && d.window === 12, JSON.stringify(d));
check('window: n reports full count (15)', d && d.n === 15, JSON.stringify(d));

// ---------- zero month counts ----------
E = makeEnv(); E.setLog(entries([3000,0,3000]));
d = E.deriveIncome();
check('zero month: counts, low becomes 0', d && d.low === 0, JSON.stringify(d));
check('zero month: median absorbs it (3000)', d && d.avg === 3000, JSON.stringify(d));

// ---------- recomputeIncome precedence ----------
// (1) below threshold -> guess wins
E = makeEnv(); E.setGuess({low:2000,avg:2500,high:3000}, 5000); E.setLog(entries([9000,9000]));
E.recomputeIncome();
check('precedence: <3 months -> guess drives income', E.getIncome().avg === 2500, JSON.stringify(E.getIncome()));

// (2) >=3 months, stale guess -> derived wins
E = makeEnv(); E.setGuess({low:2000,avg:2500,high:3000}, 500); E.setLog(entries([3000,3400,3200], 1000));
E.recomputeIncome();
check('precedence: >=3 months + stale guess -> history drives income (median 3200)', E.getIncome().avg === 3200, JSON.stringify(E.getIncome()));
check('precedence: incomeIsDerived() true here', E.incomeIsDerived() === true);

// (3) >=3 months but a FRESH manual statement (guessTs newer than latest log ts) -> guess wins
E = makeEnv(); E.setLog(entries([3000,3400,3200], 1000));   // latest ts = 1002
E.setGuess({low:4000,avg:5000,high:6000}, 9999);            // manual restated AFTER
E.recomputeIncome();
check('precedence: fresh manual statement beats history until next log', E.getIncome().avg === 5000, JSON.stringify(E.getIncome()));
check('precedence: incomeIsDerived() false during manual override', E.incomeIsDerived() === false);

// (4) logging a NEWER month hands control back to history
E.logIncomeMonth('2026-04', 3300, false);                  // ts = Date.now() > 9999
check('precedence: logging a newer month re-derives (median of 3000,3400,3200,3300 = 3250)', E.getIncome().avg === 3250, JSON.stringify(E.getIncome()));
check('precedence: incomeIsDerived() true again after new month', E.incomeIsDerived() === true);

// (5) "use my history" escape drops the override immediately
E = makeEnv(); E.setLog(entries([3000,3400,3200], 1000)); E.setGuess({low:4000,avg:5000,high:6000}, 9999);
E.recomputeIncome();
check('escape: override active before incomeUseHistory (5000)', E.getIncome().avg === 5000);
E.incomeUseHistory();
check('escape: incomeUseHistory() -> derived immediately (3200)', E.getIncome().avg === 3200, JSON.stringify(E.getIncome()));

// ---------- logIncomeMonth de-dupes ----------
E = makeEnv(); E.setLog(entries([3000,3400,3200], 1000));
E.logIncomeMonth('2026-02', 9999, false);                  // same ym as entry #2
check('log: same ym REPLACES, no duplicate row', E.MODEL.incomeLog.filter(function(x){return x.ym==='2026-02';}).length === 1);
check('log: replacement value took (9999)', E.MODEL.incomeLog.filter(function(x){return x.ym==='2026-02';})[0].amt === 9999);

// ---------- migration: old save with no incomeGuess/incomeLog ----------
E = makeEnv(); E.MODEL.income={low:1800,avg:2200,high:2600}; delete E.MODEL.incomeGuess; delete E.MODEL.incomeLog; E.MODEL.incomeGuessTs=null;
E.recomputeIncome();
check('migration: missing guess seeded from current income (2200 preserved)', E.getIncome().avg === 2200, JSON.stringify(E.getIncome()));
check('migration: incomeLog initialised to []', Array.isArray(E.MODEL.incomeLog) && E.MODEL.incomeLog.length === 0);

// ---------- ym helpers ----------
E = makeEnv();
check('ymValid: accepts 2026-06', E.ymValid('2026-06') === true);
check('ymValid: rejects 2026-13', E.ymValid('2026-13') === false);
check('ymValid: rejects junk', E.ymValid('2026-6') === false && E.ymValid('") ; alert(1)') === false);
check('ymPrev: mid-year', E.ymPrev('2026-06') === '2026-05');
check('ymPrev: year rollover (Jan -> prev Dec)', E.ymPrev('2026-01') === '2025-12');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
