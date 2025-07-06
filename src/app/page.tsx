import { generate } from '@/lib/generators';

export default async function Home() {
  // Test the generators
  const randomNumbers = await generate('random');
  const birthdayNumbers = await generate('birthday', { birthday: '1995-07-16' });

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">LuckyDay Generator Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Random Numbers:</h2>
          <p className="text-blue-600 font-mono">{randomNumbers.join(', ')}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Birthday Numbers (1995-07-16):</h2>
          <p className="text-green-600 font-mono">{birthdayNumbers.join(', ')}</p>
        </div>
      </div>
    </main>
  );
}
