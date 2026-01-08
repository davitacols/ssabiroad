"use client"

import { useEffect, useRef } from 'react'

export function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Dynamic import of Three.js
    import('three').then(({ Scene, PerspectiveCamera, WebGLRenderer, SphereGeometry, MeshPhongMaterial, Mesh, PointLight, AmbientLight, Vector3 }) => {
      const scene = new Scene()
      const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const renderer = new WebGLRenderer({ antialias: true, alpha: true })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0xffffff, 0)
      containerRef.current?.appendChild(renderer.domElement)

      // Create globe
      const geometry = new SphereGeometry(2, 64, 64)
      const material = new MeshPhongMaterial({
        color: 0x3b82f6,
        emissive: 0x1e40af,
        shininess: 100
      })
      const globe = new Mesh(geometry, material)
      scene.add(globe)

      // Lighting
      const light = new PointLight(0xffffff, 1)
      light.position.set(5, 3, 5)
      scene.add(light)

      const ambientLight = new AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      camera.position.z = 5

      // Animation
      const animate = () => {
        requestAnimationFrame(animate)
        globe.rotation.y += 0.001
        renderer.render(scene, camera)
      }

      // Handle resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', handleResize)
      animate()

      return () => {
        window.removeEventListener('resize', handleResize)
        renderer.dispose()
        containerRef.current?.removeChild(renderer.domElement)
      }
    })
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
