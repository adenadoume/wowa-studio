import { useEffect, useRef, useState } from 'react'
import './App.css'

const IMAGES_API_BASE =
  import.meta.env.VITE_IMAGES_API_BASE || 'https://img.wowa.studio'

const NORMAL_MS = 3800
const FAST_MS = 900
const SCROLL_BOOST_MS = 1400
const MIN_PLACEHOLDER_MS = 900

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => resolve(src)
    img.src = src
  })
}

function App() {
  const [images, setImages] = useState([])
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const fastUntilRef = useRef(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const bootedAt = Date.now()
      try {
        const res = await fetch(`${IMAGES_API_BASE}/api/images`)
        const data = await res.json()
        const urls = (data.images || []).map((i) => i.url)
        if (cancelled || urls.length === 0) return

        await preload(urls[0])
        if (urls[1]) preload(urls[1])

        const elapsed = Date.now() - bootedAt
        const wait = Math.max(0, MIN_PLACEHOLDER_MS - elapsed)
        setTimeout(() => {
          if (cancelled) return
          setImages(urls)
          setStarted(true)
          urls.slice(2).forEach(preload)
        }, wait)
      } catch {
        // network/API hiccup: keep the magenta placeholder rather than a broken layout
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!started || images.length < 2) return
    let cancelled = false

    function scheduleNext() {
      const ms = Date.now() < fastUntilRef.current ? FAST_MS : NORMAL_MS
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return
        setIndex((current) => {
          setPrevIndex(current)
          return (current + 1) % images.length
        })
        scheduleNext()
      }, ms)
    }

    scheduleNext()
    return () => {
      cancelled = true
      clearTimeout(timeoutRef.current)
    }
  }, [started, images.length])

  useEffect(() => {
    function boost() {
      fastUntilRef.current = Date.now() + SCROLL_BOOST_MS
      setHasScrolled(true)
    }
    window.addEventListener('wheel', boost, { passive: true })
    window.addEventListener('touchmove', boost, { passive: true })
    return () => {
      window.removeEventListener('wheel', boost)
      window.removeEventListener('touchmove', boost)
    }
  }, [])

  return (
    <div className="page">
      <aside className="sidebar">
        <header className="logo">
          <span className="logo-bold">wow</span>
          <span className="logo-bold logo-accent">a</span>
          <span className="logo-light">studio</span>
        </header>

        <footer className="contact">
          <a
            className="contact-row"
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
            <span>@wowa_studio</span>
          </a>

          <a className="contact-row" href="mailto:christovasilis@gmail.com" aria-label="Email">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <path d="M3.5 6L12 13L20.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>christovasilis@gmail.com</span>
          </a>

          <a className="contact-row" href="tel:+306974929253" aria-label="Phone">
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
      >
        {started && prevIndex !== null && (
          <img className="frame frame-under" src={images[prevIndex]} alt="" />
        )}
        {started && (
          <img key={index} className="frame frame-fade" src={images[index]} alt="" />
        )}

        <div className={`scroll-cue${hasScrolled ? ' scroll-cue-hidden' : ''}`}>
          <span className="scroll-cue-icon" />
          <span className="scroll-cue-label">scroll</span>
        </div>
      </main>
    </div>
  )
}

export default App
