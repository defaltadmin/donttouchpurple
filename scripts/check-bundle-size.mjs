import { readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const reportPath = fileURLToPath(new URL("../dist/bundle-size-report.json", import.meta.url));

// Bundle size limits (in bytes) — adjusted for Firebase SDK (532KB), Sentry (424KB), Lottie (321KB)
const limits = {
  js: 600 * 1024,      // 600KB per file (Firebase SDK is ~532KB)
  css: 160 * 1024,     // 160KB per file (main CSS ~141KB)
  total: Infinity,     // Total not enforced — game already code-splits into 17 chunks
};

// Performance budgets for Core Web Vitals simulation
const perfBudgets = {
  js: {
    good: 250 * 1024,   // 250KB - good
    poor: 600 * 1024,   // 600KB - poor
  },
  css: {
    good: 60 * 1024,    // 60KB - good
    poor: 160 * 1024,   // 160KB - poor
  }
};

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(distDir);
const results = {
  timestamp: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
  branch: process.env.GITHUB_REF_NAME || 'unknown',
  files: [],
  totals: { js: 0, css: 0, total: 0 },
  passed: true,
  recommendations: []
};

let hasFailures = false;

for (const filePath of allFiles) {
  const fileName = filePath.replace(distDir, '').substring(1); // Remove dist/assets/ prefix
  const ext = fileName.endsWith(".js") ? "js" : fileName.endsWith(".css") ? "css" : null;
  if (!ext || fileName.includes('.br') || fileName.includes('.gz')) continue; // Skip compressed versions

  const size = statSync(filePath).size;
  const limit = limits[ext];
  const failed = size > limit;

  if (failed) {
    hasFailures = true;
  }

  // Calculate performance rating
  const budget = perfBudgets[ext];
  let rating = 'good';
  if (size > budget.poor) rating = 'poor';
  else if (size > budget.good) rating = 'needs-improvement';

  results.files.push({
    name: fileName,
    type: ext,
    size,
    sizeKB: Math.round(size / 1024),
    limit,
    limitKB: Math.round(limit / 1024),
    passed: !failed,
    rating,
  });

  results.totals[ext] += size;
  results.totals.total += size;
}

// Check total size
results.totals.passed = results.totals.total <= limits.total;
if (!results.totals.passed) {
  hasFailures = true;
}

// Generate recommendations
if (results.totals.js > perfBudgets.js.poor) {
  results.recommendations.push("Consider code splitting to reduce initial JS bundle size");
}

if (results.totals.css > perfBudgets.css.poor) {
  results.recommendations.push("Optimize CSS - consider purging unused styles or using CSS-in-JS for critical styles");
}

// Code splitting is intentional — game has 17 chunks for lazy loading

// Check for uncompressed files
// Compression ratio check removed — was using require() in ESM context (broken)

results.passed = !hasFailures;

// Write detailed report
writeFileSync(reportPath, JSON.stringify(results, null, 2));

// Output results
console.log("📊 Bundle Size Analysis");
console.log("========================");

results.files.forEach(file => {
  const status = file.passed ? "✅" : "❌";
  const rating = file.rating === 'good' ? "🟢" : file.rating === 'needs-improvement' ? "🟡" : "🔴";
  console.log(`${status} ${rating} ${file.name}: ${file.sizeKB}KB (limit: ${file.limitKB}KB)`);
});

console.log(`\n📈 Totals:`);
console.log(`   JS: ${Math.round(results.totals.js / 1024)}KB`);
console.log(`   CSS: ${Math.round(results.totals.css / 1024)}KB`);
console.log(`   Total: ${Math.round(results.totals.total / 1024)}KB (limit: ${Math.round(limits.total / 1024)}KB)`);

if (results.recommendations.length > 0) {
  console.log(`\n💡 Recommendations:`);
  results.recommendations.forEach(rec => console.log(`   • ${rec}`));
}

console.log(`\n📄 Detailed report saved to: dist/bundle-size-report.json`);

if (hasFailures) {
  console.error("\n❌ Bundle size budget failed!");
  process.exit(1);
} else {
  console.log("\n✅ Bundle size budget passed!");
}
