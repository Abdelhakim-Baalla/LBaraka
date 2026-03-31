'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideProblematique() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const stats = [
    { value: '30%', label: 'des objets achetés ne sont utilisés qu\'une seule fois', icon: <Icons.package className="w-4 h-4" /> },
    { value: '1/3', label: 'de la nourriture produite est gaspillée chaque année', icon: <Icons.truck className="w-4 h-4" /> },
    { value: '68%', label: 'des Marocains n\'ont pas les moyens d\'acheter du matériel neuf', icon: <Icons.users className="w-4 h-4" /> },
  ]

  const problems = [
    { title: 'Surconsommation', desc: 'Achat d\'objets coûteux utilisés rarement (poussettes, outillage, matériel médical)', color: 'bg-red-50 border-red-100', textColor: 'text-red-600' },
    { title: 'Gaspillage alimentaire', desc: 'Des tonnes de nourriture jetées quotidiennement par les restaurants et particuliers', color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-600' },
    { title: 'Manque de confiance', desc: 'Pas de système de garantie pour prêter ou emprunter entre inconnus', color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-600' },
    { title: 'Absence de digitalisation', desc: 'Pas de plateforme mobile dédiée au partage solidaire au Maroc', color: 'bg-purple-50 border-purple-100', textColor: 'text-purple-600' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              01 — Problématique
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Le constat alarmant
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            ⚠️ Urgence sociale
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT: Stats */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                <Icons.barChart className="w-3 h-3 text-red-500" />
              </div>
              <h3 className="font-semibold text-sm">Chiffres Clés</h3>
            </div>
            <div className="space-y-3 flex-1">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                      {stat.icon}
                    </div>
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Visual */}
          <div className={`flex flex-col items-center justify-center ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
            <div className="relative w-full max-w-xs">
              {/* Cycle diagram */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 text-center shadow-lg">
                <div className="w-16 h-16 mx-auto rounded-full bg-black flex items-center justify-center mb-4">
                  <Icons.refresh className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-sm mb-2">Cycle vicieux</h4>
                <div className="space-y-2">
                  {['Acheter neuf → Utiliser 1x', 'Stoker / Jeter', 'Gaspillage de ressources', 'Impact écologique négatif'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating question */}
              <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-black text-white rounded-xl text-xs font-medium shadow-lg">
                Comment résoudre ça ? 🤔
              </div>
            </div>
          </div>

          {/* RIGHT: Problems */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.alertTriangle className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Problèmes identifiés</h3>
            </div>
            <div className="space-y-2 flex-1">
              {problems.map((p, i) => (
                <div key={i} className={`p-3 rounded-lg border ${p.color}`}>
                  <p className={`font-medium text-xs mb-1 ${p.textColor}`}>{p.title}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{p.desc}</p>
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
            <p className="text-xs font-medium mb-0.5">Question centrale</p>
            <p className="text-xs text-white/60">Comment créer un écosystème de confiance pour le partage solidaire entre citoyens marocains ?</p>
          </div>
        </div>
      </div>
    </div>
  )
}
