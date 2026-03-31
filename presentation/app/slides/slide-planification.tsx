'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlidePlanification() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const sprints = [
    { name: 'Sprint 1', duration: '2 sem.', tasks: ['Auth Module (JWT + Guards)', 'Users Module (Profil + Score)', 'Setup Docker + CI/CD'], status: 'done' },
    { name: 'Sprint 2', duration: '2 sem.', tasks: ['Items Module (CRUD + Photos)', 'Storage MinIO (Upload S3)', 'Wallet Module (Caution)'], status: 'done' },
    { name: 'Sprint 3', duration: '2 sem.', tasks: ['Transactions (State Machine)', 'Contrats PDF (Handlebars)', 'QR Code (Génération + Scan)'], status: 'done' },
    { name: 'Sprint 4', duration: '2 sem.', tasks: ['Chat (Socket.io + MongoDB)', 'Notifications temps réel', 'Food Rescue Module'], status: 'done' },
    { name: 'Sprint 5', duration: '2 sem.', tasks: ['Admin Dashboard (Stats)', 'Points Relais (Map)', 'Gamification + Badges'], status: 'done' },
    { name: 'Sprint 6', duration: '1 sem.', tasks: ['Tests unitaires (Jest)', 'Bug fixes & Polish', 'Déploiement & Présentation'], status: 'done' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              03 — Planification
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Gestion de projet Agile
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            📊 Scrum/Kanban
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT: Methodology */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.target className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Méthodologie</h3>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { title: 'Framework', value: 'Agile Scrum', icon: '🔄' },
                { title: 'Outil de gestion', value: 'Jira / GitHub Projects', icon: '📋' },
                { title: 'Versioning', value: 'Git + GitHub', icon: '🔀' },
                { title: 'CI/CD', value: 'GitHub Actions', icon: '⚡' },
                { title: 'Durée totale', value: '~11 semaines', icon: '📅' },
                { title: 'Sprints', value: '6 sprints', icon: '🏃' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="font-medium text-[11px] text-black/70">{item.title}</p>
                    <p className="text-[10px] text-gray-400">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER + RIGHT: Sprint timeline */}
          <div className={`col-span-2 ${isVisible ? 'animate-fadeInRight stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.clock className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Roadmap des Sprints</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {sprints.map((sprint, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300" data-hover>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs">{sprint.name}</span>
                    <span className="badge-success text-[9px]">✅ {sprint.duration}</span>
                  </div>
                  <div className="space-y-1.5">
                    {sprint.tasks.map((task, j) => (
                      <div key={j} className="flex items-start gap-2 text-[10px] text-gray-600">
                        <Icons.check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div className={`mt-4 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Résultat planification</p>
            <p className="text-xs text-white/60">6 sprints livrés à temps avec intégration continue via GitHub Actions (Tests + Build + APK EAS).</p>
          </div>
        </div>
      </div>
    </div>
  )
}
