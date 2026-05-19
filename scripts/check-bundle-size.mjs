import { readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const reportPath = fileURLToPath(new URL("../dist/bundle-size-report.json", import.meta.url));

// Bundle size limits (in bytes)
const limits = {
  js: 500 * 1024,      // 500KB
  css: 120 * 1024,     // 120KB
  total: 600 * 1024,   // 600KB total
};

// Performance budgets for Core Web Vitals simulation
const perfBudgets = {
  js: {
    good: 200 * 1024,   // 200KB - good
    poor: 500 * 1024,   // 500KB - poor
  },
  css: {
    good: 50 * 1024,    // 50KB - good
    poor: 120 * 1024,   // 120KB - poor
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
    compressionRatio: ext === 'js' ? calculateGzipRatio(filePath) : null
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

if (results.files.length > 5) {
  results.recommendations.push("High number of chunks detected - review code splitting strategy");
}

// Check for uncompressed files
const uncompressedFiles = results.files.filter(f => f.compressionRatio && f.compressionRatio < 0.5);
if (uncompressedFiles.length > 0) {
  results.recommendations.push("Some files have poor compression ratios - verify build compression is enabled");
}

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

// Helper function to estimate gzip compression ratio
function calculateGzipRatio(filePath) {
  // Simple estimation based on file extension and content patterns
  // In a real implementation, you'd use actual gzip compression
  try {
    const content = require('fs').readFileSync(filePath, 'utf8');
    const estimatedCompressed = content.length * 0.3; // Rough gzip estimation
    return estimatedCompressed / content.length;
  } catch {
    return null;
  }
}
