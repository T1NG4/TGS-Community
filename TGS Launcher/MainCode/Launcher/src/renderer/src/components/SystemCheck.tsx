import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { SystemCheckResult } from '@shared/types';

interface SystemCheckProps {
  onComplete: (results: SystemCheckResult) => void;
}

export function SystemCheck({ onComplete }: SystemCheckProps) {
  const [checking, setChecking] = useState(true);
  const [results, setResults] = useState<SystemCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { ipcRenderer } = window.require('electron');

  useEffect(() => {
    performSystemCheck();
  }, []);

  const performSystemCheck = async () => {
    try {
      setChecking(true);
      setError(null);
      const checkResults = await ipcRenderer.invoke('check-system');
      setResults(checkResults);
      setChecking(false);
    } catch (err: any) {
      setError(err.message || 'Falha ao verificar o sistema');
      setChecking(false);
    }
  };

  const handleContinue = () => {
    if (results) {
      onComplete(results);
    }
  };

  const canContinue = results && 
    results.nodejs.installed && 
    results.npm.installed && 
    results.diskSpace.available && 
    results.permissions.hasWrite && 
    results.internet.connected;

  const renderCheckItem = (
    label: string,
    status: 'success' | 'error' | 'warning' | 'loading',
    details?: string
  ) => {
    const icons = {
      success: <CheckCircle className="w-6 h-6 text-green-500" />,
      error: <XCircle className="w-6 h-6 text-red-500" />,
      warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
      loading: <Loader2 className="w-6 h-6 text-tgs-500 animate-spin" />,
    };

    return (
      <div className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-lg">
        <div className="flex-shrink-0 mt-0.5">{icons[status]}</div>
        <div className="flex-1">
          <p className="text-white font-medium">{label}</p>
          {details && <p className="text-gray-400 text-sm mt-1">{details}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Verificação do Sistema</h2>
        <p className="text-gray-400">
          Verificando se seu sistema atende aos requisitos mínimos
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {checking ? (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-tgs-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verificando sistema...</p>
        </div>
      ) : results ? (
        <div className="space-y-4">
          {renderCheckItem(
            'Node.js',
            results.nodejs.installed ? 'success' : 'error',
            results.nodejs.installed 
              ? `Versão ${results.nodejs.version} instalada`
              : results.nodejs.action
          )}

          {renderCheckItem(
            'npm',
            results.npm.installed ? 'success' : 'error',
            results.npm.installed 
              ? `Versão ${results.npm.version} instalada`
              : results.npm.action
          )}

          {renderCheckItem(
            'Espaço em Disco',
            results.diskSpace.available ? 'success' : 'error',
            `${(results.diskSpace.availableSpace / (1024 * 1024 * 1024)).toFixed(2)} GB disponível (mínimo: 2 GB)`
          )}

          {renderCheckItem(
            'Permissões de Escrita',
            results.permissions.hasWrite ? 'success' : 'error',
            results.permissions.hasWrite 
              ? 'Permissões adequadas'
              : 'Sem permissões de escrita'
          )}

          {renderCheckItem(
            'Conexão com Internet',
            results.internet.connected ? 'success' : 'error',
            results.internet.connected 
              ? 'Conectado'
              : 'Sem conexão com internet'
          )}

          {results.antivirus.detected && (
            renderCheckItem(
              'Antivírus',
              'warning',
              `${results.antivirus.name} detectado. ${results.antivirus.recommendation}`
            )
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={performSystemCheck}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verificar Novamente</span>
            </button>

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`btn-primary ${
                !canContinue ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {canContinue ? 'Continuar' : 'Corrija os problemas para continuar'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}