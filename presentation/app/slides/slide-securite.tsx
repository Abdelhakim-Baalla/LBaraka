'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'

export function SlideSecurite() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const securityLayers = [
    {
      title: 'Authentification JWT',
      icon: <Icons.lock className="w-4 h-4" />,
      items: [
        'Hashing bcrypt des mots de passe',
        'Tokens JWT signés (7 jours)',
        'Passport Strategy customisée',
        'Guards sur toutes les routes protégées',
      ],
      color: 'bg-red-50 border-red-100'
    },
    {
      title: 'Wallet & Caution',
      icon: <Icons.creditCard className="w-4 h-4" />,
      items: [
        'Blocage automatique du montant caution',
        'Vérification solde avant réservation',
        'Transactions atomiques Prisma ($transaction)',
        'Déblocage uniquement après retour confirmé',
      ],
      color: 'bg-blue-50 border-blue-100'
    },
    {
      title: 'Traçabilité QR Code',
      icon: <Icons.qrCode className="w-4 h-4" />,
      items: [
        'QR unique par transaction (UUID token)',
        'Usage unique (isQrUsed flag)',
        'Double scan : réception + retour',
        'Validation en Point Relais physique',
      ],
      color: 'bg-emerald-50 border-emerald-100'
    },
  ]

  const validationRules = [
    { dto: 'CreateAnnonceDto', rules: ['@IsString titre', '@IsEnum mode (3)', '@IsEnum categorie (6)', '@IsOptional prixSymbolique', '@IsArray photos (max 3)'] },
    { dto: 'RegisterDto', rules: ['@IsEmail email', '@IsString motDePasse (min 6)', '@IsString telephone', '@Matches regex téléphone'] },
    { dto: 'CreateTransactionDto', rules: ['@IsUUID annonceId', '@IsUUID emprunteurId', '@IsOptional pointRelaisId'] },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              08 — Sécurité & Validation
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Couches de sécurité
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-full border border-red-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            🔒 Multi-layer Security
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* Security layers */}
          {securityLayers.map((layer, i) => (
            <div key={i} className={`flex flex-col ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
              <div className={`p-4 rounded-xl border ${layer.color} flex-1`} data-hover>
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center mb-3">
                  {layer.icon}
                </div>
                <h3 className="font-bold text-sm mb-3">{layer.title}</h3>
                <div className="space-y-2">
                  {layer.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-[11px] text-gray-600">
                      <Icons.check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Validation DTOs */}
        <div className={`mt-4 ${isVisible ? 'animate-fadeInUp stagger-4' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center">
              <Icons.shield className="w-3 h-3 text-purple-500" />
            </div>
            <h3 className="font-semibold text-xs">Validation DTO (class-validator) — Exemples</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {validationRules.map((dto, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="font-mono text-[10px] font-bold mb-1.5">{dto.dto}</p>
                <div className="space-y-1">
                  {dto.rules.map((rule, j) => (
                    <p key={j} className="text-[9px] font-mono text-gray-500">{rule}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-3 p-3 bg-black text-white rounded-xl flex items-center gap-4 ${isVisible ? 'animate-fadeInUp stagger-5' : 'opacity-0'}`}>
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icons.lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5">Défense en profondeur</p>
            <p className="text-xs text-white/60">JWT → Guards → DTOs (class-validator) → Service Exceptions → Prisma constraints → PostgreSQL unique indexes.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
