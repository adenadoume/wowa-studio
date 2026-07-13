import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const THETA_LENGTH = (68 * Math.PI) / 180
const ROTATE_OUT = -THETA_LENGTH
const ROTATE_IN_START = THETA_LENGTH
const ROTATE_DURATION = 1.15

function computeCoverUV(naturalW, naturalH, arcLength, height) {
  const unwrappedAspect = arcLength / height
  const imgAspect = (naturalW || 1) / (naturalH || 1)
  if (imgAspect > unwrappedAspect) {
    const rx = unwrappedAspect / imgAspect
    return { rx, ry: 1, ox: (1 - rx) / 2, oy: 0 }
  }
  const ry = imgAspect / unwrappedAspect
  return { rx: 1, ry, ox: 0, oy: (1 - ry) / 2 }
}

/**
 * One arc-shaped slice of a vertical-axis cylinder, textured with a single
 * image (cover-fit in real pixels from the image's natural size). Rotating
 * this arc around Y sweeps it into or out of the camera-facing position.
 */
function ArcMesh({ image, radius, height, entering, onDone }) {
  const meshRef = useRef(null)

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const tex = loader.load(image.src)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }, [image.src])

  useEffect(() => {
    const arcLength = radius * THETA_LENGTH
    const { rx, ry, ox, oy } = computeCoverUV(image.naturalW, image.naturalH, arcLength, height)
    texture.repeat.set(rx, ry)
    texture.offset.set(ox, oy)
    texture.needsUpdate = true
  }, [texture, radius, height, image.naturalW, image.naturalH])

  useEffect(() => {
    if (!meshRef.current) return
    if (entering) {
      meshRef.current.rotation.y = ROTATE_IN_START
      gsap.to(meshRef.current.rotation, { y: 0, duration: ROTATE_DURATION, ease: 'power3.out' })
    } else {
      gsap.to(meshRef.current.rotation, {
        y: ROTATE_OUT,
        duration: ROTATE_DURATION,
        ease: 'power3.out',
        onComplete: onDone,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.src, entering])

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[radius, radius, height, 64, 1, true, -THETA_LENGTH / 2, THETA_LENGTH]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

function Scene({ current, prev, onPrevDone }) {
  const { size, camera } = useThree()
  const radius = size.width / (2 * Math.sin(THETA_LENGTH / 2))
  const height = size.height

  useEffect(() => {
    camera.left = -size.width / 2
    camera.right = size.width / 2
    camera.top = size.height / 2
    camera.bottom = -size.height / 2
    camera.position.set(0, 0, radius + 600)
    camera.near = 0.1
    camera.far = radius + 2000
    camera.updateProjectionMatrix()
  }, [camera, radius, size.width, size.height])

  return (
    <>
      {prev && (
        <ArcMesh key={`prev-${prev.src}`} image={prev} radius={radius} height={height} entering={false} onDone={onPrevDone} />
      )}
      {current && (
        <ArcMesh key={`cur-${current.src}`} image={current} radius={radius} height={height} entering />
      )}
    </>
  )
}

export default function CylinderStage({ current, prev, onPrevDone, className = '' }) {
  if (!current) return null
  return (
    <div className={`cylinder-canvas-wrap ${className}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 800], near: 0.1, far: 4000 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor('#fd3db6', 1)}
      >
        <Scene current={current} prev={prev} onPrevDone={onPrevDone} />
      </Canvas>
    </div>
  )
}
