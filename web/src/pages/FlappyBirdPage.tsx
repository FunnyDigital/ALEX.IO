import { useCallback, useEffect, useRef, useState } from 'react';

import { GamePage } from '../components/games/GamePage';
import { BetControls } from '../components/games/BetControls';
import { ResultBanner } from '../components/games/ResultBanner';
import type { ResultState } from '../components/games/ResultBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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

function draw(ctx: CanvasRenderingContext2D, bird: { y: number; vy: number }, pipes: Pipe[], flash: boolean) {
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const birdRef = useRef({ y: H / 2, vy: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const startRef = useRef(0);
  const endedRef = useRef(false);
  const paramsRef = useRef({ bet: 0, timeTarget: 0 });
  const phaseRef = useRef<'ready' | 'playing' | 'done'>('ready');

  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [bet, setBet] = useState('100');
  const [target, setTarget] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [result, setResult] = useState<ResultState | null>(null);

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
        pipesRef.current.push({
          x: W,
          gapY: 120 + Math.random() * (H - 260),
        });
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
      subtitle="Survive the target time to win 1.96x. Tap or press space to fly."
      balance={balance}
    >
      <Card className="overflow-hidden p-0">
        <div
          className="relative mx-auto w-full max-w-md cursor-pointer select-none"
          onClick={flap}
          role="presentation"
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', aspectRatio: `${W} / ${H}` }}
            className="block touch-none"
          />

          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded-full bg-white/85 px-3 py-1 text-sm font-bold text-ink-900 shadow-sm">
                {remaining.toFixed(1)}s left
              </span>
            </div>
          )}

          {phase !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-sm">
              <p className="text-lg font-black text-ink-900">
                {phase === 'ready' ? 'Ready to fly?' : result?.win ? 'You survived!' : 'Crashed'}
              </p>
              <p className="text-sm text-ink-500">Tap the canvas or press space to flap.</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Target time
          </p>
          <div className="flex gap-2">
            {TARGETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                disabled={phase === 'playing'}
                onClick={() => setTarget(seconds)}
                className={classNames(
                  'flex-1 rounded-xl border py-2 text-sm font-bold transition-colors disabled:opacity-60',
                  target === seconds
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
                )}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>

        <BetControls bet={bet} onChange={setBet} balance={balance} disabled={phase === 'playing'} />

        <Button size="lg" fullWidth onClick={start} disabled={phase === 'playing'}>
          {phase === 'playing' ? 'Fly!' : phase === 'ready' ? 'Start flight' : 'Play again'}
        </Button>

        <ResultBanner result={result} />
      </Card>
    </GamePage>
  );
}
