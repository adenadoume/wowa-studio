import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const SLICES = 14

function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, size]
}

function computeFit(naturalW, naturalH, boxW, boxH, mode) {
  if (!naturalW || !naturalH || !boxW || !boxH) {
    return { bgW: boxW, bgH: boxH, offsetX: 0, offsetY: 0 }
  }
  const scale =
    mode === 'contain'
      ? Math.min(boxW / naturalW, boxH / naturalH)
      : Math.max(boxW / naturalW, boxH / naturalH)
  const bgW = naturalW * scale
  const bgH = naturalH * scale
  return {
    bgW,
    bgH,
    offsetX: (boxW - bgW) / 2,
    offsetY: (boxH - bgH) / 2,
  }
}

/**
 * Renders an image as N horizontal slices sharing one continuous background
 * canvas (computed cover/contain fit in real pixels), so slices line up into
 * a single seamless photo. When `animate` is true, GSAP staggers each slice
 * in with its own rotateX + depth — a barrel/cylinder unwrap rather than a
 * flat single-plane flip.
 */
export default function CylinderFrame({ image, animate, className = '' }) {
  const [containerRef, box] = useElementSize()
  const slicesRef = useRef([])
  const prevSrcRef = useRef(null)

  const fit = computeFit(image?.naturalW, image?.naturalH, box.w, box.h, image?.portrait ? 'contain' : 'cover')
  const sliceH = box.h / SLICES

  useLayoutEffect(() => {
    if (!animate || !image || !box.w || !box.h) return
    if (prevSrcRef.current === image.src) return
    prevSrcRef.current = image.src

    const els = slicesRef.current.filter(Boolean)
    if (els.length === 0) return

    gsap.fromTo(
      els,
      { rotateX: -95, z: -180, opacity: 0.25 },
      {
        rotateX: 0,
        z: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: { each: 0.045, from: 'start' },
      }
    )
  }, [animate, image, box.w, box.h])

  if (!image) return null

  return (
    <div ref={containerRef} className={`cylinder-frame ${className}`}>
      {Array.from({ length: SLICES }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (slicesRef.current[i] = el)}
          className="cylinder-slice"
          style={{
            top: `${i * sliceH}px`,
            height: `${sliceH}px`,
            backgroundImage: `url(${image.src})`,
            backgroundSize: `${fit.bgW}px ${fit.bgH}px`,
            backgroundPosition: `${fit.offsetX}px ${fit.offsetY - i * sliceH}px`,
          }}
        />
      ))}
    </div>
  )
}
