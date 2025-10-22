/**
 * Test file for AI Clients
 * Chrome Extension: AI MCQ Solver
 */

import { solveWithFallback, getAPIStatus } from '../lib/api.js';

/**
 * Test the AI fallback system
 */
async function testAIClients() {
  console.log('🧪 Starting AI Clients Test...');
  
  // Test question
  const testQuestion = "What is 2+2?";
  
  try {
    console.log(`📝 Testing with question: "${testQuestion}"`);
    
    // Get API status first
    const status = getAPIStatus();
    console.log('📊 API Status:', status);
    
    // Test the fallback system
    const startTime = Date.now();
    const result = await solveWithFallback(testQuestion);
    const totalTime = Date.now() - startTime;
    
    console.log('✅ Test completed successfully!');
    console.log('📋 Results:');
    console.log(`  Answer: ${result.answer}`);
    console.log(`  Explanation: ${result.explanation}`);
    console.log(`  Source: ${result.source}`);
    console.log(`  Provider Time: ${result.timeTaken}ms`);
    console.log(`  Total Time: ${totalTime}ms`);
    
    // Log which API responded first
    if (result.source !== 'none') {
      console.log(`🎯 First successful API: ${result.source}`);
    } else {
      console.log('❌ All APIs failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test individual API providers (for debugging)
 */
async function testIndividualProviders() {
  console.log('🔍 Testing individual providers...');
  
  const testQuestion = "What is the capital of France?";
  const providers = [
    'Groq',
    'FreeLLM', 
    'OpenRouter',
    'Gemini',
    'HuggingFace',
    'OpenAI'
  ];
  
  for (const provider of providers) {
    try {
      console.log(`🧪 Testing ${provider}...`);
      const result = await solveWithFallback(testQuestion);
      
      if (result.source === provider) {
        console.log(`✅ ${provider} responded successfully`);
        console.log(`   Answer: ${result.answer}`);
        console.log(`   Time: ${result.timeTaken}ms`);
        break; // Stop after first successful provider
      }
    } catch (error) {
      console.warn(`❌ ${provider} failed:`, error);
    }
  }
}

/**
 * Performance test
 */
async function performanceTest() {
  console.log('⚡ Running performance test...');
  
  const questions = [
    "What is 2+2?",
    "What is the capital of France?",
    "Explain photosynthesis briefly"
  ];
  
  const results = [];
  
  for (const question of questions) {
    const startTime = Date.now();
    const result = await solveWithFallback(question);
    const totalTime = Date.now() - startTime;
    
    results.push({
      question,
      source: result.source,
      time: totalTime,
      success: result.source !== 'none'
    });
    
    console.log(`✅ "${question}" - ${result.source} (${totalTime}ms)`);
  }
  
  const successRate = results.filter(r => r.success).length / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  
  console.log('📊 Performance Summary:');
  console.log(`  Success Rate: ${(successRate * 100).toFixed(1)}%`);
  console.log(`  Average Time: ${avgTime.toFixed(0)}ms`);
  
  return results;
}

// Export test functions
export {
  testAIClients,
  testIndividualProviders,
  performanceTest
};

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  testAIClients()
    .then(() => console.log('🎉 All tests completed!'))
    .catch(error => console.error('💥 Tests failed:', error));
} else {
  // Browser environment - make functions available globally
  (window as any).testAIClients = testAIClients;
  (window as any).testIndividualProviders = testIndividualProviders;
  (window as any).performanceTest = performanceTest;
  
  console.log('🧪 AI Client tests loaded. Use testAIClients() to run tests.');
}
