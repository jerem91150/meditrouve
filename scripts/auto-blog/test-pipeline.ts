#!/usr/bin/env npx ts-node --compiler-options {"module":"CommonJS"}
// ============================================
// 🧪 TEST PIPELINE
// Lance le pipeline en mode dry-run pour tester sans publier
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-blog/test-pipeline.ts
// ============================================

import { runPipeline } from './pipeline';

async function main() {
  console.log('🧪 Test du pipeline auto-blog (dry-run)\n');

  const dryRun = !process.argv.includes('--publish');
  const topN = parseInt(process.argv.find(a => a.startsWith('--top='))?.split('=')[1] || '1');

  const result = await runPipeline({
    maxTopics: 3,
    topN,
    minScore: 80,
    dryRun,
  });

  console.log('\n📊 Résultat :');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error('💥 Crash:', err);
  process.exit(1);
});
