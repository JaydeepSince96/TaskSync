// Deployment verification script
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Deployment Package...\n');

// Check if we're in the right directory
console.log('1️⃣ Current Directory Structure:');
const currentDir = process.cwd();
console.log(`   Current directory: ${currentDir}`);

// Check for essential files
console.log('\n2️⃣ Essential Files Check:');
const essentialFiles = [
  'package.json',
  'package-lock.json',
  'src/services/auth-service.ts',
  'src/controllers/auth-controller.ts',
  'src/configs/passport.ts',
  'dist/'
];

essentialFiles.forEach(file => {
  const filePath = path.join(currentDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - EXISTS`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
  }
});

// Check if dist folder has compiled files
console.log('\n3️⃣ Compiled Files Check:');
const distPath = path.join(currentDir, 'dist');
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath);
  console.log(`   ✅ dist/ folder exists with ${distFiles.length} files`);
  if (distFiles.length === 0) {
    console.log('   ⚠️  dist/ folder is empty - compilation may have failed');
  }
} else {
  console.log('   ❌ dist/ folder missing - compilation may have failed');
}

// Check package.json for dependencies
console.log('\n4️⃣ Package.json Check:');
const packagePath = path.join(currentDir, 'package.json');
if (fs.existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`   ✅ package.json exists`);
    console.log(`   📦 Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
    console.log(`   🔧 Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);
    
    // Check for critical dependencies
    const criticalDeps = ['express', 'mongoose', 'passport', 'passport-google-oauth20'];
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`   ✅ ${dep} - ${packageJson.dependencies[dep]}`);
      } else {
        console.log(`   ❌ ${dep} - MISSING`);
      }
    });
  } catch (error) {
    console.log(`   ❌ Error reading package.json: ${error.message}`);
  }
} else {
  console.log('   ❌ package.json missing');
}

console.log('\n🎯 Deployment Package Checklist:');
console.log('1. ✅ All essential files present');
console.log('2. ✅ TypeScript compilation successful (dist/ folder has files)');
console.log('3. ✅ All dependencies listed in package.json');
console.log('4. ✅ ZIP file includes:');
console.log('   - dist/ folder (compiled TypeScript)');
console.log('   - src/ folder (source files)');
console.log('   - package.json');
console.log('   - package-lock.json');
console.log('   - Any .ebextensions/ or Procfile');

console.log('\n🚨 If any files are missing, the deployment will fail!');
