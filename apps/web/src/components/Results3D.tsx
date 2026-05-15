'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

type Item = { label: string; value: number };

function Bars({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const spacing = 1.4;

  return (
    <group position={[-((items.length - 1) * spacing) / 2, 0, 0]}>
      {items.map((item, idx) => {
        const h = (item.value / max) * 3 + 0.05;
        return (
          <mesh key={idx} position={[idx * spacing, h / 2, 0]}>
            <boxGeometry args={[1, h, 1]} />
            <meshStandardMaterial color="#6750A4" />
          </mesh>
        );
      })}
    </group>
  );
}

export function Results3D({ items }: { items: Item[] }) {
  return (
    <Canvas style={{ height: 360, width: '100%' }} camera={{ position: [0, 3, 7], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <gridHelper args={[12, 12]} />
      <Bars items={items} />
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}

