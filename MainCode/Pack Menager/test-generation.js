const { generatePack } = require('./src/server/src/generator');
const path = require('path');
const fs = require('fs-extra');

// Test data com os veículos existentes
const testData = {
  id: 'pack-1777707978780',
  name: 'TGS',
  description: 'Pack de teste com FORD GT e McLaren P1',
  brands: [
    {
      name: 'FORD',
      vehicles: [
        { name: 'GT', model: 'fgt' }
      ]
    },
    {
      name: 'MCLAREN', 
      vehicles: [
        { name: 'P1', model: 'p1' }
      ]
    }
  ]
};

async function testGeneration() {
  try {
    console.log('[TEST] Iniciando geração do pack TGS com veículos existentes...');
    
    const stagingPath = path.join(__dirname, 'output', '.staging');
    console.log('[TEST] Staging path:', stagingPath);
    
    // Verificar se os arquivos de staging existem
    const fgtMetaPath = path.join(stagingPath, 'pack-1777707978780', 'FORD', 'fgt', 'meta', 'vehicles.meta');
    const p1MetaPath = path.join(stagingPath, 'pack-1777707978780', 'MCLAREN', 'p1', 'meta', 'vehicles.meta');
    
    console.log('[TEST] Verificando arquivos de staging:');
    console.log('[TEST] FGT meta path:', fgtMetaPath, 'exists:', await fs.pathExists(fgtMetaPath));
    console.log('[TEST] P1 meta path:', p1MetaPath, 'exists:', await fs.pathExists(p1MetaPath));
    
    const result = await generatePack(
      testData,
      path.join(__dirname, 'output'),
      path.join(__dirname, '[TGS-Fivem-Pack]'),
      stagingPath
    );
    
    console.log('[TEST] Pack gerado com sucesso em:', result.path);
    
    // Verificar o conteúdo do vehicles.meta gerado
    const vehiclesMetaPath = path.join(result.path, 'TGS-VehiclesPack', 'data', 'vehicles.meta');
    if (await fs.pathExists(vehiclesMetaPath)) {
      const content = await fs.readFile(vehiclesMetaPath, 'utf-8');
      console.log('[TEST] Conteúdo do vehicles.meta gerado:');
      console.log('---');
      console.log(content);
      console.log('---');
      
      // Verificar se ambos os veículos estão presentes
      const hasFGT = content.includes('<modelName>FGT</modelName>') || content.includes('<modelName>fgt</modelName>');
      const hasP1 = content.includes('<modelName>P1</modelName>') || content.includes('<modelName>p1</modelName>');
      
      console.log('[TEST] FGT encontrado:', hasFGT);
      console.log('[TEST] P1 encontrado:', hasP1);
      console.log('[TEST] Ambos os veículos presentes:', hasFGT && hasP1);
    } else {
      console.log('[ERROR] vehicles.meta não encontrado em:', vehiclesMetaPath);
    }
    
  } catch (error) {
    console.error('[ERROR] Erro na geração:', error.message);
    console.error('[ERROR] Stack:', error.stack);
  }
}

testGeneration();
