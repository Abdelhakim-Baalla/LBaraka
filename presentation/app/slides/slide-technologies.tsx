'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideTechnologies() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const backendTech = [
    { name: 'NestJS v11', desc: 'Framework Node.js modulaire', category: 'Framework' },
    { name: 'Prisma v7', desc: 'ORM TypeScript pour PostgreSQL', category: 'ORM' },
    { name: 'Mongoose v8', desc: 'ODM pour MongoDB (Chat)', category: 'ODM' },
    { name: 'Passport + JWT', desc: 'Authentification sécurisée', category: 'Auth' },
    { name: 'Socket.io v4', desc: 'WebSocket temps réel', category: 'Realtime' },
    { name: 'class-validator', desc: 'Validation des DTOs', category: 'Validation' },
    { name: 'html-pdf-node', desc: 'Génération contrats PDF', category: 'PDF' },
    { name: 'Handlebars', desc: 'Templates PDF bilingues', category: 'Templates' },
    { name: 'MinIO SDK', desc: 'Stockage S3 compatible', category: 'Storage' },
    { name: 'QRCode', desc: 'Génération codes QR', category: 'Utils' },
  ]

  const mobileTech = [
    { name: 'React Native 0.81', desc: 'Framework mobile cross-platform', category: 'Framework' },
    { name: 'Expo SDK 54', desc: 'Toolchain & Services mobiles', category: 'SDK' },
    { name: 'Expo Router v6', desc: 'Navigation fichier-basée', category: 'Navigation' },
    { name: 'NativeWind v5', desc: 'TailwindCSS pour RN', category: 'Styling' },
    { name: 'React Native Maps', desc: 'Cartographie Points Relais', category: 'Maps' },
    { name: 'Reanimated v4', desc: 'Animations natives 60fps', category: 'Animations' },
    { name: 'Expo Camera', desc: 'Scanner QR Code natif', category: 'Camera' },
    { name: 'AsyncStorage', desc: 'Persistence locale JWT', category: 'Storage' },
  ]

  const infraTech = [
    { name: 'PostgreSQL 15', icon: <Icons.database className="w-4 h-4" />, desc: 'Base relationnelle principale' },
    { name: 'MongoDB 5', icon: <Icons.database className="w-4 h-4" />, desc: 'Base NoSQL pour le chat' },
    { name: 'Redis 7', icon: <Icons.zap className="w-4 h-4" />, desc: 'Cache & sessions' },
    { name: 'MinIO', icon: <Icons.image className="w-4 h-4" />, desc: 'Stockage S3 (photos/PDF)' },
    { name: 'Docker Compose', icon: <Icons.box className="w-4 h-4" />, desc: 'Orchestration containers' },
    { name: 'GitHub Actions', icon: <Icons.gitBranch className="w-4 h-4" />, desc: 'CI/CD Pipeline' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              04 — Technologies
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Stack technologique
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            🔧 Full-Stack TypeScript
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* Backend */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.server className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Backend (NestJS)</h3>
              <span className="badge-info text-[8px] ml-auto">10 packages</span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {backendTech.map((tech, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all" data-hover>
                  <div>
                    <p className="font-medium text-[11px]">{tech.name}</p>
                    <p className="text-[9px] text-gray-400">{tech.desc}</p>
                  </div>
                  <span className="badge-neutral text-[8px]">{tech.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.smartphone className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Mobile (Expo)</h3>
              <span className="badge-success text-[8px] ml-auto">8 packages</span>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {mobileTech.map((tech, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all" data-hover>
                  <div>
                    <p className="font-medium text-[11px]">{tech.name}</p>
                    <p className="text-[9px] text-gray-400">{tech.desc}</p>
                  </div>
                  <span className="badge-neutral text-[8px]">{tech.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.cpu className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Infrastructure</h3>
              <span className="badge-warning text-[8px] ml-auto">6 services</span>
            </div>
            <div className="space-y-2 flex-1">
              {infraTech.map((tech, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300" data-hover>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                      {tech.icon}
                    </div>
                    <span className="font-semibold text-xs">{tech.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 ml-9">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-4 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Choix technique</p>
            <p className="text-xs text-white/60">Stack 100% TypeScript de bout en bout — du backend NestJS au mobile React Native pour une productivité maximale.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
