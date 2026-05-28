const fs = require('fs-extra');
const path = require('path');
const { generatePack } = require('../generator');

async function testVehiclesPackMergeWithStaging() {
  console.log('[TEST] Testing VehiclesPack merge with staging...\n');

  const basePath = path.join(__dirname, '../../../../[TGS-Fivem-Pack]');
  const outputPath = path.join(__dirname, '../../../../output');
  const stagingPath = path.join(__dirname, '../../../../output', '.staging-merge-test');

  // Clean up previous test output
  const testPackDir = path.join(outputPath, '[TEST]', 'TEST-VehiclesPack');
  if (await fs.pathExists(testPackDir)) {
    await fs.remove(testPackDir);
  }
  if (await fs.pathExists(stagingPath)) {
    await fs.remove(stagingPath);
  }

  // Create staging with a simple handling.meta
  const stagingBrandDir = path.join(stagingPath, 'TEST', 'TESTBRAND');
  const stagingVehicleDir = path.join(stagingBrandDir, 'testvehicle');
  const stagingMetaDir = path.join(stagingVehicleDir, 'meta');
  await fs.ensureDir(stagingMetaDir);

  // Create a minimal handling.meta for staging
  const stagingHandlingMeta = `<?xml version="1.0" encoding="UTF-8"?>
<CHandlingDataMgr>
  <HandlingData>
    <Item>
      <handlingName>testvehicle</handlingName>
      <handlingType>HANDLING_TYPE_CAR</handlingType>
      <fMass value="1500.000000" />
    </Item>
  </HandlingData>
</CHandlingDataMgr>`;
  await fs.writeFile(path.join(stagingMetaDir, 'handling.meta'), stagingHandlingMeta);

  // Test data with one vehicle
  const testData = {
    id: 'TEST',
    name: 'TEST',
    description: 'Test pack for merge verification',
    brands: [
      {
        name: 'TESTBRAND',
        vehicles: [
          {
            model: 'testvehicle',
            name: 'Test Vehicle'
          }
        ]
      }
    ]
  };

  try {
    // Generate pack
    console.log('[TEST] Generating pack with staging...');
    await generatePack(testData, outputPath, basePath, stagingPath);
    console.log('[TEST] Pack generated successfully\n');

    // Verify output
    const outputDataDir = path.join(testPackDir, 'data');
    const templateDataDir = path.join(basePath, 'TGS-VehiclesPack', 'data');

    console.log('[TEST] Verifying merge result...\n');

    // Check handling.meta - should contain template content + staging content
    const outputHandling = await fs.readFile(path.join(outputDataDir, 'handling.meta'), 'utf-8');
    const templateHandling = await fs.readFile(path.join(templateDataDir, 'handling.meta'), 'utf-8');

    const hasTemplateContent = outputHandling.includes('CHandlingDataMgr');
    const hasStagingContent = outputHandling.includes('testvehicle');

    console.log(`[CHECK] handling.meta contains template structure: ${hasTemplateContent ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK] handling.meta contains staging vehicle: ${hasStagingContent ? 'PASS' : 'FAIL'}`);

    // Check other files - should match template exactly (no staging for them)
    const otherFiles = ['carcols.meta', 'carvariations.meta', 'vehicles.meta'];
    let otherFilesPass = true;

    for (const file of otherFiles) {
      const outputPathFile = path.join(outputDataDir, file);
      const templatePathFile = path.join(templateDataDir, file);

      const outputContent = await fs.readFile(outputPathFile, 'utf-8');
      const templateContent = await fs.readFile(templatePathFile, 'utf-8');

      if (outputContent === templateContent) {
        console.log(`[PASS] ${file} - Unchanged (no staging)`);
      } else {
        console.log(`[FAIL] ${file} - Should be unchanged`);
        otherFilesPass = false;
      }
    }

    const allPassed = hasTemplateContent && hasStagingContent && otherFilesPass;
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

testVehiclesPackMergeWithStaging();
