'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import Image from 'next/image'

export function SlideGitflow() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              04 — Workflow
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Stratégie GitFlow
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            🌿 Branches & Commits
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 flex-1 h-full overflow-hidden">
          {/* LEFT: Methodology */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                <Icons.gitBranch className="w-3 h-3 text-purple-500" />
              </div>
              <h3 className="font-semibold text-sm">Gestion du code source</h3>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { title: 'Branche Principale', value: 'main (Production)', icon: '🔒' },
                { title: 'Branche Développement', value: 'develop (Intégration)', icon: '🚧' },
                { title: 'Branches Fonctionnalités', value: 'feature/* (Nouvelles features)', icon: '✨' },
                { title: 'Branches Corrections', value: 'hotfix/* (Corrections critiques)', icon: '🐛' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 hover:bg-white hover:shadow-md transition-all">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-xs text-black/70">{item.title}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER + RIGHT: Image Gitflow */}
          <div className={`col-span-2 flex flex-col h-full ${isVisible ? 'animate-fadeInRight stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                <Icons.image className="w-3 h-3 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-sm">Schéma GitFlow</h3>
            </div>
            <div className="relative flex-1 rounded-xl bg-white border border-gray-200 overflow-hidden group shadow-inner">
              <Image 
                src="/gitflow.png" 
                alt="GitFlow Diagram" 
                fill 
                className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div className={`mt-4 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Collaboration & Stabilité</p>
            <p className="text-xs text-white/60">Le modèle GitFlow assure que la branche main est toujours stable et déployable, tandis que l{"'"}équipe livre des fonctionnalités en parallèle sans conflits.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
