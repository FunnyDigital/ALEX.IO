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
                onGameOver(false, currentElapsed);
                return;
            }
            // Win
            if (currentElapsed >= targetTime) {
                console.log(`Game should end! elapsed: ${currentElapsed}, target: ${targetTime}`);
                setRunning(false);
                setGameOver(true);
                onGameOver(true, currentElapsed);
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

    const handleGameOver = async (completed, timeSurvived) => {
        setResult({ win: completed, time: timeSurvived });
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            const token = await user.getIdToken();
            const gameData = {
                bet: Number(wager),
                completed,
                timeTarget: Number(targetTime),
                timeSurvived
            };
            const res = await axios.post('/api/games/flappy-bird', gameData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success) {
                // Use server authoritative wallet then re-load from Firestore for consistency
                let newWallet = res.data.wallet;
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        newWallet = userDoc.data().wallet || newWallet;
                    }
                } catch (_) { /* ignore fallback to server value */ }
                setWallet(newWallet);
            } else {
                throw new Error(res.data?.message || 'Settlement failed');
            }
            setGameState(completed ? 'celebrating' : 'lost');
        } catch (e) {
            setError(e.message || 'Settlement error');
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
                            gap: 15, 
                            width: '90%',
                            maxWidth: '350px',
                            padding: '25px 20px',
                            background: 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 50%, #9C27B0 100%)',
                            borderRadius: 25,
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(106, 27, 154, 0.4)',
                            border: '3px solid rgba(255, 215, 0, 0.3)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '400px',
                            justifyContent: 'space-around'
                        }}>
                            {/* Golden Trophy */}
                            <div style={{
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                borderRadius: '50%',
                                padding: '20px',
                                border: '3px solid rgba(255, 215, 0, 0.4)',
                                position: 'relative',
                                marginBottom: 10
                            }}>
                                <div style={{ 
                                    fontSize: 60, 
                                    filter: 'drop-shadow(2px 2px 4px rgba(255, 160, 0, 0.8))',
                                    position: 'relative'
                                }}>
                                    🏆
                                </div>
                            </div>
                            
                            <div style={{ 
                                fontSize: 24, 
                                fontWeight: 'bold',
                                color: 'white',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '1px',
                                marginBottom: 5
                            }}>
                                CONGRATULATIONS!
                            </div>
                            <h2 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)',
                                margin: 0,
                                marginBottom: 15
                            }}>
                                You're a Winner!
                            </h2>
                            
                            <div style={{ 
                                color: 'white', 
                                fontSize: 16, 
                                lineHeight: 1.6,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                padding: '15px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                marginBottom: 10
                            }}>
                                <div><strong>Time:</strong> {result.time}s / {targetTime}s</div>
                                <div><strong style={{ color: '#FFD700' }}>Winnings: ${Number(wager).toFixed(2)}</strong></div>
                                {wallet !== null && <div><strong style={{ color: '#FFD700' }}>New Balance: ${wallet}</strong></div>}
                            </div>
                            
                            <button onClick={handleAgain} style={{
                                background: 'linear-gradient(135deg, #8E24AA 0%, #9C27B0 100%)',
                                color: 'white',
                                border: '2px solid #9C27B0',
                                padding: '15px 35px',
                                borderRadius: 25,
                                fontSize: 18,
                                fontWeight: 700,
                                cursor: 'pointer',
                                marginTop: 10,
                                minWidth: '200px',
                                boxShadow: '0 4px 15px rgba(106, 27, 154, 0.3)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
                            >
                                Play Again
                            </button>
                            
                            <button 
                                onClick={() => window.location.reload()} 
                                style={{
                                    backgroundColor: 'rgba(158, 158, 158, 0.2)',
                                    color: '#757575',
                                    border: '2px solid rgba(117, 117, 117, 0.4)',
                                    padding: '12px 35px',
                                    borderRadius: 25,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    minWidth: '200px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(158, 158, 158, 0.3)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(158, 158, 158, 0.2)'}
                            >
                                Back to Main Menu
                            </button>
                        </div>
                    )}
                    
                    {/* Loss Screen */}
                    {gameState === 'lost' && result && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 15,
                            width: '90%',
                            maxWidth: '350px',
                            padding: '25px 20px',
                            background: 'linear-gradient(135deg, #B71C1C 0%, #C62828 50%, #D32F2F 100%)',
                            borderRadius: 25,
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(183, 28, 28, 0.4)',
                            border: '3px solid rgba(255, 255, 255, 0.15)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '400px',
                            justifyContent: 'space-around'
                        }}>
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '50%',
                                padding: '20px',
                                border: '3px solid rgba(255, 255, 255, 0.25)',
                                position: 'relative',
                                marginBottom: 10
                            }}>
                                <div style={{
                                    fontSize: 60,
                                    filter: 'drop-shadow(2px 2px 4px rgba(255, 64, 64, 0.8))',
                                    position: 'relative'
                                }}>
                                    💥
                                </div>
                            </div>
                            <div style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: 'white',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '1px',
                                marginBottom: 5
                            }}>
                                GAME OVER
                            </div>
                            <h2 style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: 'rgba(255, 255, 255, 0.9)',
                                margin: 0,
                                marginBottom: 15
                            }}>
                                Better luck next time!
                            </h2>
                            <div style={{
                                color: 'white',
                                fontSize: 16,
                                lineHeight: 1.6,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                padding: '15px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                marginBottom: 10
                            }}>
                                <div><strong>Time:</strong> {result.time}s / {targetTime}s</div>
                                <div><strong style={{ color: '#FFCDD2' }}>Bet Lost: ${Number(wager).toFixed(2)}</strong></div>
                                {wallet !== null && <div><strong style={{ color: '#FFD700' }}>New Balance: ${wallet}</strong></div>}
                            </div>
                            <button onClick={handleAgain} style={{
                                background: 'linear-gradient(135deg, #C62828 0%, #D32F2F 100%)',
                                color: 'white',
                                border: '2px solid #D32F2F',
                                padding: '15px 35px',
                                borderRadius: 25,
                                fontSize: 18,
                                fontWeight: 700,
                                cursor: 'pointer',
                                marginTop: 10,
                                minWidth: '200px',
                                boxShadow: '0 4px 15px rgba(183, 28, 28, 0.3)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                transition: 'all 0.3s ease'
                            }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0px)'}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    backgroundColor: 'rgba(158, 158, 158, 0.2)',
                                    color: '#f5f5f5',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    padding: '12px 35px',
                                    borderRadius: 25,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    minWidth: '200px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(200, 200, 200, 0.25)'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(158, 158, 158, 0.2)'}
                            >
                                Back to Main Menu
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FlappyBirdGame;
