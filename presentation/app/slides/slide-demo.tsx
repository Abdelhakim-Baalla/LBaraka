'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideDemo() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const screens = [
    { name: 'Accueil', desc: 'Liste des annonces + filtres catégories + barre de recherche', route: '(tabs)/home.tsx', features: ['34K lignes', 'Filtres dynamiques', 'Pull to refresh'] },
    { name: 'Transactions', desc: 'Suivi des emprunts/prêts avec machine à statuts visuelle', route: '(tabs)/transactions.tsx', features: ['48K lignes', 'State machine UI', 'QR Scanner'] },
    { name: 'Wallet', desc: 'Solde réel/bloqué, historique mouvements, dépôt/retrait', route: '(tabs)/wallet.tsx', features: ['26K lignes', 'Graphiques', 'Animations'] },
    { name: 'Chat', desc: 'Messagerie temps réel Socket.io avec l\'offreur', route: '(tabs)/chat.tsx', features: ['27K lignes', 'Temps réel', 'Notes vocales'] },
    { name: 'Profil', desc: 'Score LBaraka, badges, palier, édition profil', route: '(tabs)/profile.tsx', features: ['10K lignes', 'Gamification', 'Avatar'] },
    { name: 'Carte', desc: 'Localisation des Points Relais sur carte interactive', route: '(tabs)/map.tsx', features: ['12K lignes', 'React Native Maps', 'Géoloc'] },
    { name: 'Food Rescue', desc: 'Paniers alimentaires à sauver (anti-gaspillage)', route: '(tabs)/food-rescue.tsx', features: ['5K lignes', 'Timer expiration', 'Solidaire'] },
    { name: 'Onboarding', desc: 'Écran d\'accueil avec tutoriel et inscription', route: 'onboarding.tsx', features: ['4K lignes', 'Animations', 'Swipe'] },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              07 — Interface Mobile
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Écrans de l{"'"}application
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full border border-emerald-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            📱 Expo SDK 54
          </div>
        </div>

        {/* Screen grid */}
        <div className="grid grid-cols-4 gap-3 flex-1">
          {screens.map((screen, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              data-hover
            >
              {/* Phone mockup */}
              <div className="bg-gray-900 rounded-lg p-2 mb-3 aspect-[9/14] flex flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[6px] text-gray-500">9:41</span>
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  </div>
                </div>
                {/* Screen content area */}
                <div className="flex-1 bg-gray-800 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-[10px] font-bold mb-1">{screen.name}</p>
                    <div className="flex justify-center gap-1">
                      {screen.features.slice(0, 2).map((f, j) => (
                        <span key={j} className="px-1 py-0.5 bg-gray-700 rounded text-[6px] text-gray-400">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Home indicator */}
                <div className="flex justify-center mt-1">
                  <div className="w-8 h-0.5 rounded-full bg-gray-600" />
                </div>
              </div>

              {/* Info */}
              <h4 className="font-bold text-xs mb-0.5">{screen.name}</h4>
              <p className="text-[9px] text-gray-500 leading-relaxed flex-1">{screen.desc}</p>
              <div className="mt-2">
                <span className="font-mono text-[8px] text-gray-400">{screen.route}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tech bar */}
        <div className={`mt-3 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-6' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Stack mobile</p>
            <p className="text-xs text-white/60">Expo Router (file-based routing) + NativeWind (TailwindCSS) + Dark Mode élégant. API Fetch native avec intercepteur Android/Web.</p>
          </div>
          <div className="flex gap-2">
            {['Expo Router', 'NativeWind', 'Reanimated'].map((tech, i) => (
              <span key={i} className="px-2 py-1 bg-white/10 rounded-md text-[9px]">{tech}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
