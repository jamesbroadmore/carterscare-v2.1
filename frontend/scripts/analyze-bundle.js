#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Analyze bundle sizes in the dist directory
 */

const distDir = path.join(__dirname, "../dist");

if (!fs.existsSync(distDir)) {
  console.error(
    "Error: dist directory not found. Run 'npm run build' first."
  );
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function analyzeDir(dir, indent = "") {
  const files = fs.readdirSync(dir);
  let totalSize = 0;

  const sortedFiles = files
    .map((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      return { file, stat, filePath };
    })
    .sort((a, b) => b.stat.size - a.stat.size);

  sortedFiles.forEach(({ file, stat, filePath }) => {
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${file}/`);
      const subSize = analyzeDir(filePath, indent + "  ");
      totalSize += subSize;
    } else {
      const size = stat.size;
      const sizeStr = formatBytes(size);
      const icon = size > 100000 ? "⚠️ " : "✓ ";
      console.log(`${indent}${icon}${file} - ${sizeStr}`);
      totalSize += size;
    }
  });

  return totalSize;
}

console.log("\n📊 Bundle Size Analysis\n");
const totalSize = analyzeDir(distDir);
console.log("\n" + "=".repeat(50));
console.log(`Total Size: ${formatBytes(totalSize)}`);
console.log("=".repeat(50) + "\n");

// Recommendations
console.log("Optimization Tips:");
console.log("• Files > 100KB should be code-split");
console.log("• Main bundle should be < 250KB");
console.log("• Use gzip compression (Vercel enables this)");
console.log("• Enable lazy loading for large components");
console.log("• Consider using dynamic imports for routes\n");
