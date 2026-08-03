/* Meal Ideas engine + database guard — council-mandated committed suite (v40 batch).
   Extracts the SHIPPED MEAL_DB / FOOD_SYN / matcher straight from index.html and asserts:
     1. every core (healthy) ingredient on Osefe's taste list matches >= 3 meals
        — via the engine's own matcher (expandTerm/termHitsMeal), not a re-implementation
     2. macro plausibility: kcal within ±15% of 4p+4c+9f, valid goals, tags/ing present, no dupes
     3. word-boundary matching: "pea" must NOT false-match peach/peanut meals (chip trust)
     4. plural/singular matching: "apples" finds apple meals, "cherries" finds cherry
     5. allergen exclusion: disliking a FOOD_SYN category excludes EVERY meal containing
        any of its synonyms (dislikes encode allergies — this must never leak)
     6. the "banana on a cut" bug stays dead: banana >= 3 meals, and the pool gate
        (on-goal OR liked) is present in source (goal must never hard-hide a liked meal)
   Never delete a guard case. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

// ---- extract the shipped engine region: MEAL_DB ... mealMatchesText ----
const start = html.indexOf('  var MEAL_DB=[');
const endMark = 'function mealMatchesText(m,term){ return termHitsMeal(term,m); }';
const end = html.indexOf(endMark);
if (start < 0 || end < 0) { console.error('✗ cannot locate meal engine region in index.html'); process.exit(1); }
const src = html.slice(start, end + endMark.length);

const sandbox = {};
vm.createContext(sandbox);
new vm.Script(src, { filename: 'meal-engine-extract' }).runInContext(sandbox);
const { MEAL_DB, FOOD_SYN, termHitsMeal, mealHay } = sandbox;
if (!MEAL_DB || !FOOD_SYN || !termHitsMeal) { console.error('✗ extraction incomplete'); process.exit(1); }

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; console.log('✓  ' + label); } else { fail++; console.log('✗  ' + label); } }
const hitsFor = t => MEAL_DB.filter(m => termHitsMeal(t, m));

// ---- 1. core-ingredient coverage (Osefe's healthy list; sweeteners/condiments soft) ----
const CORE = ['Apples','Bananas','Oranges','Lemons','Limes','Grapes','Strawberries','Blueberries','Mangoes','Pineapple','Peaches','Pears','Watermelon','Kiwi','Avocado','Coconut','Cherries','Plums','Papaya','Pomegranate',
  'Potatoes','Tomatoes','Onions','Garlic','Carrots','Broccoli','Cauliflower','Spinach','Lettuce','Cabbage','Bell peppers','Cucumbers','Zucchini','Eggplant','Celery','Asparagus','Mushrooms','Corn','Green beans','Peas',
  'Rice','Wheat','Oats','Barley','Rye','Cornmeal','Quinoa','Millet','Buckwheat','Bulgur','Couscous','Farro','Spelt',
  'Black beans','Kidney beans','Pinto beans','Chickpeas','Lentils','Split peas','Soybeans','Edamame','Lima beans',
  'Beef','Chicken','Turkey','Pork','Lamb','Duck',
  'Salmon','Tuna','Cod','Haddock','Trout','Shrimp','Crab','Mussels','Scallops',
  'Milk','Cheese','Yogurt','Cottage cheese','Chicken eggs',
  'Almonds','Walnuts','Cashews','Pistachios','Peanuts','Chia seeds','Flaxseeds','Sesame seeds','Pumpkin seeds','Sunflower seeds',
  'Olive oil','Sesame oil','Avocado oil',
  'Basil','Parsley','Cilantro','Mint','Thyme','Rosemary','Oregano','Dill','Chives',
  'Cinnamon','Paprika','Cumin','Turmeric','Ginger','Coriander','Chili powder','Black pepper',
  'Honey','Maple syrup','Cocoa powder','Vanilla extract',
  'Soy sauce','Pesto','Tahini','Mustard','Vinegar',
  'Spaghetti','Penne','Rice noodles','Soba','Coffee','Tea'];
const gaps = CORE.filter(t => hitsFor(t).length < 3);
ok(gaps.length === 0, `core coverage: all ${CORE.length} healthy ingredients match >=3 meals` + (gaps.length ? ' — GAPS: ' + gaps.join(', ') : ''));
ok(MEAL_DB.length >= 150, `database size ${MEAL_DB.length} >= 150`);

// ---- 2. macro plausibility + structure + dupes ----
let macroBad = [], structBad = [];
const names = {};
MEAL_DB.forEach(m => {
  names[m.n] = (names[m.n] || 0) + 1;
  const est = 4 * m.p + 4 * m.c + 9 * m.f;
  if (Math.abs(est - m.kcal) / m.kcal > 0.15) macroBad.push(m.n);
  if (!m.goals || !m.goals.length || m.goals.some(g => ['cut','maintain','bulk'].indexOf(g) < 0) || !m.tags || !m.tags.length || !m.ing || !m.ing.length) structBad.push(m.n);
});
const dupes = Object.keys(names).filter(n => names[n] > 1);
ok(macroBad.length === 0, 'macros plausible (kcal ≈ 4p+4c+9f ±15%)' + (macroBad.length ? ' — OFF: ' + macroBad.slice(0,3).join(' | ') : ''));
ok(structBad.length === 0, 'every meal has valid goals + tags + ingredients');
ok(dupes.length === 0, 'no duplicate meal names' + (dupes.length ? ': ' + dupes.join(', ') : ''));

// ---- 3. word-boundary: "pea" must not match peach-only or peanut-only meals ----
const peaHits = hitsFor('pea');
const falsePea = peaHits.filter(m => { const h = mealHay(m); return h.indexOf(' pea ') < 0 && h.indexOf(' peas ') < 0; });
ok(falsePea.length === 0, '"pea" never false-matches peach/peanut meals' + (falsePea.length ? ' — LEAK: ' + falsePea.map(m=>m.n).join(' | ') : ''));

// ---- 4. plurals ----
ok(hitsFor('apples').length >= 3, `plural "apples" matches ${hitsFor('apples').length} meals (>=3)`);
ok(hitsFor('cherries').length >= 3, `plural "cherries" matches ${hitsFor('cherries').length} meals (>=3)`);

// ---- 5. allergen exclusion sweep: disliking a category must exclude every meal that
//         contains ANY of its synonyms as a standalone word ----
const CATS = ['dairy','nuts','shellfish','gluten','egg','sesame','soy','fish','pork'];
let leakTotal = 0;
CATS.forEach(cat => {
  const syns = (FOOD_SYN[cat] || []).concat([cat]);
  const containing = MEAL_DB.filter(m => { const h = mealHay(m); return syns.some(w => { const nw = ' ' + String(w).toLowerCase().trim() + ' '; return h.indexOf(nw) >= 0; }); });
  const leaked = containing.filter(m => !termHitsMeal(cat, m));
  if (leaked.length) { leakTotal += leaked.length; console.log('   LEAK [' + cat + ']: ' + leaked.map(m => m.n).slice(0,3).join(' | ')); }
});
ok(leakTotal === 0, 'allergen exclusion: no meal containing a category synonym escapes the category dislike');

// ---- 6. the original bug, pinned forever ----
const banana = hitsFor('banana');
ok(banana.length >= 3, `guard: "banana" matches ${banana.length} meals (>=3) — the reported bug`);
ok(html.indexOf('m._goal || m._score>0') >= 0, 'guard: pool gate present (on-goal OR liked) — goal never hard-hides a liked meal');
ok(html.indexOf("pool.filter(function(m){ return m.goals.indexOf(goal)>=0; })") < 0, 'guard: the old goal HARD-filter is gone');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
