'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import { SyntaxHighlighter } from './syntax-highlighter'

export function SlideArchitecture() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const backendModules = [
    { name: 'AuthModule', files: 4, desc: 'JWT + Passport + Guards', color: 'bg-red-50 border-red-100' },
    { name: 'UtilisateurModule', files: 4, desc: 'Profil + Score LBaraka', color: 'bg-blue-50 border-blue-100' },
    { name: 'AnnonceModule', files: 4, desc: 'CRUD + Photos MinIO', color: 'bg-emerald-50 border-emerald-100' },
    { name: 'TransactionModule', files: 5, desc: 'State Machine + QR', color: 'bg-amber-50 border-amber-100' },
    { name: 'WalletModule', files: 4, desc: 'Caution + Mouvements', color: 'bg-purple-50 border-purple-100' },
    { name: 'ContratModule', files: 4, desc: 'PDF Handlebars bilingue', color: 'bg-cyan-50 border-cyan-100' },
    { name: 'ChatModule', files: 5, desc: 'Socket.io + Mongoose', color: 'bg-pink-50 border-pink-100' },
    { name: 'AdminModule', files: 4, desc: 'Stats + Gestion Users', color: 'bg-orange-50 border-orange-100' },
    { name: 'StorageModule', files: 4, desc: 'MinIO S3 Upload', color: 'bg-teal-50 border-teal-100' },
    { name: 'NotificationModule', files: 4, desc: 'Push Notifications', color: 'bg-indigo-50 border-indigo-100' },
  ]

  const schemaCode = `// prisma/schema.prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  motDePasseHash  String
  telephone       String    @unique
  role            RoleUtilisateur @default(CITOYEN)
  profil          Profil?
  annonces        Annonce[]
  portefeuille    Portefeuille?
  notifications   Notification[]
}

enum RoleUtilisateur {
  CITOYEN
  PARTENAIRE
  ADMINISTRATEUR
}`

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              05 — Architecture Backend
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Modular Monolith NestJS
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            10 Modules
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT: Module list */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.layers className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Modules Backend</h3>
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto">
              {backendModules.map((mod, i) => (
                <div key={i} className={`p-2 rounded-lg border ${mod.color} flex items-center justify-between`} data-hover>
                  <div>
                    <p className="font-medium text-[10px]">{mod.name}</p>
                    <p className="text-[8px] text-gray-400">{mod.desc}</p>
                  </div>
                  <span className="text-[8px] text-gray-400">{mod.files} fichiers</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Prisma Schema code */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.database className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Schema Prisma</h3>
            </div>
            <div className="code-window flex-1 flex flex-col">
              <div className="code-header py-2">
                <div className="code-dot red" />
                <div className="code-dot yellow" />
                <div className="code-dot green" />
                <span className="code-title">schema.prisma</span>
              </div>
              <div className="code-body !p-3 flex-1 !text-[10px] !leading-relaxed">
                <SyntaxHighlighter code={schemaCode} />
              </div>
            </div>
          </div>

          {/* RIGHT: Architecture diagram */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.layout className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Pattern par module</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2 flex-1">
              {/* Module pattern */}
              {[
                { file: 'schema.prisma', icon: '📄', desc: 'Modèle Prisma' },
                { file: 'create-*.dto.ts', icon: '📝', desc: 'DTO Validation (class-validator)' },
                { file: '*.service.ts', icon: '⚙️', desc: 'Logique métier (Business Logic)' },
                { file: '*.controller.ts', icon: '🔌', desc: 'Routes REST API' },
                { file: '*.module.ts', icon: '📦', desc: 'Configuration DI NestJS' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100">
                  <span className="text-sm">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-mono text-[10px] font-medium">{item.file}</p>
                    <p className="text-[9px] text-gray-400">{item.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold">{i + 1}</div>
                </div>
              ))}

              <div className="divider my-2" />

              {/* Data flow */}
              <div className="text-center">
                <p className="text-[10px] font-semibold mb-2">Flux de données</p>
                <div className="flex items-center justify-center gap-1 text-[9px]">
                  <span className="px-2 py-1 bg-black text-white rounded-md">Client</span>
                  <Icons.arrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-1 bg-gray-200 rounded-md">Controller</span>
                  <Icons.arrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-1 bg-gray-200 rounded-md">Service</span>
                  <Icons.arrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-1 bg-gray-200 rounded-md">Prisma</span>
                  <Icons.arrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-1 bg-black text-white rounded-md">DB</span>
                </div>
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
            <p className="text-xs font-medium mb-0.5">Architecture</p>
            <p className="text-xs text-white/60">Modular Monolith : chaque module est indépendant avec son propre Controller → Service → Prisma. Pas d{"'"}over-engineering.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
