import React from 'react';
import { Rocket, CheckCircle, Shield, Zap } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
}

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-tgs-600 rounded-full mb-6">
          <Rocket className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo ao TGS FiveM Pack Manager</h2>
        <p className="text-gray-400 text-lg">
          O instalador irá guiar você através do processo de instalação do TGS FiveM Pack Manager v2.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-700/50 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-tgs-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Fácil de Usar</h3>
          <p className="text-gray-400 text-sm">
            Interface intuitiva para desenvolvedores FiveM de todos os níveis
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-tgs-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Seguro</h3>
          <p className="text-gray-400 text-sm">
            Verificação de integridade e downloads seguros com criptografia
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-6 text-center">
          <Zap className="w-12 h-12 text-tgs-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Rápido</h3>
          <p className="text-gray-400 text-sm">
            Instalação otimizada com downloads paralelos e cache inteligente
          </p>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">O que será instalado:</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-tgs-400 mr-3" />
            Aplicação principal TGS FiveM Pack Manager
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-tgs-400 mr-3" />
            Templates base para criação de packs
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-tgs-400 mr-3" />
            Dependências necessárias
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-tgs-400 mr-3" />
            Documentação e exemplos
          </li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button onClick={onStart} className="btn-primary text-lg px-8 py-3">
          Começar Instalação
        </button>
      </div>
    </div>
  );
}