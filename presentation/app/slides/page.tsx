'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { SlideIntro } from './slide-intro'
import { SlideSommaire } from './slide-sommaire'
import { SlideProblematique } from './slide-problematique'
import { SlideSolution } from './slide-solution'
import { SlidePlanification } from './slide-planification'
import { SlideTechnologies } from './slide-technologies'
import { SlideArchitecture } from './slide-architecture'
import { SlideDiagrammes } from './slide-diagrammes'
import { SlideFonctionnalites } from './slide-fonctionnalites'
import { SlideDemo } from './slide-demo'
import { SlideDevops } from './slide-devops'
import { SlideSecurite } from './slide-securite'
import { SlideConclusion } from './slide-conclusion'
import { SlideGitflow } from './slide-gitflow'

/* ====== CURSOR COMPONENT ====== */
function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const mousePos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }

      // Update dot immediately
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX - 3}px`
        dotRef.current.style.top = `${e.clientY - 3}px`
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement
      const isInteractive = target.closest('[data-hover], button, a')
      setIsHovering(!!isInteractive)
    }

    // Smooth ring follow
    let animationId: number
    const animateRing = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12

      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x - 20}px`
        ringRef.current.style.top = `${ringPos.current.y - 20}px`
      }

      // Trail particles
      trailRefs.current.forEach((trail, i) => {
        if (trail) {
          const delay = (i + 1) * 0.05
          const trailX = ringPos.current.x + (mousePos.current.x - ringPos.current.x) * (1 - delay)
          const trailY = ringPos.current.y + (mousePos.current.y - ringPos.current.y) * (1 - delay)
          trail.style.left = `${trailX - 2}px`
          trail.style.top = `${trailY - 2}px`
          trail.style.opacity = `${0.3 - i * 0.05}`
        }
      })

      animationId = requestAnimationFrame(animateRing)
    }
    animateRing()

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        className={`cursor-ring ${isHovering ? 'cursor-hover' : ''}`}
      />
      <div
        ref={dotRef}
        className={`cursor-dot ${isHovering ? 'cursor-hover' : ''}`}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el }}
          className="w-1 h-1 bg-black/20 rounded-full fixed pointer-events-none"
          style={{ zIndex: 9998 }}
        />
      ))}
    </>
  )
}

/* ====== FLOATING SHAPES ====== */
function Shapes() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * 0.02
      const y = (e.clientY - window.innerHeight / 2) * 0.02
      setOffset({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Large circle - top right */}
      <div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-black/[0.03] shape-float"
        style={{ transform: `translate(${offset.x * 2}px, ${offset.y * 2}px)` }}
      />
      {/* Medium circle - bottom left */}
      <div
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full border border-black/[0.04] shape-float-reverse"
        style={{ transform: `translate(${offset.x * 1.5}px, ${offset.y * 1.5}px)` }}
      />
      {/* Rotating square - top left */}
      <div
        className="absolute top-20 left-20 w-20 h-20 border border-black/[0.05] shape-rotate"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
      {/* Small circle - center right */}
      <div
        className="absolute top-1/2 right-20 w-12 h-12 rounded-full border border-black/[0.06] shape-float"
        style={{ transform: `translate(${offset.x * 3}px, ${offset.y * 3}px)` }}
      />
      {/* Diamond - bottom right */}
      <div
        className="absolute bottom-32 right-32 w-16 h-16 border border-black/[0.04] shape-rotate-slow"
        style={{ transform: `rotate(45deg) translate(${offset.x * 2}px, ${offset.y * 2}px)` }}
      />
      {/* Pulsing dots cluster */}
      <div className="absolute top-1/3 left-1/4">
        <div className="w-2 h-2 bg-black/[0.06] rounded-full shape-pulse" />
        <div className="w-3 h-3 bg-black/[0.08] rounded-full shape-pulse mt-2 ml-4" style={{ animationDelay: '1s' }} />
        <div className="w-2 h-2 bg-black/[0.06] rounded-full shape-pulse mt-1 ml-1" style={{ animationDelay: '2s' }} />
      </div>
      {/* Gradient line accents */}
      <div className="absolute top-1/4 right-1/3 w-40 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent shape-fade" />
      <div className="absolute bottom-1/3 left-1/3 w-32 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent shape-fade" style={{ animationDelay: '2s' }} />
      {/* Dot grid */}
      <div className="absolute bottom-1/4 right-1/4 grid grid-cols-3 gap-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-black/20 rounded-full shape-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  )
}

