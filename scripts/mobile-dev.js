#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎰 LuckyDay Development Menu');
console.log('============================');
console.log('1. Start Next.js Web App (npm run dev)');
console.log('2. Start Expo Mobile App (npx expo start)');
console.log('3. Build for Production (npm run build)');
console.log('4. Build Mobile App (eas build)');
console.log('5. Exit');
console.log('');

rl.question('Choose an option (1-5): ', (answer) => {
  switch(answer.trim()) {
    case '1':
      console.log('Starting Next.js web app...');
      spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
      break;
    case '2':
      console.log('Starting Expo mobile app...');
      spawn('npx', ['expo', 'start'], { stdio: 'inherit' });
      break;
    case '3':
      console.log('Building Next.js for production...');
      spawn('npm', ['run', 'build'], { stdio: 'inherit' });
      break;
    case '4':
      console.log('Building mobile app with EAS...');
      spawn('eas', ['build'], { stdio: 'inherit' });
      break;
    case '5':
      console.log('Goodbye!');
      rl.close();
      break;
    default:
      console.log('Invalid option. Please choose 1-5.');
      rl.close();
  }
}); 