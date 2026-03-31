'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideSolution() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const modes = [
    { emoji: '🎁', title: 'Don Gratuit', desc: 'Donner un objet sans contrepartie financière', badge: 'badge-success', example: 'Ex: Poussette, vêtements, livres' },
    { emoji: '🤝', title: 'Prêt Temporaire', desc: 'Prêter un objet avec caution sécurisée via le Wallet', badge: 'badge-info', example: 'Ex: Perceuse, appareil médical' },
    { emoji: '💰', title: 'Location Solidaire', desc: 'Louer à prix symbolique avec contrat PDF automatique', badge: 'badge-warning', example: 'Ex: Matériel événementiel' },
  ]

  const pillars = [
    { icon: <Icons.shield className="w-4 h-4" />, title: 'Confiance', desc: 'Score LBaraka + Wallet caution + Points Relais' },
    { icon: <Icons.qrCode className="w-4 h-4" />, title: 'Traçabilité', desc: 'QR Code pour retrait/retour + Contrat PDF' },
    { icon: <Icons.messageCircle className="w-4 h-4" />, title: 'Communication', desc: 'Chat temps réel + Notifications push' },
    { icon: <Icons.heart className="w-4 h-4" />, title: 'Solidarité', desc: 'Food Rescue + Gamification + Badges' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              02 — Solution proposée
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              LBaraka — L{"'"}app solidaire
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full border border-emerald-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            ✅ Solution complète
          </div>
        </div>

        {/* 3 Modes */}
        <div className={`grid grid-cols-3 gap-3 mb-4 ${isVisible ? 'animate-fadeInUp stagger-1' : 'opacity-0'}`}>
          {modes.map((mode, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border-2 border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-lg" data-hover>
              <div className="text-3xl mb-2">{mode.emoji}</div>
              <h3 className="font-bold text-sm mb-1">{mode.title}</h3>
              <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">{mode.desc}</p>
              <span className={`${mode.badge} text-[10px]`}>{mode.example}</span>
            </div>
          ))}
        </div>

        {/* Workflow + Pillars */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* LEFT: Workflow */}
          <div className={`${isVisible ? 'animate-fadeInLeft stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.activity className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Flux d{"'"}une transaction</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              {[
                { step: '1', label: 'Publication annonce', status: 'DISPONIBLE' },
                { step: '2', label: 'Réservation', status: 'RÉSERVÉE' },
                { step: '3', label: 'Blocage caution Wallet', status: 'Wallet' },
                { step: '4', label: 'Génération contrat PDF', status: 'PDF' },
                { step: '5', label: 'Retrait (Scan QR)', status: 'EN COURS' },
                { step: '6', label: 'Retour (Scan QR)', status: 'TERMINÉE' },
                { step: '7', label: 'Déblocage caution', status: '✅' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-xs text-gray-700 flex-1">{item.label}</span>
                  <span className="badge-neutral text-[9px]">{item.status}</span>
                  {i < 6 && <div className="absolute ml-3 mt-8 h-3 w-px bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Pillars */}
          <div className={`${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.layers className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">4 Piliers de la solution</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pillars.map((p, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300" data-hover>
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center mb-2">
                    {p.icon}
                  </div>
                  <h4 className="font-semibold text-xs mb-1">{p.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Score LBaraka */}
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Icons.award className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-xs">Score LBaraka — Gamification</span>
              </div>
              <div className="flex items-center gap-2">
                {['🥉 Bronze', '🥈 Argent', '🥇 Or', '🏆 Légende'].map((tier, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-white border border-gray-200 text-[9px] font-medium">
                    {tier}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div className={`mt-4 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Proposition de valeur</p>
            <p className="text-xs text-white/60">LBaraka transforme la solidarité de quartier en un écosystème digital sécurisé avec traçabilité complète.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
