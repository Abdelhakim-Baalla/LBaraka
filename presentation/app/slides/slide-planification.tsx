'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import Image from 'next/image'

export function SlidePlanification() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

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
              Gestion Agile & Backlog Jira
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            📊 Scrum / Kanban
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 flex-1 h-full overflow-hidden">
          {/* LEFT: Methodology */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.target className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Méthodologie Active</h3>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { title: 'Framework', value: 'Agile Scrum', icon: '🔄' },
                { title: 'Outil de gestion', value: 'Jira Software', icon: '📋' },
                { title: 'Sprints', value: '6 sprints itératifs', icon: '🏃' },
                { title: 'Traçabilité', value: 'Tickets liés aux commits', icon: '🔗' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 hover:bg-white hover:shadow-md transition-all">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-xs text-black/70">{item.title}</p>
                    <p className="text-[11px] text-gray-500">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER + RIGHT: Image Backlog */}
          <div className={`col-span-2 flex flex-col h-full ${isVisible ? 'animate-fadeInRight stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.layout className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Vue du Backlog Scrum (Jira)</h3>
            </div>
            <div className="relative flex-1 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden group shadow-inner">
              <Image 
                src="/backlog.png" 
                alt="Jira Backlog" 
                fill 
                className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-500"
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
            <p className="text-xs font-medium mb-0.5">Visibilité totale</p>
            <p className="text-xs text-white/60">L{"'"}utilisation de Jira a permis d{"'"}affiner le product backlog en epics et user stories priorisées, garantissant une livraison continue de valeur à chaque fin de sprint.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
