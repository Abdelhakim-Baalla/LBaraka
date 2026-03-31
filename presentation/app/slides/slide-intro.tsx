'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideIntro() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const features = [
    { icon: <Icons.smartphone className="w-4 h-4" />, title: 'React Native + Expo', desc: 'SDK 54 • Cross-platform' },
    { icon: <Icons.server className="w-4 h-4" />, title: 'NestJS Backend', desc: 'Modular Monolith • REST API' },
    { icon: <Icons.database className="w-4 h-4" />, title: 'PostgreSQL + MongoDB', desc: 'Dual Database • Prisma + Mongoose' },
    { icon: <Icons.shield className="w-4 h-4" />, title: 'Sécurité JWT', desc: 'Auth + Guards + Wallet' },
  ]

  return (
    <div className="slide bg-[#fafafa]">
      <div className="slide-content flex flex-col h-full py-6">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* LEFT: Title */}
          <div className={`lg:col-span-1 ${isVisible ? 'animate-fadeInLeft' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-medium tracking-wider uppercase mb-6">
              <Icons.award className="w-3 h-3" />
              PROJET DE FIN D{"'"}ANNÉE
            </div>
            <h1 className="text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.85] mb-2">
              <span className="block">LBaraka</span>
              <span className="block text-black/20 text-5xl lg:text-6xl mt-1">Solidaire</span>
            </h1>
            <div className="divider my-5" />
            <p className="text-subtitle text-sm max-w-sm">
              Plateforme mobile de prêt, don et location solidaire entre particuliers au Maroc.
            </p>
          </div>

          {/* CENTER: Visual */}
          <div className={`lg:col-span-1 flex items-center justify-center ${isVisible ? 'animate-scaleIn stagger-2' : 'opacity-0'}`}>
            <div className="relative w-64 h-64">
              {/* Concentric circles */}
              <div className="absolute inset-0 rounded-full border border-black/[0.05] shape-float" />
              <div className="absolute inset-4 rounded-full border border-black/[0.08] shape-float-reverse" />
              <div className="absolute inset-8 rounded-full border border-black/[0.1] shape-float" />
              <div className="absolute inset-12 rounded-full border border-black/[0.12] shape-float-reverse" />
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/30">
                  <Icons.heart className="w-10 h-10 text-white" />
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-2 right-0 px-3 py-1.5 bg-white rounded-full shadow-lg text-[10px] font-medium border border-gray-100 shape-float">
                🤝 Prêt
              </div>
              <div className="absolute bottom-4 -left-4 px-3 py-1.5 bg-white rounded-full shadow-lg text-[10px] font-medium border border-gray-100 shape-float-reverse">
                🎁 Don
              </div>
              <div className="absolute top-1/2 -right-6 px-3 py-1.5 bg-white rounded-full shadow-lg text-[10px] font-medium border border-gray-100 shape-float">
                💰 Location
              </div>
              <div className="absolute -bottom-2 right-8 px-3 py-1.5 bg-white rounded-full shadow-lg text-[10px] font-medium border border-gray-100 shape-float-reverse">
                🥗 Food Rescue
              </div>
            </div>
          </div>

          {/* RIGHT: Features + CTA */}
          <div className={`lg:col-span-1 ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="space-y-3 mb-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 transition-all duration-300" data-hover>
                  <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{f.title}</p>
                    <p className="text-[10px] text-gray-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="btn-primary text-xs flex items-center gap-2" data-hover>
                Découvrir le projet
                <Icons.arrowRight className="w-3 h-3" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
              <Icons.arrowRight className="w-3 h-3" /> pour naviguer
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className={`mt-auto pt-4 flex items-center justify-between text-[10px] text-gray-400 ${isVisible ? 'animate-fadeIn stagger-5' : 'opacity-0'}`}>
          <span>Abdelhakim Baalla • YouCode 2ème Année</span>
          <span>2024 — 2026</span>
        </div>
      </div>
    </div>
  )
}
