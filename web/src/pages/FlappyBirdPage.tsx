import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { GamePage } from '../components/games/GamePage';
import { ResultBanner } from '../components/games/ResultBanner';
import type { ResultState } from '../components/games/ResultBanner';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';
import { apiService, getErrorMessage } from '../lib/api';
import { classNames } from '../lib/format';

const W = 360;
const H = 560;
const BIRD_X = 96;
const BIRD_R = 14;
const PIPE_W = 58;
const PIPE_GAP = 168;
const PIPE_SPACING = 210;
const GRAVITY = 0.42;
const JUMP = -7.2;
const SPEED = 2.4;

const TARGETS = [15, 30, 45, 60];

interface Pipe {
  x: number;
  gapY: number;
}

function draw(
  ctx: CanvasRenderingContext2D,
  bird: { y: number; vy: number },
  pipes: Pipe[],
  flash: boolean
) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#e6fbf2');
  sky.addColorStop(1, '#f8fafc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d1fae5';
  for (let index = 0; index < 5; index += 1) {
    const y = 70 + index * 110;
    ctx.beginPath();
    ctx.arc((index % 2 === 0 ? 1 : -1) * 25 + 180, y, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const pipe of pipes) {
    ctx.fillStyle = '#10b981';
    const topHeight = pipe.gapY - PIPE_GAP / 2;
    const bottomY = pipe.gapY + PIPE_GAP / 2;
    ctx.beginPath();
    ctx.roundRect(pipe.x, -20, PIPE_W, topHeight + 20, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(pipe.x, bottomY, PIPE_W, H - bottomY, 10);
    ctx.fill();
  }

  ctx.fillStyle = '#a7f3d0';
  ctx.fillRect(0, H - 16, W, 16);

  ctx.save();
  const tilt = Math.max(-0.5, Math.min(0.9, bird.vy / 16));
  ctx.translate(BIRD_X, bird.y);
  ctx.rotate(tilt);
  ctx.fillStyle = flash ? '#f43f5e' : '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b1220';
  ctx.beginPath();
  ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.moveTo(BIRD_R - 2, 2);
  ctx.lineTo(BIRD_R + 7, 5);
  ctx.lineTo(BIRD_R - 2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function FlappyBirdPage() {
  const { balance, setBalance } = useWallet();
  const { toast } = useToast();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const birdRef = useRef({ y: H / 2, vy: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const startRef = useRef(0);
  const endedRef = useRef(false);
  const paramsRef = useRef({ bet: 0, timeTarget: 0 });
  const phaseRef = useRef<'ready' | 'playing' | 'done'>('ready');

  const [size, setSize] = useState({ w: 240, h: 373 });
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [bet, setBet] = useState('100');
  const [target, setTarget] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [result, setResult] = useState<ResultState | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      const scale = Math.min(cw / W, ch / H);
      setSize({ w: Math.floor(W * scale), h: Math.floor(H * scale) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finish = useCallback(
    async (completed: boolean, timeSurvived: number) => {
      if (endedRef.current) return;
      endedRef.current = true;
      stopLoop();
      setPhase('done');

      const { bet: amount, timeTarget } = paramsRef.current;
      try {
        const { data } = await apiService.flappyBird({
          bet: amount,
          completed,
          timeTarget,
          timeSurvived: Number(timeSurvived.toFixed(2)),
        });
        setBalance(data.wallet);
        setResult({
          win: data.win,
          profit: data.profit,
          detail: completed
            ? `Survived ${timeSurvived.toFixed(1)}s`
            : `Crashed at ${timeSurvived.toFixed(1)}s`,
        });
      } catch (error) {
        toast(getErrorMessage(error), 'error');
      }
    },
    [setBalance, stopLoop, toast]
  );

  const start = () => {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast('Enter a valid bet', 'error');
    if (amount > balance) return toast('Insufficient balance', 'error');

    paramsRef.current = { bet: amount, timeTarget: target };
    birdRef.current = { y: H / 2, vy: JUMP };
    pipesRef.current = [];
    endedRef.current = false;
    setResult(null);
    setRemaining(target);
    setPhase('playing');
  };

  const flap = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    birdRef.current.vy = JUMP;
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    startRef.current = performance.now();
    lastRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(2, (now - lastRef.current) / 16.666);
      lastRef.current = now;
      const survived = (now - startRef.current) / 1000;

      const bird = birdRef.current;
      bird.vy += GRAVITY * dt;
      bird.y += bird.vy * dt;

      const lastPipe = pipesRef.current[pipesRef.current.length - 1];
      if (!lastPipe || lastPipe.x <= W - PIPE_SPACING) {
        pipesRef.current.push({ x: W, gapY: 120 + Math.random() * (H - 260) });
      }

      for (const pipe of pipesRef.current) {
        pipe.x -= SPEED * dt;
      }
      pipesRef.current = pipesRef.current.filter((pipe) => pipe.x + PIPE_W > -10);

      let collided = bird.y - BIRD_R < 0 || bird.y + BIRD_R > H - 16;
      for (const pipe of pipesRef.current) {
        const withinX = BIRD_X + BIRD_R > pipe.x && BIRD_X - BIRD_R < pipe.x + PIPE_W;
        const withinGap =
          bird.y - BIRD_R > pipe.gapY - PIPE_GAP / 2 && bird.y + BIRD_R < pipe.gapY + PIPE_GAP / 2;
        if (withinX && !withinGap) collided = true;
      }

      draw(ctx, bird, pipesRef.current, collided);

      if (collided) {
        finish(false, survived);
        return;
      }
      if (survived >= paramsRef.current.timeTarget) {
        finish(true, survived);
        return;
      }

      setRemaining(Math.max(0, paramsRef.current.timeTarget - survived));
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return stopLoop;
  }, [phase, finish, stopLoop]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, flap]);

  useEffect(() => stopLoop, [stopLoop]);

  return (
    <GamePage
      title="Flappy Flight"
      subtitle="Tap the canvas or press space to fly."
      balance={balance}
      controls={
        <>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="w-12 shrink-0 text-[11px] font-bold uppercase tracking-wide text-ink-500">
              Target
            </span>
            {TARGETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                disabled={phase === 'playing'}
                onClick={() => setTarget(seconds)}
                className={classNames(
                  'h-10 flex-1 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60',
                  target === seconds
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
                )}
              >
                {seconds}s
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-500">
                ₦
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={10}
                value={bet}
                disabled={phase === 'playing'}
                onChange={(event) => setBet(event.target.value)}
                placeholder="Bet"
                aria-label="Bet amount"
                className="h-11 w-full rounded-xl border border-ink-100 bg-white pl-7 pr-3 text-sm font-semibold text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              disabled={phase === 'playing'}
              onClick={() => setBet(String(Math.floor(balance)))}
              className="h-11 shrink-0 rounded-xl border border-ink-100 bg-white px-2.5 text-xs font-bold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
            >
              Max
            </button>
            <Button className="h-11 shrink-0 px-5" disabled={phase === 'playing'} onClick={start}>
              {phase === 'playing' ? 'Flying…' : 'Start'}
            </Button>
          </div>

          <ResultBanner result={result} className="h-14 shrink-0" />
        </>
      }
    >
      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative" style={{ width: size.w, height: size.h }}>
          <canvas
            ref={canvasRef}
            style={{ width: size.w, height: size.h }}
            className="block touch-none rounded-2xl shadow-card"
            onClick={flap}
            role="presentation"
          />

          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-ink-900 shadow-sm">
                {remaining.toFixed(1)}s left
              </span>
            </div>
          )}

          {phase !== 'playing' && (
            <button
              type="button"
              onClick={start}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/75 px-4 text-center backdrop-blur-sm"
            >
              <span className="text-base font-black text-ink-900">
                {phase === 'ready' ? 'Ready to fly?' : result?.win ? 'You survived!' : 'Crashed'}
              </span>
              <span className="text-xs text-ink-500">
                {phase === 'ready' ? 'Tap to start' : 'Tap to play again'}
              </span>
            </button>
          )}
        </div>
      </div>

    </GamePage>
  );
}
