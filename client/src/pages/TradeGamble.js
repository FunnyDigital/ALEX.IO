import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button, TextField, MenuItem } from '@mui/material';
import axios from 'axios';

import { rtdb, auth, db } from '../firebase';
import { ref, onValue, set, push, update, serverTimestamp } from 'firebase/database';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

function TradeGamble() {
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  useEffect(() => {
    let unsub = null;
    const attach = () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, 'users', user.uid);
        unsub = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            setWallet(typeof data.wallet === 'number' ? data.wallet : 0);
          }
        });
      }
    };
    const remove = () => { if (typeof unsub === 'function') unsub(); };
    const off = auth.onAuthStateChanged(() => {
      remove();
      attach();
    });
    attach();
    return () => { remove(); off(); };
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

  // Settle wallet for the current user's resolved trades
  React.useEffect(() => {
    const tradesRef = ref(rtdb, 'tradeGamble/trades');
    const unsub = onValue(tradesRef, async (snapshot) => {
      const val = snapshot.val();
      const user = auth.currentUser;
      if (!val || !user || !profile) return;
      const entries = Object.entries(val);
      for (const [key, trade] of entries) {
        const mine = trade?.uid ? trade.uid === user.uid : (trade?.name && profile?.username && trade.name === profile.username);
        if (mine && trade.resolved && !trade.settled && typeof trade.win === 'boolean') {
          try {
            const token = await user.getIdToken();
            const res = await axios.post('/api/games/trade-gamble/settle', {
              bet: Number(trade.bet),
              win: !!trade.win,
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success) {
              await update(ref(rtdb, `tradeGamble/trades/${key}`), { settled: true });
            }
          } catch (e) {
            // ignore transient errors; will retry on next onValue
          }
        }
      }
    });
    return () => unsub();
  }, [profile]);

  // Start a trade (write to rtdb)
  const handleTrade = (type) => {
    setError('');
    if (!baseBet || Number(baseBet) <= 0) {
      setError('Enter a valid bet amount');
      return;
    }

    // Check if user has sufficient balance
    if (wallet && parseFloat(baseBet) > wallet) {
      setError(`Insufficient balance! Your balance is $${wallet.toFixed(2)} but you're trying to bet $${parseFloat(baseBet).toFixed(2)}. Please reduce your bet amount or add funds to your wallet.`);
      return;
    }

    // Use logged-in user's username
    const name = profile?.username || 'Player';
    const uid = auth.currentUser?.uid || null;
    const trade = {
      name,
      uid,
      baseBet: Number(baseBet),
      bet: Number(baseBet),
      multiplier: 1,
      type,
      startIdx: graphData.length - 1,
      duration,
      resolved: false,
      settled: false,
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

  // Improved candlestick trading graph
  const renderGraph = () => {
    // Responsive width/height for mobile portrait
    let width = Math.min(900, window.innerWidth * 0.98);
    let height = Math.max(260, Math.min(400, window.innerHeight * 0.4));
    const candleCount = 40;
    const data = graphData.slice(-candleCount - 1);
    const yMin = 0.5, yMax = 7;
    const yScale = v => height - ((v - yMin) / (yMax - yMin)) * height;
    // X axis labels
    const now = new Date();
    const timeLabels = Array.from({length: 7}, (_, i) => {
      const t = new Date(now.getTime() - (6 - i) * (candleCount / 6) * 1000);
      return t.toLocaleTimeString([], {minute: '2-digit', second: '2-digit'});
    });
    // Candle width and spacing
    const candleWidth = Math.max(10, width / (candleCount * 1.3));
    const candleSpacing = (width - candleWidth * candleCount) / (candleCount + 1);
    return (
      <svg width={width} height={height + 40} style={{ width: '100%', height: '100%' }}>
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} fill="#181a20" stroke="#444" strokeWidth={2} />
        {/* Grid lines */}
        {[...Array(8)].map((_, i) => {
          const y = height - (i * height / 7);
          return <line key={i} x1={0} y1={y} x2={width} y2={y} stroke="#333" strokeDasharray="4 4" />;
        })}
        {[...Array(7)].map((_, i) => {
          const x = i * width / 6;
          return <line key={i} x1={x} y1={0} x2={x} y2={height} stroke="#333" strokeDasharray="4 4" />;
        })}
        {/* Y axis labels */}
        {[...Array(8)].map((_, i) => {
          const y = height - (i * height / 7);
          const val = (yMin + ((yMax - yMin) * i / 7)).toFixed(2);
          return <text key={i} x={2} y={y - 2} fontSize="11" fill="#aaa">{val}</text>;
        })}
        {/* X axis time labels */}
        {timeLabels.map((label, i) => (
          <text key={i} x={i * width / 6} y={height + 18} fontSize="12" fill="#aaa" textAnchor="middle">{label}</text>
        ))}
        {/* Candles with wicks */}
        {data.slice(1).map((v, i) => {
          const open = data[i];
          const close = data[i + 1];
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
          const bodyH = Math.max(Math.abs(yOpen - yClose), 8); // Minimum body height
          return (
            <g key={i}>
              {/* Wick */}
              <rect x={x + candleWidth/2 - 1.2} y={yHigh} width={2.4} height={Math.max(2, yLow - yHigh)} fill="#bbb" rx={1.2} />
              {/* Body */}
              <rect x={x} y={bodyY} width={candleWidth} height={bodyH} fill={color} stroke="#222" rx={3} />
            </g>
          );
        })}
        {/* Current value */}
        <text x={width - 120} y={38} fontFamily="monospace" fontSize="2rem" fill="#fff">{data[data.length - 1]?.toFixed(4)}x</text>
        {/* Y axis title */}
        <text x={-height/2} y={16} fontSize="13" fill="#aaa" transform={`rotate(-90 0 16)`}>Multiplier (x)</text>
        {/* X axis title */}
        <text x={width/2} y={height + 36} fontSize="13" fill="#aaa" textAnchor="middle">Time</text>
      </svg>
    );
  };

  return (
    <div className="gaming-page" style={{ minHeight: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'var(--primary-bg)' }}>
      <div className="gaming-container" style={{ width: '100%', maxWidth: 1400, display: 'flex', flexDirection: 'row', gap: 32, padding: '24px', boxSizing: 'border-box', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Graph and Trades Side-by-side on large screens, stacked on mobile */}
        <div style={{ flex: 2, minWidth: 340, maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            color: 'var(--text-gold)',
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            margin: 0
          }}>
            Trade Gamble
          </div>
          {/* Graph Area */}
          <div style={{
            background: 'var(--accent-bg)',
            borderRadius: 12,
            border: '2px solid var(--border-primary)',
            overflow: 'hidden',
            minHeight: 320,
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {renderGraph()}
          </div>
          {/* Current Trades */}
          <div style={{
            background: 'var(--accent-bg)',
            borderRadius: 12,
            border: '1px solid var(--border-secondary)',
            padding: '16px',
            minHeight: 120,
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <Typography style={{ 
              fontWeight: 700, 
              color: 'var(--text-gold)', 
              marginBottom: '16px', 
              fontSize: '18px',
              textAlign: 'center'
            }}>
              Current Trades
            </Typography>
            {trades.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                No active trades
              </div>
            )}
            {trades.map((trade, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px',
                padding: '8px',
                background: 'var(--secondary-bg)',
                borderRadius: 8,
                border: `1px solid ${trade.resolved ? (trade.win ? 'var(--green-accent)' : 'var(--red-accent)') : 'var(--border-secondary)'}`
              }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{trade.name}</span>
                <span style={{ 
                  color: trade.type === 'buy' ? 'var(--green-accent)' : 'var(--red-accent)',
                  fontWeight: 700
                }}>
                  {trade.type === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span style={{ color: 'var(--text-gold)' }}>Bet: ${trade.bet}</span>
                <span>
                  {trade.resolved ? (
                    <b style={{ color: trade.win ? 'var(--green-accent)' : 'var(--red-accent)' }}>
                      {trade.win ? 'Win' : 'Lose'} {trade.win ? `(+$${trade.profit})` : ''}
                    </b>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Controls on the right (or below on mobile) */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16,
            background: 'var(--accent-bg)',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid var(--border-secondary)',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {/* Input Row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* ...existing code for TextFields... */}
              <TextField 
                label="Base Bet" 
                type="number" 
                value={baseBet} 
                onChange={e => setBaseBet(e.target.value)} 
                disabled={!!activeTrade}
                InputProps={{ 
                  style: { 
                    color: 'var(--text-primary)', 
                    fontWeight: 600, 
                    background: 'var(--secondary-bg)', 
                    borderRadius: 8 
                  } 
                }}
                InputLabelProps={{
                  style: { 
                    color: 'var(--text-secondary)'
                  }
                }}
                sx={{
                  flex: 1, 
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--border-secondary)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                  },
                }}
              />
              <TextField 
                select 
                label="Multiplier" 
                value={multiplier} 
                onChange={e => handleMultiplierChange(Number(e.target.value))} 
                disabled={!activeTrade}
                InputProps={{ 
                  style: { 
                    color: 'var(--text-primary)', 
                    fontWeight: 600, 
                    background: 'var(--secondary-bg)', 
                    borderRadius: 8 
                  } 
                }}
                InputLabelProps={{
                  style: { 
                    color: 'var(--text-secondary)'
                  }
                }}
                sx={{
                  flex: 1, 
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--border-secondary)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                  },
                }}
              >
                {[1,2,5,10,20].map(m => <MenuItem key={m} value={m}>x{m}</MenuItem>)}
              </TextField>
              <TextField 
                select 
                label="Duration" 
                value={duration} 
                onChange={e => setDuration(Number(e.target.value))} 
                disabled={!!activeTrade}
                InputProps={{ 
                  style: { 
                    color: 'var(--text-primary)', 
                    fontWeight: 600, 
                    background: 'var(--secondary-bg)', 
                    borderRadius: 8 
                  } 
                }}
                InputLabelProps={{
                  style: { 
                    color: 'var(--text-secondary)'
                  }
                }}
                sx={{
                  flex: 1, 
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--border-secondary)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--border-primary)',
                    },
                  },
                }}
              >
                {[1,2,5,10].map(d => <MenuItem key={d} value={d}>{d} min</MenuItem>)}
              </TextField>
            </div>
            {/* Current Bet Display */}
            <div style={{ 
              textAlign: 'center', 
              fontWeight: 700, 
              color: 'var(--text-gold)',
              fontSize: 16
            }}>
              Current Bet: ${activeTrade ? activeTrade.bet : baseBet || 0}
            </div>
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button 
                variant="contained"
                disabled={!!activeTrade || !baseBet} 
                onClick={() => handleTrade('buy')}
                sx={{ 
                  flex: 1,
                  maxWidth: 150,
                  background: 'var(--green-accent)',
                  color: 'var(--primary-bg)',
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 2,
                  padding: '12px 0',
                  '&:hover': {
                    background: 'var(--green-secondary)',
                  },
                  '&:disabled': {
                    background: 'var(--accent-bg)',
                    color: 'var(--text-muted)',
                  }
                }}
              >
                BUY
              </Button>
              <Button 
                variant="contained"
                disabled={!!activeTrade || !baseBet} 
                onClick={() => handleTrade('sell')}
                sx={{ 
                  flex: 1,
                  maxWidth: 150,
                  background: 'var(--red-accent)',
                  color: 'var(--primary-bg)',
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 2,
                  padding: '12px 0',
                  '&:hover': {
                    background: 'var(--red-secondary)',
                  },
                  '&:disabled': {
                    background: 'var(--accent-bg)',
                    color: 'var(--text-muted)',
                  }
                }}
              >
                SELL
              </Button>
            </div>
            {/* Status Display + Wallet */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {wallet !== null && (
                <span style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: 18 }}>
                  Wallet: ${wallet}
                </span>
              )}
              {activeTrade && !activeTrade.resolved && tradeTimer !== null && (
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  Time left: <b style={{ color: 'var(--gold-primary)' }}>{tradeTimer}s</b>
                </span>
              )}
              {myTrade && myTrade.resolved && (
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  Result: <b style={{ color: myTrade.win ? 'var(--green-accent)' : 'var(--red-accent)' }}>
                    {myTrade.win ? 'Win' : 'Lose'} {myTrade.win ? `(+$${myTrade.profit})` : ''}
                  </b>
                </span>
              )}
              {error && (
                <span style={{ color: 'var(--red-accent)', fontWeight: 600 }}>{error}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TradeGamble;
