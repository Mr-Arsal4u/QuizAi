/**
 * Test file for AI Clients
 * Chrome Extension: AI MCQ Solver
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

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
  
  // Import the individual functions directly
  const { tryGroq, tryFreeLLM, tryOpenRouter, tryGemini, tryHuggingFace, tryOpenAI } = await import('../lib/api.js');
  
  const providers = [
    { name: 'Groq', fn: tryGroq },
    { name: 'FreeLLM', fn: tryFreeLLM },
    { name: 'OpenRouter', fn: tryOpenRouter },
    { name: 'Gemini', fn: tryGemini },
    { name: 'HuggingFace', fn: tryHuggingFace },
    { name: 'OpenAI', fn: tryOpenAI }
  ];
  
  const results = [];
  
  for (const provider of providers) {
    try {
      console.log(`🧪 Testing ${provider.name}...`);
      const result = await provider.fn(testQuestion);
      
      if (result) {
        console.log(`✅ ${provider.name} responded successfully`);
        console.log(`   Answer: ${result.answer}`);
        console.log(`   Explanation: ${result.explanation}`);
        console.log(`   Time: ${result.timeTaken}ms`);
        console.log(`   Source: ${result.source}`);
        results.push({ provider: provider.name, success: true, result });
      } else {
        console.log(`❌ ${provider.name} returned null (no response)`);
        results.push({ provider: provider.name, success: false, error: 'No response' });
      }
    } catch (error) {
      console.warn(`❌ ${provider.name} failed:`, error.message);
      results.push({ provider: provider.name, success: false, error: error.message });
    }
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('📊 Individual API Test Summary:');
  console.log('='.repeat(50));
  results.forEach(({ provider, success, result, error }) => {
    if (success) {
      console.log(`✅ ${provider}: ${result.timeTaken}ms - "${result.answer}"`);
    } else {
      console.log(`❌ ${provider}: ${error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Success Rate: ${successCount}/${results.length} (${((successCount/results.length)*100).toFixed(1)}%)`);
  
  return results;
}

/**
 * Test all APIs with the same question to compare responses
 */
async function testAllAPIsComparison() {
  console.log('🔄 Testing all APIs with same question for comparison...');
  
  const testQuestion = "What is 2+2?";
  const { tryGroq, tryFreeLLM, tryOpenRouter, tryGemini, tryHuggingFace, tryOpenAI } = await import('../lib/api.js');
  
  const providers = [
    { name: 'Groq', fn: tryGroq },
    { name: 'FreeLLM', fn: tryFreeLLM },
    { name: 'OpenRouter', fn: tryOpenRouter },
    { name: 'Gemini', fn: tryGemini },
    { name: 'HuggingFace', fn: tryHuggingFace },
    { name: 'OpenAI', fn: tryOpenAI }
  ];
  
  console.log(`📝 Question: "${testQuestion}"`);
  console.log('='.repeat(60));
  
  const responses = [];
  
  for (const provider of providers) {
    try {
      console.log(`\n🧪 Testing ${provider.name}...`);
      const result = await provider.fn(testQuestion);
      
      if (result) {
        console.log(`✅ ${provider.name} Response:`);
        console.log(`   Answer: "${result.answer}"`);
        console.log(`   Explanation: "${result.explanation}"`);
        console.log(`   Time: ${result.timeTaken}ms`);
        responses.push({ provider: provider.name, result });
      } else {
        console.log(`❌ ${provider.name}: No response`);
        responses.push({ provider: provider.name, result: null });
      }
    } catch (error) {
      console.log(`❌ ${provider.name}: ${error.message}`);
      responses.push({ provider: provider.name, result: null, error: error.message });
    }
  }
  
  // Summary comparison
  console.log('\n📊 Response Comparison Summary:');
  console.log('='.repeat(60));
  responses.forEach(({ provider, result, error }) => {
    if (result) {
      console.log(`${provider}: "${result.answer}" (${result.timeTaken}ms)`);
    } else {
      console.log(`${provider}: Failed - ${error || 'No response'}`);
    }
  });
  
  return responses;
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
  testAllAPIsComparison,
  performanceTest
};

// Run comprehensive test if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  async function runComprehensiveTest() {
    console.log('🚀 Running comprehensive AI API test...\n');
    
    // Test the main fallback system
    await testAIClients();
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Testing individual providers...\n');
    
    // Test individual providers
    await testIndividualProviders();
    
    console.log('\n' + '='.repeat(50));
    console.log('🔄 Testing all APIs with same question for comparison...\n');
    
    // Test all APIs with same question
    await testAllAPIsComparison();
    
    console.log('\n' + '='.repeat(50));
    console.log('⚡ Running performance test...\n');
    
    // Performance test
    await performanceTest();
    
    console.log('\n🎉 All comprehensive tests completed!');
  }
  
  runComprehensiveTest()
    .catch(error => console.error('💥 Tests failed:', error));
} else {
  // Browser environment - make functions available globally
  (window as any).testAIClients = testAIClients;
  (window as any).testIndividualProviders = testIndividualProviders;
  (window as any).performanceTest = performanceTest;
  
  console.log('🧪 AI Client tests loaded. Use testAIClients() to run tests.');
}
