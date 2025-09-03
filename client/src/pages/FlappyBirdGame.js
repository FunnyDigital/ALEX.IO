import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './FlappyBirdGame.css';

// --- Constants ---
const BIRD_DEFAULTS = { x: 50, y: 150, width: 25, height: 25 };
const GRAVITY = 0.4;
const LIFT = -7;
const PIPE_DEFAULTS = { width: 50, gap: 150 };
const GAME_SPEED = 3;

// --- Helper Components ---
const SetupScreen = ({ onStart, wallet, error }) => {
    const [timeInput, setTimeInput] = useState(30);
    const [wagerInput, setWagerInput] = useState(100);
    const handleStart = () => {
        onStart({
            targetTime: parseInt(timeInput, 10) || 30,
            wagerAmount: parseInt(wagerInput, 10) || 100,
        });
    };
    return (
        <div className="flappy-modal pixel-bg flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-xl w-full max-w-xs mx-auto">
            <h1 className="pixel-title text-yellow-400 mb-2">Flappy</h1>
            <h1 className="pixel-title text-yellow-400 mb-8">Challenge</h1>
            <div className="w-full mb-4">
                <label htmlFor="time-input" className="pixel-label mb-2">Time to Beat (s)</label>
                <input id="time-input" type="number" value={timeInput} onChange={e => setTimeInput(e.target.value)} className="pixel-input" />
            </div>
            <div className="w-full mb-6">
                <label htmlFor="wager-input" className="pixel-label mb-2">Wager Amount ($)</label>
                <input id="wager-input" type="number" value={wagerInput} onChange={e => setWagerInput(e.target.value)} className="pixel-input" />
            </div>
            <button onClick={handleStart} className="pixel-btn pixel-btn-green w-full py-4 text-2xl mt-2">START</button>
            {error && <div className="pixel-label text-red-400 mt-4 font-bold">{error}</div>}
            {wallet !== null && <div className="pixel-label text-yellow-400 mt-4 font-bold">Wallet: ${wallet}</div>}
        </div>
    );
};

const GameOverModal = ({ isWin, elapsedTime, wagerAmount, onPlayAgain }) => (
    <div className="flappy-modal pixel-bg flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-xl w-full max-w-xs mx-auto">
        <h2 className={`pixel-title mb-4 ${isWin ? 'text-green-400' : 'text-red-400'}`}>{isWin ? 'YOU WON!' : 'YOU LOST!'}</h2>
        <div className="pixel-modal-box mb-6">
            <p className="pixel-label">TIME SURVIVED</p>
            <p className="pixel-value mb-2">{elapsedTime}s</p>
            <p className="pixel-label">WAGER</p>
            <p className={`pixel-value ${isWin ? 'text-green-400' : 'text-red-400'}`}>{isWin ? `+$${wagerAmount}` : `-$${wagerAmount}`}</p>
        </div>
        <button onClick={onPlayAgain} className="pixel-btn pixel-btn-yellow w-full py-4 text-2xl mt-2">AGAIN?</button>
    </div>
);

const GameInfo = ({ elapsedTime, targetTime, wagerAmount }) => (
     <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between text-lg pixel-label">
         <div>
            <span>Time: </span><span>{elapsedTime}s</span>
        </div>
        <div>
            <span>Target: </span><span>{targetTime}s</span>
        </div>
         <div>
            <span>Wager: $</span><span>{wagerAmount}</span>
        </div>
    </div>
);

