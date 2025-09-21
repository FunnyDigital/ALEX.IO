import React, { useRef, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TIME_OPTIONS = Array.from({ length: 10 }, (_, i) => 15 + i * 5); // 15, 20, ..., 60

function FlappyBirdCanvas({ onGameOver, targetTime, setElapsedExternal }) {
    const canvasRef = useRef(null);
    const [running, setRunning] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const requestRef = useRef();
    const timerRef = useRef();

    // Responsive canvas size
    const [canvasSize, setCanvasSize] = useState({ w: 360, h: 480 });

    // Game state
    const bird = useRef({ x: 60, y: 200, vy: 0, width: 32, height: 32 });
    const pipes = useRef([]);
    const gravity = 0.5;
    const lift = -8.5;
    const pipeGap = 140;
    const pipeWidth = 52;
    const pipeSpeed = 2.8;

    // Resize canvas to fit viewport (no scroll)
    useEffect(() => {
        function resize() {
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            // Fit to viewport, max 400x600, min 240x320
            let w = Math.min(400, Math.max(240, vw * 0.95));
            let h = Math.min(600, Math.max(320, vh * 0.8));
            setCanvasSize({ w: Math.round(w), h: Math.round(h) });
        }
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Handle jump/tap (debounced for smoothness)
    useEffect(() => {
        let lastJump = 0;
        function jump(e) {
            // Only allow jump every 80ms for smoothness
            const now = Date.now();
            if (now - lastJump < 80) return;
            if (e.type === 'keydown' && e.code !== 'Space') return;
            bird.current.vy = lift;
            lastJump = now;
        }
        // Use pointerdown for best mobile/desktop tap
        window.addEventListener('pointerdown', jump);
        window.addEventListener('keydown', jump);
        return () => {
            window.removeEventListener('pointerdown', jump);
            window.removeEventListener('keydown', jump);
        };
    }, []);

    // Main game loop
    useEffect(() => {
        if (!running) return;
        const ctx = canvasRef.current.getContext('2d');
        let frame = 0;
        const { w: canvasW, h: canvasH } = canvasSize;

        function reset() {
            bird.current = { x: 60, y: canvasH / 2, vy: 0, width: 32, height: 32 };
            pipes.current = [];
            setElapsed(0);
            if (setElapsedExternal) setElapsedExternal(0);
            frame = 0;
        }

        function drawBird() {
            ctx.save();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(bird.current.x + 16, bird.current.y + 16, 16, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Eye
            ctx.beginPath();
            ctx.arc(bird.current.x + 22, bird.current.y + 12, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bird.current.x + 23, bird.current.y + 12, 1.2, 0, 2 * Math.PI);
            ctx.fillStyle = '#23243a';
            ctx.fill();
            // Beak
            ctx.beginPath();
            ctx.moveTo(bird.current.x + 32, bird.current.y + 16);
            ctx.lineTo(bird.current.x + 38, bird.current.y + 13);
            ctx.lineTo(bird.current.x + 38, bird.current.y + 19);
            ctx.closePath();
            ctx.fillStyle = '#ffb300';
            ctx.fill();
            ctx.restore();
        }

        function drawPipes() {
            ctx.save();
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 4;
            pipes.current.forEach(pipe => {
                ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
                ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
                ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvasH - pipe.bottom);
                ctx.strokeRect(pipe.x, pipe.bottom, pipeWidth, canvasH - pipe.bottom);
            });
            ctx.restore();
        }

        function drawBg() {
            ctx.fillStyle = '#181c2f';
            ctx.fillRect(0, 0, canvasW, canvasH);
        }

        function draw() {
            drawBg();
            drawPipes();
            drawBird();
        }

        function collision() {
            // Ground/ceiling
            if (bird.current.y < 0 || bird.current.y + bird.current.height > canvasH) return true;
            // Pipes
            for (let pipe of pipes.current) {
                if (
                    bird.current.x + bird.current.width > pipe.x &&
                    bird.current.x < pipe.x + pipeWidth &&
                    (bird.current.y < pipe.top || bird.current.y + bird.current.height > pipe.bottom)
                ) {
                    return true;
                }
            }
            return false;
        }

        function step() {
            frame++;
            // Bird physics
            bird.current.vy += gravity;
            bird.current.y += bird.current.vy;
            // Pipes
            if (frame % 90 === 0) {
                const top = Math.random() * (canvasH - pipeGap - 80) + 40;
                pipes.current.push({
                    x: canvasW,
                    top,
                    bottom: top + pipeGap,
                });
            }
            pipes.current.forEach(pipe => (pipe.x -= pipeSpeed));
            pipes.current = pipes.current.filter(pipe => pipe.x + pipeWidth > 0);
            // Draw
            draw();
            // Collision
            if (collision()) {
                setRunning(false);
                onGameOver(false, elapsed);
                return;
            }
            // Win
            if (elapsed >= targetTime) {
                setRunning(false);
                onGameOver(true, elapsed);
                return;
            }
            requestRef.current = requestAnimationFrame(step);
        }

        reset();
        requestRef.current = requestAnimationFrame(step);
        timerRef.current = setInterval(() => {
            setElapsed(e => {
                if (setElapsedExternal) setElapsedExternal(e + 1);
                return e + 1;
            });
        }, 1000);
        return () => {
            cancelAnimationFrame(requestRef.current);
            clearInterval(timerRef.current);
        };
        // eslint-disable-next-line
    }, [running, canvasSize]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', touchAction: 'manipulation', width: '100%', gap: 12 }}>
            <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{
                    background: 'var(--accent-bg)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-primary)',
                    border: '2px solid var(--border-primary)',
                    width: '100%',
                    maxWidth: 400,
                    maxHeight: 600,
                    cursor: 'pointer',
                    touchAction: 'none',
                    userSelect: 'none'
                }}
            />
            <div style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: 18 }}>Time: {elapsed}s</div>
        </div>
    );
}

