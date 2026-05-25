'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const multer = require('multer');
const fsExtra = require('fs-extra');
const { z } = require('zod');
const sanitize = require('sanitize-filename');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { generatePack } = require('./generator');
const {
  parseHandlingMeta,
  parseVehiclesMeta,
  detectFileType,
  FILE_TYPE_LABELS,
} = require('./metaParser');
const {
  createEmptyCarcolsMeta,
  addWheelToCarcolsMeta,
  removeWheelFromCarcolsMeta,
  WHEEL_CLASS_MAP,
} = require('./carcolsManager');

// ─── Logger ──────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fivem-pack-manager' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );

}

// ─── Rate Limiter ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Muitas requisições, tente novamente depois.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helper Functions ─────────────────────────────────────────────────────────
async function makeFolderHidden(folderPath) {
  if (process.platform === 'win32') {
    try {
      await new Promise((resolve, reject) => {
        exec(`attrib +h "${folderPath}"`, (error) => {
          if (error) {
            logger.warn(`[makeFolderHidden] Failed to hide folder: ${folderPath}`, { error: error.message });
            reject(error);
          } else {
            logger.info(`[makeFolderHidden] Folder hidden: ${folderPath}`);
            resolve();
          }
        });
      });
    } catch (error) {
      // Don't fail if hiding doesn't work, just log it
      logger.warn(`[makeFolderHidden] Could not hide folder: ${folderPath}`, { error: error.message });
    }
  }
}

// ─── Validation Schemas ──────────────────────────────────────────────────────
const PackIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'packId deve conter apenas letras, números, hífens e underscores');
const BrandNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'brandName deve conter apenas letras, números, hífens e underscores')
  .max(50);
const VehicleModelSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'vehicleModel deve conter apenas letras, números, hífens e underscores'
  )
  .max(50);
const FileNameSchema = z.string().min(1).max(255);

// ─── Safe Path Join ──────────────────────────────────────────────────────────
function safeJoin(basePath, ...parts) {
  const resolved = path.resolve(basePath, ...parts);
  if (!resolved.startsWith(path.resolve(basePath))) {
    throw new Error('Tentativa de path traversal detectada');
  }
  return resolved;
}

// ─── Paths ────────────────────────────────────────────────────────────────────
// These are overridden by electron/main.js before calling createApp()
let BASE_PATH = path.join(__dirname, '../../[TGS-Fivem-Pack]');
let OUTPUT_PATH = path.join(__dirname, '../../output');
let DIST_PATH = path.join(__dirname, '../../client/dist');
let STAGING_PATH = path.join(__dirname, '../../output', '.staging');

function setPaths(base, output, dist) {
  BASE_PATH = base;
  OUTPUT_PATH = output;
  DIST_PATH = dist;
  STAGING_PATH = path.join(output, '.staging');
}

// ─── Multer (memory storage for parsing) ─────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const ADS_CONFIG_REMOTE_URL =
  'https://raw.githubusercontent.com/T1NG4/TGS-ads/main/pack-manager.json';

function isValidAdConfig(data) {
  if (!data || typeof data !== 'object') return false;
  const hasValidAds =
    Array.isArray(data.ads) &&
    data.ads.every(
      (ad) =>
        ad &&
        typeof ad.id === 'string' &&
        typeof ad.type === 'string' &&
        typeof ad.url === 'string'
    );
  const hasVast =
    typeof data.vastTagUrl === 'string' && data.vastTagUrl.trim().length > 0;
  return (
    typeof data.version === 'number' &&
    typeof data.enabled === 'boolean' &&
    hasValidAds &&
    (!data.enabled || data.ads.length > 0 || hasVast)
  );
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://imasdk.googleapis.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "media-src 'self' https: blob: data:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
].join('; ');

