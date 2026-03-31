'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideConclusion() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const skills = [
    { name: 'NestJS (Backend)', level: 90 },
    { name: 'React Native / Expo', level: 85 },
    { name: 'Prisma + PostgreSQL', level: 88 },
    { name: 'Socket.io (Realtime)', level: 80 },
    { name: 'Docker & CI/CD', level: 75 },
    { name: 'TypeScript', level: 92 },
  ]

  const bestPractices = [
    { icon: <Icons.code className="w-4 h-4" />, title: 'KISS', desc: 'Code simple, méthodes < 30 lignes' },
    { icon: <Icons.layers className="w-4 h-4" />, title: 'Modular Monolith', desc: 'Séparation stricte par module' },
    { icon: <Icons.shield className="w-4 h-4" />, title: 'Validation DTO', desc: 'class-validator sur chaque input' },
    { icon: <Icons.zap className="w-4 h-4" />, title: 'Exception-based', desc: 'Fail fast avec NestJS exceptions' },
    { icon: <Icons.gitBranch className="w-4 h-4" />, title: 'CI/CD', desc: 'GitHub Actions automatisé' },
    { icon: <Icons.lock className="w-4 h-4" />, title: 'Sécurité JWT', desc: 'Guards + Passport + bcrypt' },
  ]

  const perspectives = [
    'Intégrer un système de paiement réel (Stripe/CMI)',
    'Ajouter la géolocalisation temps réel des livreurs',
    'Implémenter un système de notation / avis',
    'Déployer sur AWS/GCP avec Kubernetes',
    'Ajouter le support multilingue (Arabe/Amazigh)',
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              🎯 Conclusion
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Bilan & Perspectives
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-black text-white text-xs rounded-full font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            Projet complet ✅
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT: Skills */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.activity className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Compétences acquises</h3>
            </div>
            <div className="space-y-3 flex-1">
              {skills.map((skill, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium">{skill.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-1000 ease-out"
                      style={{ width: isVisible ? `${skill.level}%` : '0%', transitionDelay: `${0.5 + i * 0.1}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats summary */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { value: '10', label: 'Modules Backend' },
                { value: '8', label: 'Écrans Mobile' },
                { value: '252', label: 'Lignes Schema' },
                { value: '5', label: 'Services Docker' },
              ].map((stat, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-center">
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[8px] text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Best Practices */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.check className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Bonnes pratiques</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {bestPractices.map((bp, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300" data-hover>
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center mb-2">
                    {bp.icon}
                  </div>
                  <h4 className="font-semibold text-xs mb-0.5">{bp.title}</h4>
                  <p className="text-[9px] text-gray-500 leading-relaxed">{bp.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Perspectives */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.target className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Perspectives & Évolutions</h3>
            </div>
            <div className="space-y-2 flex-1">
              {perspectives.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 transition-all" data-hover>
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>

            {/* Links */}
            <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-semibold mb-2">Ressources</p>
              <div className="space-y-1.5">
                {[
                  { icon: <Icons.github className="w-3 h-3" />, name: 'GitHub Repository', url: 'github.com/Abdelhakim-Baalla/LBaraka' },
                  { icon: <Icons.book className="w-3 h-3" />, name: 'Documentation API', url: 'Swagger UI — /api/docs' },
                  { icon: <Icons.monitor className="w-3 h-3" />, name: 'Prisma Studio', url: 'npx prisma studio' },
                ].map((link, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] text-gray-500" data-hover>
                    {link.icon}
                    <span className="font-medium">{link.name}</span>
                    <span className="text-gray-400 ml-auto">{link.url}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom thank you bar */}
        <div className={`mt-4 p-4 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-5' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🙏</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5">Merci pour votre attention !</p>
            <p className="text-xs text-white/60">Abdelhakim Baalla — YouCode 2ème Année — Projet de Fin d{"'"}Année 2024/2026</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px]">Questions ? 🤔</span>
          </div>
        </div>
      </div>
    </div>
  )
}
