'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import Image from 'next/image'

export function SlideDiagrammes() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeModal, setActiveModal] = useState<number | null>(null)
  
  useEffect(() => { setIsVisible(true) }, [])

  const diagrams = [
    {
      id: 'classes',
      title: 'Diagramme de Classes',
      icon: <Icons.box className="w-8 h-8" />,
      image: '/classes.png',
      desc: 'Modèle de données relationnel structurant les Entités principales (Utilisateur, Annonce, Transaction, Portefeuille).',
      color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:shadow-lg hover:-translate-y-1',
    },
    {
      id: 'usecases',
      title: 'Diagramme Cas d\'Utilisation',
      icon: <Icons.users className="w-8 h-8" />,
      image: '/use-cases.jpg',
      desc: 'Interactions système entre les acteurs clés (Citoyen, Partenaire Relais, Administrateur).',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:shadow-lg hover:-translate-y-1',
    },
    {
      id: 'sequences',
      title: 'Diagramme de Séquence',
      icon: <Icons.activity className="w-8 h-8" />,
      image: '/sequences.png',
      desc: 'Workflow d\'une transaction de prêt avec scan QR Code, blocage de caution et orchestration temps réel.',
      color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:shadow-lg hover:-translate-y-1',
    },
    {
      id: 'deployment',
      title: 'Diagramme de Déploiement',
      icon: <Icons.server className="w-8 h-8" />,
      image: '/deployement.png',
      desc: 'Architecture d\'infrastructure physique montrant les conteneurs Docker (NestJS, Postgres, Mongo, MinIO, Redis).',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:shadow-lg hover:-translate-y-1',
    }
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              06 — Conception & Architecture
            </div>
            <h2 className={`text-4xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Diagrammes UML LBaraka
            </h2>
          </div>
          <div className={`px-4 py-2 bg-black text-white text-sm rounded-full font-medium shadow-md ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            🔍 Cliquez pour agrandir
          </div>
        </div>

        {/* Buttons Grid */}
        <div className={`grid grid-cols-2 gap-6 flex-1 ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
          {diagrams.map((diag, i) => (
            <button
              key={i}
              onClick={() => setActiveModal(i)}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${diag.color}`}
              data-hover
            >
              <div className="p-4 bg-white/60 rounded-full shadow-sm">
                {diag.icon}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{diag.title}</h3>
                <p className="text-xs text-black/60 font-medium px-4">{diag.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom Insight */}
        <div className={`mt-6 p-4 bg-black text-white rounded-xl flex items-center gap-4 shadow-xl ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold mb-1">Conception Robuste Avant Implémentation</p>
            <p className="text-xs text-white/70 leading-relaxed">
              Une modélisation logicielle systématique a permis de consolider la base de données relationnelle 
              (10 modèles Prisma intriqués), de clarifier les workflows métiers complexes et de définir l{"'"}infrastructure monorepo Dockerisée.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal Overlay */}
      {activeModal !== null && (
        <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-md flex flex-col animate-fadeIn">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl text-black">
                {diagrams[activeModal].icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{diagrams[activeModal].title}</h2>
                <p className="text-sm text-gray-500 mt-1">{diagrams[activeModal].desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveModal(null)}
              className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-colors flex items-center gap-2"
              data-hover
            >
              <Icons.x className="w-5 h-5" />
              Fermer
            </button>
          </div>

          {/* Modal Image Area */}
          <div className="flex-1 relative p-8 flex items-center justify-center bg-gray-50/50">
            <div className="relative w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <Image 
                src={diagrams[activeModal].image} 
                alt={diagrams[activeModal].title} 
                fill 
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


