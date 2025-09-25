import React, { useRef, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import './FlappyBirdGame.css';

const TIME_OPTIONS = Array.from({ length: 10 }, (_, i) => 15 + i * 5); // 15, 20, ..., 60

function FlappyBirdCanvas({ onGameOver, targetTime, setElapsedExternal }) {
    const canvasRef = useRef(null);
    const [running, setRunning] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [score, setScore] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const requestRef = useRef();
    const timerRef = useRef();

    // Responsive canvas size
    const [canvasSize, setCanvasSize] = useState({ w: 360, h: 480 });

    // Game state
    const bird = useRef({ x: 60, y: 200, vy: 0, width: 32, height: 32 });
    const pipes = useRef([]);
    const gravity = 0.6; // Back to original
    const lift = -7; // Reduced jump force for smoother control
    const pipeGap = 180; // Keep the increased gap
    const pipeWidth = 52;
    const pipeSpeed = 2.8; // Keep normal speed

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
            // Only allow jump every 120ms for better control
            const now = Date.now();
            if (now - lastJump < 120) return;
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
        let gameStartTime = Date.now();
        const { w: canvasW, h: canvasH } = canvasSize;

        function reset() {
            bird.current = { x: 60, y: canvasH / 2, vy: 0, width: 32, height: 32 };
            pipes.current = [];
            gameStartTime = Date.now();
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
            // Eye - positioned more to the right for forward-looking
            ctx.beginPath();
            ctx.arc(bird.current.x + 24, bird.current.y + 11, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bird.current.x + 25, bird.current.y + 11, 1.2, 0, 2 * Math.PI);
            ctx.fillStyle = '#23243a';
            ctx.fill();
            // Beak - positioned more to the right for forward direction
            ctx.beginPath();
            ctx.moveTo(bird.current.x + 32, bird.current.y + 16);
            ctx.lineTo(bird.current.x + 40, bird.current.y + 14);
            ctx.lineTo(bird.current.x + 40, bird.current.y + 18);
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
            // Calculate real elapsed time
            const currentElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            
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
                setGameOver(true);
                onGameOver(false, currentElapsed, score, multiplier);
                return;
            }
            // Win
            if (currentElapsed >= targetTime) {
                console.log(`Game should end! elapsed: ${currentElapsed}, target: ${targetTime}`);
                setRunning(false);
                setGameOver(true);
                onGameOver(true, currentElapsed, score, multiplier);
                return;
            }
            requestRef.current = requestAnimationFrame(step);
        }

        reset();
        requestRef.current = requestAnimationFrame(step);
        timerRef.current = setInterval(() => {
            const currentElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            console.log(`Timer tick: ${currentElapsed}s, target: ${targetTime}s`);
            setElapsed(currentElapsed);
            if (setElapsedExternal) setElapsedExternal(currentElapsed);
            
            // Calculate multiplier based on time milestones (every 1 second)
            setMultiplier(1 + currentElapsed * 0.5);
        }, 1000);
        return () => {
            cancelAnimationFrame(requestRef.current);
            clearInterval(timerRef.current);
        };
        // eslint-disable-next-line
    }, [running, canvasSize]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', touchAction: 'manipulation', width: '100%', gap: 12 }}>
            {/* Game HUD */}
            {running && !gameOver && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 400,
                    padding: '10px 15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}>
                    <div>Score: {score}</div>
                    <div>Multiplier: {multiplier.toFixed(1)}x</div>
                    <div>Time: {Math.floor(elapsed)}s</div>
                </div>
            )}
            
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
            setError(`Insufficient balance! Your balance is $${wallet.toFixed(2)} but you're trying to bet $${wager.toFixed(2)}. Please reduce your bet amount or add funds to your wallet.`);
            return;
        }
        setGameState('playing');
    };

    const handleGameOver = async (completed, timeSurvived, score, multiplier = 1) => {
        console.log('=== WEB GAME ENDING ===');
        console.log('Completed:', completed);
        console.log('Multiplier:', multiplier);
        
        setResult({ win: completed, time: timeSurvived, score, multiplier });
        
        // Calculate total winnings based on time milestones
        const totalWinnings = completed ? Number(wager) * multiplier : 0;
        
        // Settle via backend to ensure atomic update
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            const token = await user.getIdToken();
            
            const gameData = {
                bet: Number(wager),
                completed,
                timeTarget: Number(targetTime),
                timeSurvived,
                score,
                multiplier,
                totalWinnings
            };
            
            const res = await axios.post('/api/games/flappy-bird', gameData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data?.success) {
                setWallet(res.data.wallet);
                console.log('Web game settlement successful:', res.data);
                
                // Set celebration or loss state instead of gameOver
                setGameState(completed ? 'celebrating' : 'lost');
            } else {
                throw new Error(res.data?.message || 'Settlement failed');
            }
        } catch (e) {
            setError(e.message || 'Settlement error');
            // Still show result screen even if API fails
            setGameState(completed ? 'celebrating' : 'lost');
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
                    
                    {/* Celebration Screen */}
                    {gameState === 'celebrating' && result && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 20, 
                            width: '100%',
                            padding: 20,
                            backgroundColor: '#4CAF50',
                            borderRadius: 15,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>
                                🎉 CONGRATULATIONS! 🎉
                            </div>
                            <h2 style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: 'white',
                                margin: 0
                            }}>
                                You Won!
                            </h2>
                            
                            {/* Confetti Effect */}
                            <div style={{ fontSize: 24, lineHeight: 1.2, color: 'white' }}>
                                🎊 🎉 🎊 🎉 🎊<br/>
                                🌟 ⭐ 🌟 ⭐ 🌟<br/>
                                🎊 🎉 🎊 🎉 🎊
                            </div>
                            
                            <div style={{ color: 'white', fontSize: 16, lineHeight: 1.6 }}>
                                <div><strong>Score:</strong> {result.score}</div>
                                <div><strong>Time:</strong> {result.time}s / {targetTime}s</div>
                                <div><strong>Multiplier:</strong> {result.multiplier}x</div>
                                <div><strong style={{ color: '#FFD700' }}>Winnings: ${(Number(wager) * result.multiplier).toFixed(2)}</strong></div>
                                {wallet !== null && <div><strong style={{ color: '#FFD700' }}>New Balance: ${wallet}</strong></div>}
                            </div>
                            
                            <button onClick={handleAgain} style={{
                                backgroundColor: 'white',
                                color: '#4CAF50',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 10
                            }}>
                                Play Again
                            </button>
                        </div>
                    )}
                    
                    {/* Loss Screen */}
                    {gameState === 'lost' && result && (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 20, 
                            width: '100%',
                            padding: 20,
                            backgroundColor: '#f44336',
                            borderRadius: 15,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 32, marginBottom: 10 }}>
                                💥 Game Over
                            </div>
                            <h2 style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: 'white',
                                margin: 0
                            }}>
                                Better luck next time!
                            </h2>
                            
                            {/* Loss Effect */}
                            <div style={{ fontSize: 24, lineHeight: 1.2, color: 'white' }}>
                                💔 😔 💔<br/>
                                ⚡ 💥 ⚡
                            </div>
                            
                            <div style={{ color: 'white', fontSize: 16, lineHeight: 1.6 }}>
                                <div><strong>Score:</strong> {result.score}</div>
                                <div><strong>Time:</strong> {result.time}s / {targetTime}s</div>
                                <div><strong>Multiplier:</strong> {result.multiplier}x</div>
                                <div><strong style={{ color: '#FFB6C1' }}>Bet Lost: ${Number(wager).toFixed(2)}</strong></div>
                                {wallet !== null && <div><strong style={{ color: '#FFD700' }}>New Balance: ${wallet}</strong></div>}
                            </div>
                            
                            <button onClick={handleAgain} style={{
                                backgroundColor: 'white',
                                color: '#f44336',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 10
                            }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FlappyBirdGame;
