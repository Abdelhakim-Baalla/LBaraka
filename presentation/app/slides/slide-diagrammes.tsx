'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideDiagrammes() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  // Class diagram entities
  const entities = [
    {
      name: 'User',
      fields: ['id: UUID', 'email: String', 'motDePasseHash: String', 'telephone: String', 'role: RoleUtilisateur'],
      relations: ['1:1 Profil', '1:N Annonce', '1:1 Portefeuille', '1:N Transaction'],
      color: 'border-blue-200 bg-blue-50',
    },
    {
      name: 'Annonce',
      fields: ['titre: String', 'mode: ModeEchange', 'categorie: CategorieAnnonce', 'statut: StatutAnnonce', 'photos: String[]'],
      relations: ['N:1 User', '1:N Transaction'],
      color: 'border-emerald-200 bg-emerald-50',
    },
    {
      name: 'Transaction',
      fields: ['statut: StatutTransaction', 'qrCodeReception: String', 'qrCodeRetour: String', 'montantCautionBloquee: Decimal'],
      relations: ['N:1 Annonce', 'N:1 User(Prêteur)', 'N:1 User(Emprunteur)', '1:1 Contrat'],
      color: 'border-amber-200 bg-amber-50',
    },
    {
      name: 'Portefeuille',
      fields: ['soldeReel: Decimal', 'soldeBloque: Decimal', 'devise: MAD'],
      relations: ['1:1 User', '1:N MouvementWallet'],
      color: 'border-purple-200 bg-purple-50',
    },
  ]

  // Use case actors
  const useCases = [
    {
      actor: '👤 Citoyen',
      cases: ['S\'inscrire / Se connecter', 'Créer une annonce (Don/Prêt/Location)', 'Réserver un objet', 'Scanner QR Code (Retrait/Retour)', 'Consulter son Wallet', 'Chatter avec le prêteur', 'Sauver un panier alimentaire'],
    },
    {
      actor: '🏪 Partenaire',
      cases: ['Gérer le Point Relais', 'Valider les retraits/retours', 'Scanner les QR Codes'],
    },
    {
      actor: '👑 Admin',
      cases: ['Dashboard statistiques', 'Gérer les utilisateurs (Ban/Upgrade)', 'Gérer les annonces', 'Voir les transactions/litiges'],
    },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              05 — Conception UML
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Diagrammes de conception
            </h2>
          </div>
          <div className={`flex gap-2 ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            <span className="badge-info text-[9px]">Diagramme de Classes</span>
            <span className="badge-warning text-[9px]">Cas d{"'"}Utilisation</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* LEFT: Class Diagram */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.grid className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Diagramme de Classes (simplifié)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {entities.map((entity, i) => (
                <div key={i} className={`p-3 rounded-xl border-2 ${entity.color}`} data-hover>
                  <h4 className="font-bold text-xs mb-2 flex items-center gap-1">
                    <Icons.box className="w-3 h-3" />
                    {entity.name}
                  </h4>
                  <div className="space-y-0.5 mb-2">
                    {entity.fields.map((f, j) => (
                      <p key={j} className="text-[9px] font-mono text-gray-600">
                        {f}
                      </p>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-1.5">
                    {entity.relations.map((r, j) => (
                      <p key={j} className="text-[8px] text-gray-400 flex items-center gap-1">
                        <Icons.link className="w-2 h-2" /> {r}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Additional entities */}
            <div className="mt-2 flex gap-2">
              {['Contrat', 'PointRelais', 'MouvementWallet', 'Notification', 'Profil'].map((name, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-md text-[8px] font-medium text-gray-500 border border-gray-200">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT: Use Case Diagram */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.users className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Diagramme de Cas d{"'"}Utilisation</h3>
            </div>
            <div className="space-y-3 flex-1">
              {useCases.map((uc, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300" data-hover>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{uc.actor.split(' ')[0]}</span>
                    <h4 className="font-semibold text-xs">{uc.actor.split(' ').slice(1).join(' ')}</h4>
                    <span className="badge-neutral text-[8px] ml-auto">{uc.cases.length} cas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {uc.cases.map((c, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[9px] text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-black/20 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Enums reference */}
            <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-semibold mb-2">Enums du système (Prisma)</p>
              <div className="flex flex-wrap gap-1">
                {['RoleUtilisateur (6)', 'ModeEchange (3)', 'StatutTransaction (6)', 'StatutAnnonce (4)', 'NiveauTier (4)', 'TypeBadge (7)', 'CategorieAnnonce (6)', 'TypeRelais (3)'].map((e, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white rounded text-[8px] font-mono border border-gray-200 text-gray-600">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-3 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">10 modèles Prisma + 8 Enums</p>
            <p className="text-xs text-white/60">Le schéma Prisma gère 252 lignes de modèles avec relations complexes N:N via Transaction intermédiaire.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