function FlappyBirdGame() {
    const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'gameOver'
    const [targetTime, setTargetTime] = useState(30);
    const [wager, setWager] = useState(100);
    const [result, setResult] = useState(null); // { win, time: int }
    const [elapsed, setElapsed] = useState(0); // Track elapsed time externally
    const [wallet, setWallet] = useState(null);
    const [error, setError] = useState('');

    // Fetch wallet on mount and after game reset
    useEffect(() => {
        const fetchWallet = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setWallet(userDoc.data().wallet || 0);
            }
        };
        fetchWallet();
    }, [gameState]);

    const handleStart = e => {
        e.preventDefault();
        setResult(null);
        setError('');
        if (wallet !== null && wager > wallet) {
            setError('Insufficient balance');
            return;
        }
        setGameState('playing');
    };

    const handleGameOver = async (win, time) => {
        setResult({ win, time });
        setGameState('gameOver');
        // Update wallet in Firestore
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            let newWallet = userDoc.data().wallet || 0;
            if (win) {
                newWallet += wager;
            } else {
                newWallet -= wager;
            }
            await updateDoc(userRef, { wallet: newWallet });
            setWallet(newWallet);
        }
    };

    const handleAgain = () => {
        setGameState('setup');
        setResult(null);
        setElapsed(0);
        setError('');
    };

    return (
        <div className="gaming-page">
            <div className="gaming-container">
                <div className="gaming-card" style={{
                    width: '100%',
                    maxWidth: 400,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 20
                }}>
                    {gameState === 'setup' && (
                        <form onSubmit={handleStart} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                            <h1 style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: 'var(--text-gold)',
                                margin: 0,
                                textAlign: 'center',
                                letterSpacing: '1px'
                            }}>
                                Flappy Bird Challenge
                            </h1>
                            
                            <div style={{ width: '100%' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'var(--text-primary)',
                                    marginBottom: 8,
                                    fontWeight: 500,
                                    fontSize: 16
                                }}>
                                    Time to Beat (seconds)
                                </label>
                                <select
                                    value={targetTime}
                                    onChange={e => setTargetTime(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        background: 'var(--accent-bg)',
                                        color: 'var(--text-primary)',
                                        border: '2px solid var(--border-secondary)',
                                        fontSize: 16,
                                        fontWeight: 500
                                    }}
                                >
                                    {TIME_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt} seconds</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ width: '100%' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'var(--text-primary)',
                                    marginBottom: 8,
                                    fontWeight: 500,
                                    fontSize: 16
                                }}>
                                    Wager Amount ($)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={wager}
                                    onChange={e => setWager(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 8,
                                        background: 'var(--accent-bg)',
                                        color: 'var(--text-primary)',
                                        border: '2px solid var(--border-secondary)',
                                        fontSize: 16,
                                        fontWeight: 500
                                    }}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className="gaming-button-primary"
                                style={{
                                    width: '100%',
                                    padding: '14px 0',
                                    borderRadius: 8,
                                    background: 'var(--gradient-gold)',
                                    color: 'var(--primary-bg)',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-primary)'
                                }}
                            >
                                Start Game
                            </button>
                            
                            {error && <div style={{ color: 'var(--red-accent)', fontWeight: 600, textAlign: 'center' }}>{error}</div>}
                            {wallet !== null && <div style={{ color: 'var(--text-gold)', fontWeight: 600, textAlign: 'center' }}>Wallet: ${wallet}</div>}
                        </form>
                    )}
                    
                    {gameState === 'playing' && (
                        <FlappyBirdCanvas onGameOver={handleGameOver} targetTime={targetTime} setElapsedExternal={setElapsed} />
                    )}
                    
                    {gameState === 'gameOver' && result && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
                            <h2 style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: result.win ? 'var(--green-accent)' : 'var(--red-accent)',
                                margin: 0,
                                textAlign: 'center'
                            }}>
                                {result.win ? 'YOU WON!' : 'GAME OVER'}
                            </h2>
                            
                            <div style={{ color: 'var(--text-primary)', fontSize: 16, textAlign: 'center', lineHeight: 1.6 }}>
                                <div>Time Survived: <strong style={{ color: 'var(--text-gold)' }}>{result.time ?? elapsed}s</strong></div>
                                <div>Wager: <strong style={{ color: 'var(--text-gold)' }}>${wager}</strong></div>
                                {wallet !== null && <div>Wallet: <strong style={{ color: 'var(--text-gold)' }}>${wallet}</strong></div>}
                            </div>
                            
                            <button
                                onClick={handleAgain}
                                className="gaming-button-primary"
                                style={{
                                    width: '100%',
                                    padding: '14px 0',
                                    borderRadius: 8,
                                    background: 'var(--gradient-gold)',
                                    color: 'var(--primary-bg)',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-primary)'
                                }}
                            >
                                Play Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FlappyBirdGame;
