'use client'
import { useEffect, useState } from 'react'
import { Icons } from './icons'
import { SyntaxHighlighter } from './syntax-highlighter'

export function SlideDevops() {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { setIsVisible(true) }, [])

  const dockerCode = `# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: lbaraka
  
  mongo:
    image: mongo:5.0
    ports: ["27017:27017"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
    command: server /data
  
  backend:
    build: ./backend
    ports: ["3000:3000"]
    depends_on: [postgres, mongo, minio]`

  const ciSteps = [
    { name: 'Checkout', icon: '📥', desc: 'actions/checkout@v4' },
    { name: 'Setup Node.js 20', icon: '📦', desc: 'actions/setup-node@v4' },
    { name: 'Install deps', icon: '📋', desc: 'npm install --legacy-peer-deps' },
    { name: 'Prisma Generate', icon: '🔧', desc: 'npx prisma generate' },
    { name: 'Unit Tests', icon: '🧪', desc: 'npm run test (Jest)' },
    { name: 'Build', icon: '🏗️', desc: 'npm run build' },
    { name: 'Docker Build', icon: '🐳', desc: 'docker compose build' },
    { name: 'EAS Build', icon: '📱', desc: 'eas build --platform android' },
  ]

  return (
    <div className="slide">
      <div className="slide-content flex flex-col h-full py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className={`slide-badge mb-2 ${isVisible ? 'animate-fadeInDown' : 'opacity-0'}`}>
              07 — DevOps & CI/CD
            </div>
            <h2 className={`text-3xl font-bold tracking-tight ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              Infrastructure & Déploiement
            </h2>
          </div>
          <div className={`px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200 font-medium ${isVisible ? 'animate-fadeIn' : 'opacity-0'}`}>
            🐳 Docker + GitHub Actions
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1">
          {/* LEFT: Docker Compose */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInLeft stagger-1' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                <Icons.box className="w-3 h-3 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm">Docker Compose</h3>
            </div>
            <div className="code-window flex-1 flex flex-col">
              <div className="code-header py-2">
                <div className="code-dot red" />
                <div className="code-dot yellow" />
                <div className="code-dot green" />
                <span className="code-title">docker-compose.yml</span>
              </div>
              <div className="code-body !p-3 flex-1 !text-[9px] !leading-relaxed">
                <SyntaxHighlighter code={dockerCode} />
              </div>
            </div>
          </div>

          {/* CENTER: CI/CD Pipeline */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInUp stagger-2' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Icons.gitBranch className="w-3 h-3 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-sm">Pipeline CI/CD</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex-1">
              <p className="text-[10px] font-medium text-gray-600 mb-2">GitHub Actions — ci.yml</p>
              <div className="space-y-1.5">
                {ciSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-100">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm">{step.icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-medium">{step.name}</p>
                      <p className="text-[8px] text-gray-400 font-mono">{step.desc}</p>
                    </div>
                    <Icons.check className="w-3 h-3 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Architecture diagram */}
          <div className={`flex flex-col ${isVisible ? 'animate-fadeInRight stagger-3' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Icons.layout className="w-3 h-3 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm">Architecture globale</h3>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 flex-1 flex flex-col justify-center">
              {/* Architecture layers */}
              <div className="space-y-3">
                {/* Client layer */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-700">📱 Client Mobile</p>
                  <p className="text-[8px] text-emerald-600">React Native + Expo SDK 54</p>
                </div>

                <div className="flex justify-center">
                  <Icons.arrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                </div>

                {/* API layer */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                  <p className="text-[10px] font-bold text-blue-700">⚡ API REST + WebSocket</p>
                  <p className="text-[8px] text-blue-600">NestJS v11 (Port 3000)</p>
                </div>

                <div className="flex justify-center">
                  <Icons.arrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                </div>

                {/* Data layer */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-center">
                    <p className="text-[9px] font-bold text-purple-700">🐘 PostgreSQL</p>
                    <p className="text-[7px] text-purple-600">Prisma ORM</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 border border-green-100 text-center">
                    <p className="text-[9px] font-bold text-green-700">🍃 MongoDB</p>
                    <p className="text-[7px] text-green-600">Mongoose ODM</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-center">
                    <p className="text-[9px] font-bold text-red-700">⚡ Redis</p>
                    <p className="text-[7px] text-red-600">Cache</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-center">
                    <p className="text-[9px] font-bold text-amber-700">📁 MinIO</p>
                    <p className="text-[7px] text-amber-600">S3 Storage</p>
                  </div>
                </div>
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
            <p className="text-xs font-medium mb-0.5">Infrastructure as Code</p>
            <p className="text-xs text-white/60">5 services Docker + pipeline CI/CD automatisé sur chaque push vers main (Tests → Build → Docker → APK EAS).</p>
          </div>
        </div>
      </div>
    </div>
  )
}