export default function FlappyBirdGame() {
    const [gameState, setGameState] = useState('setup'); // 'setup', 'playing', 'gameOver'
    const [settings, setSettings] = useState({ targetTime: 30, wagerAmount: 100 });
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isWin, setIsWin] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [error, setError] = useState('');
    const canvasRef = useRef(null);
    const gameLoopId = useRef(null);
    const timerId = useRef(null);
    const mutableGameState = useRef({
        bird: { ...BIRD_DEFAULTS },
        pipes: [],
        velocity: 0,
        frameCount: 0,
    }).current;

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

    const endGame = useCallback(async (didWin) => {
        setGameState('gameOver');
        setIsWin(didWin);
        if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
        if (timerId.current) clearInterval(timerId.current);
        // Update wallet in Firestore
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            let newWallet = userDoc.data().wallet || 0;
            if (didWin) {
                newWallet += settings.wagerAmount;
            } else {
                newWallet -= settings.wagerAmount;
            }
            await updateDoc(userRef, { wallet: newWallet });
            setWallet(newWallet);
        }
    }, [settings.wagerAmount]);

    const handleInput = useCallback(() => {
        mutableGameState.velocity = LIFT;
    }, [mutableGameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleInput();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleInput);
        document.addEventListener('touchstart', handleInput);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleInput);
            document.removeEventListener('touchstart', handleInput);
        };
    }, [gameState, handleInput]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const gameLoop = () => {
            mutableGameState.velocity += GRAVITY;
            mutableGameState.bird.y += mutableGameState.velocity;
            mutableGameState.frameCount++;
            if (mutableGameState.bird.y + BIRD_DEFAULTS.height > canvas.height || mutableGameState.bird.y < 0) {
                endGame(false);
                return;
            }
            for (let pipe of mutableGameState.pipes) {
                if (
                    mutableGameState.bird.x < pipe.x + PIPE_DEFAULTS.width &&
                    mutableGameState.bird.x + BIRD_DEFAULTS.width > pipe.x &&
                    mutableGameState.bird.y < pipe.y + pipe.height &&
                    mutableGameState.bird.y + BIRD_DEFAULTS.height > pipe.y
                ) {
                    endGame(false);
                    return;
                }
            }
            if (mutableGameState.frameCount % 100 === 0) {
                const gapY = Math.random() * (canvas.height - PIPE_DEFAULTS.gap * 2) + PIPE_DEFAULTS.gap;
                mutableGameState.pipes.push({ x: canvas.width, y: 0, height: gapY - PIPE_DEFAULTS.gap / 2 });
                mutableGameState.pipes.push({ x: canvas.width, y: gapY + PIPE_DEFAULTS.gap / 2, height: canvas.height });
            }
            mutableGameState.pipes.forEach(pipe => pipe.x -= GAME_SPEED);
            mutableGameState.pipes = mutableGameState.pipes.filter(pipe => pipe.x + PIPE_DEFAULTS.width > 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(mutableGameState.bird.x, mutableGameState.bird.y, BIRD_DEFAULTS.width, BIRD_DEFAULTS.height);
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 2;
            ctx.strokeRect(mutableGameState.bird.x, mutableGameState.bird.y, BIRD_DEFAULTS.width, BIRD_DEFAULTS.height);
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 4;
            mutableGameState.pipes.forEach(pipe => {
                 ctx.fillRect(pipe.x, pipe.y, PIPE_DEFAULTS.width, pipe.height);
                 ctx.strokeRect(pipe.x, pipe.y, PIPE_DEFAULTS.width, pipe.height);
            });
            gameLoopId.current = requestAnimationFrame(gameLoop);
        };
        gameLoopId.current = requestAnimationFrame(gameLoop);
        timerId.current = setInterval(() => {
            setElapsedTime(prevTime => {
                const newTime = prevTime + 1;
                if (newTime >= settings.targetTime) {
                    endGame(true);
                }
                return newTime;
            });
        }, 1000);
        return () => {
            if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
            if (timerId.current) clearInterval(timerId.current);
        };
    }, [gameState, settings.targetTime, endGame, mutableGameState]);

    const startGame = (newSettings) => {
        setError('');
        if (wallet !== null && newSettings.wagerAmount > wallet) {
            setError('Insufficient balance');
            return;
        }
        setSettings(newSettings);
        setElapsedTime(0);
        const canvas = canvasRef.current;
        mutableGameState.bird = { ...BIRD_DEFAULTS, y: canvas.height / 2 };
        mutableGameState.pipes = [];
        mutableGameState.velocity = 0;
        mutableGameState.frameCount = 0;
        setGameState('playing');
    };

    const resetGame = () => {
        setGameState('setup');
        setError('');
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    return (
        <div className="pixel-bg min-h-screen flex items-center justify-center text-white font-['Press_Start_2P']">
            <div className="flappy-canvas-container flex flex-col items-center justify-center mx-auto my-8">
              <div className="relative bg-[#1a2236] rounded-2xl shadow-2xl border-4 border-[#23243a] flex items-center justify-center overflow-hidden"
                style={{ width: '95vw', maxWidth: 400, height: '70vh', maxHeight: 600 }}>
                {gameState === 'setup' && <SetupScreen onStart={startGame} wallet={wallet} error={error} />}
                {gameState === 'gameOver' && (
                  <GameOverModal 
                    isWin={isWin} 
                    elapsedTime={elapsedTime} 
                    wagerAmount={settings.wagerAmount}
                    onPlayAgain={resetGame}
                  />
                )}
                {gameState === 'playing' && (
                  <GameInfo 
                    elapsedTime={elapsedTime} 
                    targetTime={settings.targetTime}
                    wagerAmount={settings.wagerAmount}
                  />
                )}
                <canvas ref={canvasRef} width={window.innerWidth < 500 ? window.innerWidth * 0.95 : 400} height={window.innerHeight < 700 ? window.innerHeight * 0.7 : 600} className="absolute top-0 left-0 pixel-canvas" style={{ imageRendering: 'pixelated', borderRadius: '1rem', width: '100%', height: '100%' }} />
              </div>
            </div>
        </div>
    );
}
