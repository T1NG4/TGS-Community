export interface VehicleMeta {
  handling: {
    fMass: string;
    fInitialDriveMaxFlatVel: string;
    fDriveBiasFront: string;
    fSteeringLock: string;
  };
  vehicles: {
    audioNameHash: string;
  };
}

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: string;
  meta?: VehicleMeta;
}

export interface FileUploadInfo {
  file: File;
  type: string;
  label: string;
  targetModel: string;
  targetBrand: string;
  isMatched: boolean;
}

export interface DetectedVehicle {
  model: string;
  brand: string;
  files: FileUploadInfo[];
  hasYft: boolean;
  hasYtd: boolean;
  hasMeta: boolean;
}

export interface Brand {
  id: string;
  name: string;
  vehicles: Vehicle[];
}

export interface StagedWheel {
  id: string;
  brandName: string;
  wheelName: string;
  wheelClass: string;
  rimRadius: number;
  fileName: string;
  filePath: string;
}

export interface AudioConfig {
  id: string;
  name: string;
  gameRel: string | null;
  soundsRel: string | null;
  ampRel: string | null;
  gameNametable: string | null;
  soundsNametable: string | null;
  ampNametable: string | null;
  awcFiles: string[];
  npcAwc: string | null;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  brands: Brand[];
  sharedAudio: string[];
  sharedWheelsBrands: string[];
  stagedWheels: StagedWheel[];
  audioConfigs: AudioConfig[];
  createdAt: string;
  metaOverrides?: {
    vehicles: {
      [brandName: string]: {
        [vehicleModel: string]: {
          handling?: string;
          vehicles?: string;
          carvariations?: string;
          carcols?: string;
          vehiclelayouts?: string;
        };
      };
    };
    sharedWheels?: {
      carcols?: string;
    };
  };
}

export interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  content?: string;
}
