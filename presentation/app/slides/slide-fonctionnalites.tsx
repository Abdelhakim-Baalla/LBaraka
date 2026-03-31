'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import { SyntaxHighlighter } from './syntax-highlighter'

export function SlideFonctionnalites() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const modules = [
    { emoji: '🔐', name: 'Auth & JWT', desc: 'Register, Login, JWT Guard, Passport Strategy, bcrypt hash', files: ['auth.service.ts', 'jwt.strategy.ts', 'jwt-auth.guard.ts'] },
    { emoji: '📦', name: 'Annonces CRUD', desc: 'Création avec 3 photos max (MinIO), 3 modes, filtres par catégorie', files: ['annonce.service.ts', 'create-annonce.dto.ts'] },
    { emoji: '🔄', name: 'Transactions', desc: 'Machine à statuts (6 états), QR génération/scan, retard tracking', files: ['transaction.service.ts'] },
    { emoji: '💳', name: 'Wallet & Caution', desc: 'Solde réel/bloqué, dépôt, blocage auto, déblocage à la fin', files: ['wallet.service.ts'] },
    { emoji: '📄', name: 'Contrats PDF', desc: 'Templates Handlebars bilingues (Arabe/Français), hash signature', files: ['contrat.service.ts'] },
    { emoji: '📱', name: 'QR Code', desc: 'Génération QR unique par transaction, validation au scan', files: ['transaction.service.ts'] },
    { emoji: '💬', name: 'Chat Temps Réel', desc: 'Socket.io WebSocket, MongoDB messages, notes vocales', files: ['chat.gateway.ts', 'chat.service.ts'] },
    { emoji: '🥗', name: 'Food Rescue', desc: 'Module anti-gaspillage, paniers solidaires à récupérer', files: ['food-rescue.tsx'] },
  ]

  const codeExample = `// transaction.service.ts
async confirmerRetrait(transactionId: string) {
  const transaction = await this.prisma
    .transaction.findUnique({
      where: { id: transactionId }
    });

  if (!transaction) {
    throw new NotFoundException(
      'Transaction introuvable'
    );
  }

  // Vérifier le QR Code scanné
  if (!transaction.scannedReception) {
    throw new BadRequestException(
      'QR non scanné'
    );
  }

  // Mettre à jour le statut
  return this.prisma.transaction.update({
    where: { id: transactionId },
    data: { statut: 'EN_COURS' }
  });
}`

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              06 — Fonctionnalités
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Modules fonctionnels
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            8 Modules
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT + CENTER: Module grid */}
          <div className={`col-span-2 grid grid-cols-2 gap-2 ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            {modules.map((mod, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group" data-hover>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{mod.emoji}</span>
                  <h4 className="font-bold text-xs">{mod.name}</h4>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{mod.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {mod.files.map((f, j) => (
                    <span key={j} className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] font-mono text-gray-500">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Code example */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.code className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Exemple de code</h3>
            </div>
            <div className="code-window flex-1 flex flex-col">
              <div className="code-header py-2">
                <div className="code-dot red" />
                <div className="code-dot yellow" />
                <div className="code-dot green" />
                <span className="code-title">transaction.service.ts</span>
              </div>
              <div className="code-body !p-3 flex-1 !text-[9px] !leading-relaxed">
                <SyntaxHighlighter code={codeExample} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-3 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">NestJS Exception-based</p>
            <p className="text-xs text-white/60">Chaque service utilise des Exceptions NestJS (NotFoundException, BadRequestException) pour un error handling clair.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
