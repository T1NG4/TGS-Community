import React, { useState, useEffect } from 'react';
import { Download, HardDrive, Package, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { SystemCheckResult, InstallationConfig, InstallationResult, DownloadProgress } from '@shared/types';
import { DEFAULT_INSTALL_PATHS, INSTALLATION_TYPES } from '@shared/constants';

interface InstallationProps {
  onComplete: (result: InstallationResult) => void;
  systemCheckResults?: SystemCheckResult;
}

export function Installation({ onComplete, systemCheckResults }: InstallationProps) {
  const [config, setConfig] = useState<InstallationConfig>({
    type: 'full',
    installPath: DEFAULT_INSTALL_PATHS[process.platform as keyof typeof DEFAULT_INSTALL_PATHS] || DEFAULT_INSTALL_PATHS.win32,
    createShortcuts: true,
    addToPath: false,
    language: 'pt',
  });
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { ipcRenderer } = window.require('electron');

  useEffect(() => {
    // Listen for installation progress
    const handleProgress = (_event: any, progressData: DownloadProgress) => {
      setProgress((prev) => {
        const existing = prev.findIndex((p) => p.component === progressData.component);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = progressData;
          return updated;
        }
        return [...prev, progressData];
      });
    };

    ipcRenderer.on('installation-progress', handleProgress);

    return () => {
      ipcRenderer.removeListener('installation-progress', handleProgress);
    };
  }, []);

  const handleStartInstallation = async () => {
    try {
      setInstalling(true);
      setError(null);
      setProgress([]);

      const result = await ipcRenderer.invoke('start-installation', config);
      
      setInstalling(false);
      onComplete(result);
    } catch (err: any) {
      setError(err.message || 'Falha na instalação');
      setInstalling(false);
    }
  };

  const handleCancelInstallation = async () => {
    try {
      await ipcRenderer.invoke('cancel-installation');
      setInstalling(false);
      setProgress([]);
    } catch (err: any) {
      setError(err.message || 'Falha ao cancelar instalação');
    }
  };

  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const totalProgress = progress.reduce((sum, p) => sum + p.progress, 0);
    return totalProgress / progress.length;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Configuração da Instalação</h2>
        <p className="text-gray-400">
          Escolha as opções de instalação desejadas
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      {installing ? (
        <div className="space-y-6">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-tgs-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Instalando...</h3>
            <p className="text-gray-400">Por favor, aguarde enquanto os componentes são baixados</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progresso Geral</span>
                <span className="text-white font-medium">{getOverallProgress().toFixed(0)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>
            </div>

            {progress.map((p) => (
              <div key={p.component} className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-tgs-400" />
                    <span className="text-white font-medium">{p.component}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{p.progress.toFixed(0)}%</span>
                </div>
                <div className="progress-bar h-1 mb-2">
                  <div
                    className="progress-fill"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatBytes(p.downloaded)} / {formatBytes(p.total)}</span>
                  {p.eta > 0 && <span>ETA: {formatTime(p.eta)}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCancelInstallation}
              className="btn-danger"
            >
              Cancelar Instalação
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Installation Type */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Tipo de Instalação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(INSTALLATION_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setConfig((prev) => ({ ...prev, type: type as any }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.type === type
                      ? 'border-tgs-500 bg-tgs-500/10'
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {config.type === type ? (
                      <CheckCircle className="w-5 h-5 text-tgs-400" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-500 rounded-full" />
                    )}
                    <span className="text-white font-medium capitalize">{type}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{info.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Installation Path */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Diretório de Instalação</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.installPath}
                onChange={(e) => setConfig((prev) => ({ ...prev, installPath: e.target.value }))}
                className="input-field"
                placeholder="Caminho de instalação"
              />
              <button className="btn-secondary">Procurar</button>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Opções</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.createShortcuts}
                  onChange={(e) => setConfig((prev) => ({ ...prev, createShortcuts: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-tgs-600 focus:ring-tgs-500"
                />
                <span className="text-gray-300">Criar atalhos na área de trabalho</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.addToPath}
                  onChange={(e) => setConfig((prev) => ({ ...prev, addToPath: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-tgs-600 focus:ring-tgs-500"
                />
                <span className="text-gray-300">Adicionar ao PATH do sistema</span>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-tgs-400 hover:text-tgs-300 text-sm font-medium"
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} opções avançadas
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-700/30 rounded-lg space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Idioma</label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig((prev) => ({ ...prev, language: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Resumo da Instalação</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo:</span>
                <span className="text-white capitalize">{config.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Caminho:</span>
                <span className="text-white truncate max-w-xs">{config.installPath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Atalhos:</span>
                <span className="text-white">{config.createShortcuts ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartInstallation}
              className="btn-primary text-lg px-8 py-3"
            >
              Iniciar Instalação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}