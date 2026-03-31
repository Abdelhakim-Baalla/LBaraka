import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-[12rem] font-bold leading-none text-gray-100 select-none">404</h1>
        <h2 className="text-2xl font-bold -mt-8 mb-2">Page introuvable</h2>
        <p className="text-gray-500 text-sm mb-8">
          {"La page que vous cherchez n'existe pas."}
        </p>
        <Link href="/slides" className="btn-primary" data-hover>
          Retour à la présentation
        </Link>
      </div>
    </div>
  )
}