// ─── Express App ──────────────────────────────────────────────────────────────
function createApp(serveStatic = false) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Security headers
  app.use((req, res, next) => {
    res.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Rate limiting
  app.use('/api/', limiter);

  if (serveStatic) {
    app.use(express.static(DIST_PATH));
  }

  // ── Reference ──────────────────────────────────────────────────────────────
  app.get('/api/reference', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/ads/config', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(ADS_CONFIG_REMOTE_URL, {
        headers: { 'User-Agent': 'TGS-Pack-Manager' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({ error: `Upstream HTTP ${response.status}` });
      }

      const data = await response.json();
      if (!isValidAdConfig(data)) {
        return res.status(502).json({ error: 'Invalid ads config format' });
      }

      res.json(data);
    } catch (error) {
      logger.warn('Failed to fetch remote ads config', error);
      res.status(502).json({ error: error.message || 'Failed to fetch ads config' });
    }
  });

  const RELEASES_REPO = 'T1NG4/TGS-pack-manager-releases';
  app.get('/api/releases/latest', async (_req, res) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch release info' });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Failed to fetch release info',
      });
    }
  });

  app.get('/api/output-path', (_req, res) => res.json({ path: OUTPUT_PATH }));

  app.post('/api/output-path', (req, res) => {
    const { path: newPath } = req.body;
    if (newPath) {
      setPaths(BASE_PATH, newPath, DIST_PATH);
      res.json({ success: true, path: OUTPUT_PATH });
    } else {
      res.status(400).json({ error: 'Path not provided' });
    }
  });

  // ── Export Pack ────────────────────────────────────────────────────────────
  app.post('/api/export', async (req, res) => {
    try {
      await fsExtra.ensureDir(OUTPUT_PATH);
      await fsExtra.ensureDir(STAGING_PATH);
      await makeFolderHidden(STAGING_PATH);
      
      if (!(await fsExtra.pathExists(BASE_PATH))) {
        throw new Error(`Pasta 'base' não encontrada em:\n${BASE_PATH}`);
      }
      const result = await generatePack(req.body, OUTPUT_PATH, BASE_PATH, STAGING_PATH);
      // open folder
      const { shell } = (() => {
        try {
          return require('electron');
        } catch {
          return {};
        }
      })();
      if (shell) shell.openPath(result.path);

      res.json({
        success: true,
        message: 'Pack exportado com sucesso!',
        path: result.path,
        warnings: result.warnings || [],
      });
    } catch (err) {
      logger.error('[Export] Error exporting pack', { error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Upload & Parse Vehicle Files ───────────────────────────────────────────
  app.post('/api/upload-files', upload.array('files'), async (req, res) => {
    try {
      const { packId, brandName, vehicleModel } = req.body;

      // Validate inputs
      const validation = z
        .object({
          packId: PackIdSchema,
          brandName: BrandNameSchema,
          vehicleModel: VehicleModelSchema,
        })
        .safeParse({ packId, brandName, vehicleModel });

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
      }

      const streamDir = safeJoin(STAGING_PATH, packId, brandName.toUpperCase(), vehicleModel.toLowerCase());
      const tuningDir = safeJoin(streamDir, 'Tuning');
      const metaDir = safeJoin(streamDir, 'meta');
      await fsExtra.ensureDir(streamDir);
      await fsExtra.ensureDir(tuningDir);
      await fsExtra.ensureDir(metaDir);

      const streamFiles = [];
      const tuningFiles = [];
      const metaFiles = [];
      const extractedHandling = {};
      const extractedVehicles = {};
      const errors = [];

      for (const file of req.files) {
        const sanitizedName = sanitize(path.basename(file.originalname));
        if (!sanitizedName) {
          errors.push(`Nome de arquivo inválido: ${file.originalname}`);
          continue;
        }

        const fileType = detectFileType(sanitizedName);
        console.log(`[Upload Debug] File: ${sanitizedName}, Type: ${fileType}`);

        if (fileType === 'unknown') {
          errors.push(`Arquivo ignorado: ${sanitizedName}`);
          continue;
        }

        if (fileType.startsWith('meta_')) {
          console.log(`[Upload Debug] Processing meta file: ${sanitizedName}, Type: ${fileType}`);
          // save to meta staging
          await fsExtra.writeFile(path.join(metaDir, sanitizedName), file.buffer);
          console.log(`[Upload Debug] Meta file saved to: ${path.join(metaDir, sanitizedName)}`);
          metaFiles.push({
            name: sanitizedName,
            type: fileType,
            label: FILE_TYPE_LABELS[fileType],
          });

          // parse and extract values
          const content = file.buffer.toString('utf-8');
          if (fileType === 'meta_handling') {
            const items = await parseHandlingMeta(content);
            const match =
              items.find((i) => i.handlingName?.toLowerCase() === vehicleModel.toLowerCase()) ||
              items[0];
            if (match) Object.assign(extractedHandling, match);
          }
          if (fileType === 'meta_vehicles') {
            const items = await parseVehiclesMeta(content);
            const match =
              items.find((i) => i.modelName?.toLowerCase() === vehicleModel.toLowerCase()) ||
              items[0];
            if (match) Object.assign(extractedVehicles, match);
          }
        } else {
          // Check if it's a base file
          // Base files are: modelo.yft, modelo_hi.yft, modelo.ytd, modelo_hi.ytd
          // OR animation/drawable/script files (unless they contain _arch_ or _tuning)
          const baseFileName = vehicleModel.toLowerCase();
          const fileNameLower = sanitizedName.toLowerCase();

          // Check exact match for base model files
          const isExactBaseFile =
            fileNameLower === `${baseFileName}.yft` ||
            fileNameLower === `${baseFileName}_hi.yft` ||
            fileNameLower === `${baseFileName}.ytd` ||
            fileNameLower === `${baseFileName}_hi.ytd`;

          // Animation/drawable/script files are base files unless they contain _arch_ or _tuning
          const isAnimationFile =
            fileType === 'animations' ||
            fileType === 'drawable' ||
            fileType === 'drawable_dict' ||
            fileType === 'script';
          const isTuningFile =
            fileNameLower.includes('_arch_') || fileNameLower.includes('_tuning');

          const isBaseFile = isExactBaseFile || (isAnimationFile && !isTuningFile);

          if (isBaseFile) {
            // save to stream staging (base file)
            await fsExtra.writeFile(path.join(streamDir, sanitizedName), file.buffer);
            streamFiles.push({
              name: sanitizedName,
              type: fileType,
              label: FILE_TYPE_LABELS[fileType],
              size: file.size,
              isTuning: false,
            });
          } else {
            // save to tuning staging (not a base file)
            await fsExtra.writeFile(path.join(tuningDir, sanitizedName), file.buffer);
            tuningFiles.push({
              name: sanitizedName,
              type: fileType,
              label: FILE_TYPE_LABELS[fileType],
              size: file.size,
              isTuning: true,
            });
          }
        }
      }

      res.json({
        success: true,
        streamFiles,
        tuningFiles,
        metaFiles,
        extractedHandling,
        extractedVehicles,
        errors,
      });
    } catch (err) {
      logger.error('[Upload] Error uploading files', { error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get staged file list ───────────────────────────────────────────────────
  app.get('/api/staged-files', async (req, res) => {
    const { packId, brandName, vehicleModel } = req.query;

    // Validate inputs
    const validation = z
      .object({
        packId: PackIdSchema,
        brandName: BrandNameSchema,
        vehicleModel: VehicleModelSchema,
      })
      .safeParse({ packId, brandName, vehicleModel });

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const streamDir = safeJoin(STAGING_PATH, packId, brandName.toUpperCase(), vehicleModel.toLowerCase());
    const metaDir = safeJoin(streamDir, 'meta');

    try {
      const files = [];

      if (await fsExtra.pathExists(streamDir)) {
        const entries = await fsExtra.readdir(streamDir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile()) {
            const type = detectFileType(e.name);
            files.push({ name: e.name, type, label: FILE_TYPE_LABELS[type], isStream: true });
          }
        }
      }

      if (await fsExtra.pathExists(metaDir)) {
        const entries = await fsExtra.readdir(metaDir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isFile()) {
            const type = detectFileType(e.name);
            files.push({ name: e.name, type, label: FILE_TYPE_LABELS[type], isMeta: true });
          }
        }
      }

      res.json({ files });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Clear staged files ─────────────────────────────────────────────────────
  app.delete('/api/staged-files', async (req, res) => {
    const { packId, brandName, vehicleModel } = req.query;

    // Validate inputs
    const validation = z
      .object({
        packId: PackIdSchema,
        brandName: BrandNameSchema,
        vehicleModel: VehicleModelSchema,
      })
      .safeParse({ packId, brandName, vehicleModel });

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const stagingDir = safeJoin(STAGING_PATH, packId, brandName.toUpperCase(), vehicleModel.toLowerCase());
    try {
      await fsExtra.remove(stagingDir);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Upload Shared Wheels ────────────────────────────────────────────────────
  app.post('/api/upload-wheels', upload.array('files'), async (req, res) => {
    try {
      const {
        packId,
        brandName,
        wheelClass,
        modShopLabel,
        rimRadius,
        rear,
      } = req.body;

      // Validate inputs (modShopLabel can be a single string or multiple values)
      const validation = z
        .object({
          packId: PackIdSchema,
          brandName: BrandNameSchema,
          modShopLabel: z.union([z.string(), z.array(z.string())]).optional(),
          wheelClass: z.string().optional(),
          rimRadius: z.coerce.number().min(0.1).max(1).optional(),
          rear: z.coerce.boolean().optional(),
        })
        .safeParse({
          packId,
          brandName,
          // wheelName is now derived from files, not received
          wheelClass,
          modShopLabel,
          rimRadius,
          rear,
        });

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
      }

      const wheelsDir = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'stream',
        brandName.toUpperCase()
      );
      await fsExtra.ensureDir(wheelsDir);

      const uploadedFiles = [];

      // Process uploaded wheel files
      for (const file of req.files || []) {
        const sanitizedName = sanitize(path.basename(file.originalname));
        if (!sanitizedName) {
          continue; // Skip invalid filenames
        }

        const fileType = detectFileType(sanitizedName);

        if (fileType !== 'wheels') {
          continue; // Only accept wheel files
        }

        await fsExtra.writeFile(path.join(wheelsDir, sanitizedName), file.buffer);
        uploadedFiles.push({
          name: sanitizedName,
          type: fileType,
          label: FILE_TYPE_LABELS[fileType],
          size: file.size,
        });
      }

      // Update carcols.meta if user confirmed and files uploaded
      // Only create carcols entries if createInCarcols flag is true
      const createInCarcols = req.body.createInCarcols === '1' || req.body.createInCarcols === true;
      const modShopLabelList = Array.isArray(modShopLabel)
        ? modShopLabel
        : modShopLabel
          ? [modShopLabel]
          : [];

      if (createInCarcols && wheelClass && uploadedFiles.length > 0) {
        // Validate wheel class
        if (!Object.prototype.hasOwnProperty.call(WHEEL_CLASS_MAP, wheelClass)) {
          return res.status(400).json({
            error: `Invalid wheel class. Valid values: ${Object.keys(WHEEL_CLASS_MAP).join(', ')}`,
          });
        }

        const carcolsDir = safeJoin(STAGING_PATH, packId, 'shared', 'wheels', 'data');
        const carcolsPath = safeJoin(carcolsDir, 'carcols.meta');

        await fsExtra.ensureDir(carcolsDir);

        let carcolsContent = '';
        if (await fsExtra.pathExists(carcolsPath)) {
          carcolsContent = await fsExtra.readFile(carcolsPath, 'utf-8');
        }

        // If single label provided: use for all wheels
        // If multiple labels: match 1:1 with uploaded files
        const labelsToUse =
          modShopLabelList.length === 1
            ? Array(uploadedFiles.length).fill(modShopLabelList[0])
            : modShopLabelList.slice(0, uploadedFiles.length);

        // Create or update carcols entry for each wheel
        // wheelName is the filename without extension (model 3D name)
        // modShopLabel is the customized display name
        let updatedContent = carcolsContent;
        for (let i = 0; i < uploadedFiles.length; i++) {
          const wheelNameForEntry = uploadedFiles[i].name.replace(/\.[^.]+$/, ''); // Use filename as wheelName
          const labelForEntry = labelsToUse[i] || wheelNameForEntry;
          updatedContent = await addWheelToCarcolsMeta(
            updatedContent,
            wheelNameForEntry,
            wheelClass,
            rimRadius || 0.25,
            {
              modShopLabel: labelForEntry,
              rear,
            }
          );
        }

        await fsExtra.writeFile(carcolsPath, updatedContent, 'utf-8');
        logger.info('[Upload Wheels] Added wheels to carcols.meta', {
          count: uploadedFiles.length,
          wheelClass,
          packId,
          brandName,
        });
      } else if (createInCarcols && (!wheelClass || uploadedFiles.length === 0)) {
        // User wanted to create carcols but missing required data
        logger.warn('[Upload Wheels] createInCarcols=true but missing wheelClass or files', {
          packId,
          brandName,
        });
      }

      res.json({ success: true, files: uploadedFiles });
    } catch (err) {
      logger.error('[Upload Wheels] Error uploading wheels', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get Shared Wheels List ─────────────────────────────────────────────────
  app.get('/api/shared-wheels', async (req, res) => {
    const { packId } = req.query;

    // Validate inputs
    const validation = PackIdSchema.safeParse(packId);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const wheelsDir = safeJoin(STAGING_PATH, packId, 'shared', 'wheels', 'stream');

    try {
      const wheels = {};

      if (await fsExtra.pathExists(wheelsDir)) {
        const brandDirs = await fsExtra.readdir(wheelsDir, { withFileTypes: true });
        for (const brandDir of brandDirs) {
          if (brandDir.isDirectory()) {
            const brandPath = path.join(wheelsDir, brandDir.name);
            const files = await fsExtra.readdir(brandPath);
            wheels[brandDir.name] = files.map((f) => ({
              name: f,
              type: detectFileType(f),
              label: FILE_TYPE_LABELS[detectFileType(f)],
            }));
          }
        }
      }

      res.json({ wheels });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Stage Wheel (for staging mode) ─────────────────────────────────────────────
  app.post('/api/stage-wheel', upload.single('file'), async (req, res) => {
    try {
      const { packId, brandName, wheelName, wheelClass, rimRadius } = req.body;

      // Validate inputs
      const validation = z
        .object({
          packId: PackIdSchema,
          brandName: BrandNameSchema,
          wheelName: z.string().min(1).max(100),
          wheelClass: z.string().optional(),
          rimRadius: z.coerce.number().min(0.1).max(1).optional(),
        })
        .safeParse({ packId, brandName, wheelName, wheelClass, rimRadius });

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const sanitizedName = sanitize(req.file.originalname);
      if (!sanitizedName) {
        return res.status(400).json({ error: 'Nome de arquivo inválido' });
      }

      if (!sanitizedName.endsWith('.ydr')) {
        return res.status(400).json({ error: 'O arquivo deve ser .ydr' });
      }

      // Save to staging directory
      const wheelsDir = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'stream',
        brandName.toUpperCase()
      );
      await fsExtra.ensureDir(wheelsDir);

      const filePath = path.join(wheelsDir, sanitizedName);
      await fsExtra.writeFile(filePath, req.file.buffer);

      logger.info('[Stage Wheel] Wheel staged successfully', {
        packId,
        brandName,
        wheelName,
        fileName: sanitizedName,
      });

      res.json({
        success: true,
        filePath: filePath,
        fileName: sanitizedName,
      });
    } catch (err) {
      logger.error('[Stage Wheel] Error staging wheel', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Delete Wheel File ─────────────────────────────────────────────────────────
  app.post('/api/delete-wheel-file', async (req, res) => {
    try {
      const { packId, brandName, fileName } = req.body;

      // Validate inputs
      const validation = z
        .object({
          packId: PackIdSchema,
          brandName: BrandNameSchema,
          fileName: FileNameSchema,
        })
        .safeParse({ packId, brandName, fileName });

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
      }

      const filePath = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'stream',
        brandName.toUpperCase(),
        fileName
      );

      const carcolsPath = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'data',
        'carcols.meta'
      );

      if (await fsExtra.pathExists(filePath)) {
        await fsExtra.unlink(filePath);

        // Also remove entry from carcols.meta (if present)
        try {
          const wheelName = fileName.replace(/\.ydr$/i, '');
          if (await fsExtra.pathExists(carcolsPath)) {
            const content = await fsExtra.readFile(carcolsPath, 'utf-8');
            const { xml, removedCount } = await removeWheelFromCarcolsMeta(content, wheelName);
            if (removedCount > 0) {
              await fsExtra.writeFile(carcolsPath, xml, 'utf-8');
            }
          }
        } catch (innerErr) {
          logger.warn('[Delete Wheel File] Failed to update carcols.meta after delete', {
            error: innerErr.message,
            stack: innerErr.stack,
            packId,
            brandName,
            fileName,
          });
        }

        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
      }
    } catch (err) {
      console.error('[Delete Wheel File]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Delete Wheels Brand ───────────────────────────────────────────────────────
  app.post('/api/delete-wheels-brand', async (req, res) => {
    try {
      const { packId, brandName } = req.body;

      // Validate inputs
      const validation = z
        .object({
          packId: PackIdSchema,
          brandName: BrandNameSchema,
        })
        .safeParse({ packId, brandName });

      if (!validation.success) {
        return res
          .status(400)
          .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
      }

      const brandPath = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'stream',
        brandName.toUpperCase()
      );

      const carcolsPath = safeJoin(
        STAGING_PATH,
        packId,
        'shared',
        'wheels',
        'data',
        'carcols.meta'
      );

      if (await fsExtra.pathExists(brandPath)) {
        // Remove all wheels from this brand folder from carcols.meta (best-effort)
        try {
          if (await fsExtra.pathExists(carcolsPath)) {
            const brandFiles = await fsExtra.readdir(brandPath);
            const ydrFiles = brandFiles.filter((f) => f.toLowerCase().endsWith('.ydr'));
            if (ydrFiles.length > 0) {
              let content = await fsExtra.readFile(carcolsPath, 'utf-8');
              let totalRemoved = 0;
              for (const f of ydrFiles) {
                const wheelName = f.replace(/\.ydr$/i, '');
                const result = await removeWheelFromCarcolsMeta(content, wheelName);
                content = result.xml;
                totalRemoved += result.removedCount;
              }
              if (totalRemoved > 0) {
                await fsExtra.writeFile(carcolsPath, content, 'utf-8');
              }
            }
          }
        } catch (innerErr) {
          logger.warn('[Delete Wheels Brand] Failed to update carcols.meta after brand delete', {
            error: innerErr.message,
            stack: innerErr.stack,
            packId,
            brandName,
          });
        }

        await fsExtra.remove(brandPath);
        res.json({ success: true });
      } else {
        // Idempotent delete: if folder doesn't exist, consider it already deleted
        res.json({ success: true });
      }
    } catch (err) {
      console.error('[Delete Wheels Brand]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get carcols.meta ────────────────────────────────────────────────────────
  app.get('/api/carcols-meta', async (req, res) => {
    const { packId } = req.query;

    // Validate inputs
    const validation = PackIdSchema.safeParse(packId);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const carcolsPath = safeJoin(STAGING_PATH, packId, 'shared', 'wheels', 'data', 'carcols.meta');

    try {
      if (await fsExtra.pathExists(carcolsPath)) {
        const content = await fsExtra.readFile(carcolsPath, 'utf-8');
        res.json({ content });
      } else {
        // Return empty template by default (auto-generated as wheels are added)
        const emptyTemplate = createEmptyCarcolsMeta();
        res.json({ content: emptyTemplate });
      }
    } catch (err) {
      logger.error('[Get carcols-meta] Error reading carcols', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Save carcols.meta ───────────────────────────────────────────────────────
  app.post('/api/carcols-meta', async (req, res) => {
    const { packId, content } = req.body;

    // Validate inputs
    const validation = z
      .object({
        packId: PackIdSchema,
        content: z.string().min(1),
      })
      .safeParse({ packId, content });

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const carcolsDir = safeJoin(STAGING_PATH, packId, 'shared', 'wheels', 'data');
    const carcolsPath = safeJoin(carcolsDir, 'carcols.meta');

    try {
      await fsExtra.ensureDir(carcolsDir);
      await fsExtra.writeFile(carcolsPath, content, 'utf-8');
      res.json({ success: true });
    } catch (err) {
      console.error('[Save carcols.meta]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Apply Staged Wheels to carcols.meta ───────────────────────────────────────
  app.post('/api/apply-staged-wheels', async (req, res) => {
    const { packId, stagedWheels } = req.body;

    // Validate inputs
    const validation = z
      .object({
        packId: PackIdSchema,
        stagedWheels: z.array(
          z.object({
            id: z.string(),
            brandName: BrandNameSchema,
            wheelName: z.string().min(1),
            wheelClass: z.string(),
            rimRadius: z.coerce.number().min(0.1).max(1),
            fileName: z.string(),
            filePath: z.string(),
          })
        ),
      })
      .safeParse({ packId, stagedWheels });

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const carcolsDir = safeJoin(STAGING_PATH, packId, 'shared', 'wheels', 'data');
    const carcolsPath = safeJoin(carcolsDir, 'carcols.meta');

    try {
      await fsExtra.ensureDir(carcolsDir);

      // Read existing carcols.meta or create empty template
      let carcolsContent = '';
      if (await fsExtra.pathExists(carcolsPath)) {
        carcolsContent = await fsExtra.readFile(carcolsPath, 'utf-8');
      } else {
        carcolsContent = createEmptyCarcolsMeta();
      }

      // Apply each staged wheel to carcols.meta
      for (const wheel of stagedWheels) {
        // Generate wheelName from fileName (remove .ydr extension)
        const wheelNameForEntry = wheel.fileName.replace(/\.ydr$/i, '');
        const modShopLabel = `${wheel.brandName} - ${wheel.wheelName}`;

        carcolsContent = await addWheelToCarcolsMeta(
          carcolsContent,
          wheelNameForEntry,
          wheel.wheelClass,
          wheel.rimRadius,
          {
            modShopLabel,
            rear: false,
          }
        );

        logger.info('[Apply Staged Wheels] Applied wheel to carcols', {
          wheelName: wheel.wheelName,
          wheelClass: wheel.wheelClass,
          brandName: wheel.brandName,
        });
      }

      // Save updated carcols.meta
      await fsExtra.writeFile(carcolsPath, carcolsContent, 'utf-8');

      logger.info('[Apply Staged Wheels] All staged wheels applied successfully', {
        count: stagedWheels.length,
        packId,
      });

      res.json({
        success: true,
        content: carcolsContent,
        appliedCount: stagedWheels.length,
      });
    } catch (err) {
      logger.error('[Apply Staged Wheels] Error applying staged wheels', {
        error: err.message,
        stack: err.stack,
      });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get brand's combined handling.meta (for editor preview) ───────────────
  app.post('/api/brand-meta-preview', async (req, res) => {
    const { brand } = req.body; // brand = full brand object with vehicles
    if (!brand) return res.status(400).json({ error: 'brand object required' });

    try {
      // Build XML for the full brand handling.meta
      const xml2js = require('xml2js');
      const builder = new xml2js.Builder({
        renderOpts: { pretty: true, indent: '  ', newline: '\n' },
        xmldec: { version: '1.0', encoding: 'UTF-8' },
      });

      const obj = {
        CHandlingDataMgr: {
          HandlingData: {
            Item: brand.vehicles.map((v) => ({
              $: { type: 'CHandlingData' },
              handlingName: v.model,
              fMass: { $: { value: v.meta?.handling?.fMass || '1500.000000' } },
              fInitialDragCoeff: {
                $: { value: v.meta?.handling?.fInitialDragCoeff || '8.000000' },
              },
              fDriveBiasFront: { $: { value: v.meta?.handling?.fDriveBiasFront || '0.500000' } },
              nInitialDriveGears: { $: { value: v.meta?.handling?.nInitialDriveGears || '6' } },
              fInitialDriveForce: {
                $: { value: v.meta?.handling?.fInitialDriveForce || '0.300000' },
              },
              fDriveInertia: { $: { value: '1.000000' } },
              fInitialDriveMaxFlatVel: {
                $: { value: v.meta?.handling?.fInitialDriveMaxFlatVel || '160.000000' },
              },
              fBrakeForce: { $: { value: v.meta?.handling?.fBrakeForce || '0.800000' } },
              fBrakeBiasFront: { $: { value: v.meta?.handling?.fBrakeBiasFront || '0.520000' } },
              fHandBrakeForce: { $: { value: v.meta?.handling?.fHandBrakeForce || '0.600000' } },
              fSteeringLock: { $: { value: v.meta?.handling?.fSteeringLock || '40.000000' } },
              fTractionCurveMax: {
                $: { value: v.meta?.handling?.fTractionCurveMax || '2.200000' },
              },
              fTractionCurveMin: {
                $: { value: v.meta?.handling?.fTractionCurveMin || '2.000000' },
              },
              fCollisionDamageMult: {
                $: { value: v.meta?.handling?.fCollisionDamageMult || '1.000000' },
              },
              fEngineDamageMult: {
                $: { value: v.meta?.handling?.fEngineDamageMult || '1.500000' },
              },
              strModelFlags: v.meta?.handling?.strModelFlags || '440010',
              strHandlingFlags: v.meta?.handling?.strHandlingFlags || '0',
              AIHandling: v.meta?.handling?.AIHandling || 'AVERAGE',
              SubHandlingData: {
                Item: [
                  {
                    $: { type: 'CCarHandlingData' },
                    fBackEndPopUpCarImpulseMult: { $: { value: '0.1' } },
                    fBackEndPopUpBuildingImpulseMult: { $: { value: '0.03' } },
                    fBackEndPopUpMaxDeltaSpeed: { $: { value: '3.0' } },
                  },
                  { $: { type: 'NULL' } },
                  { $: { type: 'NULL' } },
                ],
              },
            })),
          },
        },
      };

      const xml = builder.buildObject(obj);
      res.json({ xml });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Open Packs Folder ─────────────────────────────────────────────────────────────
  app.post('/api/open-packs-folder', async (req, res) => {
    try {
      logger.info('[Open Packs Folder] Checking global.electronAPI:', !!global.electronAPI);
      logger.info('[Open Packs Folder] Checking global.electronAPI.openPacksFolder:', !!(global.electronAPI && global.electronAPI.openPacksFolder));
      
      // Try to use IPC if available (Electron environment)
      if (global.electronAPI && global.electronAPI.openPacksFolder) {
        logger.info('[Open Packs Folder] Using IPC to open folder');
        const result = await global.electronAPI.openPacksFolder();
        logger.info('[Open Packs Folder] IPC result:', result);
        res.json(result);
      } else {
        // Fallback for web mode - return path
        logger.warn('[Open Packs Folder] IPC not available, returning path');
        logger.warn('[Open Packs Folder] global keys:', Object.keys(global));
        res.json({ 
          success: true, 
          message: 'Caminho da pasta', 
          path: OUTPUT_PATH,
          note: 'Abra manualmente: ' + OUTPUT_PATH 
        });
      }
    } catch (err) {
      logger.error('[Open Packs Folder] Error opening folder', { error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Upload Audio Config ─────────────────────────────────────────────────────
  app.post('/api/upload-audio', upload.fields([
    { name: 'gameRel', maxCount: 1 },
    { name: 'soundsRel', maxCount: 1 },
    { name: 'ampRel', maxCount: 1 },
    { name: 'gameNametable', maxCount: 1 },
    { name: 'soundsNametable', maxCount: 1 },
    { name: 'ampNametable', maxCount: 1 },
    { name: 'awc', maxCount: 1 },
    { name: 'npcAwc', maxCount: 1 },
  ]), async (req, res) => {
    try {
      const { packId, audioName } = req.body;
      
      if (!packId || !audioName) {
        return res.status(400).json({ error: 'packId e audioName são obrigatórios' });
      }

      const audioDir = safeJoin(STAGING_PATH, packId, 'shared', 'audio', 'audioconfig');
      const sfxDir = safeJoin(STAGING_PATH, packId, 'shared', 'audio', 'sfx', `dlc_${audioName}`);
      
      await fsExtra.ensureDir(audioDir);
      await fsExtra.ensureDir(sfxDir);

      const uploadedFiles = [];

      // Process REL files
      if (req.files.gameRel && req.files.gameRel[0]) {
        const gameRelPath = path.join(audioDir, `${audioName}_game.dat151.rel`);
        await fsExtra.writeFile(gameRelPath, req.files.gameRel[0].buffer);
        uploadedFiles.push({ type: 'gameRel', path: gameRelPath });
      }

      if (req.files.soundsRel && req.files.soundsRel[0]) {
        const soundsRelPath = path.join(audioDir, `${audioName}_sounds.dat54.rel`);
        await fsExtra.writeFile(soundsRelPath, req.files.soundsRel[0].buffer);
        uploadedFiles.push({ type: 'soundsRel', path: soundsRelPath });
      }

      if (req.files.ampRel && req.files.ampRel[0]) {
        const ampRelPath = path.join(audioDir, `${audioName}_amp.dat10.rel`);
        await fsExtra.writeFile(ampRelPath, req.files.ampRel[0].buffer);
        uploadedFiles.push({ type: 'ampRel', path: ampRelPath });
      }

      // Process Nametable files
      if (req.files.gameNametable && req.files.gameNametable[0]) {
        const gameNametablePath = path.join(audioDir, `${audioName}_game.dat151.nametable`);
        await fsExtra.writeFile(gameNametablePath, req.files.gameNametable[0].buffer);
        uploadedFiles.push({ type: 'gameNametable', path: gameNametablePath });
      }

      if (req.files.soundsNametable && req.files.soundsNametable[0]) {
        const soundsNametablePath = path.join(audioDir, `${audioName}_sounds.dat54.nametable`);
        await fsExtra.writeFile(soundsNametablePath, req.files.soundsNametable[0].buffer);
        uploadedFiles.push({ type: 'soundsNametable', path: soundsNametablePath });
      }

      if (req.files.ampNametable && req.files.ampNametable[0]) {
        const ampNametablePath = path.join(audioDir, `${audioName}_amp.dat10.nametable`);
        await fsExtra.writeFile(ampNametablePath, req.files.ampNametable[0].buffer);
        uploadedFiles.push({ type: 'ampNametable', path: ampNametablePath });
      }

      // Process AWC files
      if (req.files.awc && req.files.awc[0]) {
        const awcPath = path.join(sfxDir, `${audioName}.awc`);
        await fsExtra.writeFile(awcPath, req.files.awc[0].buffer);
        uploadedFiles.push({ type: 'awc', path: awcPath });
      }

      if (req.files.npcAwc && req.files.npcAwc[0]) {
        const npcAwcPath = path.join(sfxDir, `${audioName}_npc.awc`);
        await fsExtra.writeFile(npcAwcPath, req.files.npcAwc[0].buffer);
        uploadedFiles.push({ type: 'npcAwc', path: npcAwcPath });
      }

      logger.info('[Upload Audio] Audio config uploaded successfully', {
        audioName,
        packId,
        fileCount: uploadedFiles.length
      });

      res.json({ success: true, uploadedFiles });
    } catch (err) {
      logger.error('[Upload Audio] Error uploading audio config', { error: err.message, stack: err.stack });
      res.status(500).json({ error: err.message });
    }
  });

  // ── Catch-all for React (production) ──────────────────────────────────────
  if (serveStatic) {
    app.get('*', (_req, res) => res.sendFile(path.join(DIST_PATH, 'index.html')));
  }

  return app;
}
function getOutputPath() {
  return OUTPUT_PATH;
}

module.exports = { createApp, setPaths, getOutputPath };
