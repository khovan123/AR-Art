"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Palette = {
  base: string;
  accent: string;
  glow: string;
};

const PALETTES: Palette[] = [
  { base: "#090711", accent: "#6d28d9", glow: "#67e8f9" },
  { base: "#10060d", accent: "#be185d", glow: "#fb7185" },
  { base: "#041015", accent: "#0f766e", glow: "#a78bfa" },
];

function createArtworkTexture(palette: Palette, variant: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 960;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const background = context.createLinearGradient(0, 0, 768, 960);
  background.addColorStop(0, palette.base);
  background.addColorStop(0.5, palette.accent);
  background.addColorStop(1, palette.base);
  context.fillStyle = background;
  context.fillRect(0, 0, 768, 960);

  const radial = context.createRadialGradient(
    350 + variant * 30,
    380 - variant * 26,
    30,
    390,
    440,
    360,
  );
  radial.addColorStop(0, palette.glow);
  radial.addColorStop(0.28, palette.accent);
  radial.addColorStop(1, "rgba(0,0,0,0)");
  context.globalAlpha = 0.82;
  context.fillStyle = radial;
  context.fillRect(0, 0, 768, 960);

  context.globalAlpha = 0.62;
  context.strokeStyle = "rgba(255,255,255,0.72)";
  context.lineWidth = 5;
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    context.ellipse(
      384 + Math.sin(index + variant) * 50,
      430 + Math.cos(index * 1.1 + variant) * 65,
      105 + index * 44,
      70 + index * 30,
      variant * 0.28 + index * 0.31,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }

  context.globalAlpha = 0.74;
  for (let index = 0; index < 14; index += 1) {
    const x = 80 + ((index * 121 + variant * 63) % 610);
    const y = 90 + ((index * 173 + variant * 97) % 760);
    const radius = 5 + ((index * 13) % 24);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = index % 2 === 0 ? palette.glow : "rgba(255,255,255,0.78)";
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addFrame(
  scene: THREE.Scene,
  palette: Palette,
  variant: number,
  position: THREE.Vector3,
  rotationY: number,
) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 4.2, 0.24),
    new THREE.MeshStandardMaterial({
      color: 0x14141a,
      metalness: 0.75,
      roughness: 0.19,
    }),
  );
  group.add(frame);

  const texture = createArtworkTexture(palette, variant);
  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(2.92, 3.78),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  artwork.position.z = 0.13;
  group.add(artwork);

  scene.add(group);
  return { group, texture };
}

export function ImmersiveGalleryShowcase() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030305);
    scene.fog = new THREE.FogExp2(0x030305, 0.055);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0.15, 8.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.28));

    const violetLight = new THREE.PointLight(0xa78bfa, 42, 22, 2);
    violetLight.position.set(-3.4, 3.3, 4.6);
    scene.add(violetLight);

    const cyanLight = new THREE.PointLight(0x67e8f9, 38, 20, 2);
    cyanLight.position.set(3.4, -1.8, 2.3);
    scene.add(cyanLight);

    const roseLight = new THREE.PointLight(0xfb7185, 24, 17, 2);
    roseLight.position.set(1.2, 2.8, -5.5);
    scene.add(roseLight);

    const frames = [
      addFrame(scene, PALETTES[0], 0, new THREE.Vector3(-2.25, 0.45, -1.4), 0.3),
      addFrame(scene, PALETTES[1], 1, new THREE.Vector3(2.2, -0.5, -5.9), -0.32),
      addFrame(scene, PALETTES[2], 2, new THREE.Vector3(-1.6, -0.25, -9.8), 0.24),
    ];
    const baseFrameY = frames.map(({ group }) => group.position.y);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.72, 0.19, 128, 20, 2, 5),
      new THREE.MeshPhysicalMaterial({
        color: 0xd8b4fe,
        emissive: 0x4c1d95,
        emissiveIntensity: 1.45,
        metalness: 0.5,
        roughness: 0.16,
        clearcoat: 1,
      }),
    );
    knot.position.set(2.05, 1.1, -2.3);
    scene.add(knot);

    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.88, 2),
      new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        emissive: 0x0f766e,
        emissiveIntensity: 1.2,
        metalness: 0.66,
        roughness: 0.16,
      }),
    );
    ico.position.set(-2.25, 1.05, -7.2);
    scene.add(ico);

    const particleCount = window.innerWidth < 768 ? 260 : 520;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 14;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[index * 3 + 2] = 4 - Math.random() * 20;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd8d9ff,
      size: 0.025,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
    };

    const handlePointerLeave = () => {
      targetPointer.set(0, 0);
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      pointer.lerp(targetPointer, 0.035);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.42, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.15 + pointer.y * 0.28, 0.05);
      camera.lookAt(pointer.x * 0.18, pointer.y * 0.1, -3.8);

      if (!reducedMotion) {
        frames.forEach(({ group }, index) => {
          group.position.y = baseFrameY[index] + Math.sin(time * 0.62 + index * 1.5) * 0.055;
          group.rotation.z = Math.sin(time * 0.18 + index) * 0.018;
        });
        knot.rotation.x = time * 0.14;
        knot.rotation.y = time * 0.22;
        ico.rotation.x = -time * 0.1;
        ico.rotation.y = time * 0.18;
        particles.rotation.y = time * 0.009;
        violetLight.position.x = -3.4 + Math.sin(time * 0.35) * 1.2;
        cyanLight.position.y = -1.8 + Math.cos(time * 0.3) * 0.9;
      }

      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    resize();
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);

      frames.forEach(({ group, texture }) => {
        texture.dispose();
        group.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        });
      });

      knot.geometry.dispose();
      if (Array.isArray(knot.material)) knot.material.forEach((material) => material.dispose());
      else knot.material.dispose();
      ico.geometry.dispose();
      if (Array.isArray(ico.material)) ico.material.forEach((material) => material.dispose());
      else ico.material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}
