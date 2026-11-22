#!/usr/bin/env node
/**
 * MyMediary — Zero-dependency repository integrity verifier.
 * Run with: node scripts/verify.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

let errors = 0;
let checks = 0;

function ok(msg) {
  checks++;
  console.log(`  [OK] ${msg}`);
}

function fail(msg) {
  checks++;
  errors++;
  console.error(`  [FAIL] ${msg}`);
}

function walkJs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJs(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out.sort();
}

console.log('=== MyMediary Integrity Check ===\n');

// 1. Critical root / PWA / TWA files
console.log('1. Checking critical PWA & GitHub Pages files...');
const requiredFiles = [
  'index.html',
  'sw.js',
  'manifest.json',
  'manifest-dark.json',
  '.nojekyll',
  '.well-known/assetlinks.json',
  'favicon.ico',
  'icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon.svg',
];
for (const rel of requiredFiles) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) ok(`Exists: ${rel}`);
  else fail(`Missing required file: ${rel}`);
}

// 2. JavaScript syntax check
console.log('\n2. Checking JavaScript syntax (node --check)...');
const jsFiles = [...walkJs(path.join(ROOT, 'js')), path.join(ROOT, 'sw.js')];
for (const file of jsFiles) {
  const rel = path.relative(ROOT, file);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    fail(`Syntax error in ${rel}: ${err.stderr?.toString().trim() || err.message}`);
  }
}
if (errors === 0) ok(`All ${jsFiles.length} JavaScript files passed syntax validation.`);

// 3. i18n ES/EN dictionary parity
console.log('\n3. Checking i18n dictionary parity (es.js <-> en.js)...');
const sandbox = { window: {} };
sandbox.globalThis = sandbox;
try {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/i18n/es.js'), 'utf8'), sandbox, { filename: 'es.js' });
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/i18n/en.js'), 'utf8'), sandbox, { filename: 'en.js' });
  const dict = { es: sandbox.window.MEDIARY_I18N_ES, en: sandbox.window.MEDIARY_I18N_EN };
  if (!dict.es || !dict.en) {
    fail('I18N.es or I18N.en did not register properly.');
  } else {
    const esKeys = Object.keys(dict.es);
    const enKeys = Object.keys(dict.en);
    const missingInEn = esKeys.filter(k => !(k in dict.en));
    const missingInEs = enKeys.filter(k => !(k in dict.es));

    if (missingInEn.length) fail(`Keys missing in en.js: ${missingInEn.slice(0, 15).join(', ')} (${missingInEn.length} total)`);
    if (missingInEs.length) fail(`Keys missing in es.js: ${missingInEs.slice(0, 15).join(', ')} (${missingInEs.length} total)`);
    if (!missingInEn.length && !missingInEs.length) ok(`Top-level i18n parity: ${esKeys.length} keys in both ES and EN.`);

    for (const nested of ['cats', 'subs']) {
      if (dict.es[nested] && dict.en[nested]) {
        const kEs = Object.keys(dict.es[nested]);
        const kEn = Object.keys(dict.en[nested]);
        const mEn = kEs.filter(k => !(k in dict.en[nested]));
        const mEs = kEn.filter(k => !(k in dict.es[nested]));
        if (mEn.length) fail(`${nested} keys missing in en.js: ${mEn.join(', ')}`);
        if (mEs.length) fail(`${nested} keys missing in es.js: ${mEs.join(', ')}`);
        if (!mEn.length && !mEs.length) ok(`Nested I18N.${nested} parity: ${kEs.length} keys.`);
      }
    }

    for (const arrKey of ['meses', 'dias']) {
      if (Array.isArray(dict.es[arrKey]) && Array.isArray(dict.en[arrKey])) {
        if (dict.es[arrKey].length !== dict.en[arrKey].length) {
          fail(`Array length mismatch for I18N.${arrKey}: ES=${dict.es[arrKey].length}, EN=${dict.en[arrKey].length}`);
        } else {
          ok(`Array I18N.${arrKey} parity: ${dict.es[arrKey].length} entries.`);
        }
      }
    }

    // 4. Verify all data-i18n* attributes in index.html resolve
    console.log('\n4. Checking all data-i18n* keys in index.html...');
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const attrRegex = /data-i18n(?:-[a-z]+)*="([^"]+)"/g;
    const htmlKeys = new Set();
    let m;
    while ((m = attrRegex.exec(html)) !== null) {
      htmlKeys.add(m[1]);
    }
    const missingHtmlEs = [...htmlKeys].filter(k => !(k in dict.es));
    const missingHtmlEn = [...htmlKeys].filter(k => !(k in dict.en));
    if (missingHtmlEs.length) fail(`index.html data-i18n keys missing in es.js: ${missingHtmlEs.join(', ')}`);
    if (missingHtmlEn.length) fail(`index.html data-i18n keys missing in en.js: ${missingHtmlEn.join(', ')}`);
    if (!missingHtmlEs.length && !missingHtmlEn.length) {
      ok(`All ${htmlKeys.size} unique data-i18n* keys in index.html exist in both ES and EN.`);
    }

    // 5. Verify all local asset references in index.html exist on disk
    console.log('\n5. Checking local asset references in index.html...');
    const refRegex = /(?:src|href)="(\.\/[^"?#]+)"/g;
    const localRefs = new Set();
    while ((m = refRegex.exec(html)) !== null) {
      localRefs.add(m[1]);
    }
    let missingRefs = 0;
    for (const ref of localRefs) {
      const target = path.join(ROOT, ref.replace(/^\.\//, ''));
      if (!fs.existsSync(target)) {
        fail(`Broken local asset reference in index.html: ${ref}`);
        missingRefs++;
      }
    }
    if (missingRefs === 0) ok(`All ${localRefs.size} local asset references in index.html exist on disk.`);
  }
} catch (err) {
  fail(`Failed evaluating i18n dictionaries: ${err.message}`);
}

// 6. Verify all Service Worker precache assets exist on disk
console.log('\n6. Checking sw.js precache ASSETS...');
const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const assetsMatch = swSrc.match(/const\s+ASSETS\s*=\s*\[([\s\S]*?)\];/);
if (!assetsMatch) {
  fail('Could not locate ASSETS array in sw.js');
} else {
  const swAssets = [];
  const itemRe = /['"]([^'"]+)['"]/g;
  let am;
  while ((am = itemRe.exec(assetsMatch[1])) !== null) {
    swAssets.push(am[1]);
  }
  let swMissing = 0;
  for (const a of swAssets) {
    if (a === './' || a === '/') continue;
    const target = path.join(ROOT, a.replace(/^\.\//, ''));
    if (!fs.existsSync(target)) {
      fail(`Missing sw.js precache asset: ${a}`);
      swMissing++;
    }
  }
  if (swMissing === 0) ok(`All ${swAssets.length} sw.js precache entries exist on disk.`);
}

// 7. Verify index.html has no corrupted '>None' or icon-only data-i18n tags
console.log('\n7. Checking index.html i18n markup integrity...');
const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const noneMatches = htmlSrc.match(/data-i18n="[^"]+">None/g) || [];
if (noneMatches.length) fail(`Found ${noneMatches.length} corrupted '>None' i18n nodes in index.html.`);
else ok('Zero corrupted ">None" i18n nodes in index.html.');

const iconOnlyRe = /<([a-z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>\s*(?:<svg\b[^>]*>(?:(?!<\/svg>)[\s\S])*<\/svg>)?\s*<\/\1>/gi;
const iconOnlyHits = [];
let im;
while ((im = iconOnlyRe.exec(htmlSrc)) !== null) {
  iconOnlyHits.push(`${im[1]}[${im[2]}]`);
}
if (iconOnlyHits.length) fail(`Found ${iconOnlyHits.length} empty/icon-only data-i18n elements: ${iconOnlyHits.slice(0, 8).join(', ')}`);
else ok('Zero empty or icon-only data-i18n elements in index.html.');

console.log(`\n=== Result: ${checks - errors}/${checks} checks passed (${errors} failed) ===`);
process.exit(errors > 0 ? 1 : 0);