/* ====== PARTICLES ====== */
function Particles() {
  const [particles, setParticles] = useState<any[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 10,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-black/[0.08] animate-particle-float"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ====== MAIN SLIDES PAGE ====== */
export default function SlidesPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [transitionState, setTransitionState] = useState<'idle' | 'exit' | 'enter'>('idle')
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')
  const [showControls, setShowControls] = useState(true)
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null)

  const slides = [
    { component: <SlideIntro />, title: 'Introduction' },
    { component: <SlideSommaire />, title: 'Sommaire' },
    { component: <SlideProblematique />, title: 'Problématique' },
    { component: <SlideSolution />, title: 'Solution' },
    { component: <SlidePlanification />, title: 'Planification' },
    { component: <SlideGitflow />, title: 'GitFlow & CI' },
    { component: <SlideTechnologies />, title: 'Technologies' },
    { component: <SlideArchitecture />, title: 'Architecture' },
    { component: <SlideDiagrammes />, title: 'Diagrammes UML' },
    { component: <SlideFonctionnalites />, title: 'Fonctionnalités' },
    { component: <SlideDemo />, title: 'Interface Mobile' },
    { component: <SlideDevops />, title: 'DevOps & CI/CD' },
    { component: <SlideSecurite />, title: 'Sécurité' },
    { component: <SlideConclusion />, title: 'Conclusion' },
  ]

  const totalSlides = slides.length

  const navigateTo = useCallback((index: number, direction: 'next' | 'prev') => {
    if (transitionState !== 'idle') return
    if (index < 0 || index >= totalSlides) return

    setTransitionDirection(direction)
    setTransitionState('exit')

    setTimeout(() => {
      setCurrentSlide(index)
      setTransitionState('enter')
    }, 400)

    setTimeout(() => {
      setTransitionState('idle')
    }, 1000)
  }, [transitionState, totalSlides])

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      navigateTo(currentSlide + 1, 'next')
    }
  }, [currentSlide, totalSlides, navigateTo])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      navigateTo(currentSlide - 1, 'prev')
    }
  }, [currentSlide, navigateTo])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'ArrowDown':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          prevSlide()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen()
            setIsFullscreen(false)
          }
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, toggleFullscreen])

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true)
      return
    }

    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    handleMouseMove()
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [isFullscreen])

  // Transition class
  const getTransitionClass = () => {
    if (transitionState === 'exit') {
      return transitionDirection === 'next' ? 'slide-exit-left' : 'slide-exit-right'
    }
    if (transitionState === 'enter') {
      return transitionDirection === 'next' ? 'slide-enter-right' : 'slide-enter-left'
    }
    return 'slide-idle'
  }

  const progressWidth = ((currentSlide + 1) / totalSlides) * 100

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white cursor-none">
      {/* Background elements */}
      <Shapes />
      <Particles />
      <Cursor />

      {/* Progress bar */}
      <div
        className={`progress-track transition-all duration-300 ${
          isFullscreen && !showControls ? 'h-[2px] opacity-50' : 'h-1 opacity-100'
        }`}
      >
        <div className="progress-fill" style={{ width: `${progressWidth}%` }} />
      </div>

      {/* Slide container */}
      <div className={`relative z-10 ${getTransitionClass()}`}>
        {slides[currentSlide].component}
      </div>

      {/* Global Watermark (Hidden on Intro Slide) */}
      <div 
        className={`fixed top-8 left-8 z-[100] pointer-events-none transition-all duration-700 ${
          currentSlide === 0 || isFullscreen ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0 drop-shadow-sm'
        }`}
      >
        <Image 
          src="/logo-light.png" 
          alt="LBaraka" 
          width={180} 
          height={60} 
          className="object-contain"
        />
      </div>

      {/* Click zones for navigation */}
      <div className="fixed bottom-0 left-0 w-1/4 h-20 z-40 cursor-none" onClick={prevSlide} />
      <div className="fixed bottom-0 right-0 w-1/4 h-20 z-40 cursor-none" onClick={nextSlide} />

      {/* Bottom navigation */}
      <div
        className={`fixed bottom-6 left-0 right-0 z-50 flex items-center justify-center gap-8 transition-all duration-500 ${
          isFullscreen && !showControls ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Slide counter - left */}
        <div className="font-mono text-xs text-black/30">
          <span className="text-black/60 text-sm">
            {String(currentSlide + 1).padStart(2, '0')}
          </span>
          /{String(totalSlides).padStart(2, '0')}
        </div>

        {/* Dot navigation - center */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const direction = index > currentSlide ? 'next' : 'prev'
                navigateTo(index, direction)
              }}
              className={`rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 h-2 bg-black'
                  : index < currentSlide
                    ? 'w-2 h-2 bg-black/40 hover:bg-black/60'
                    : 'w-2 h-2 bg-black/20 hover:bg-black/40'
              }`}
              data-hover
              aria-label={`Slide ${index + 1}: ${slides[index].title}`}
            />
          ))}
        </div>

        {/* Fullscreen button - right */}
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
          data-hover
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>

      {/* Swipe hint - only on first slide */}
      {currentSlide === 0 && transitionState === 'idle' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 text-black/20 animate-bounce-subtle">
          <div className="w-6 h-px bg-black/20" />
          <span className="text-xs font-medium tracking-wider uppercase">→ pour naviguer</span>
          <div className="w-6 h-px bg-black/20" />
        </div>
      )}

      {/* Navigation arrows (visible on hover of sides) */}
      <button
        onClick={prevSlide}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300 ${
          currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 hover:opacity-100'
        } ${isFullscreen && !showControls ? 'hidden' : ''}`}
        data-hover
        aria-label="Previous slide"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all duration-300 ${
          currentSlide === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 hover:opacity-100'
        } ${isFullscreen && !showControls ? 'hidden' : ''}`}
        data-hover
        aria-label="Next slide"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
