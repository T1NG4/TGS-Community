'use strict';

const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });
const builder = new xml2js.Builder({
  renderOpts: { pretty: true, indent: '  ', newline: '\n' },
  xmldec: { version: '1.0', encoding: 'UTF-8' },
});

/**
 * Wheel class mapping to Item indices
 */
const WHEEL_CLASS_MAP = {
  VWT_SPORT: 0,
  VWT_MUSCLE: 1,
  VWT_LOWRIDER: 2,
  VWT_SUV: 3,
  VWT_OFFROAD: 4,
  VWT_TUNER: 5,
  VWT_BIKE: 6,
  VWT_HIEND: 7,
  VWT_SUPERMOD1: 8,
  VWT_SUPERMOD2: 9,
  VWT_SUPERMOD3: 10,
};

/**
 * Create an empty carcols.meta template with 11 wheel class slots
 */
function createEmptyCarcolsMeta() {
  const classDescriptions = {
    VWT_SPORT: 'VWT_SPORT - Rodas Esportivas',
    VWT_MUSCLE: 'VWT_MUSCLE - Rodas para Carros Muscle',
    VWT_LOWRIDER: 'VWT_LOWRIDER - Rodas Lowrider',
    VWT_SUV: 'VWT_SUV - Rodas para SUVs',
    VWT_OFFROAD: 'VWT_OFFROAD - Rodas Offroad',
    VWT_TUNER: 'VWT_TUNER - Rodas Tuner',
    VWT_BIKE: 'VWT_BIKE - Rodas para Motos',
    VWT_HIEND: 'VWT_HIEND - Rodas High-End',
    VWT_SUPERMOD1: 'VWT_SUPERMOD1 - Benny\'s Originals',
    VWT_SUPERMOD2: 'VWT_SUPERMOD2 - Benny\'s Bespoke',
    VWT_SUPERMOD3: 'VWT_SUPERMOD3',
  };

  const obj = {
    CVehicleModelInfoVarGlobal: {
      Wheels: [
        {
          Item: Array.from({ length: 11 }, (_, idx) => {
            const classNames = Object.keys(WHEEL_CLASS_MAP);
            return {
              $: { comment: ` ${classDescriptions[classNames[idx]]} ` },
            };
          }),
        },
      ],
    },
  };

  return builder.buildObject(obj);
}

/**
 * Parse existing carcols.meta and add/update a wheel entry
 * @param {string} carcolsContent - Existing XML content (or empty)
 * @param {string} wheelName - Name of the wheel (model .ydr filename)
 * @param {string} wheelClass - Class of wheel (VWT_SPORT, etc)
 * @param {number} rimRadius - Rim radius value (default 0.25)
 * @param {object} options - Additional options
 * @param {string} options.modShopLabel - Label shown in mod shop (default: wheelName)
 * @param {string} options.wheelVariation - Wheel variation (default: empty)
 * @param {boolean} options.rear - Is rear wheel (default: false)
 * @returns {string} Updated XML content
 */
async function addWheelToCarcolsMeta(
  carcolsContent,
  wheelName,
  wheelClass,
  rimRadius = 0.25,
  options = {}
) {
  try {
    let data;

    // Parse existing content or create new template
    if (carcolsContent && carcolsContent.trim()) {
      data = await parser.parseStringPromise(carcolsContent);
    } else {
      // Create empty template
      data = {
        CVehicleModelInfoVarGlobal: {
          Wheels: [
            {
              Item: Array.from({ length: 11 }, (_, idx) => {
                const classNames = Object.keys(WHEEL_CLASS_MAP);
                return {
                  $: { comment: ` ${classNames[idx]} ` },
                };
              }),
            },
          ],
        },
      };
    }

    const itemIndex = WHEEL_CLASS_MAP[wheelClass];
    if (itemIndex === undefined) {
      const err = new Error(`Invalid wheel class: ${wheelClass}`);
      err.cause = new Error('wheel class not found in WHEEL_CLASS_MAP');
      throw err;
    }

    // Ensure Items array exists
    if (!data.CVehicleModelInfoVarGlobal) {
      data.CVehicleModelInfoVarGlobal = {};
    }
    if (!data.CVehicleModelInfoVarGlobal.Wheels) {
      data.CVehicleModelInfoVarGlobal.Wheels = [{ Item: [] }];
    }

    // Ensure Wheels[0] is an object (xml2js may return it as string if empty/whitespace)
    if (typeof data.CVehicleModelInfoVarGlobal.Wheels[0] === 'string') {
      data.CVehicleModelInfoVarGlobal.Wheels[0] = { Item: [] };
    }

    if (!data.CVehicleModelInfoVarGlobal.Wheels[0].Item) {
      data.CVehicleModelInfoVarGlobal.Wheels[0].Item = [];
    }

    // Ensure Item is always an array
    if (typeof data.CVehicleModelInfoVarGlobal.Wheels[0].Item === 'string') {
      data.CVehicleModelInfoVarGlobal.Wheels[0].Item = [];
    }

    const items = data.CVehicleModelInfoVarGlobal.Wheels[0].Item;

    // Ensure we have enough Item placeholders
    while (items.length <= itemIndex) {
      const classNames = Object.keys(WHEEL_CLASS_MAP);
      items.push({
        $: { comment: ` ${classNames[items.length]} ` },
      });
    }

    // Add wheel entry as a child Item within the class Item
    const modShopLabel = options.modShopLabel || wheelName;
    const wheelVariation = options.wheelVariation || '';
    const rear = options.rear !== undefined ? options.rear : false;

    const wheelEntry = {
      wheelName: [wheelName],
      wheelVariation: [wheelVariation],
      modShopLabel: [modShopLabel],
      rimRadius: [{ $: { value: parseFloat(rimRadius).toFixed(4) } }],
      rear: [{ $: { value: rear.toString() } }],
    };

    // Ensure item at this index is an object (not a string)
    if (typeof items[itemIndex] === 'string' || !items[itemIndex]) {
      items[itemIndex] = { $: { comment: ` ${Object.keys(WHEEL_CLASS_MAP)[itemIndex]} ` } };
    }

    // Initialize Item array if it doesn't exist (for nested wheels)
    if (!items[itemIndex].Item) {
      items[itemIndex].Item = [];
    }

    // If Item is a string (edge case), convert to array
    if (typeof items[itemIndex].Item === 'string') {
      items[itemIndex].Item = [];
    }

    // --- EVITAR DUPLICATAS ---
    // Verificar se a roda já existe nesta categoria
    const existingIndex = items[itemIndex].Item.findIndex(
      (entry) => entry.wheelName && entry.wheelName[0] === wheelName
    );

    if (existingIndex !== -1) {
      // Atualiza a roda existente
      items[itemIndex].Item[existingIndex] = wheelEntry;
    } else {
      // Adiciona nova roda
      items[itemIndex].Item.push(wheelEntry);
    }

    // Build XML
    const newXml = builder.buildObject(data);
    return newXml;
  } catch (err) {
    const error = new Error(`Failed to update carcols.meta: ${err.message}`);
    error.cause = err;
    throw error;
  }
}

