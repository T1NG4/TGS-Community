const fs = require('fs-extra');
const path = require('path');
const { generatePack } = require('../generator');

async function testVehiclesPackTemplateCopy() {
  console.log('[TEST] Testing VehiclesPack template copy without staging...\n');

  const basePath = path.join(__dirname, '../../../../[TGS-Fivem-Pack]');
  const outputPath = path.join(__dirname, '../../../../output');
  const stagingPath = path.join(__dirname, '../../../../output', '.staging-test');

  // Clean up previous test output
  const testPackDir = path.join(outputPath, '[TEST]', 'TEST-VehiclesPack');
  if (await fs.pathExists(testPackDir)) {
    await fs.remove(testPackDir);
  }

  // Test data (minimal, no staging)
  const testData = {
    id: 'TEST',
    name: 'TEST',
    description: 'Test pack for template copy verification',
    brands: []
  };

  try {
    // Generate pack
    console.log('[TEST] Generating pack...');
    await generatePack(testData, outputPath, basePath, stagingPath);
    console.log('[TEST] Pack generated successfully\n');

    // Verify output
    const outputDataDir = path.join(testPackDir, 'data');
    const templateDataDir = path.join(basePath, 'TGS-VehiclesPack', 'data');

    console.log('[TEST] Verifying output against template...\n');

    const expectedFiles = [
      'carcols.meta',
      'carvariations.meta',
      'handling.meta',
      'vehicles.meta',
      'vehiclelayouts.meta',
    ];
    let allPassed = true;

    for (const file of expectedFiles) {
      const outputPathFile = path.join(outputDataDir, file);
      const templatePathFile = path.join(templateDataDir, file);

      const outputExists = await fs.pathExists(outputPathFile);
      const templateExists = await fs.pathExists(templatePathFile);

      if (!outputExists) {
        console.log(`[FAIL] ${file} - Missing in output`);
        allPassed = false;
        continue;
      }

      if (!templateExists) {
        console.log(`[WARN] ${file} - Missing in template (unexpected)`);
        continue;
      }

      const outputContent = await fs.readFile(outputPathFile, 'utf-8');
      const templateContent = await fs.readFile(templatePathFile, 'utf-8');

      if (outputContent === templateContent) {
        console.log(`[PASS] ${file} - Matches template exactly`);
      } else {
        console.log(`[FAIL] ${file} - Does not match template`);
        allPassed = false;
      }
    }

    // Check for unexpected files
    const outputFiles = await fs.readdir(outputDataDir);
    const unexpectedFiles = outputFiles.filter(f => !expectedFiles.includes(f));
    if (unexpectedFiles.length > 0) {
      console.log(`[FAIL] Unexpected files in output: ${unexpectedFiles.join(', ')}`);
      allPassed = false;
    }

    console.log('\n[TEST] Result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');

    // Cleanup
    await fs.remove(stagingPath);
    await fs.remove(testPackDir);

    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('[TEST] Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testVehiclesPackTemplateCopy();
