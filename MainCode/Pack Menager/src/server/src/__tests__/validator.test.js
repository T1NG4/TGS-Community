const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const {
  validateXmlStructure,
  validatePackIntegrity,
  validateUniqueIds,
  validateCrossReferences,
} = require('../validator');

describe('validator', () => {
  it('validateXmlStructure fails on malformed XML', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vxml-'));
    const fp = path.join(dir, 'bad.meta');
    await fs.writeFile(fp, '<root><unclosed>', 'utf-8');
    const r = await validateXmlStructure(fp, 'bad.meta');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/XML inválido/i);
    await fs.remove(dir);
  });

  it('validateUniqueIds warns on duplicates', () => {
    const w = validateUniqueIds(['a', 'a', 'b']);
    expect(w.some((x) => x.includes('duplicado'))).toBe(true);
  });

  it('validateCrossReferences warns for missing handling', () => {
    const w = validateCrossReferences(['ABC'], new Set(['ZZZ']));
    expect(w.length).toBeGreaterThan(0);
    expect(w[0]).toMatch(/ABC/);
  });

  it('validatePackIntegrity reports duplicate modelName', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vpack-'));
    const dataDir = path.join(dir, 'X-VehiclesPack', 'data');
    await fs.ensureDir(dataDir);
    const vehiclesXml = `<?xml version="1.0" encoding="UTF-8"?>
<CVehicleModelInfo__InitDataList>
  <residentTxd>vehshare</residentTxd>
  <InitDatas>
    <Item>
      <modelName>DUP</modelName>
      <handlingId>DUP</handlingId>
      <vehicleMakeName>BR</vehicleMakeName>
    </Item>
    <Item>
      <modelName>DUP</modelName>
      <handlingId>DUP</handlingId>
      <vehicleMakeName>BR</vehicleMakeName>
    </Item>
  </InitDatas>
  <txdRelationships/>
</CVehicleModelInfo__InitDataList>`;
    const handlingXml = `<?xml version="1.0" encoding="UTF-8"?>
<CHandlingDataMgr>
  <HandlingData>
    <Item type="CHandlingData">
      <handlingName>DUP</handlingName>
      <handlingType>HANDLING_TYPE_CAR</handlingType>
    </Item>
  </HandlingData>
</CHandlingDataMgr>`;
    await fs.writeFile(path.join(dataDir, 'vehicles.meta'), vehiclesXml);
    await fs.writeFile(path.join(dataDir, 'handling.meta'), handlingXml);

    const { warnings, errors } = await validatePackIntegrity(dir);
    expect(errors).toEqual([]);
    expect(warnings.some((x) => x.includes('duplicado'))).toBe(true);

    await fs.remove(dir);
  });
});
