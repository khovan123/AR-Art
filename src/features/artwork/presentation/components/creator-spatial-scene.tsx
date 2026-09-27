"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CreatorSpatialScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.035);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    );
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const violet = new THREE.PointLight(0x8b5cf6, 44, 18, 2);
    violet.position.set(4.6, 2.2, 4.2);
    scene.add(violet);

    const cyan = new THREE.PointLight(0x22d3ee, 32, 16, 2);
    cyan.position.set(-4.8, -2.4, 2.4);
    scene.add(cyan);

    const rose = new THREE.PointLight(0xec4899, 22, 14, 2);
    rose.position.set(0.8, -3.2, -3);
    scene.add(rose);

    const rig = new THREE.Group();
    rig.position.set(2.8, 0.1, -2.2);
    scene.add(rig);

    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9f7aea,
      emissive: 0x34156f,
      emissiveIntensity: 1.7,
      metalness: 0.58,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.88,
    });

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.25, 0.22, 180, 26, 2, 5),
      shellMaterial,
    );
    rig.add(knot);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const rings = [
      new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.018, 12, 180), ringMaterial),
      new THREE.Mesh(
        new THREE.TorusGeometry(2.55, 0.012, 12, 180),
        ringMaterial.clone(),
      ),
      new THREE.Mesh(
        new THREE.TorusGeometry(3.05, 0.008, 10, 180),
        ringMaterial.clone(),
      ),
    ];

    rings[0].rotation.x = Math.PI * 0.28;
    rings[1].rotation.y = Math.PI * 0.38;
    rings[2].rotation.x = Math.PI * 0.54;
    rings.forEach((ring) => rig.add(ring));

    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      emissive: 0x155e75,
      emissiveIntensity: 1.15,
      metalness: 0.45,
      roughness: 0.18,
      transparent: true,
      opacity: 0.76,
    });

    const crystals: THREE.Mesh[] = [];
    for (let index = 0; index < 7; index += 1) {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16 + (index % 3) * 0.05, 0),
        crystalMaterial.clone(),
      );
      const angle = (index / 7) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * (2.45 + (index % 2) * 0.4),
        Math.sin(angle) * 1.7,
        Math.sin(angle * 1.7) * 0.8,
      );
      rig.add(mesh);
      crystals.push(mesh);
    }

    const particleCount = window.innerWidth < 768 ? 260 : 620;
    const positions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 18;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 11;
      positions[index * 3 + 2] = 4 - Math.random() * 20;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.025,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const targetPointer = new THREE.Vector2();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    let frameId = 0;

    const onPointerMove = (event: PointerEvent) => {
      targetPointer.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * -2,
      );
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      pointer.lerp(targetPointer, reduceMotion ? 0 : 0.035);
      const float = reduceMotion ? 0 : Math.sin(time * 0.75) * 0.16;

      rig.position.x = 2.8 + pointer.x * 0.42;
      rig.position.y = 0.1 + pointer.y * 0.28 + float;
      rig.rotation.x = reduceMotion ? 0.18 : time * 0.055 + pointer.y * 0.06;
      rig.rotation.y = reduceMotion ? -0.15 : time * 0.085 + pointer.x * 0.1;

      knot.rotation.x = reduceMotion ? 0.3 : time * 0.18;
      knot.rotation.y = reduceMotion ? 0.4 : time * 0.23;

      rings.forEach((ring, index) => {
        if (reduceMotion) return;
        ring.rotation.z = time * (index % 2 === 0 ? 0.12 : -0.09) + index;
      });

      crystals.forEach((crystal, index) => {
        if (reduceMotion) return;
        crystal.rotation.x = time * (0.35 + index * 0.03);
        crystal.rotation.y = time * (0.28 + index * 0.025);
      });

      if (!reduceMotion) {
        particles.rotation.y = time * 0.01;
        violet.position.x = 4.6 + Math.sin(time * 0.35) * 1.2;
        cyan.position.y = -2.4 + Math.cos(time * 0.3) * 0.9;
      }

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.16, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.1, 0.04);
      camera.lookAt(0.4, 0, -2.4);

      renderer.render(scene, camera);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize);
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);

      knot.geometry.dispose();
      shellMaterial.dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        const material = ring.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      });
      crystals.forEach((crystal) => {
        crystal.geometry.dispose();
        const material = crystal.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="creator-spatial-scene pointer-events-none fixed inset-0 z-0"
    />
  );
}
