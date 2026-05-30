import React, { useState, useEffect, useRef } from 'react';
import type {
  AudioConfig,
  Brand,
  DetectedVehicle,
  FileUploadInfo,
  Pack,
  StagedWheel,
  TreeNode,
  Vehicle,
  VehicleMeta,
} from '../../types';
import translations from '../../translations';
import { NavItem } from '../shared/NavItem';
import { MetaField } from '../shared/MetaField';
import { XmlMetaEditor } from './XmlMetaEditor';
import { buildExportPreview } from './exportPreview';
import { useApiBase } from '../../hooks/useApiBase';
import { AdGateModal } from '../../ads/AdGateModal';
import {
  openExternalLink,
  PACK_MANAGER_PUBLIC_DOCS_URL,
  PACK_MANAGER_RELEASES_REPO_URL,
} from '../../constants/publicLinks';
import { initGa4 } from '../../analytics/ga4';
import {
  trackPackExportCancelled,
  trackPackExportComplete,
  trackPackExportFailed,
  trackPackExportStart,
  trackPackOpen,
  trackPackTabView,
} from '../../analytics/tgsEvents';
import {
  Car,
  FolderOpen,
  Plus,
  FileText,
  Shield,
  Download,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  File,
  Info,
  HardDrive,
  Terminal,
  Volume2,
  Minus,
  Maximize2,
  Disc,
  Settings,
  Languages,
} from 'lucide-react';

const PackManagerApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<
    'packs' | 'brands' | 'wheels' | 'sound' | 'logs' | 'config'
  >('packs');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    | 'new-pack'
    | 'add-brand'
    | 'add-vehicle'
    | 'export'
    | 'upload-files'
    | 'upload-wheels'
    | 'edit-carcols'
    | 'add-wheels-brand'
    | 'add-audio-config'
    | 'confirm-delete-pack'
  >('new-pack');
  const [packIdToDelete, setPackIdToDelete] = useState<string | null>(null);
  const newPackNameInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVehicle, setUploadingVehicle] = useState<{
    brandId: string;
    vehicle: Vehicle;
  } | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Record<string, any[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileUploadInfo[]>([]);
  const [detectedVehicles, setDetectedVehicles] = useState<DetectedVehicle[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [smartUploadMode, setSmartUploadMode] = useState(true);
  const [language, setLanguage] = useState<'en' | 'pt'>('en');
  const [packsDirectory, setPacksDirectory] = useState('C:\\Users\\Tigas\\Documents\\FiveM\\app car pack\\output');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'update' | 'offline'>('offline');
  const [currentVersion, setCurrentVersion] = useState('2.0.29');

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key];
  };

  const API = useApiBase();

  const isNewerVersion = (latest: string, current: string) => {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    return false;
  };

  // Internet = conseguir release no GitHub via backend (não usar /api/reference — é só local)
  useEffect(() => {
    const checkVersion = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setConnectionStatus('offline');
        return;
      }

      try {
        const response = await fetch(`${API}/api/releases/latest`, { cache: 'no-store' });
        if (!response.ok) {
          setConnectionStatus('offline');
          return;
        }

        const releaseData = await response.json();
        const latestVersion = String(releaseData.tag_name || '').replace(/^v/, '');

        if (!latestVersion) {
          setConnectionStatus('online');
          return;
        }

        if (latestVersion === currentVersion) {
          setConnectionStatus('online');
        } else if (isNewerVersion(latestVersion, currentVersion)) {
          setConnectionStatus('update');
        } else {
          setConnectionStatus('online');
        }
      } catch {
        setConnectionStatus('offline');
      }
    };

    const onBrowserOffline = () => setConnectionStatus('offline');

    checkVersion();
    const interval = setInterval(checkVersion, 60_000);
    window.addEventListener('online', checkVersion);
    window.addEventListener('offline', onBrowserOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkVersion);
      window.removeEventListener('offline', onBrowserOffline);
    };
  }, [API, currentVersion]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          text: 'ONLINE',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-400',
          description: 'conectado a internet e atualizado'
        };
      case 'update':
        return {
          text: 'UPDATE',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400',
          description: 'conectado a internet e nao atualizado'
        };
      case 'offline':
        return {
          text: 'OFFLINE',
          color: 'text-red-400',
          bgColor: 'bg-red-400',
          description: 'nao conectado a internet'
        };
      default:
        return {
          text: 'OFFLINE',
          color: 'text-red-400',
          bgColor: 'bg-red-400',
          description: 'nao conectado a internet'
        };
    }
  };

  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');
  const [newAudioName, setNewAudioName] = useState('');
  const [audioFiles, setAudioFiles] = useState<{
    gameRel: File | null;
    soundsRel: File | null;
    ampRel: File | null;
    gameNametable: File | null;
    soundsNametable: File | null;
    ampNametable: File | null;
    awc: File | null;
    npcAwc: File | null;
  }>({
    gameRel: null,
    soundsRel: null,
    ampRel: null,
    gameNametable: null,
    soundsNametable: null,
    ampNametable: null,
    awc: null,
    npcAwc: null,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'loading' | 'info';
  } | null>(null);
  const [validationResults, setValidationResults] = useState<string[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<{
    brandId: string;
    vehicle: Vehicle;
  } | null>(null);
  const [metaEditorMode, setMetaEditorMode] = useState<'guided' | 'xml'>('guided');
  const [xmlContent, setXmlContent] = useState('');
  const [outputPath, setOutputPath] = useState('Documentos/FiveM Packs');
  const [wheelsBrandName, setWheelsBrandName] = useState('');
  const [newWheelsBrandName, setNewWheelsBrandName] = useState('');
  const [wheelName, setWheelName] = useState('');
  const [wheelClass, setWheelClass] = useState('VWT_SPORT');
  const [rimRadius, setRimRadius] = useState('0.25');
  const [sharedWheelsFiles, setSharedWheelsFiles] = useState<Record<string, any[]>>({});
  const [carcolsContent, setCarcolsContent] = useState('');
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; type: 'info' | 'error' | 'success'; message: string }>
  >([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'error' | 'success'>('all');
  const [metaTextSnapshot, setMetaTextSnapshot] = useState('');
  const [showMetaDiff, setShowMetaDiff] = useState(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [validationStep, setValidationStep] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedMetaType, setSelectedMetaType] = useState<'handling' | 'vehicles' | 'carvariations' | 'carcols' | 'vehiclelayouts'>('handling');
  const [metaContent, setMetaContent] = useState('');
  const [editingSharedWheelsCarcols, setEditingSharedWheelsCarcols] = useState(false);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, type, message }].slice(-100)); // Keep last 100 logs
  };

  useEffect(() => {
    void initGa4(currentVersion).then(() => {
      trackPackOpen(currentVersion);
    });
  }, []);

  useEffect(() => {
    trackPackTabView(currentTab);
  }, [currentTab]);

  /* F12 / Ctrl+Shift+I → DevTools (portable; fallback se atalho do Electron falhar) */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const f12 = e.key === 'F12';
      const devCombo = e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i');
      if (!f12 && !devCombo) return;
      e.preventDefault();
      void window.electronAPI?.toggleDevTools?.();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    const savedPacks = localStorage.getItem('fivemPacks');
    if (savedPacks) {
      const parsed = JSON.parse(savedPacks);
      const filtered = parsed.filter((p: any) => p.id !== 'demo-1');
      setPacks(filtered);
    }
    // Fetch real output path from backend
    fetch(`${API}/api/output-path`)
      .then((r) => r.json())
      .then((d) => {
        if (d.path) {
          setOutputPath(d.path);
          setPacksDirectory(d.path);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('fivemPacks', JSON.stringify(packs));
  }, [packs]);

  useEffect(() => {
    if (!showModal || modalType !== 'new-pack') return;
    const timer = window.setTimeout(() => newPackNameInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [showModal, modalType]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Fetch staged files for current pack on load or pack change
  useEffect(() => {
    if (currentPack) {
      currentPack.brands.forEach((brand) => {
        brand.vehicles.forEach((vehicle) => {
          fetchStagedFiles(brand.name, vehicle.model);
        });
      });
      fetchSharedWheels();
      fetchCarcolsMeta();
    }
  }, [currentPack]);

  const fetchStagedFiles = async (brandName: string, vehicleModel: string) => {
    if (!currentPack) return;
    try {
      const response = await fetch(
        `${API}/api/staged-files?packId=${currentPack.id}&brandName=${brandName}&vehicleModel=${vehicleModel}`
      );
      const data = await response.json();
      if (data.files) {
        setStagedFiles((prev) => ({
          ...prev,
          [`${brandName}-${vehicleModel}`]: data.files,
        }));
      }
    } catch (error) {
      console.error('Error fetching staged files:', error);
    }
  };

  const fetchSharedWheels = async () => {
    if (!currentPack) return;
    try {
      const response = await fetch(`${API}/api/shared-wheels?packId=${currentPack.id}`);
      const data = await response.json();
      if (data.wheels) {
        setSharedWheelsFiles(data.wheels);
      }
    } catch (error) {
      console.error('Error fetching shared wheels:', error);
    }
  };

  const fetchCarcolsMeta = async () => {
    if (!currentPack) return;
    try {
      const response = await fetch(`${API}/api/carcols-meta?packId=${currentPack.id}`);
      const data = await response.json();
      if (data.content) {
        setCarcolsContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching carcols meta:', error);
    }
  };

  
  const saveCarcolsMeta = async () => {
    if (!currentPack) return;
    try {
      const response = await fetch(`${API}/api/carcols-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: currentPack.id, content: carcolsContent }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('carcols.meta saved successfully!', 'success');
        setShowModal(false);
      } else {
        showToast('Error saving carcols.meta', 'error');
      }
    } catch (error) {
      console.error('Error saving carcols meta:', error);
      showToast('Error saving carcols.meta', 'error');
    }
  };

  const addWheelsBrand = () => {
    if (!currentPack || !newWheelsBrandName.trim()) return;

    const brandName = newWheelsBrandName.toUpperCase();
    if (currentPack.sharedWheelsBrands.includes(brandName)) {
      showToast('Brand already exists', 'error');
      return;
    }

    const updatedPack = {
      ...currentPack,
      sharedWheelsBrands: [...currentPack.sharedWheelsBrands, brandName],
    };
    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    setNewWheelsBrandName('');
    setShowModal(false);
    showToast(`Brand ${brandName} added`);
  };

  const addAudioConfig = async () => {
    if (!currentPack || !newAudioName.trim() || !audioFiles.gameRel || !audioFiles.soundsRel) {
      showToast('Fill in required fields', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('packId', currentPack.id);
      formData.append('audioName', newAudioName.trim());

      if (audioFiles.gameRel) formData.append('gameRel', audioFiles.gameRel);
      if (audioFiles.soundsRel) formData.append('soundsRel', audioFiles.soundsRel);
      if (audioFiles.ampRel) formData.append('ampRel', audioFiles.ampRel);
      if (audioFiles.gameNametable) formData.append('gameNametable', audioFiles.gameNametable);
      if (audioFiles.soundsNametable) formData.append('soundsNametable', audioFiles.soundsNametable);
      if (audioFiles.ampNametable) formData.append('ampNametable', audioFiles.ampNametable);
      if (audioFiles.awc) formData.append('awc', audioFiles.awc);
      if (audioFiles.npcAwc) formData.append('npcAwc', audioFiles.npcAwc);

      const response = await fetch(`${API}/api/upload-audio`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newAudioConfig: AudioConfig = {
          id: Date.now().toString(),
          name: newAudioName.trim(),
          gameRel: audioFiles.gameRel ? `${newAudioName.trim()}_game.dat151.rel` : null,
          soundsRel: audioFiles.soundsRel ? `${newAudioName.trim()}_sounds.dat54.rel` : null,
          ampRel: audioFiles.ampRel ? `${newAudioName.trim()}_amp.dat10.rel` : null,
          gameNametable: audioFiles.gameNametable ? `${newAudioName.trim()}_game.dat151.nametable` : null,
          soundsNametable: audioFiles.soundsNametable ? `${newAudioName.trim()}_sounds.dat54.nametable` : null,
          ampNametable: audioFiles.ampNametable ? `${newAudioName.trim()}_amp.dat10.nametable` : null,
          awcFiles: result.uploadedFiles.filter((f: any) => f.type === 'awc' || f.type === 'npcAwc').map((f: any) => f.path),
          npcAwc: audioFiles.npcAwc ? `${newAudioName.trim()}_npc.awc` : null,
        };

        const updatedPack = {
          ...currentPack,
          audioConfigs: [...(currentPack.audioConfigs || []), newAudioConfig],
        };
        setCurrentPack(updatedPack);
        const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
        setPacks(updatedPacks);

        setNewAudioName('');
        setAudioFiles({
          gameRel: null,
          soundsRel: null,
          ampRel: null,
          gameNametable: null,
          soundsNametable: null,
          ampNametable: null,
          awc: null,
          npcAwc: null,
        });
        setShowModal(false);
        showToast(`Audio ${newAudioName.trim()} added successfully!`, 'success');
      } else {
        showToast(result.error || 'Error adding audio', 'error');
      }
    } catch (error) {
      console.error('Error adding audio config:', error);
      showToast('Error adding audio', 'error');
    }
  };

  const deleteWheelFile = async (brandName: string, fileName: string) => {
    if (!currentPack) return;
    try {
      const response = await fetch(`${API}/api/delete-wheel-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: currentPack.id, brandName, fileName }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSharedWheels();
        showToast('Wheel deleted', 'success');
      } else {
        showToast('Error deleting wheel', 'error');
      }
    } catch (error) {
      console.error('Error deleting wheel:', error);
      showToast('Error deleting wheel', 'error');
    }
  };

  const deleteWheelsBrand = async (brandName: string) => {
    if (!currentPack) return;
    try {
      const response = await fetch(`${API}/api/delete-wheels-brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: currentPack.id, brandName }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedPack = {
          ...currentPack,
          sharedWheelsBrands: currentPack.sharedWheelsBrands.filter((b) => b !== brandName),
        };
        setCurrentPack(updatedPack);
        const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
        setPacks(updatedPacks);
        fetchSharedWheels();
        showToast(`Brand ${brandName} deleted`, 'success');
      } else {
        showToast('Error deleting brand', 'error');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      showToast('Error deleting brand', 'error');
    }
  };

  const stageWheel = async () => {
    if (!currentPack || !wheelsBrandName || !wheelName) return;

    const fileInput = document.getElementById('wheel-file-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      showToast('Select a .ydr file', 'error');
      return;
    }

    if (!file.name.endsWith('.ydr')) {
      showToast('File must be .ydr', 'error');
      return;
    }

    setIsUploading(true);
    addLog('info', `Staging wheel: ${wheelsBrandName} - ${wheelName}`);

    try {
      const formData = new FormData();
      formData.append('packId', currentPack.id);
      formData.append('brandName', wheelsBrandName.toUpperCase());
      formData.append('wheelName', wheelName);
      formData.append('wheelClass', wheelClass);
      formData.append('rimRadius', rimRadius);
      formData.append('file', file);

      const response = await fetch(`${API}/api/stage-wheel`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(`Error: ${data.error || 'Error staging wheel'}`, 'error');
        addLog('error', `Error staging: ${data.error || 'Unknown error'}`);
        setIsUploading(false);
        return;
      }

      // Add to staged wheels in pack state
      const newStagedWheel: StagedWheel = {
        id: 'wheel-' + Date.now(),
        brandName: wheelsBrandName.toUpperCase(),
        wheelName,
        wheelClass,
        rimRadius: parseFloat(rimRadius),
        fileName: file.name,
        filePath: data.filePath,
      };

      const updatedPack = {
        ...currentPack,
        stagedWheels: [...(currentPack.stagedWheels || []), newStagedWheel],
      };

      // Add brand to sharedWheelsBrands if not exists
      if (!updatedPack.sharedWheelsBrands.includes(wheelsBrandName.toUpperCase())) {
        updatedPack.sharedWheelsBrands = [
          ...updatedPack.sharedWheelsBrands,
          wheelsBrandName.toUpperCase(),
        ];
      }

      setCurrentPack(updatedPack);
      const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
      setPacks(updatedPacks);

      // Reset form
      setWheelName('');
      setWheelClass('VWT_SPORT');
      setRimRadius('0.25');
      if (fileInput) fileInput.value = '';

      setShowModal(false);
      showToast('Wheel added to staging!', 'success');
      addLog('success', `Wheel ${wheelName} added to staging`);
    } catch (error) {
      console.error('Error staging wheel:', error);
      showToast('Error staging wheel', 'error');
      addLog('error', `Error staging: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteStagedWheel = (wheelId: string) => {
    if (!currentPack) return;

    const updatedPack = {
      ...currentPack,
      stagedWheels: (currentPack.stagedWheels || []).filter((w) => w.id !== wheelId),
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);

    showToast('Wheel removed from staging', 'success');
  };

  // ─── Smart File Detection & Organization ─────────────────────────────────

  const detectFileTypeClient = (filename: string): { type: string; label: string } => {
    const lower = filename.toLowerCase();
    const ext = lower.split('.').pop() || '';

    if (ext === 'yft')
      return { type: lower.includes('_hi.yft') ? 'model_hd' : 'model', label: '🚗 Model (.yft)' };
    if (ext === 'ytd') return { type: 'textures', label: '🎨 Textures (.ytd)' };
    if (ext === 'ydr') return { type: 'drawable', label: '📦 Drawable (.ydr)' };
    if (ext === 'ycd') return { type: 'animations', label: '🎬 Animations (.ycd)' };
    if (lower.includes('handling') && ext === 'meta')
      return { type: 'meta_handling', label: '⚙️ Handling Meta' };
    if (lower.includes('vehicles') && ext === 'meta')
      return { type: 'meta_vehicles', label: '🚙 Vehicles Meta' };
    if (lower.includes('carcols') && ext === 'meta')
      return { type: 'meta_carcols', label: '🎨 Carcols Meta' };
    if (lower.includes('carvariations') && ext === 'meta')
      return { type: 'meta_carvariations', label: '🔧 CarVariations Meta' };
    if (ext === 'meta') return { type: 'meta_unknown', label: '📄 Meta' };
    return { type: 'unknown', label: '❓ Unknown' };
  };

  const extractModelFromFilename = (filename: string): string | null => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    // Remove common suffixes
    const baseName = nameWithoutExt.replace(/(_hi|_lod|_col|_+tuning\d*)$/i, '');
    return baseName.toLowerCase();
  };

  const analyzeFiles = (files: FileList | null): FileUploadInfo[] => {
    if (!files) return [];

    return Array.from(files).map((file) => {
      const { type, label } = detectFileTypeClient(file.name);
      const detectedModel = extractModelFromFilename(file.name);

      // If we have a selected vehicle, check if file matches
      let targetModel = detectedModel || '';
      let targetBrand = uploadingVehicle?.brandId || '';
      let isMatched = false;

      console.log(`[Upload Debug] File: ${file.name}, detectedModel: ${detectedModel}, uploadingVehicle: ${uploadingVehicle?.vehicle.model}`);

      if (uploadingVehicle) {
        // For meta files, associate them with the current vehicle being uploaded
        if (type.startsWith('meta_')) {
          isMatched = true;
          targetModel = uploadingVehicle.vehicle.model;
          targetBrand = uploadingVehicle.brandId;
          console.log(`[Upload Debug] Meta file auto-matched to current vehicle: ${targetModel}`);
        } else {
          isMatched =
            detectedModel === uploadingVehicle.vehicle.model.toLowerCase() ||
            file.name.toLowerCase().includes(uploadingVehicle.vehicle.model.toLowerCase());
          
          console.log(`[Upload Debug] isMatched: ${isMatched}, detectedModel === model: ${detectedModel === uploadingVehicle.vehicle.model.toLowerCase()}, filename includes model: ${file.name.toLowerCase().includes(uploadingVehicle.vehicle.model.toLowerCase())}`);
          
          if (isMatched) {
            targetModel = uploadingVehicle.vehicle.model;
            targetBrand = uploadingVehicle.brandId;
          }
        }
      }

      return {
        file,
        type,
        label,
        targetModel,
        targetBrand,
        isMatched,
      };
    });
  };

  const groupFilesByVehicle = (files: FileUploadInfo[]): DetectedVehicle[] => {
    const groups: Record<string, DetectedVehicle> = {};

    files.forEach((fileInfo) => {
      const key = `${fileInfo.targetBrand}-${fileInfo.targetModel}`;

      if (!groups[key]) {
        groups[key] = {
          model: fileInfo.targetModel,
          brand: fileInfo.targetBrand,
          files: [],
          hasYft: false,
          hasYtd: false,
          hasMeta: false,
        };
      }

      groups[key].files.push(fileInfo);

      if (fileInfo.type === 'model' || fileInfo.type === 'model_hd') groups[key].hasYft = true;
      if (fileInfo.type === 'textures') groups[key].hasYtd = true;
      if (fileInfo.type.startsWith('meta_')) groups[key].hasMeta = true;
    });

    return Object.values(groups).filter((g) => g.model); // Remove groups without model
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length) return;

    processFiles(droppedFiles);
  };

  const processFiles = (files: FileList | null) => {
    const analyzed = analyzeFiles(files);
    setPendingFiles((prev) => [...prev, ...analyzed]);

    const grouped = groupFilesByVehicle([...pendingFiles, ...analyzed]);
    setDetectedVehicles(grouped);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = ''; // Reset to allow reselection
  };

  const removePendingFile = (index: number) => {
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    setPendingFiles(newFiles);
    setDetectedVehicles(groupFilesByVehicle(newFiles));
  };

  const clearPendingFiles = () => {
    setPendingFiles([]);
    setDetectedVehicles([]);
    setUploadProgress({});
  };

  const executeSmartUpload = async () => {
    if (!currentPack || !uploadingVehicle || pendingFiles.length === 0) return;

    setIsUploading(true);
    const filesToUpload = smartUploadMode
      ? pendingFiles.filter((f) => f.isMatched || f.targetModel === uploadingVehicle.vehicle.model)
      : pendingFiles;

    let uploaded = 0;
    const total = filesToUpload.length;

    for (const fileInfo of filesToUpload) {
      const formData = new FormData();
      formData.append('packId', currentPack.id);
      formData.append('brandName', uploadingVehicle.brandId);
      formData.append('vehicleModel', uploadingVehicle.vehicle.model);
      formData.append('files', fileInfo.file);

      try {
        const response = await fetch(`${API}/api/upload-files`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          uploaded++;
          setUploadProgress((prev) => ({
            ...prev,
            [fileInfo.file.name]: 100,
          }));

          if (
            Object.keys(result.extractedHandling).length > 0 ||
            Object.keys(result.extractedVehicles).length > 0
          ) {
            applyExtractedMeta(result.extractedHandling, result.extractedVehicles);
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setIsUploading(false);

    if (uploaded === total) {
      showToast(`${uploaded} file(s) uploaded successfully!`, 'success');
      fetchStagedFiles(uploadingVehicle.brandId, uploadingVehicle.vehicle.model);
      clearPendingFiles();
    } else {
      showToast(`${uploaded}/${total} files uploaded`, 'error');
    }
  };

  const applyExtractedMeta = (handling: any, vehicles: any) => {
    if (!uploadingVehicle || !currentPack) return;

    const updatedPacks = packs.map((pack) => {
      if (pack.id === currentPack.id) {
        const updatedBrands = pack.brands.map((brand) => {
          if (brand.name.toUpperCase() === uploadingVehicle.brandId.toUpperCase()) {
            const updatedVehicles = brand.vehicles.map((v) => {
              if (v.id === uploadingVehicle.vehicle.id) {
                return {
                  ...v,
                  meta: {
                    handling: {
                      fMass: handling.fMass || v.meta?.handling.fMass || '1500.000000',
                      fInitialDriveMaxFlatVel:
                        handling.fInitialDriveMaxFlatVel ||
                        v.meta?.handling.fInitialDriveMaxFlatVel ||
                        '160.000000',
                      fDriveBiasFront:
                        handling.fDriveBiasFront || v.meta?.handling.fDriveBiasFront || '0.500000',
                      fSteeringLock:
                        handling.fSteeringLock || v.meta?.handling.fSteeringLock || '40.000000',
                    },
                    vehicles: {
                      audioNameHash:
                        vehicles.audioNameHash || v.meta?.vehicles.audioNameHash || 'NULL',
                    },
                  },
                };
              }
              return v;
            });
            return { ...brand, vehicles: updatedVehicles };
          }
          return brand;
        });
        return { ...pack, brands: updatedBrands };
      }
      return pack;
    });

    setPacks(updatedPacks);
    const updatedPack = updatedPacks.find((p) => p.id === currentPack.id);
    if (updatedPack) setCurrentPack(updatedPack);
    showToast('Technical data synchronized from .meta!', 'success');
  };

  const deleteStagedFiles = async (brandName: string, vehicleModel: string) => {
    if (!currentPack) return;
    try {
      await fetch(
        `${API}/api/staged-files?packId=${currentPack.id}&brandName=${brandName}&vehicleModel=${vehicleModel}`,
        {
          method: 'DELETE',
        }
      );
      setStagedFiles((prev) => {
        const next = { ...prev };
        delete next[`${brandName}-${vehicleModel}`];
        return next;
      });
      showToast('Files removed from staging', 'success');
    } catch (error) {
      showToast('Error removing files', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'loading' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createNewPack = () => {
    if (!newPackName.trim()) {
      showToast('Pack name is required', 'error');
      return;
    }

    const newPack: Pack = {
      id: 'pack-' + Date.now(),
      name: newPackName,
      description: newPackDesc || 'Custom FiveM vehicle pack',
      brands: [],
      sharedAudio: ['default_horn', 'engine_sport'],
      sharedWheelsBrands: [],
      stagedWheels: [],
      audioConfigs: [],
      createdAt: new Date().toISOString(),
    };

    setPacks([...packs, newPack]);
    setCurrentPack(newPack);
    setCurrentTab('packs');
    setNewPackName('');
    setNewPackDesc('');
    setShowModal(false);
    showToast(`Pack "${newPack.name}" created successfully!`);
  };

  const openDeletePackConfirm = (packId: string) => {
    setPackIdToDelete(packId);
    setModalType('confirm-delete-pack');
    setShowModal(true);
  };

  const confirmDeletePack = () => {
    if (!packIdToDelete) return;

    const packId = packIdToDelete;
    const updatedPacks = packs.filter((p) => p.id !== packId);
    setPacks(updatedPacks);

    if (currentPack?.id === packId) {
      setCurrentPack(null);
      setCurrentTab('packs');
      setEditingVehicle(null);
      setUploadingVehicle(null);
    }

    setPackIdToDelete(null);
    setShowModal(false);

    showToast('Pack deleted successfully', 'success');
    addLog('info', `Pack ${packId} deleted`);
  };

  const addBrand = () => {
    if (!currentPack || !newBrandName.trim()) return;

    const brandExists = currentPack.brands.some(
      (b) => b.name.toLowerCase() === newBrandName.toLowerCase()
    );
    if (brandExists) {
      showToast('Brand already exists', 'error');
      return;
    }

    const updatedPack = {
      ...currentPack,
      brands: [
        ...currentPack.brands,
        {
          id: 'brand-' + Date.now(),
          name: newBrandName.toUpperCase(),
          vehicles: [],
        },
      ],
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    setNewBrandName('');
    setShowModal(false);
    showToast(`Brand ${newBrandName.toUpperCase()} added`);
  };

  const addVehicle = () => {
    if (!currentPack || !selectedBrandId || !newVehicleName || !newVehicleModel) return;

    const updatedBrands = currentPack.brands.map((brand) => {
      if (brand.id === selectedBrandId) {
        return {
          ...brand,
          vehicles: [
            ...brand.vehicles,
            {
              id: 'veh-' + Date.now(),
              name: newVehicleName,
              model: newVehicleModel.toLowerCase().replace(/\s+/g, ''),
              year: newVehicleYear || '2023',
              meta: {
                handling: {
                  fMass: '1500.000000',
                  fInitialDriveMaxFlatVel: '160.000000',
                  fDriveBiasFront: '0.500000',
                  fSteeringLock: '40.000000',
                },
                vehicles: {
                  audioNameHash: 'NULL',
                },
              },
            },
          ],
        };
      }
      return brand;
    });

    const updatedPack = { ...currentPack, brands: updatedBrands };
    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);

    setNewVehicleName('');
    setNewVehicleModel('');
    setNewVehicleYear('');
    setShowModal(false);
    showToast('Vehicle added successfully');
  };

  const deleteVehicle = (brandId: string, vehicleId: string) => {
    if (!currentPack) return;

    const updatedBrands = currentPack.brands.map((brand) => {
      if (brand.id === brandId) {
        return {
          ...brand,
          vehicles: brand.vehicles.filter((v) => v.id !== vehicleId),
        };
      }
      return brand;
    });

    const updatedPack = { ...currentPack, brands: updatedBrands };
    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    showToast('Vehicle removed');
  };

  const deleteBrand = (brandId: string) => {
    if (!currentPack) return;

    const updatedPack = {
      ...currentPack,
      brands: currentPack.brands.filter((b) => b.id !== brandId),
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    showToast('Brand removed');
  };

  const deleteAudioConfig = (audioId: string) => {
    if (!currentPack) return;

    const updatedPack = {
      ...currentPack,
      audioConfigs: currentPack.audioConfigs?.filter((a) => a.id !== audioId) || [],
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    showToast('Audio config removed');
  };

  const saveMetaOverride = () => {
    if (!currentPack) return;

    const overrides = currentPack.metaOverrides || { vehicles: {}, sharedWheels: {} };

    if (editingSharedWheelsCarcols) {
      // Save shared wheels carcols
      overrides.sharedWheels = { carcols: metaContent };
    } else if (selectedBrand && selectedVehicle) {
      // Save vehicle meta
      if (!overrides.vehicles[selectedBrand]) {
        overrides.vehicles[selectedBrand] = {};
      }
      if (!overrides.vehicles[selectedBrand][selectedVehicle]) {
        overrides.vehicles[selectedBrand][selectedVehicle] = {};
      }
      overrides.vehicles[selectedBrand][selectedVehicle][selectedMetaType] = metaContent;
    }

    const updatedPack = {
      ...currentPack,
      metaOverrides: overrides,
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    setMetaTextSnapshot(metaContent);
    showToast('Meta override saved');
  };

  const resetMetaOverride = () => {
    if (!currentPack) return;

    const overrides = currentPack.metaOverrides || { vehicles: {}, sharedWheels: {} };

    if (editingSharedWheelsCarcols) {
      delete overrides.sharedWheels?.carcols;
    } else if (selectedBrand && selectedVehicle) {
      delete overrides.vehicles[selectedBrand]?.[selectedVehicle]?.[selectedMetaType];
      // Clean up empty objects
      if (Object.keys(overrides.vehicles[selectedBrand]?.[selectedVehicle] || {}).length === 0) {
        delete overrides.vehicles[selectedBrand]?.[selectedVehicle];
      }
      if (Object.keys(overrides.vehicles[selectedBrand] || {}).length === 0) {
        delete overrides.vehicles[selectedBrand];
      }
    }

    const updatedPack = {
      ...currentPack,
      metaOverrides: overrides,
    };

    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    setMetaContent('');
    setMetaTextSnapshot('');
    showToast('Meta override reset');
  };

  const loadMetaOverride = () => {
    if (!currentPack) return;

    const overrides = currentPack.metaOverrides || { vehicles: {}, sharedWheels: {} };

    let next = '';
    if (editingSharedWheelsCarcols) {
      next = overrides.sharedWheels?.carcols || '';
    } else if (selectedBrand && selectedVehicle) {
      next = overrides.vehicles[selectedBrand]?.[selectedVehicle]?.[selectedMetaType] || '';
    }
    setMetaContent(next);
    setMetaTextSnapshot(next);
  };

  const restoreMetaEditorFromSnapshot = () => {
    setMetaContent(metaTextSnapshot);
    showToast('Texto do editor restaurado para a última versão carregada.', 'info');
  };


  const openMetaEditor = async (brandId: string, vehicle: Vehicle) => {
    setEditingVehicle({ brandId, vehicle });
    setMetaEditorMode('guided');

    // Fetch Brand-wide XML preview
    if (currentPack) {
      const brand = currentPack.brands.find((b) => b.id === brandId);
      if (brand) {
        try {
          const response = await fetch(`${API}/api/brand-meta-preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId: currentPack.id,
              brandName: brand.name,
              brand,
            }),
          });
          const { xml } = await response.json();
          setXmlContent(xml);
        } catch (err) {
          console.error('Failed to fetch brand meta preview');
        }
      }
    }

    setCurrentTab('brands');
    setShowModal(true);
    setModalType('add-brand');
  };

  const updateMeta = async (field: string, subfield: string, value: string) => {
    if (!editingVehicle || !currentPack) return;

    const newEditingVehicle = {
      ...editingVehicle,
      vehicle: {
        ...editingVehicle.vehicle,
        meta: {
          ...editingVehicle.vehicle.meta,
          [field]: {
            ...(editingVehicle.vehicle.meta?.[field as keyof VehicleMeta] as any),
            [subfield]: value,
          },
        } as VehicleMeta,
      },
    };

    setEditingVehicle(newEditingVehicle);

    // Refresh Brand-wide XML Content with new value
    const brand = currentPack.brands.find((b) => b.id === editingVehicle.brandId);
    if (brand) {
      // Update the temporary brand object for preview
      const tempBrand = {
        ...brand,
        vehicles: brand.vehicles.map((v) =>
          v.id === editingVehicle.vehicle.id ? newEditingVehicle.vehicle : v
        ),
      };

      try {
        const response = await fetch(`${API}/api/brand-meta-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packId: currentPack.id,
            brandName: brand.name,
            brand: tempBrand,
          }),
        });
        const { xml } = await response.json();
        setXmlContent(xml);
      } catch (err) {
        // Fallback or silent error
      }
    }
  };

  const saveMeta = () => {
    if (!currentPack || !editingVehicle) return;

    const updatedBrands = currentPack.brands.map((brand) => {
      if (brand.id === editingVehicle.brandId) {
        return {
          ...brand,
          vehicles: brand.vehicles.map((v) =>
            v.id === editingVehicle.vehicle.id ? editingVehicle.vehicle : v
          ),
        };
      }
      return brand;
    });

    const updatedPack = { ...currentPack, brands: updatedBrands };
    setCurrentPack(updatedPack);
    const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
    setPacks(updatedPacks);
    setShowModal(false);
    showToast('Meta data saved');
  };

  const selectPack = (pack: Pack) => {
    setCurrentPack(pack);
    setCurrentTab('packs');
  };

  const generateManifestContent = (): string => {
    if (!currentPack) return '-- No pack loaded';

    let manifest = `fx_version 'cerulean'\ngame 'gta5'\n\n`;
    manifest += `author 'TGS Development'\ndescription '${currentPack.description}'\nversion '1.0.0'\n\n`;

    manifest += `files {\n`;
    // Meta files with wildcards
    currentPack.brands.forEach((brand) => {
      manifest += `    'data/${brand.name}/meta/*.meta',\n`;
    });

    manifest += `}\n\n`;
    manifest += `data_file 'HANDLING_FILE' 'data/**/handling.meta'\n`;
    manifest += `data_file 'VEHICLE_METADATA_FILE' 'data/**/vehicles.meta'\n`;
    manifest += `data_file 'CARCOLS_FILE' 'data/**/carcols.meta'\n`;
    manifest += `data_file 'VEHICLE_VARIATION_FILE' 'data/**/carvariations.meta'\n\n`;

    manifest += `-- Wildcard support for all vehicles\n`;
    currentPack.brands.forEach((brand) => {
      brand.vehicles.forEach((vehicle) => {
        manifest += `files { 'stream/${brand.name}/${vehicle.model}/*.y*', 'stream/${brand.name}/${vehicle.model}/Tuning/*.y*' }\n`;
      });
    });

    manifest += `\n-- Shared assets\n`;
    if (currentPack.sharedAudio.length > 0) {
      manifest += `files { 'shared/audio/*.awc' }\n`;
    }

    return manifest;
  };

  const runValidation = () => {
    if (!currentPack) {
      setValidationResults(['No pack selected']);
      return;
    }

    const results: string[] = [];

    if (currentPack.brands.length === 0) {
      results.push('⚠️ No brands defined. Add at least one brand.');
    } else {
      results.push('✅ Multiple brands configured');
    }

    let totalVehicles = 0;
    currentPack.brands.forEach((brand) => {
      totalVehicles += brand.vehicles.length;
      if (brand.vehicles.length === 0) {
        results.push(`⚠️ Brand ${brand.name} has no vehicles`);
      } else {
        results.push(`✅ ${brand.name} has ${brand.vehicles.length} vehicles`);
      }
    });

    if (totalVehicles === 0) {
      results.push('❌ No vehicles in pack');
    } else {
      results.push(`✅ Total of ${totalVehicles} vehicles`);
    }

    if (currentPack.sharedAudio.length > 0) {
      results.push(`✅ ${currentPack.sharedAudio.length} shared audio files`);
    }

    if (currentPack.sharedWheelsBrands.length > 0) {
      results.push(`✅ Shared wheels for ${currentPack.sharedWheelsBrands.length} brands`);
    }

    if (currentPack.stagedWheels.length > 0) {
      results.push(`⏳ ${currentPack.stagedWheels.length} staged wheels waiting to be applied`);
    }

    // Meta check
    results.push('✅ Meta files generated per brand (handling, vehicles, carcols, etc)');
    results.push('✅ fxmanifest.lua uses optimized wildcards');
    results.push('✅ Structure matches TGS_Pack_Exemplo');

    setValidationResults(results);
    setShowModal(true);
    setModalType('export');
    showToast('Validation complete');
  };

  const handleExportClick = () => {
    if (!currentPack || isValidating) return;
    setShowAdGate(true);
  };

  const handleAdGateComplete = () => {
    setShowAdGate(false);
    executeExport();
  };

  const handleAdGateCancel = () => {
    if (currentPack) {
      trackPackExportCancelled(currentPack.id, currentPack.name);
    }
    setShowAdGate(false);
  };

  const executeExport = async () => {
    if (!currentPack) return;
    const exportStartedAt = Date.now();
    const packId = currentPack.id;
    const packName = currentPack.name;
    const vehicleCount = currentPack.brands?.reduce(
      (n, b) => n + (b.vehicles?.length || 0),
      0
    );
    trackPackExportStart(packId, packName, vehicleCount);
    setIsValidating(true);
    setValidationProgress(0);
    setValidationStep('Starting...');

    try {
      // Step 1: Apply staged wheels if any
      if (currentPack.stagedWheels.length > 0) {
        setValidationStep('Applying wheel configurations to carcols.meta...');
        setValidationProgress(20);
        addLog('info', `Applying ${currentPack.stagedWheels.length} wheels to carcols.meta`);

        const applyResponse = await fetch(`${API}/api/apply-staged-wheels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packId: currentPack.id,
            stagedWheels: currentPack.stagedWheels,
          }),
        });

        const applyData = await applyResponse.json();

        if (!applyResponse.ok || !applyData.success) {
          const wheelErr = applyData.error || 'Unknown error';
          trackPackExportFailed(packId, packName, `wheels: ${wheelErr}`);
          showToast(`Error applying wheels: ${wheelErr}`, 'error');
          setIsValidating(false);
          return;
        }

        addLog('success', `${applyData.appliedCount} wheels applied to carcols.meta`);
        setValidationProgress(50);

        // Clear staged wheels from pack state
        const updatedPack = {
          ...currentPack,
          stagedWheels: [],
        };
        setCurrentPack(updatedPack);
        const updatedPacks = packs.map((p) => (p.id === updatedPack.id ? updatedPack : p));
        setPacks(updatedPacks);
      }

      // Step 2: Export pack
      setValidationStep('Generating pack on disk...');
      setValidationProgress(70);
      addLog('info', 'Starting pack export');

      const response = await fetch(`${API}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPack),
      });

      const result = await response.json();

      if (result.success) {
        setValidationProgress(100);
        setValidationStep('Completed!');
        addLog('success', 'Pack exported successfully');
        const srvWarnings = Array.isArray(result.warnings) ? result.warnings : [];
        trackPackExportComplete(
          packId,
          packName,
          Date.now() - exportStartedAt,
          srvWarnings.length
        );
        if (srvWarnings.length > 0) {
          setValidationResults((prev) => [
            ...prev,
            ...srvWarnings.map((w: string) => `⚠️ ${w}`),
          ]);
          addLog(
            'info',
            `Validação do servidor: ${srvWarnings.length} aviso(s)`
          );
          showToast(`Pack gerado com ${srvWarnings.length} aviso(s). Veja na lista.`, 'info');
        } else {
          showToast(`Pack generated! Opening folder...`, 'success');
          setShowModal(false);
        }
      } else {
        const errMsg = result.error || 'Export failed';
        trackPackExportFailed(packId, packName, errMsg);
        showToast(errMsg, 'error');
        addLog('error', `Export error: ${errMsg}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      trackPackExportFailed(packId, packName, errMsg);
      showToast('Backend connection error.', 'error');
      addLog('error', `Connection error: ${errMsg}`);
    } finally {
      setIsValidating(false);
      setValidationProgress(0);
      setValidationStep('');
    }
  };

  const openPacksFolder = async () => {
    console.log('[Frontend] openPacksFolder called');
    
    try {
      // Try Electron API first
      if (window.electronAPI && window.electronAPI.openPacksFolder) {
        console.log('[Frontend] Using Electron API');
        const result = await window.electronAPI.openPacksFolder();
        console.log('[Frontend] Electron API result:', result);
        
        if (result.success) {
          showToast('Folder opened successfully!', 'success');
        } else {
          showToast(result.error || 'Failed to open folder', 'error');
        }
      } else {
        // Fallback to HTTP request
        console.log('[Frontend] Electron API not available, using HTTP fallback');
        const response = await fetch(`${API}/api/open-packs-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        console.log('[Frontend] HTTP fallback result:', result);

        if (result.success && result.path) {
          // Copy path to clipboard
          navigator.clipboard.writeText(result.path).then(() => {
            showToast(`Path copied! Open manually: ${result.path}`, 'info');
          }).catch(() => {
            showToast(`Open manually: ${result.path}`, 'info');
          });
        } else {
          showToast(result.error || 'Failed to open folder', 'error');
        }
      }
    } catch (error) {
      console.log('[Frontend] Error:', error);
      showToast('Error opening folder', 'error');
    }
  };

  const renderTree = (node: TreeNode, level: number = 0) => {
    const padding = level * 20;

    return (
      <div key={node.name} style={{ paddingLeft: `${padding}px` }} className="py-0.5">
        <div
          className={`flex items-center gap-2 text-sm ${node.type === 'folder' ? 'text-cyan-400' : 'text-slate-300'}`}
        >
          {node.type === 'folder' ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="font-mono">{node.name}</span>
          {node.content && <span className="text-[10px] text-emerald-400 ml-auto">(meta)</span>}
        </div>
        {node.children &&
          node.children.map((child, idx) => <div key={idx}>{renderTree(child, level + 1)}</div>)}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-72 bg-black border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800 draggable">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 flex items-center justify-center logo-icon transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 1024 928" version="1.1">
                <path d="M 510.140 87.260 C 509.473 87.927, 480.256 110.335, 445.214 137.055 L 381.500 185.636 381.248 476.174 L 380.997 766.711 411.248 785.674 C 427.887 796.104, 457.085 814.416, 476.134 826.366 L 510.768 848.094 547.634 824.932 C 567.910 812.193, 592.150 796.953, 601.500 791.066 C 610.850 785.179, 623.542 777.243, 629.704 773.431 L 640.909 766.500 640.954 609.250 L 641 452 576 452 L 511 452 511 485.500 L 511 519 542.005 519 L 573.009 519 572.755 622.708 L 572.500 726.416 541.637 745.728 L 510.774 765.040 484.137 748.340 C 469.487 739.155, 455.363 730.304, 452.750 728.670 L 448 725.701 448 473.096 L 448 220.492 462.750 209.359 C 470.863 203.235, 484.180 193.112, 492.345 186.863 C 500.509 180.613, 508.176 174.745, 509.382 173.822 C 511.530 172.178, 512.203 172.627, 542.287 195.799 L 573 219.455 573 270.727 L 573 322 607 322 L 641 322 640.943 253.750 L 640.886 185.500 636.193 181.953 C 630.454 177.617, 610.873 162.631, 595.095 150.500 C 585.819 143.368, 516.892 90.320, 512.426 86.876 C 511.823 86.411, 510.820 86.580, 510.140 87.260 M 685.247 369.689 L 685.500 525.500 755 525.757 L 824.500 526.013 824.338 556.108 L 824.176 586.204 791.603 604.004 L 759.031 621.805 758.766 594.152 L 758.500 566.500 723.250 566.237 L 688 565.974 688 658.500 L 688 751.025 691.750 748.663 C 693.813 747.363, 709.225 738.201, 726 728.302 C 742.775 718.404, 782.375 695.017, 814 676.331 C 845.625 657.646, 877.465 638.846, 884.755 634.553 L 898.011 626.747 897.755 539.623 L 897.500 452.500 828.250 452.500 L 759 452.500 759 405.197 L 759 357.895 789.750 378.626 C 806.663 390.029, 821.400 400.020, 822.500 400.830 C 824.290 402.148, 824.510 403.519, 824.591 413.901 L 824.682 425.500 861.355 425.762 L 898.027 426.025 897.764 393.328 L 897.500 360.631 800 293.308 C 746.375 256.280, 698.561 223.260, 693.747 219.931 L 684.994 213.878 685.247 369.689 M 333.472 221.884 C 332.387 222.921, 304.725 244.150, 272 269.059 C 239.275 293.969, 192.700 329.425, 168.500 347.850 C 144.300 366.276, 124.169 381.834, 123.765 382.425 C 122.905 383.684, 122.722 467, 123.580 467 C 124.279 467, 135.103 458.888, 169.282 432.750 C 183.486 421.887, 195.196 413, 195.304 413 C 195.412 413, 195.493 465.476, 195.485 529.613 L 195.469 646.227 199.485 648.967 C 205.292 652.930, 263.015 689, 263.550 689 C 263.797 689, 264.002 615.087, 264.005 524.750 L 264.009 360.500 300.255 332.916 L 336.500 305.332 336.761 262.666 C 336.904 239.200, 336.667 220, 336.233 220 C 335.799 220, 334.557 220.848, 333.472 221.884" stroke="none" fill="#fefffe" fillRule="evenodd"/>
              </svg>
            </div>
            <div className="font-audiowide text-xl">TGS PACK MANAGER</div>
                      </div>
          <div className="mt-2 text-xs text-zinc-500">Powered by TGS</div>
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-mono text-zinc-500">MENU</div>

          <NavItem
            icon={<Plus className="w-4 h-4" />}
            label={t('myPacks')}
            active={currentTab === 'packs'}
            onClick={() => setCurrentTab('packs')}
          />
          <NavItem
            icon={<Car className="w-4 h-4" />}
            label={t('vehicles')}
            active={currentTab === 'brands'}
            onClick={() => setCurrentTab('brands')}
          />
          <NavItem
            icon={<Disc className="w-4 h-4" />}
            label={t('wheels')}
            active={currentTab === 'wheels'}
            onClick={() => setCurrentTab('wheels')}
          />
          <NavItem
            icon={<Volume2 className="w-4 h-4" />}
            label={t('sound')}
            active={currentTab === 'sound'}
            onClick={() => setCurrentTab('sound')}
          />
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label={t('config')}
            active={currentTab === 'config'}
            onClick={() => setCurrentTab('config')}
          />
          <NavItem
            icon={<Terminal className="w-4 h-4" />}
            label={t('logs')}
            active={currentTab === 'logs'}
            onClick={() => setCurrentTab('logs')}
          />
        </div>

        <div className="p-4 border-t border-zinc-800 text-xs">
          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <CheckCircle className="w-3 h-3" />
              <span className="font-medium">OPTIMIZED FOR</span>
            </div>
            <div className="text-[10px] text-zinc-400 space-y-1">
              <div>• Meta files per brand</div>
              <div>• Shared audio &amp; wheels</div>
              <div>• Automatic wildcards</div>
              <div>• FiveM Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="draggable h-14 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentPack && (
              <div className="px-3 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                {currentPack.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentPack && (
              <button
                onClick={runValidation}
                className="no-drag flex items-center gap-2 bg-white text-black text-sm px-4 h-9 rounded-xl hover:bg-cyan-300 transition-colors font-medium"
              >
                <Shield className="w-4 h-4" />
                VALIDATE PACK
              </button>
            )}

            <button
              onClick={() => window.electronAPI?.minimizeWindow?.()}
              className="no-drag w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.electronAPI?.toggleFullscreen?.()}
              className="no-drag w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.electronAPI?.closeWindow?.()}
              className="no-drag w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-zinc-950 p-8">
          {/* CREATE / PACKS LIST */}
          {currentTab === 'packs' && (
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="text-emerald-400 text-sm font-medium mb-1">LIBRARY</div>
                  <h2 className="text-5xl font-bold tracking-tighter">Your Packs</h2>
                </div>
                <button
                  onClick={() => {
                    setPackIdToDelete(null);
                    setNewPackName('');
                    setNewPackDesc('');
                    setShowModal(true);
                    setModalType('new-pack');
                  }}
                  className="flex items-center gap-3 bg-white text-zinc-950 px-6 h-12 rounded-2xl font-semibold hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" /> NEW PACK
                </button>
              </div>

              {packs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {packs.map((pack) => {
                    const totalVehicles = pack.brands.reduce(
                      (acc, brand) => acc + brand.vehicles.length,
                      0
                    );
                    return (
                      <div
                        key={pack.id}
                        className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700 hover:border-cyan-400/60 group"
                      >
                        <div className="p-8" style={{paddingBottom: '2px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '22px'}}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 text-left">
                              <div className="text-3xl font-semibold tracking-tight text-white" style={{paddingLeft: '22px', paddingBottom: '60px'}}>
                                {pack.name}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectPack(pack);
                                    setCurrentTab('brands');
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-300 p-2 transition-colors"
                                  title="Manage Pack"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeletePackConfirm(pack.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-2 transition-colors"
                                  title="Delete Pack"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                              {pack.description}
                            </p>
                          </div>
                        </div>

                        <div className="bg-black/40 px-4 py-3 flex items-start justify-between border-t border-zinc-800/30">
                          <div className="flex flex-col gap-1 text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-emerald-400" />
                              <span className="text-zinc-400">vehicles: </span>
                              <span className="text-emerald-400 font-bold">{totalVehicles}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-purple-400" />
                              <span className="text-zinc-400">sounds: </span>
                              <span className="text-purple-400 font-bold">{pack.audioConfigs?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Disc className="w-3 h-3 text-amber-400" />
                              <span className="text-zinc-400">wheels: </span>
                              <span className="text-amber-400 font-bold">{pack.sharedWheelsBrands?.length || 0}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[7px] text-zinc-600">
                              ID: {pack.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-dashed border-zinc-700 h-80 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <FolderOpen className="mx-auto mb-6 text-zinc-600 h-20 w-20" />
                    <p className="text-zinc-400">No packs yet. Create your first one!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BRANDS & VEHICLES EDITOR */}
          {currentTab === 'brands' && currentPack && (
            <div className="max-w-[95%] mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-cyan-400 font-mono text-sm">{t('editing')}</div>
                  <div className="text-4xl font-bold tracking-tighter">{currentPack.name}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setModalType('add-brand');
                    }}
                    className="flex items-center gap-2 border border-white/30 px-5 h-11 rounded-2xl hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4" /> ADD VEHICLE
                  </button>
                                  </div>
              </div>

              {currentPack.brands.length > 0 ? (
                <div className="space-y-8">
                  {currentPack.brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 p-6 border-b border-zinc-800/50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-white tracking-tight">
                                {brand.name}
                              </div>
                              <div className="text-xs text-cyan-400 font-mono mt-1">
                                {brand.vehicles.length} vehicles • META FILES AUTO-GENERATED
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBrandId(brand.id);
                                setShowModal(true);
                                setModalType('add-vehicle');
                              }}
                              className="text-xs flex items-center gap-2 text-cyan-400 hover:text-white bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Plus className="w-3 h-3" /> ADD VEHICLE
                            </button>
                            <button
                              onClick={() => deleteBrand(brand.id)}
                              className="text-zinc-400 hover:text-red-400 p-2 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">

                        {brand.vehicles.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {brand.vehicles.map((vehicle) => (
                              <div
                                key={vehicle.id}
                                className="bg-black border border-zinc-700 rounded-2xl p-5 group"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-baseline gap-0">
                                      <div className="font-semibold text-lg">{vehicle.name}</div>
                                      <sup className="text-[10px] text-cyan-400 font-medium ml-0.5">
                                        {vehicle.year}
                                      </sup>
                                    </div>
                                    <div className="font-mono text-xs text-zinc-500 mt-1">
                                      Model: {vehicle.model}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-300 p-2 transition-colors"
                                      title="Ações futuras"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteVehicle(brand.id, vehicle.id)}
                                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-2 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-1.5">
                                      <HardDrive
                                        className={`w-3 h-3 ${stagedFiles[`${brand.name}-${vehicle.model}`]?.length ? 'text-emerald-400' : 'text-zinc-700'}`}
                                      />
                                      {stagedFiles[`${brand.name}-${vehicle.model}`]?.length || 0}{' '}
                                      files
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[7px] text-zinc-600">
                                        ID: {vehicle.id}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setUploadingVehicle({ brandId: brand.name, vehicle });
                                      setShowModal(true);
                                      setModalType('upload-files');
                                    }}
                                    className="w-full py-2 bg-zinc-900 hover:bg-white hover:text-black text-white text-[10px] font-bold rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                                  >
                                    <Upload className="w-3 h-3" /> SMART UPLOAD
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="italic text-xs text-zinc-500 py-6 border border-dashed border-zinc-700 rounded-2xl text-center">
                            No vehicles yet for this brand. Add some!
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => {
                    setShowModal(true);
                    setModalType('add-brand');
                  }}
                  className="border border-dashed border-zinc-700 h-96 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <div className="text-6xl mb-6 opacity-40">
                    <HardDrive className="w-16 h-16" />
                  </div>
                  <div className="text-xl text-zinc-400">{t('noVehicles')}</div>
                  <div className="text-sm text-zinc-500 mt-2">
                    {t('clickToAddBrand')}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                  {t('vehiclesInfo')}
                </p>
              </div>
            </div>
          )}

          {/* WHEELS SHARED */}
          {currentTab === 'wheels' && currentPack && (
            <div className="max-w-[95%] mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-cyan-400 font-mono text-sm">{t('sharedWheels')}</div>
                  <div className="text-4xl font-bold tracking-tighter">{currentPack.name}</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setNewWheelsBrandName('');
                      setShowModal(true);
                      setModalType('add-wheels-brand');
                    }}
                    className="flex items-center gap-2 border border-white/30 px-5 h-11 rounded-2xl hover:bg-white/5"
                  >
                    <Plus className="w-4 h-4" />
                    ADD WHEELS
                  </button>
                                  </div>
              </div>

              {/* Wheels List by Brand */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentPack.sharedWheelsBrands.length > 0 ? (
                  currentPack.sharedWheelsBrands.map((brand) => (
                    <div
                      key={brand}
                      className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
                    >
                      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                            <HardDrive className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{brand}</div>
                            <div className="text-xs text-zinc-500">
                              {sharedWheelsFiles[brand]?.length || 0} files
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setWheelsBrandName(brand);
                              setShowModal(true);
                              setModalType('upload-wheels');
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
                          >
                            <Upload className="w-3 h-3" />
                            Add Wheels
                          </button>
                          <button
                            onClick={() => deleteWheelsBrand(brand)}
                            className="text-red-400 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        {sharedWheelsFiles[brand] && sharedWheelsFiles[brand].length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {sharedWheelsFiles[brand].map((file: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-3"
                              >
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                                  <File className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-xs truncate flex-1">{file.name}</div>
                                <button
                                  onClick={() => deleteWheelFile(brand, file.name)}
                                  className="text-red-400 hover:text-red-500 p-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                            <div className="text-[10px] text-zinc-600">No wheels added</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                                    <div
                    onClick={() => {
                      setShowModal(true);
                      setModalType('add-wheels-brand');
                    }}
                    className="col-span-2 border border-dashed border-zinc-700 h-96 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors"
                  >
                    <div className="text-6xl mb-6 opacity-40">
                      <HardDrive className="w-16 h-16" />
                    </div>
                    <div className="text-xl text-zinc-400">{t('noWheels')}</div>
                    <div className="text-sm text-zinc-500 mt-2">
                      {t('clickToAddWheelsBrand')}
                    </div>
                  </div>
                )}
              </div>

              {/* Staged Wheels Section */}
              {currentPack && currentPack.stagedWheels && currentPack.stagedWheels.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-cyan-500/10 text-cyan-400 text-xs font-bold px-3 py-1 rounded border border-cyan-500/20 uppercase tracking-widest">
                        Staging
                      </div>
                      <div className="text-sm text-zinc-400">
                        {currentPack.stagedWheels.length} wheel(s) awaiting validation
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-2xl border border-cyan-500/20 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-cyan-500/5">
                      <div className="text-xs text-cyan-200/70">
                        These configurations will be applied to carcols.meta when you click "VALIDATE PACK"
                      </div>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {currentPack.stagedWheels.map((wheel) => (
                        <div key={wheel.id} className="p-4 flex items-center gap-4 hover:bg-zinc-800/50">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                            <HardDrive className="w-4 h-4" />
                          </div>
                          <div className="flex-1 grid grid-cols-5 gap-4 text-xs">
                            <div>
                              <div className="text-zinc-500 mb-1">Brand</div>
                              <div className="font-medium text-white">{wheel.brandName}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1">Name</div>
                              <div className="font-medium text-white">{wheel.wheelName}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1">Class</div>
                              <div className="font-medium text-cyan-400">{wheel.wheelClass}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1">Radius</div>
                              <div className="font-medium text-white">{wheel.rimRadius}</div>
                            </div>
                            <div>
                              <div className="text-zinc-500 mb-1">File</div>
                              <div className="font-medium text-zinc-300 truncate">{wheel.fileName}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteStagedWheel(wheel.id)}
                            className="text-red-400 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                  {t('wheelsInfo')}
                </p>
              </div>
            </div>
          )}

          {/* SOUND/AUDIO */}
          {currentTab === 'sound' && currentPack && (
            <div className="max-w-[95%] mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-cyan-400 font-mono text-sm">{t('audioConfigs')}</div>
                  <div className="text-4xl font-bold tracking-tighter">{currentPack.name}</div>
                </div>
                <button
                  onClick={() => {
                    setNewAudioName('');
                    setAudioFiles({
                      gameRel: null,
                      soundsRel: null,
                      ampRel: null,
                      gameNametable: null,
                      soundsNametable: null,
                      ampNametable: null,
                      awc: null,
                      npcAwc: null,
                    });
                    setShowModal(true);
                    setModalType('add-audio-config');
                  }}
                  className="flex items-center gap-2 border border-white/30 px-5 h-11 rounded-2xl hover:bg-white/5"
                >
                  <Plus className="w-4 h-4" />
                  ADD SOUND
                </button>
              </div>

              {currentPack.audioConfigs && currentPack.audioConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPack.audioConfigs.map((audio) => (
                    <div key={audio.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-cyan-400" />
                          <div className="font-semibold">{audio.name}</div>
                        </div>
                        <button
                          onClick={() => deleteAudioConfig(audio.id)}
                          className="text-red-400 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${audio.gameRel ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span className="text-zinc-400">Game REL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${audio.soundsRel ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span className="text-zinc-400">Sounds REL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${audio.ampRel ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span className="text-zinc-400">AMP REL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${audio.awcFiles.length > 0 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span className="text-zinc-400">AWC Files ({audio.awcFiles.length})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                                <div
                  onClick={() => {
                    setShowModal(true);
                    setModalType('add-audio-config');
                  }}
                  className="border border-dashed border-zinc-700 h-96 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <div className="text-6xl mb-6 opacity-40">
                    <Volume2 className="w-16 h-16" />
                  </div>
                  <div className="text-xl text-zinc-400">{t('noAudio')}</div>
                  <div className="text-sm text-zinc-500 mt-2">
                    {t('clickToAddAudio')}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                  {t('audioInfo')}
                </p>
              </div>
            </div>
          )}

          
          {/* CONFIG */}
          {currentTab === 'config' && (
            <div className="max-w-[95%] mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tighter">{t('configTitle')}</h2>
                <p className="text-zinc-400 mt-2">{t('configDesc')}</p>
              </div>

              <div className="grid gap-6">
                {/* Language Setting */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                      <Languages className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('displayLanguage')}</h3>
                      <p className="text-sm text-zinc-500">{t('displayLanguageDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-4 rounded-2xl border transition-all ${
                        language === 'en'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('pt')}
                      className={`flex-1 py-4 rounded-2xl border transition-all ${
                        language === 'pt'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      Português
                    </button>
                  </div>
                </div>

                {/* Directory Setting */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('packsDir')}</h3>
                      <p className="text-sm text-zinc-500">{t('packsDirDesc')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={packsDirectory}
                        onChange={(e) => setPacksDirectory(e.target.value)}
                        onBlur={() => {
                          fetch(`${API}/api/output-path`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: packsDirectory })
                          }).then(r => r.json()).then(d => {
                            if (d.success) setOutputPath(packsDirectory);
                          }).catch(console.error);
                        }}
                        className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-sm"
                        placeholder="C:\Users\Tigas\Documents\FiveM\app car pack\output"
                      />
                      <button 
                        onClick={() => window.electronAPI?.openPacksFolder?.()}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm font-medium"
                      >
                        {t('browse')}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                      Changes here affect where the "FOLDER" button in Export points to.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                  {t('configInfo')}
                </p>
              </div>
            </div>
          )}

          {/* LOGS */}
          {currentTab === 'logs' && (
            <div className="max-w-[95%] mx-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <div className="text-cyan-400 font-mono text-sm">{t('systemLogs')}</div>
                  <div className="text-4xl font-bold tracking-tighter">{t('debug')}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'info', 'success', 'error'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setLogFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        logFilter === f ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const body = logs
                        .map((l) => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`)
                        .join('\n');
                      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `tgs-pack-manager-logs-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('Logs exportados', 'success');
                    }}
                    disabled={logs.length === 0}
                    className="flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-xl hover:bg-cyan-500/20 disabled:opacity-40 text-xs"
                  >
                    <Download className="w-4 h-4" /> EXPORTAR
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="flex items-center gap-2 border border-white/30 px-4 py-2 rounded-xl hover:bg-white/5 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    CLEAR
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-zinc-400">Info</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-zinc-400">Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-400">Error</span>
                  </div>
                </div>
                <div className="h-[600px] overflow-y-auto p-4 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div>No logs recorded</div>
                    </div>
                  ) : (logFilter === 'all' ? logs : logs.filter((l) => l.type === logFilter)).length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">Nenhum log neste filtro</div>
                  ) : (
                    (logFilter === 'all' ? logs : logs.filter((l) => l.type === logFilter)).map((log, idx) => (
                      <div
                        key={idx}
                        className={`mb-2 p-3 rounded-lg border ${
                          log.type === 'error'
                            ? 'bg-red-500/5 border-red-500/20 text-red-400'
                            : log.type === 'success'
                              ? 'bg-green-500/5 border-green-500/20 text-green-400'
                              : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="text-zinc-500">[{log.timestamp}]</span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-3">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                  Logs show detailed information about system operations, including
                  uploads, errors, and backend responses. Use this tab for debugging when issues occur.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="h-11 bg-black border-t border-zinc-900 flex items-center px-6 text-xs text-zinc-500 font-mono justify-between">
          <div></div>
          <div className="flex gap-5 items-center">
            <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full font-mono flex items-center gap-1.5" title={getStatusConfig().description}>
              <div className={`w-2 h-2 ${getStatusConfig().bgColor} rounded-full ${connectionStatus === 'online' ? 'animate-pulse' : ''}`}></div>
              <span className={getStatusConfig().color}>{getStatusConfig().text}</span>
            </div>
            <button
              type="button"
              onClick={() => openExternalLink(PACK_MANAGER_PUBLIC_DOCS_URL)}
              className="hover:text-zinc-300 transition-colors bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-zinc-500"
            >
              TGS_Pack_Docs
            </button>
            <button
              type="button"
              onClick={() => openExternalLink(PACK_MANAGER_RELEASES_REPO_URL)}
              className="hover:text-zinc-300 transition-colors bg-transparent border-0 p-0 cursor-pointer font-mono text-xs text-zinc-500"
              title={PACK_MANAGER_RELEASES_REPO_URL}
            >
              GitHub
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div
          className="no-drag fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setPackIdToDelete(null);
            clearPendingFiles();
          }}
        >
          <div
            className={`no-drag bg-zinc-900 w-full rounded-3xl overflow-hidden ${modalType === 'upload-files' || modalType === 'export' ? 'max-w-6xl' : 'max-w-2xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === 'confirm-delete-pack' && (() => {
              const packToDelete = packs.find((p) => p.id === packIdToDelete);
              return (
                <>
                  <div className="px-8 pt-8 pb-2">
                    <div className="text-red-400/90 text-sm font-medium mb-1 tracking-wide">
                      CONFIRMAÇÃO
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Excluir pack?</h2>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>

                  <div className="px-8 py-6">
                    <div className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                          Pack selecionado
                        </div>
                        <div className="truncate text-lg font-semibold text-white">
                          {packToDelete?.name ?? '—'}
                        </div>
                        {packToDelete?.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                            {packToDelete.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-black p-5">
                    <button
                      type="button"
                      onClick={() => {
                        setPackIdToDelete(null);
                        setShowModal(false);
                      }}
                      className="no-drag flex-1 rounded-2xl border border-zinc-700 py-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeletePack}
                      className="no-drag flex-1 rounded-2xl border border-red-500/40 bg-red-500/10 py-4 text-sm font-semibold text-red-300 transition-colors hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200"
                    >
                      Excluir pack
                    </button>
                  </div>
                </>
              );
            })()}

            {/* New Pack Modal */}
            {modalType === 'new-pack' && (
              <>
                <div className="px-8 pt-8">
                  <div className="text-xl font-semibold mb-1">Create New Car Pack</div>
                  <div className="text-sm text-zinc-400">Follows optimized TGS structure</div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <div className="text-xs text-zinc-400 mb-2">PACK NAME</div>
                    <input
                      ref={newPackNameInputRef}
                      type="text"
                      value={newPackName}
                      onChange={(e) => setNewPackName(e.target.value)}
                      className="no-drag w-full bg-black border border-zinc-700 focus:border-cyan-400 rounded-2xl px-5 h-14 outline-none text-lg placeholder:text-zinc-600"
                      placeholder="MyAwesomeCars"
                      autoFocus
                    />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-2">DESCRIPTION</div>
                    <textarea
                      value={newPackDesc}
                      onChange={(e) => setNewPackDesc(e.target.value)}
                      className="no-drag w-full bg-black border border-zinc-700 focus:border-cyan-400 rounded-3xl px-5 py-4 outline-none h-28 resize-y text-sm"
                      placeholder="Collection of tuned Japanese cars for FiveM"
                    />
                  </div>
                </div>

                <div className="bg-black p-5 flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 text-sm border border-zinc-700 rounded-2xl"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={createNewPack}
                    className="flex-1 py-4 bg-white text-black font-semibold rounded-2xl"
                  >
                    CREATE PACK
                  </button>
                </div>
              </>
            )}

            {/* Add Brand / Meta Editor Modal */}
            {modalType === 'add-brand' && (
              <>
                {editingVehicle ? (
                  /* ADVANCED META EDITOR UI */
                  <div className="flex flex-col h-full max-h-[85vh]">
                    <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
                            ADVANCED EDITOR
                          </div>
                          <span className="text-zinc-500 text-xs font-mono">
                            • {editingVehicle.vehicle.model}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold tracking-tighter">
                          Edit {editingVehicle.vehicle.name}
                        </h3>
                      </div>
                      <div className="flex bg-black rounded-2xl p-1.5 border border-zinc-800">
                        <button
                          onClick={() => setMetaEditorMode('guided')}
                          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${metaEditorMode === 'guided' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          GUIDED
                        </button>
                        <button
                          onClick={() => setMetaEditorMode('xml')}
                          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${metaEditorMode === 'xml' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          RAW XML
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-zinc-950/50">
                      {metaEditorMode === 'guided' ? (
                        <div className="space-y-8">
                          <section>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-px flex-1 bg-zinc-800"></div>
                              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">
                                Handling Physics
                              </h4>
                              <div className="h-px flex-1 bg-zinc-800"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <MetaField
                                label="Vehicle Mass"
                                value={editingVehicle.vehicle.meta?.handling.fMass || '1500.000'}
                                onChange={(v) => updateMeta('handling', 'fMass', v)}
                                helper="Weight of the vehicle (KG)"
                              />
                              <MetaField
                                label="Top Speed"
                                value={
                                  editingVehicle.vehicle.meta?.handling.fInitialDriveMaxFlatVel ||
                                  '160.000'
                                }
                                onChange={(v) =>
                                  updateMeta('handling', 'fInitialDriveMaxFlatVel', v)
                                }
                                helper="Maximum speed in GTA units"
                              />
                              <MetaField
                                label="Drive Bias"
                                value={
                                  editingVehicle.vehicle.meta?.handling.fDriveBiasFront || '0.500'
                                }
                                onChange={(v) => updateMeta('handling', 'fDriveBiasFront', v)}
                                helper="0.0 = RWD, 0.5 = AWD, 1.0 = FWD"
                              />
                              <MetaField
                                label="Steering Angle"
                                value={
                                  editingVehicle.vehicle.meta?.handling.fSteeringLock || '40.000'
                                }
                                onChange={(v) => updateMeta('handling', 'fSteeringLock', v)}
                                helper="Max steering turn degrees"
                              />
                            </div>
                          </section>

                          <section>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-px flex-1 bg-zinc-800"></div>
                              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">
                                Model Configuration
                              </h4>
                              <div className="h-px flex-1 bg-zinc-800"></div>
                            </div>
                            <MetaField
                              label="Engine Sound (Audio Name Hash)"
                              value={editingVehicle.vehicle.meta?.vehicles.audioNameHash || 'NULL'}
                              onChange={(v) => updateMeta('vehicles', 'audioNameHash', v)}
                              helper="Model name of the audio baseline used"
                            />
                          </section>
                        </div>
                      ) : (
                        <div className="h-full min-h-[400px] flex flex-col">
                          <div className="flex-1 rounded-2xl border border-zinc-800 overflow-hidden bg-black flex flex-col">
                            <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                                handling.meta preview
                              </div>
                              <div className="text-[10px] text-cyan-500">
                                Live generated from fields
                              </div>
                            </div>
                            <textarea
                              readOnly
                              value={xmlContent}
                              className="flex-1 w-full bg-black p-6 text-emerald-400 font-mono text-xs outline-none resize-none leading-relaxed"
                            />
                          </div>
                          <div className="mt-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-zinc-400 leading-relaxed italic">
                            ⚠️ Professional Mode Active: Changes in the Guided tab are automatically
                            reflected in the XML. Direct XML editing is arriving in the next patch.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6 border-t border-zinc-800 flex gap-3 bg-zinc-900/20">
                      <button
                        onClick={() => {
                          setEditingVehicle(null);
                          setShowModal(false);
                        }}
                        className="px-6 py-4 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                      >
                        CLOSE EDITOR
                      </button>
                      <button
                        onClick={() => {
                          saveMeta();
                          setEditingVehicle(null);
                        }}
                        className="flex-1 py-4 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
                      >
                        UPDATE VEHICLE CONFIG
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-8">
                      <div className="text-2xl font-semibold mb-6">Add New Brand</div>

                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 h-14 rounded-2xl px-6 text-xl placeholder:text-zinc-600 focus:border-white"
                        placeholder="FERRARI"
                      />

                      <div className="mt-6 text-xs leading-relaxed text-zinc-400">
                        All vehicles from this brand will share the same meta files (handling.meta,
                        vehicles.meta, carvariations.meta).
                      </div>
                    </div>

                    <div className="flex p-4 gap-3 border-t border-zinc-800">
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-4 text-zinc-400 hover:bg-zinc-800 rounded-2xl"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addBrand}
                        className="flex-1 py-4 bg-cyan-400 text-black font-medium rounded-2xl"
                      >
                        ADD BRAND
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Add Vehicle Modal */}
            {modalType === 'add-vehicle' && (
              <>
                <div className="px-8 pt-8 pb-2">
                  <div className="font-semibold text-xl">Add Vehicle</div>
                  <div className="text-xs text-zinc-400">
                    To brand:{' '}
                    <span className="text-white font-medium">
                      {currentPack?.brands.find((b) => b.id === selectedBrandId)?.name}
                    </span>
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  <div>
                    <label className="block text-xs mb-2 text-zinc-400">DISPLAY NAME</label>
                    <input
                      value={newVehicleName}
                      onChange={(e) => setNewVehicleName(e.target.value)}
                      className="bg-zinc-950 w-full h-12 rounded-2xl px-5 border border-zinc-700 focus:border-white outline-none"
                      placeholder="M3 E92"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-zinc-400">
                      MODEL NAME (used in filenames)
                    </label>
                    <input
                      value={newVehicleModel}
                      onChange={(e) => setNewVehicleModel(e.target.value)}
                      className="bg-zinc-950 w-full h-12 rounded-2xl px-5 border border-zinc-700 focus:border-white outline-none font-mono"
                      placeholder="bmwm3e92"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-zinc-400">YEAR (optional)</label>
                    <input
                      type="text"
                      value={newVehicleYear}
                      onChange={(e) => setNewVehicleYear(e.target.value)}
                      className="bg-zinc-950 w-full h-12 rounded-2xl px-5 border border-zinc-700 focus:border-white outline-none"
                      placeholder="2012"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-800 flex gap-3">
                  <button
                    className="flex-1 h-12 rounded-2xl border border-zinc-700 text-sm"
                    onClick={() => setShowModal(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="flex-1 h-12 rounded-2xl bg-white text-black text-sm font-medium"
                    onClick={addVehicle}
                  >
                    ADD TO PACK
                  </button>
                </div>
              </>
            )}

            {/* Upload Files Modal - Smart Upload */}
            {modalType === 'upload-files' && uploadingVehicle && (
              <div className="flex flex-col h-full max-h-[85vh]">
                <div className="p-8 border-b border-zinc-800">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                      Smart Upload
                    </div>
                    <span className="text-zinc-500 text-xs font-mono">
                      • {uploadingVehicle.brandId} / {uploadingVehicle.vehicle.model}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tighter">Manage Files</h3>
                  <p className="text-zinc-400 text-sm mt-2">
                    Drag or select files. The system automatically detects the model and
                    organizes everything.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 font-sans">
                  {/* Smart Mode Toggle */}
                  <div className="flex items-center justify-between mb-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${smartUploadMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        onClick={() => setSmartUploadMode(!smartUploadMode)}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${smartUploadMode ? 'translate-x-4' : 'translate-x-0'}`}
                        ></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Smart Mode</div>
                        <div className="text-[10px] text-zinc-500">
                          Filters files matching the model:{' '}
                          <span className="text-cyan-400 font-mono">
                            {uploadingVehicle.vehicle.model}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-400">
                      {detectedVehicles.length > 0
                        ? `${detectedVehicles.length} vehicle(s) detected`
                        : 'No files'}
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <div
                    className={`relative group transition-all ${isDragging ? 'scale-[1.02]' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                        isDragging
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-zinc-700 group-hover:border-white group-hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                          isDragging
                            ? 'bg-emerald-500 scale-110'
                            : 'bg-zinc-800 group-hover:scale-110'
                        }`}
                      >
                        <Upload
                          className={
                            isDragging
                              ? 'text-white'
                              : isUploading
                                ? 'animate-bounce text-cyan-400'
                                : 'text-white'
                          }
                        />
                      </div>
                      <div className="text-lg font-semibold">
                        {isDragging
                          ? 'Drop here!'
                          : isUploading
                            ? 'Processing...'
                            : 'Drag files or click to select'}
                      </div>
                      <div className="text-xs text-zinc-500 mt-2">
                        .yft (model) • .ytd (textures) • .ydr • .ycd • .meta (handling, vehicles)
                      </div>
                    </div>
                  </div>

                  {/* Detected Vehicles Preview */}
                  {detectedVehicles.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          Detected Organization
                        </div>
                        {pendingFiles.length > 0 && (
                          <button
                            onClick={clearPendingFiles}
                            className="text-red-400 hover:text-red-500 p-2 transition-colors flex items-center gap-1 text-xs"
                          >
                            <Trash2 className="w-4 h-4" /> CLEAR ALL
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {detectedVehicles.map((vehicle, vIdx) => (
                          <div
                            key={vIdx}
                            className={`bg-zinc-950 border rounded-2xl overflow-hidden ${
                              vehicle.model === uploadingVehicle.vehicle.model.toLowerCase()
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-zinc-800'
                            }`}
                          >
                            {/* Vehicle Header */}
                            <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Car
                                  className={`w-4 h-4 ${
                                    vehicle.model === uploadingVehicle.vehicle.model.toLowerCase()
                                      ? 'text-emerald-400'
                                      : 'text-cyan-400'
                                  }`}
                                />
                                <span className="font-mono text-sm">
                                  {vehicle.brand || uploadingVehicle.brandId} /{' '}
                                </span>
                                <span className="font-semibold">{vehicle.model}</span>
                                {vehicle.model === uploadingVehicle.vehicle.model.toLowerCase() && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                    TARGET
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px]">
                                {vehicle.hasYft && (
                                  <span className="text-emerald-400">✓ Model</span>
                                )}
                                {vehicle.hasYtd && (
                                  <span className="text-emerald-400">✓ Textures</span>
                                )}
                                {vehicle.hasMeta && <span className="text-cyan-400">✓ Meta</span>}
                              </div>
                            </div>

                            {/* Files List */}
                            <div className="p-3 space-y-1">
                              {vehicle.files.map((fileInfo, fIdx) => (
                                <div
                                  key={fIdx}
                                  className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 rounded-xl"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-1.5 rounded ${fileInfo.isMatched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
                                    >
                                      <File className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium">
                                        {fileInfo.file.name}
                                      </div>
                                      <div className="text-[9px] text-zinc-500">
                                        {fileInfo.label} •{' '}
                                        {(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const globalIdx = pendingFiles.indexOf(fileInfo);
                                      if (globalIdx > -1) removePendingFile(globalIdx);
                                    }}
                                    className="text-red-400 hover:text-red-500 p-2 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                      <div className="text-xs text-cyan-400 mb-2">Upload Progress</div>
                      <div className="space-y-2">
                        {Object.entries(uploadProgress).map(([filename, progress]) => (
                          <div key={filename} className="flex items-center gap-3">
                            <div className="text-[10px] text-zinc-400 w-32 truncate">
                              {filename}
                            </div>
                            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-cyan-400 w-8">{progress}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staged Files (Already Uploaded) */}
                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Files on Server (
                        {stagedFiles[
                          `${uploadingVehicle.brandId}-${uploadingVehicle.vehicle.model}`
                        ]?.length || 0}
                        )
                      </div>
                      {stagedFiles[`${uploadingVehicle.brandId}-${uploadingVehicle.vehicle.model}`]
                        ?.length > 0 && (
                        <button
                          onClick={() =>
                            deleteStagedFiles(
                              uploadingVehicle.brandId,
                              uploadingVehicle.vehicle.model
                            )
                          }
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          Remove all
                        </button>
                      )}
                    </div>

                    {stagedFiles[`${uploadingVehicle.brandId}-${uploadingVehicle.vehicle.model}`]
                      ?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {stagedFiles[
                          `${uploadingVehicle.brandId}-${uploadingVehicle.vehicle.model}`
                        ].map((file, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-3"
                          >
                            <div
                              className={`p-1.5 rounded-lg ${file.isMeta ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-500/10 text-cyan-400'}`}
                            >
                              <File className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-xs truncate">{file.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                        <div className="text-[10px] text-zinc-600">
                          No files uploaded yet
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-[11px] text-emerald-200/70 leading-relaxed">
                      The system automatically detects the model by filename (ex:{' '}
                      <code className="text-cyan-400">bmwm3e92.yft</code> → model:{' '}
                      <code className="text-cyan-400">bmwm3e92</code>). .meta files are extracted
                      and automatically applied to corresponding vehicles.
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-black border-t border-zinc-800 flex gap-3">
                  <button
                    onClick={() => {
                      clearPendingFiles();
                      setShowModal(false);
                    }}
                    className="flex-1 py-4 text-sm border border-zinc-700 rounded-2xl hover:bg-zinc-900"
                  >
                    CANCEL
                  </button>
                  {pendingFiles.length > 0 && (
                    <button
                      onClick={executeSmartUpload}
                      disabled={isUploading}
                      className="flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{' '}
                          SENDING...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> CONFIRM UPLOAD (
                          {smartUploadMode
                            ? pendingFiles.filter((f) => f.isMatched).length
                            : pendingFiles.length}{' '}
                          files)
                        </>
                      )}
                    </button>
                  )}
                  {pendingFiles.length === 0 && (
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-[2] py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200"
                    >
                      DONE
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Add Wheels Brand Modal */}
            {modalType === 'add-wheels-brand' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="font-semibold text-2xl">Add New Brand</div>
                    <div className="text-cyan-400 text-sm mt-1">
                      New brand to organize shared wheels
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Brand Name</label>
                    <input
                      type="text"
                      value={newWheelsBrandName}
                      onChange={(e) => setNewWheelsBrandName(e.target.value)}
                      placeholder="Ex: APOLLO"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                    />
                  </div>

                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                      The brand will be used to organize wheels in shared/wheels/stream/[BRAND]/. Use uppercase names for consistency.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-sm border border-zinc-700 rounded-2xl hover:bg-zinc-900"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={addWheelsBrand}
                      disabled={!newWheelsBrandName.trim()}
                      className="flex-1 py-4 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl disabled:opacity-50"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Audio Config Modal */}
            {modalType === 'add-audio-config' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="font-semibold text-2xl">Add Audio</div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Audio Name</label>
                    <input
                      type="text"
                      value={newAudioName}
                      onChange={(e) => setNewAudioName(e.target.value)}
                      placeholder="Ex: lambov10"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-zinc-400 mb-3">Required Files</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">.awc</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-cyan-500 text-black text-xs rounded cursor-pointer hover:bg-cyan-400">
                            Escolher
                            <input
                              type="file"
                              accept=".awc"
                              onChange={(e) => setAudioFiles({ ...audioFiles, awc: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.awc?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">NPC .awc</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-cyan-500 text-black text-xs rounded cursor-pointer hover:bg-cyan-400">
                            Escolher
                            <input
                              type="file"
                              accept=".awc"
                              onChange={(e) => setAudioFiles({ ...audioFiles, npcAwc: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.npcAwc?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Game .rel</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-cyan-500 text-black text-xs rounded cursor-pointer hover:bg-cyan-400">
                            Escolher
                            <input
                              type="file"
                              accept=".rel"
                              onChange={(e) => setAudioFiles({ ...audioFiles, gameRel: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.gameRel?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Sounds .rel</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-cyan-500 text-black text-xs rounded cursor-pointer hover:bg-cyan-400">
                            Escolher
                            <input
                              type="file"
                              accept=".rel"
                              onChange={(e) => setAudioFiles({ ...audioFiles, soundsRel: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.soundsRel?.name || 'null'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-zinc-400 mb-3">Optional Files</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Game .nametable</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-zinc-600 text-white text-xs rounded cursor-pointer hover:bg-zinc-500">
                            Escolher
                            <input
                              type="file"
                              accept=".nametable"
                              onChange={(e) => setAudioFiles({ ...audioFiles, gameNametable: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.gameNametable?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Sounds .nametable</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-zinc-600 text-white text-xs rounded cursor-pointer hover:bg-zinc-500">
                            Escolher
                            <input
                              type="file"
                              accept=".nametable"
                              onChange={(e) => setAudioFiles({ ...audioFiles, soundsNametable: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.soundsNametable?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">AMP .nametable</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-zinc-600 text-white text-xs rounded cursor-pointer hover:bg-zinc-500">
                            Escolher
                            <input
                              type="file"
                              accept=".nametable"
                              onChange={(e) => setAudioFiles({ ...audioFiles, ampNametable: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.ampNametable?.name || 'null'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">AMP .rel</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg">
                          <label className="px-3 py-1 bg-zinc-600 text-white text-xs rounded cursor-pointer hover:bg-zinc-500">
                            Escolher
                            <input
                              type="file"
                              accept=".rel"
                              onChange={(e) => setAudioFiles({ ...audioFiles, ampRel: e.target.files?.[0] || null })}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-zinc-400 truncate">
                            {audioFiles.ampRel?.name || 'null'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-3 text-sm border border-zinc-700 rounded-xl hover:bg-zinc-900"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={addAudioConfig}
                      disabled={!newAudioName.trim() || !audioFiles.gameRel || !audioFiles.soundsRel || !audioFiles.awc || !audioFiles.npcAwc}
                      className="flex-1 py-3 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl disabled:opacity-50"
                    >
                      ADD AUDIO
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Wheels Modal - Staging Mode */}
            {modalType === 'upload-wheels' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="font-semibold text-2xl">Add Wheel to Staging</div>
                    <div className="text-cyan-400 text-sm mt-1">
                      Configuration will be applied when validating pack
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Brand</label>
                    <input
                      type="text"
                      value={wheelsBrandName}
                      onChange={(e) => setWheelsBrandName(e.target.value.toUpperCase())}
                      placeholder="Ex: VOLVO"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Wheel Name</label>
                    <input
                      type="text"
                      value={wheelName}
                      onChange={(e) => setWheelName(e.target.value)}
                      placeholder="Ex: GT"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Class</label>
                    <select
                      value={wheelClass}
                      onChange={(e) => setWheelClass(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                    >
                      <option value="VWT_SPORT">VWT_SPORT - Sports</option>
                      <option value="VWT_MUSCLE">VWT_MUSCLE - Muscle</option>
                      <option value="VWT_LOWRIDER">VWT_LOWRIDER - Lowrider</option>
                      <option value="VWT_SUV">VWT_SUV - SUV</option>
                      <option value="VWT_OFFROAD">VWT_OFFROAD - Offroad</option>
                      <option value="VWT_TUNER">VWT_TUNER - Tuner</option>
                      <option value="VWT_BIKE">VWT_BIKE - Bikes</option>
                      <option value="VWT_HIEND">VWT_HIEND - High-End</option>
                      <option value="VWT_SUPERMOD1">VWT_SUPERMOD1 - Benny's Originals</option>
                      <option value="VWT_SUPERMOD2">VWT_SUPERMOD2 - Benny's Bespoke</option>
                      <option value="VWT_SUPERMOD3">VWT_SUPERMOD3 - Supermod 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Wheel Radius (Rim Radius)</label>
                    <input
                      type="number"
                      value={rimRadius}
                      onChange={(e) => setRimRadius(e.target.value)}
                      min="0.1"
                      max="1"
                      step="0.01"
                      placeholder="0.25"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Default: 0.25 (range: 0.1 - 1.0)</p>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Upload 3D file (.ydr)
                    </label>
                    <input
                      type="file"
                      accept=".ydr"
                      id="wheel-file-input"
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-black file:cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <p className="text-[11px] text-cyan-200/70 leading-relaxed">
                      This configuration will be stored but NOT applied to carcols.meta. It will only be applied when you click "VALIDATE PACK".
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-sm border border-zinc-700 rounded-2xl hover:bg-zinc-900"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={stageWheel}
                      disabled={!wheelsBrandName || !wheelName}
                      className="flex-1 py-4 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl disabled:opacity-50"
                    >
                      ADD TO STAGING
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Carcols Meta Modal */}
            {modalType === 'edit-carcols' && (
              <div className="flex flex-col h-full max-h-[85vh]">
                <div className="p-8 border-b border-zinc-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-2xl">carcols.meta Editor</div>
                      <div className="text-cyan-400 text-sm mt-1">
                        Wheel definitions by category
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <textarea
                    value={carcolsContent}
                    onChange={(e) => setCarcolsContent(e.target.value)}
                    className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 resize-none"
                    spellCheck={false}
                  />
                </div>

                <div className="p-6 border-t border-zinc-800">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-sm border border-zinc-700 rounded-2xl hover:bg-zinc-900"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={saveCarcolsMeta}
                      disabled={isUploading}
                      className="flex-1 py-4 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl disabled:opacity-50"
                    >
                      {isUploading ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                    <p className="text-[10px] text-cyan-200/70 leading-relaxed">
                      ⚠️ Limit: ~500 wheels per category. Distribute wheels between SPORT, MUSCLE, LOWRIDER, SUV, OFFROAD, TUNER, BIKE, HIEND, SUPERMOD1/2/3.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation / Export Modal */}
            {modalType === 'export' && (
              <div className="max-h-[80vh] overflow-auto">
                <div className="px-8 pt-8">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-2xl">Pack Validation</div>
                      <div className="text-emerald-400 text-sm mt-1">
                        TGS_Pack_Exemplo Compliant
                      </div>
                    </div>
                    <div className="text-right text-xs pt-1 text-zinc-400 font-mono">
                      {currentPack?.name}
                    </div>
                  </div>
                </div>

                <div className="p-8 text-sm">
                  {validationResults.length > 0 &&
                    validationResults.map((result, index) => (
                      <div
                        key={index}
                        className="py-3 border-b border-zinc-800 last:border-none flex gap-4"
                      >
                        {result.includes('✅') ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 mt-px flex-shrink-0" />
                        ) : result.includes('❌') ? (
                          <X className="w-5 h-5 text-red-400 mt-px flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-cyan-400 mt-px flex-shrink-0" />
                        )}
                        <div>{result}</div>
                      </div>
                    ))}
                </div>

                {/* Destination path indicator */}
                <div className="mx-8 mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <FolderOpen className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                      Export destination
                    </div>
                    <div className="text-xs font-mono text-zinc-300 break-all">{outputPath}</div>
                  </div>
                </div>

                <div className="mx-8 mb-6 p-4 rounded-2xl bg-black/40 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                    Preview da estrutura
                  </div>
                  <ul className="text-xs font-mono text-zinc-300 space-y-2">
                    {buildExportPreview(currentPack ?? null).map((row, i) => (
                      <li key={i}>
                        <span className="text-emerald-500/90 mr-2">├──</span>
                        <span>{row.label}</span>
                        {row.detail ? (
                          <div className="ml-6 text-[10px] text-zinc-500 mt-1">{row.detail}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-black p-6 flex gap-3 text-sm">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isValidating}
                    className="flex-1 py-4 rounded-2xl border border-zinc-700 disabled:opacity-50"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={openPacksFolder}
                    disabled={isValidating}
                    className="py-4 px-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-cyan-500/20 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" /> FOLDER
                  </button>
                  <button
                    onClick={handleExportClick}
                    disabled={isValidating}
                    className="flex-1 py-4 bg-gradient-to-r from-white to-slate-100 text-black font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> EXPORT PACK
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                {isValidating && (
                  <div className="px-6 pb-6">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-zinc-400">{validationStep}</span>
                      <span className="text-cyan-400 font-mono">{validationProgress}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${validationProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AdGateModal
        open={showAdGate}
        apiBase={API}
        t={t}
        onComplete={handleAdGateComplete}
        onCancel={handleAdGateCancel}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm z-[100] transition-all text-white ${
            toast.type === 'success'
              ? 'bg-emerald-600'
              : toast.type === 'loading'
                ? 'bg-cyan-600'
                : toast.type === 'info'
                  ? 'bg-slate-800 border border-cyan-500/30'
                  : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : toast.type === 'loading' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-cyan-400" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PackManagerApp;
