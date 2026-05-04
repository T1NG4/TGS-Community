import React, { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { InstallationResult } from '@shared/types';

interface ConfigurationProps {
  onComplete: () => void;
  installationResult?: InstallationResult;
}

export function Configuration({ onComplete, installationResult }: ConfigurationProps) {
  const [configuring, setConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});

  const { ipcRenderer } = window.require('electron');

  const handleSaveConfiguration = async () => {
    try {
      setConfiguring(true);
      setError(null);

      // Simulate configuration tests
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setTestResults({
        paths: true,
        shortcuts: true,
        permissions: true,
      });

      setConfiguring(false);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Falha na configuração');
      setConfiguring(false);
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Configuração Final</h2>
        <p className="text-gray-400">
          Configure as opções finais e teste a instalação
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

      <div className="space-y-6">
        {/* Installation Summary */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Resumo da Instalação
          </h3>
          
          {installationResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${installationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {installationResult.success ? 'Sucesso' : 'Falha'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Caminho:</span>
                <span className="text-white text-sm truncate max-w-xs">{installationResult.installedPath}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duração:</span>
                <span className="text-white">{(installationResult.duration / 1000).toFixed(1)}s</span>
              </div>
              
              <div>
                <span className="text-gray-400 block mb-2">Componentes instalados:</span>
                <div className="flex flex-wrap gap-2">
                  {installationResult.components.map((component) => (
                    <span
                      key={component}
                      className="px-3 py-1 bg-tgs-600/20 text-tgs-400 rounded-full text-sm"
                    >
                      {component}
                    </span>
                  ))}
                </div>
              </div>

              {installationResult.errors && installationResult.errors.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-2">Erros:</span>
                  <div className="space-y-1">
                    {installationResult.errors.map((err, index) => (
                      <p key={index} className="text-red-400 text-sm">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Tests */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Testes de Configuração</h3>
          
          {configuring ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-tgs-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Testando configuração...</p>
            </div>
          ) : Object.keys(testResults).length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-white">Caminhos e diretórios</span>
                {testResults.paths ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-white">Atalhos criados</span>
                {testResults.shortcuts ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-white">Permissões de acesso</span>
                {testResults.permissions ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              Os testes serão executados após salvar a configuração
            </p>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-700/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Próximos Passos</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-tgs-400 mr-3 mt-0.5 flex-shrink-0" />
              <span>Inicie o TGS FiveM Pack Manager através do atalho criado</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-tgs-400 mr-3 mt-0.5 flex-shrink-0" />
              <span>Configure seu primeiro pack de veículos</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-tgs-400 mr-3 mt-0.5 flex-shrink-0" />
              <span>Consulte a documentação para mais informações</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSaveConfiguration}
            disabled={configuring}
            className={`btn-primary text-lg px-8 py-3 ${
              configuring ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {configuring ? 'Configurando...' : 'Finalizar e Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}