/**
 * Parse existing carcols.meta and remove wheel entries by wheelName (across all classes)
 * @param {string} carcolsContent - Existing XML content
 * @param {string} wheelName - Name of the wheel (model name, without extension)
 * @returns {Promise<{ xml: string, removedCount: number }>} Updated XML and how many entries were removed
 */
async function removeWheelFromCarcolsMeta(carcolsContent, wheelName) {
  try {
    if (!carcolsContent || !carcolsContent.trim()) {
      return { xml: createEmptyCarcolsMeta(), removedCount: 0 };
    }

    const data = await parser.parseStringPromise(carcolsContent);
    let removedCount = 0;

    if (!data.CVehicleModelInfoVarGlobal) {
      return { xml: carcolsContent, removedCount: 0 };
    }
    if (!data.CVehicleModelInfoVarGlobal.Wheels) {
      return { xml: carcolsContent, removedCount: 0 };
    }

    // xml2js shape guards
    if (typeof data.CVehicleModelInfoVarGlobal.Wheels[0] === 'string') {
      return { xml: carcolsContent, removedCount: 0 };
    }

    const wheelsRoot = data.CVehicleModelInfoVarGlobal.Wheels[0];
    if (!wheelsRoot.Item || typeof wheelsRoot.Item === 'string') {
      return { xml: carcolsContent, removedCount: 0 };
    }

    for (const classItem of wheelsRoot.Item) {
      if (!classItem || typeof classItem === 'string') continue;
      if (!classItem.Item || typeof classItem.Item === 'string') continue;

      const before = classItem.Item.length;
      classItem.Item = classItem.Item.filter((entry) => {
        if (!entry || typeof entry === 'string') return true;
        const entryName = entry.wheelName?.[0];
        return entryName !== wheelName;
      });
      removedCount += before - classItem.Item.length;
    }

    const newXml = builder.buildObject(data);
    return { xml: newXml, removedCount };
  } catch (err) {
    const error = new Error(`Failed to remove wheel from carcols.meta: ${err.message}`);
    error.cause = err;
    throw error;
  }
}

/**
 * Generate carcols.meta from wheel configurations
 * Used during pack export to generate final carcols based on all wheels added
 * @param {Array} wheelsByClass - Object with keys like VWT_SPORT and values as wheel names
 * @returns {string} Generated XML content
 */
function generateCarcolsFromWheels(wheelsByClass) {
  const data = {
    CVehicleModelInfoVarGlobal: {
      Wheels: [
        {
          Item: Array.from({ length: 11 }, (_, idx) => {
            const classNames = Object.keys(WHEEL_CLASS_MAP);
            const className = classNames[idx];
            const wheelName = wheelsByClass[className];

            if (wheelName) {
              return {
                wheelName: [{ $: { value: wheelName } }],
                modShopLabel: [{ $: { value: wheelName } }],
                rimRadius: [{ $: { value: '0.250000' } }],
                rear: [{ $: { value: 'false' } }],
              };
            }

            // Empty placeholder with comment
            return {
              $: { comment: ` ${className} ` },
            };
          }),
        },
      ],
    },
  };

  return builder.buildObject(data);
}

module.exports = {
  createEmptyCarcolsMeta,
  addWheelToCarcolsMeta,
  removeWheelFromCarcolsMeta,
  generateCarcolsFromWheels,
  WHEEL_CLASS_MAP,
};
