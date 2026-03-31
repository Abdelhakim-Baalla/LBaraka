'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideSommaire() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const sections = [
    { num: '01', title: 'Problématique', subtitle: 'Le constat', desc: 'Surproduction, gaspillage et manque de solidarité locale', gradient: 'from-gray-900 to-gray-700' },
    { num: '02', title: 'Solution Proposée', subtitle: 'LBaraka App', desc: 'Plateforme mobile solidaire de prêt, don et location', gradient: 'from-gray-800 to-gray-500' },
    { num: '03', title: 'Planification', subtitle: 'Gestion de projet', desc: 'Méthodologie Agile, Jira, sprints et livrables', gradient: 'from-gray-700 to-gray-400' },
    { num: '04', title: 'Technologies', subtitle: 'Stack technique', desc: 'NestJS, React Native, PostgreSQL, MongoDB, Docker', gradient: 'from-gray-600 to-gray-300' },
    { num: '05', title: 'Architecture', subtitle: 'Conception UML', desc: 'Diagrammes de classes, cas d\'utilisation et séquence', gradient: 'from-gray-500 to-gray-300' },
    { num: '06', title: 'Fonctionnalités', subtitle: 'Modules clés', desc: 'Auth, Annonces, Wallet, Chat, Contrats, QR Code', gradient: 'from-gray-400 to-gray-200' },
    { num: '07', title: 'Démonstration', subtitle: 'Captures d\'écran', desc: 'Interface mobile et flux utilisateur', gradient: 'from-gray-500 to-gray-300' },
    { num: '08', title: 'Conclusion', subtitle: 'Bilan & Perspectives', desc: 'Résultats, compétences acquises et évolutions', gradient: 'from-gray-900 to-gray-600' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className={`mb-6 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
          <div className="slide-badge mb-2">📋 PLAN</div>
          <h2 className="text-4xl font-bold tracking-tight">Sommaire</h2>
          <p className="text-subtitle text-sm mt-1">Vue d{"'"}ensemble de la présentation</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {sections.map((section, i) => (
            <div
              key={i}
              className={`group relative p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-300 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-black/5 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              data-hover
            >
              {/* Number */}
              <div className={`text-4xl font-bold bg-gradient-to-br ${section.gradient} bg-clip-text text-transparent mb-2 leading-none`}>
                {section.num}
              </div>
              {/* Content */}
              <h3 className="font-semibold text-sm mb-0.5">{section.title}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{section.subtitle}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{section.desc}</p>
              {/* Hover indicator */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-black rounded-full transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`mt-4 flex items-center justify-between gap-4 ${isVisible ? 'animate-fadeInUp stagger-6' : 'opacity-0'}`}>
          <div className="flex items-center gap-6">
            {[
              { icon: <Icons.check className="w-3 h-3 text-emerald-500" />, text: '10 Modules Backend' },
              { icon: <Icons.code className="w-3 h-3 text-blue-500" />, text: '8 Écrans Mobile' },
              { icon: <Icons.zap className="w-3 h-3 text-amber-500" />, text: 'Temps Réel Socket.io' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center">{item.icon}</div>
                {item.text}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">8 sections • ~15 min</span>
        </div>
      </div>
    </div>
  )
}
