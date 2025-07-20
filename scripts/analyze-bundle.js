#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing bundle size and performance...\n');

// Check if bundle analyzer report exists
const reportPath = path.join(__dirname, '../.next/bundle-report.html');
if (fs.existsSync(reportPath)) {
  console.log('✅ Bundle analyzer report found');
  console.log(`📊 Report location: ${reportPath}`);
} else {
  console.log('⚠️  No bundle analyzer report found');
  console.log('💡 Run "npm run dev" to generate bundle analysis');
}

// Analyze package.json dependencies
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

console.log('\n📦 Dependencies Analysis:');
console.log(`Total dependencies: ${Object.keys(dependencies).length}`);

// Categorize dependencies
const categories = {
  'React & Next.js': ['react', 'react-dom', 'next'],
  'Styling': ['tailwindcss', 'clsx', 'tailwind-merge'],
  'Development': ['typescript', 'eslint', '@types/node', '@types/react', '@types/react-dom'],
  'Build Tools': ['webpack-bundle-analyzer', '@svgr/webpack', 'url-loader', 'file-loader']
};

Object.entries(categories).forEach(([category, deps]) => {
  const found = deps.filter(dep => dependencies[dep]);
  if (found.length > 0) {
    console.log(`  ${category}: ${found.join(', ')}`);
  }
});

// Check for potential optimizations
console.log('\n🎯 Optimization Opportunities:');

// Check for large dependencies
const largeDeps = ['lodash', 'moment', 'date-fns', 'ramda'];
const foundLargeDeps = largeDeps.filter(dep => dependencies[dep]);
if (foundLargeDeps.length > 0) {
  console.log(`  ⚠️  Large dependencies detected: ${foundLargeDeps.join(', ')}`);
  console.log('     Consider using tree-shaking or alternatives');
}

// Check for duplicate dependencies
const duplicatePatterns = [
  { pattern: /^@types\//, name: 'TypeScript types' },
  { pattern: /^@babel\//, name: 'Babel plugins' },
  { pattern: /^eslint-/, name: 'ESLint plugins' }
];

duplicatePatterns.forEach(({ pattern, name }) => {
  const matches = Object.keys(dependencies).filter(dep => pattern.test(dep));
  if (matches.length > 1) {
    console.log(`  ⚠️  Multiple ${name} detected: ${matches.join(', ')}`);
  }
});

// Check bundle size limits
console.log('\n📏 Bundle Size Guidelines:');
console.log('  Initial bundle: < 200KB (gzipped)');
console.log('  Total bundle: < 500KB (gzipped)');
console.log('  Individual chunks: < 50KB (gzipped)');

// Performance recommendations
console.log('\n🚀 Performance Recommendations:');
console.log('  1. Use dynamic imports for heavy components');
console.log('  2. Implement code splitting by routes');
console.log('  3. Optimize images and assets');
console.log('  4. Enable tree shaking for all packages');
console.log('  5. Use production builds for analysis');

// Generate optimization report
const report = {
  timestamp: new Date().toISOString(),
  dependencies: Object.keys(dependencies).length,
  categories,
  recommendations: [
    'Implement lazy loading for advanced methods',
    'Add service worker for caching',
    'Optimize API responses',
    'Use React.memo for expensive components',
    'Implement virtual scrolling for large lists'
  ]
};

fs.writeFileSync(
  path.join(__dirname, '../bundle-analysis-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Bundle analysis complete!');
console.log('📄 Report saved to: bundle-analysis-report.json'); 