'use client';

import { useEffect, useRef, useState } from 'react';

interface ModelConfig {
  id: string;
  name: string;
  url: string;
  scale: number;
  scaleMobile: number;
  params: {
    eyeX: string;
    eyeY: string;
    angleX: string;
    angleY: string;
  };
}

const MODELS: ModelConfig[] = [
  {
    id: 'miku',
    name: '初音ミク',
    url: '/live2d/miku/miku.model3.json',
    scale: 0.15,
    scaleMobile: 0.08,
    params: { eyeX: 'PARAM_EYE_BALL_X', eyeY: 'PARAM_EYE_BALL_Y', angleX: 'PARAM_ANGLE_X', angleY: 'PARAM_ANGLE_Y' },
  },
  {
    id: 'hiyori',
    name: 'ひより',
    url: '/live2d/hiyori_pro_zh/hiyori_pro_t11.model3.json',
    scale: 0.10,
    scaleMobile: 0.05,
    params: { eyeX: 'ParamEyeBallX', eyeY: 'ParamEyeBallY', angleX: 'ParamAngleX', angleY: 'ParamAngleY' },
  },
];

const CUBISM_CORE_URL = '/live2d/live2dcubismcore.min.js';

export default function Live2DMiku() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const currentModelRef = useRef<ModelConfig>(MODELS[0]);

  const [currentModelId, setCurrentModelId] = useState<string>('miku');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const dragging = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const PROXIMITY = 200;
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let currentModel: any;
    let cancelled = false;

    async function start() {
      // Step 1: Ensure Cubism Core is available
      if (!(window as any).Live2DCubismCore) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = CUBISM_CORE_URL;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Cubism Core'));
          document.head.appendChild(script);
        });
      }

      if (cancelled) return;

      // Step 2: Init PIXI app once, reuse for model switches
      if (!appRef.current) {
        const PIXIModule = await import('pixi.js');
        const PIXI = PIXIModule.default || PIXIModule;
        (window as any).PIXI = PIXI;

        if (cancelled) return;

        const app = new PIXI.Application({
          view: canvas,
          width: 380,
          height: 500,
          backgroundAlpha: 0,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });
        appRef.current = app;
      }

      if (cancelled) return;

      // Step 3: Import Live2D module (Cubism Core is guaranteed available now)
      const { Live2DModel } = await import('pixi-live2d-display/cubism4');
      if (cancelled) return;

      // Step 4: Load model
      const config = MODELS.find((m) => m.id === currentModelId)!;
      currentModelRef.current = config;

      const isMobile = window.innerWidth < 600;
      const w = isMobile ? 180 : 380;
      const h = isMobile ? 240 : 500;

      const app = appRef.current;
      app.renderer.resize(w, h);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      currentModel = await Live2DModel.from(config.url);
      if (cancelled) {
        currentModel.destroy({ children: true, texture: true, baseTexture: true });
        return;
      }

      const scale = isMobile ? config.scaleMobile : config.scale;
      currentModel.scale.set(scale);
      currentModel.anchor.set(0.5, 0.5);
      currentModel.position.set(w / 2, h * 0.5);

      app.stage.addChild(currentModel);
      modelRef.current = currentModel;
      setLoading(false);

      setTimeout(() => {
        try { currentModel.motion('Idle'); } catch (_) {}
      }, 1000);

      container.addEventListener('click', () => {
        try { currentModel.motion('Tap'); } catch (_) {}
      });
    }

    setLoading(true);
    start().catch((e) => console.error('Live2D init failed:', e));

    return () => {
      cancelled = true;
      if (currentModel) {
        modelRef.current = null;
        currentModel.destroy({ children: true, texture: true, baseTexture: true });
      }
    };
  }, [currentModelId]);

  // Cleanup PIXI app on unmount
  useEffect(() => {
    return () => {
      const app = appRef.current;
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Eye tracking
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    const updateLoop = () => {
      const model = modelRef.current;
      const container = containerRef.current;
      if (model && container) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rangeX = Math.max(rect.width, 200);
        const rangeY = Math.max(rect.height, 200);
        const nx = Math.max(-1, Math.min(1, ((mousePosRef.current.x - centerX) / rangeX) * 2));
        const ny = Math.max(-1, Math.min(1, ((mousePosRef.current.y - centerY) / rangeY) * 2));

        const params = currentModelRef.current.params;
        try {
          const coreModel = model.internalModel?.coreModel;
          if (coreModel) {
            coreModel.setParameterValueById(params.eyeX, nx, 0.8);
            coreModel.setParameterValueById(params.eyeY, ny, 0.8);
            coreModel.setParameterValueById(params.angleX, nx * 15, 0.5);
            coreModel.setParameterValueById(params.angleY, ny * 15, 0.5);
          }
        } catch (_) {}
      }
      rafRef.current = requestAnimationFrame(updateLoop);
    };
    rafRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Proximity: show on mouse approach, hide after delay
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = Math.max(0, Math.abs(e.clientX - cx) - r.width / 2);
      const dy = Math.max(0, Math.abs(e.clientY - cy) - r.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PROXIMITY) {
        clearTimeout(hideTimerRef.current);
        if (!visible) setVisible(true);
      } else if (visible) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setVisible(false), 400);
      }
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(hideTimerRef.current);
    };
  }, [visible]);

  // Drag
  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.live2d-model-switcher')) return;
    dragging.current = true;
    const rect = containerRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const el = containerRef.current!;
    el.style.left = `${e.clientX - dragOffset.current.x}px`;
    el.style.top = `${e.clientY - dragOffset.current.y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const switchModel = (id: string) => {
    if (id === currentModelId) return;
    setCurrentModelId(id);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`live2d-miku${visible ? ' visible' : ''}`}
    >
      <div className="live2d-model-switcher">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={`live2d-switch-btn${m.id === currentModelId ? ' active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              switchModel(m.id);
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} className="live2d-miku-canvas" />
      {loading && <div className="live2d-loading" />}
      <div className="live2d-status">
        {loading ? '加载中...' : currentModelId === 'miku' ? '初音ミク' : 'ひより'}
      </div>
    </div>
  );
}
