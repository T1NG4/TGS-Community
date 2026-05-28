import React from 'react';
import { CheckCircle, ExternalLink, BookOpen, MessageCircle, RefreshCw } from 'lucide-react';
import { InstallationResult } from '@shared/types';

interface CompletionProps {
  installationResult?: InstallationResult;
  onRestart: () => void;
}

export function Completion({ installationResult, onRestart }: CompletionProps) {
  const handleLaunchApp = async () => {
    try {
      // Calls the backend to spawn the process with the secure token
      // Pass the installed path so it knows where the data/apps folder is
      const appType = window.electron?.appType || 'packManager'; // This depends on how appType is tracked. If not available, we can pass it via installationResult config if possible.
      // Wait, installationResult has installedPath!
      if (installationResult) {
        await window.electron?.ipcRenderer.invoke('launch-app', 'packManager', installationResult.installedPath);
      }
    } catch (error) {
      console.error('Error launching app:', error);
    }
  };

  const handleViewDocumentation = () => {
    window.open('https://github.com/T1NG4/TGS_fivem_pack_maneger/blob/main/README.md', '_blank');
  };

  const handleGetSupport = () => {
    window.open('https://github.com/T1NG4/TGS_fivem_pack_maneger/issues', '_blank');
  };

  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Instalação Concluída!</h2>
        <p className="text-gray-400 text-lg">
          O TGS FiveM Pack Manager foi instalado com sucesso
        </p>
      </div>

      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Tudo pronto!</h3>
              <p className="text-gray-300">
                O TGS FiveM Pack Manager v2.0 foi instalado com sucesso em seu sistema.
                Você pode começar a criar e gerenciar seus packs de veículos FiveM agora.
              </p>
            </div>
          </div>
        </div>

        {/* Installation Details */}
        {installationResult && (
          <div className="bg-gray-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Detalhes da Instalação</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Caminho de instalação:</span>
                <span className="text-white text-sm truncate max-w-xs">{installationResult.installedPath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tempo de instalação:</span>
                <span className="text-white">{(installationResult.duration / 1000).toFixed(1)} segundos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Componentes instalados:</span>
                <span className="text-white">{installationResult.components.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleLaunchApp}
            className="btn-primary flex items-center justify-center space-x-2 py-4"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Abrir Aplicação</span>
          </button>

          <button
            onClick={handleViewDocumentation}
            className="btn-secondary flex items-center justify-center space-x-2 py-4"
          >
            <BookOpen className="w-5 h-5" />
            <span>Documentação</span>
          </button>

          <button
            onClick={handleGetSupport}
            className="btn-secondary flex items-center justify-center space-x-2 py-4"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Suporte</span>
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Próximos Passos</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-tgs-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">1</span>
              <span>Inicie o TGS FiveM Pack Manager através do atalho na área de trabalho</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-tgs-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">2</span>
              <span>Importe seus veículos ou use os templates fornecidos</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-tgs-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">3</span>
              <span>Configure os metadados e propriedades dos veículos</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-tgs-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">4</span>
              <span>Gere o pack final e adicione ao seu servidor FiveM</span>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recursos Úteis</h3>
          <div className="space-y-2">
            <a
              href="https://github.com/T1NG4/TGS_fivem_pack_maneger"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-tgs-400 hover:text-tgs-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Repositório GitHub</span>
            </a>
            <a
              href="https://github.com/T1NG4/TGS_fivem_pack_maneger/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-tgs-400 hover:text-tgs-300 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Wiki e Tutoriais</span>
            </a>
            <a
              href="https://github.com/T1NG4/TGS_fivem_pack_maneger/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-tgs-400 hover:text-tgs-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reportar Problemas</span>
            </a>
          </div>
        </div>

        {/* Restart Option */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reiniciar Instalação</span>
          </button>
        </div>
      </div>
    </div>
  );
}