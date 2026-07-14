import { useEffect, useRef, useState } from 'react'
import ImageCarousel from './ImageCarousel'
import './App.css'

const IMAGES_API_BASE =
  import.meta.env.VITE_IMAGES_API_BASE || 'https://img.wowa.studio'

const ROTATE_MS = 3800
const CHROME_VISIBLE_MS = 2200

function shuffle(arr) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ src })
    img.onerror = () => resolve({ src })
    img.src = src
  })
}

function App() {
  const [images, setImages] = useState([])
  const [hovered, setHovered] = useState(false)
  const [chromeHidden, setChromeHidden] = useState(true)
  const [showMagenta, setShowMagenta] = useState(true)

  const chromeRevealTimeoutRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${IMAGES_API_BASE}/api/images`)
        const data = await res.json()
        const urls = shuffle((data.images || []).map((i) => i.url))
        if (cancelled || urls.length === 0) return

        const first = await preload(urls[0])
        const rest = urls.slice(1)
        if (cancelled) return

        setImages([first, ...rest.map((src) => ({ src }))])
        rest.forEach(async (src, i) => {
          const loaded = await preload(src)
          setImages((current) => {
            const next = [...current]
            next[i + 1] = loaded
            return next
          })
        })
      } catch {
        // network/API hiccup: carousel just keeps showing its magenta slide
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function showChromeBriefly() {
      setChromeHidden(false)
      clearTimeout(chromeRevealTimeoutRef.current)
      chromeRevealTimeoutRef.current = setTimeout(() => {
        setChromeHidden(true)
      }, CHROME_VISIBLE_MS)
    }
    window.addEventListener('wheel', showChromeBriefly, { passive: true })
    window.addEventListener('touchstart', showChromeBriefly, { passive: true })
    window.addEventListener('touchmove', showChromeBriefly, { passive: true })
    return () => {
      window.removeEventListener('wheel', showChromeBriefly)
      window.removeEventListener('touchstart', showChromeBriefly)
      window.removeEventListener('touchmove', showChromeBriefly)
      clearTimeout(chromeRevealTimeoutRef.current)
    }
  }, [])

  return (
    <div className="page">
      <aside className="sidebar">
        <a href="/" className={`logo${chromeHidden ? ' chrome-hidden' : ''}`} aria-label="wowastudio — Home">
          <img className="logo-img" src="/wowa-logo.svg" alt="wowastudio" />
        </a>

        <footer className={`contact${chromeHidden ? ' chrome-hidden' : ''}`}>
          <a
            className="contact-row contact-icon-only"
            href="https://www.instagram.com/wowa_studio/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram: @wowa_studio"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </a>

          <a className="contact-row contact-icon-only" href="mailto:contact@wowa.studio" aria-label="Email: contact@wowa.studio">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <a className="contact-row contact-phone" href="tel:+306974929253" aria-label="Phone: +30 697 492 9253">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.5 3.5H8.5L10.5 8.5L8 10.5C9 13 11 15 13.5 16L15.5 13.5L20.5 15.5V19.5C20.5 20.6 19.6 21.5 18.5 21.5C10.5 21 3.5 14 3 6C3 4.9 3.9 3.5 4.5 3.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>+30 697 492 9253</span>
          </a>
        </footer>
      </aside>

      <main
        className={`stage${hovered ? ' stage-color' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        onTouchCancel={() => setHovered(false)}
      >
        <ImageCarousel
          images={images}
          rotateMs={ROTATE_MS}
          showMagenta={showMagenta}
          onMagentaPassed={() => setShowMagenta(false)}
        />
      </main>
    </div>
  )
}

export default App
