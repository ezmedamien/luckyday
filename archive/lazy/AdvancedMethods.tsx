import React from 'react';
import { GeneratorMethod } from '@/lib/generators';
import { translations, Language } from '@/lib/translations';
import { Card } from '@/components/ui/Card';

interface AdvancedMethodsProps {
  language: Language;
  selectedMethod: GeneratorMethod;
  onMethodSelect: (method: GeneratorMethod) => void;
  historicalData: any[];
}

const generatorMethods = [
  {
    category: "Frequency-Based",
    methods: [
      { id: "windowHot", label: "Window Hot", description: "Recent frequency weighted", requiresHistory: true },
      { id: "hotColdHybrid", label: "Hot/Cold Hybrid", description: "3 hottest + 3 coldest", requiresHistory: true }
    ]
  },
  {
    category: "Pattern Analysis",
    methods: [
      { id: "expectedGap", label: "Expected Gap", description: "Numbers overdue by 20%", requiresHistory: true },
      { id: "hotPairs", label: "Hot Pairs", description: "Frequently co-occurring pairs", requiresHistory: true },
      { id: "hotTriplets", label: "Hot Triplets", description: "Frequently co-occurring triplets", requiresHistory: true },
      { id: "deltaSystem", label: "Delta System", description: "Common number spacing patterns", requiresHistory: true },
      { id: "positionalFreq", label: "Positional Freq", description: "Position-based frequency", requiresHistory: true }
    ]
  },
  {
    category: "Constraint Filters",
    methods: [
      { id: "oddEvenBalanced", label: "Odd/Even Balanced", description: "3 odd + 3 even numbers" },
      { id: "sumInRange", label: "Sum in Range", description: "Sum between 100-200" },
      { id: "zoneBalanced", label: "Zone Balanced", description: "1 number from each zone (1-15, 16-30, 31-45)" }
    ]
  },
  {
    category: "Advanced Algorithms",
    methods: [
      { id: "markovChain", label: "Markov Chain", description: "1-step transition probabilities", requiresHistory: true },
      { id: "gboostModel", label: "Gradient Boost", description: "ML-based prediction model", requiresHistory: true },
      { id: "positionalSelect", label: "Position Select", description: "Choose numbers for specific positions", requiresHistory: true, requiresInput: true }
    ]
  }
];

export const AdvancedMethods: React.FC<AdvancedMethodsProps> = ({
  language,
  selectedMethod,
  onMethodSelect,
  historicalData
}) => {
  const t = translations[language];

  return (
    <div className="space-y-8">
      {generatorMethods.map((category) => (
        <div key={category.category}>
          <h3 className="text-lg font-semibold text-indigo mb-4">
            {category.category === "Frequency-Based" ? t.frequencyBased :
             category.category === "Pattern Analysis" ? t.patternAnalysis :
             category.category === "Constraint Filters" ? t.constraintFilters :
             category.category === "Advanced Algorithms" ? t.advancedAlgorithms :
             category.category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.methods.map((method) => (
              <button
                key={method.id}
                onClick={() => onMethodSelect(method.id)}
                className={`duo-card p-4 text-left transition-all ${
                  selectedMethod === method.id
                    ? 'ring-2 ring-indigo bg-indigo/5'
                    : 'hover:ring-2 hover:ring-indigo/20'
                }`}
              >
                <div className="font-semibold text-indigo mb-1">{method.label}</div>
                <div className="text-sm text-gray-600">{t.methodDescriptions[method.id]}</div>
                {method.requiresHistory && (
                  <div className="text-xs text-lime mt-2">
                    {historicalData.length > 0 ? '✅ Historical data loaded' : '⏳ Loading historical data...'}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 