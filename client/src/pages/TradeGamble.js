import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button, TextField, MenuItem } from '@mui/material';
import './TradeGambleMobile.css';
import { rtdb, auth, db } from '../firebase';
import { ref, onValue, set, push, update, serverTimestamp } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

function TradeGamble() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);
  // UI State
  const [baseBet, setBaseBet] = useState('');
  const [multiplier, setMultiplier] = useState(1);
  const [activeTrade, setActiveTrade] = useState(null); // {bet, multiplier, ...}
  const [duration, setDuration] = useState(1);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState([1]);
  const [trades, setTrades] = useState([]); // {name, bet, type, startIdx, duration, resolved, win, profit}
  const [myTrade, setMyTrade] = useState(null);
  const graphInterval = useRef(null);
  const graphTick = useRef(0);

  // Universal graph: listen to rtdb
  React.useEffect(() => {
    const graphRef = ref(rtdb, 'tradeGamble/graphData');
    onValue(graphRef, (snapshot) => {
      const val = snapshot.val();
      if (val && Array.isArray(val)) setGraphData(val);
    });
  }, []);

  // Universal graph: update rtdb (all clients update)
  React.useEffect(() => {
    graphInterval.current = setInterval(async () => {
      const graphRef = ref(rtdb, 'tradeGamble/graphData');
      let prev = [];
      await onValue(graphRef, (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val) && !isNaN(val[0])) prev = val;
        else prev = [1];
      }, { onlyOnce: true });
      const last = typeof prev[prev.length - 1] === 'number' && !isNaN(prev[prev.length - 1]) ? prev[prev.length - 1] : 1;
      let next = last + (Math.random() - 0.5) * 0.2;
      if (isNaN(next)) next = 1;
      set(graphRef, [...prev, Math.max(0.5, Math.min(7, next))]);
    }, 1000);
    return () => clearInterval(graphInterval.current);
  }, []);

  // Timer for active trade
  const [tradeTimer, setTradeTimer] = React.useState(null);
  React.useEffect(() => {
    if (activeTrade && !activeTrade.resolved) {
      setTradeTimer(activeTrade.duration * 60);
      const timerInterval = setInterval(() => {
        setTradeTimer(t => {
          if (t > 1) return t - 1;
          clearInterval(timerInterval);
          return 0;
        });
      }, 1000);
      return () => clearInterval(timerInterval);
    } else {
      setTradeTimer(null);
      // If trade is resolved, allow play again
      if (activeTrade && activeTrade.resolved) {
        setTimeout(() => {
          setActiveTrade(null);
          setMyTrade(null);
        }, 1000); // 1s delay for result display
      }
    }
  }, [activeTrade]);

  // Universal trades: listen to rtdb
  React.useEffect(() => {
    const tradesRef = ref(rtdb, 'tradeGamble/trades');
    onValue(tradesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const arr = Object.values(val);
        setTrades(arr);
      } else {
        setTrades([]);
      }
    });
  }, []);

  // Resolve trades (all clients)
  React.useEffect(() => {
    onValue(ref(rtdb, 'tradeGamble/trades'), (snapshot) => {
      const val = snapshot.val();
      if (val) {
        Object.entries(val).forEach(([key, trade]) => {
          if (!trade.resolved && graphData.length > trade.startIdx + trade.duration * 60) {
            const start = graphData[trade.startIdx];
            const end = graphData[trade.startIdx + trade.duration * 60];
            const win = (trade.type === 'buy' && end > start) || (trade.type === 'sell' && end < start);
            update(ref(rtdb, `tradeGamble/trades/${key}`), {
              resolved: true,
              win,
              profit: win ? trade.bet * 2 : 0
            });
          }
        });
      }
    });
  }, [graphData]);

  // Start a trade (write to rtdb)
  const handleTrade = (type) => {
    setError('');
    if (!baseBet || Number(baseBet) <= 0) {
      setError('Enter a valid bet amount');
      return;
    }
    // Use logged-in user's username
    const name = profile?.username || 'Player';
    const trade = {
      name,
      baseBet: Number(baseBet),
      bet: Number(baseBet),
      multiplier: 1,
      type,
      startIdx: graphData.length - 1,
      duration,
      resolved: false,
      win: null,
      profit: null,
      timestamp: serverTimestamp()
    };
    const newRef = push(ref(rtdb, 'tradeGamble/trades'));
    set(newRef, trade);
    setMyTrade(trade);
    setActiveTrade({ ...trade, key: newRef.key });
    setMultiplier(1);
  };

  // Update multiplier for active trade (write to rtdb)
  const handleMultiplierChange = (newMultiplier) => {
    setMultiplier(newMultiplier);
    if (activeTrade && activeTrade.key) {
      const updatedBet = newMultiplier === 1 ? activeTrade.baseBet : activeTrade.baseBet * newMultiplier;
      setActiveTrade({ ...activeTrade, multiplier: newMultiplier, bet: updatedBet });
      setMyTrade({ ...activeTrade, multiplier: newMultiplier, bet: updatedBet });
      update(ref(rtdb, `tradeGamble/trades/${activeTrade.key}`), {
        multiplier: newMultiplier,
        bet: updatedBet
      });
    }
  };

  // Draw simple candlestick chart (always visible)
  const renderGraph = () => {
    // Responsive width/height for mobile portrait
    let width = 600, height = 320;
    if (window.innerWidth < 600) {
      width = window.innerWidth;
      height = window.innerHeight * 0.4;
    }
    const candleCount = 30; // Fewer, larger candles
    const data = graphData.slice(-candleCount - 1); // Need previous for open/close
    const midValue = 3.75; // (0.5 + 7) / 2
    const yMin = 0.5, yMax = 7;
    const yScale = v => height - ((v - yMin) / (yMax - yMin)) * height;
    // Timestamps for x-axis
    const now = new Date();
    const timeLabels = Array.from({length: 6}, (_, i) => {
      const t = new Date(now.getTime() - (5 - i) * (candleCount / 5) * 1000);
      return t.toLocaleTimeString([], {minute: '2-digit', second: '2-digit'});
    });
    // Candle width and spacing
    const candleWidth = Math.max(18, width / (candleCount * 1.2));
    const candleSpacing = (width - candleWidth * candleCount) / (candleCount + 1);
    return (
      <svg width={width} height={height + 30} style={{ width: '100%', height: '100%' }}>
        <rect x={0} y={0} width={width} height={height} fill="#181a20" stroke="#e94f4f" strokeWidth={4} />
        {/* Y axis lines and labels */}
        {[...Array(7)].map((_, i) => {
          const y = height - (i * height / 7);
          const val = (yMin + ((yMax - yMin) * i / 7)).toFixed(2);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={width} y2={y} stroke="#333" strokeDasharray="4 4" />
              <text x={2} y={y - 2} fontSize="10" fill="#aaa">{val}</text>
            </g>
          );
        })}
        {/* Middle line */}
        <line x1={0} y1={yScale(midValue)} x2={width} y2={yScale(midValue)} stroke="#fff" strokeDasharray="2 2" strokeWidth={2} />
        {/* X axis time labels */}
        {timeLabels.map((label, i) => (
          <text key={i} x={i * width / 5} y={height + 18} fontSize="11" fill="#aaa" textAnchor="middle">{label}</text>
        ))}
        {/* Candles with wicks */}
        {data.slice(1).map((v, i) => {
          const open = data[i];
          const close = data[i + 1];
          // For a more realistic candle, use a small window for high/low
          const window = data.slice(Math.max(0, i - 1), i + 3);
          const high = Math.max(...window);
          const low = Math.min(...window);
          const isUp = close >= open;
          const color = isUp ? '#27ae60' : '#e94f4f';
          const x = candleSpacing + i * (candleWidth + candleSpacing);
          const yOpen = yScale(open);
          const yClose = yScale(close);
          const yHigh = yScale(high);
          const yLow = yScale(low);
          // Candle body
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(Math.abs(yOpen - yClose), 12); // Minimum body height
          return (
            <g key={i}>
              {/* Wick */}
              <rect x={x + candleWidth/2 - 1.5} y={yHigh} width={3} height={Math.max(2, yLow - yHigh)} fill="#444" rx={1.5} />
              {/* Body */}
              <rect x={x} y={bodyY} width={candleWidth} height={bodyH} fill={color} stroke="#222" rx={4} />
            </g>
          );
        })}
        {/* Current value */}
        <text x={width - 120} y={40} fontFamily="monospace" fontSize="2rem" fill="#fff">{data[data.length - 1]?.toFixed(4)}x</text>
      </svg>
    );
  };

  return (
    <div className="trade-root">
      <div className="trade-container">
        <div className="trade-graph-area">
          {renderGraph()}
        </div>
        <div className="trade-leaderboard">
          <Typography style={{ fontWeight: 900, color: '#7cbcff', marginBottom: '1rem', fontSize: '1.1rem' }}>Current Trades</Typography>
          {trades.length === 0 && <div>No trades yet.</div>}
          {trades.map((trade, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span>{trade.name}</span>
              <span style={{ color: trade.type === 'buy' ? '#4f6ee9' : '#e94f4f' }}>{trade.type === 'buy' ? 'Buy' : 'Sell'}</span>
              <span>Bet: {trade.bet}</span>
              <span>
                {trade.resolved ? (
                  <b style={{ color: trade.win ? '#4f6ee9' : '#e94f4f' }}>{trade.win ? 'Win' : 'Lose'} {trade.win ? `(+${trade.profit})` : ''}</b>
                ) : (
                  <span style={{ color: '#aaa' }}>Pending</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="trade-controls">
        <Typography style={{ fontFamily: 'Press Start 2P', fontWeight: 900, fontSize: '1.2rem', color: '#e94f4f', marginBottom: '1rem' }}>Trade Gamble</Typography>
        <div className="trade-controls-row">
          <TextField label="Base Bet" type="number" value={baseBet} onChange={e => setBaseBet(e.target.value)} style={{ marginRight: '1rem', flex: 1 }} disabled={!!activeTrade} />
          <TextField select label="Multiplier" value={multiplier} onChange={e => handleMultiplierChange(Number(e.target.value))} style={{ marginRight: '1rem', flex: 1 }} disabled={!activeTrade}>
            {[1,2,5,10,20].map(m => <MenuItem key={m} value={m}>x{m}</MenuItem>)}
          </TextField>
          <TextField select label="Duration" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ flex: 1 }} disabled={!!activeTrade}>
            {[1,2,5,10].map(d => <MenuItem key={d} value={d}>{d} min</MenuItem>)}
          </TextField>
        </div>
        <div className="trade-controls-row" style={{ justifyContent: 'center', fontWeight: 700, fontFamily: 'monospace', color: '#222' }}>
          <span>Current Bet: {activeTrade ? activeTrade.bet : baseBet}</span>
        </div>
  {/* Multiplier slider removed */}
        <div className="trade-controls-row" style={{ justifyContent: 'center' }}>
          <Button className="trade-btn buy" style={{background:'#27ae60',borderColor:'#27ae60'}} disabled={!!activeTrade || !baseBet} onClick={() => handleTrade('buy')}>BUY</Button>
          <Button className="trade-btn sell" style={{background:'#e94f4f',borderColor:'#e94f4f'}} disabled={!!activeTrade || !baseBet} onClick={() => handleTrade('sell')}>SELL</Button>
        </div>
        <div className="trade-summary">
          {activeTrade && !activeTrade.resolved && tradeTimer !== null && (
            <span>Time left: <b style={{ color: '#4f6ee9' }}>{tradeTimer}s</b></span>
          )}
          {myTrade && myTrade.resolved && (
            <span>Result: <b style={{ color: myTrade.win ? '#4f6ee9' : '#e94f4f' }}>{myTrade.win ? 'Win' : 'Lose'} {myTrade.win ? `(+${myTrade.profit})` : ''}</b></span>
          )}
          {error && <span style={{ color: '#e94f4f' }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}

export default TradeGamble;
