// Ibrahim Lagat Deriv Bot - JavaScript Logic
let socket;
let isRunning = false;
let tickHistory = [];
let totalProfit = 0;
let totalLoss = 0;
const token = "8v9ozP9cV5oJTKs"; // Your API token
const targetDigit = 7;
const maxProfit = 500;
const maxLoss = 10;

function log(message) {
  const logElement = document.getElementById("log");
  logElement.innerHTML += `> ${message}<br>`;
  logElement.scrollTop = logElement.scrollHeight;
}

function startBot() {
  if (isRunning) return;
  isRunning = true;
  log("Starting Deriv bot...");
  authenticate(token);
}

function stopBot() {
  isRunning = false;
  if (socket) socket.close();
  log("Bot stopped.");
}

function authenticate(token) {
  socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

  socket.onopen = () => {
    log("WebSocket connected. Authenticating...");
    socket.send(JSON.stringify({ authorize: token }));
  };

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.msg_type === 'authorize') {
      log(`Authorized as: ${data.authorize.loginid}`);
      subscribeTicks();
    } else if (data.msg_type === 'tick') {
      handleTick(data.tick);
    }
  };

  socket.onerror = (err) => log("WebSocket error: " + err.message);
  socket.onclose = () => log("WebSocket disconnected.");
}

function subscribeTicks() {
  log("Subscribing to ticks for market: R_100...");
  socket.send(JSON.stringify({ ticks: "R_100" }));
}

function handleTick(tick) {
  const price = tick.quote.toFixed(2);
  const digit = Number(price.slice(-1));
  tickHistory.push(Number(price));

  if (tickHistory.length > 50) tickHistory.shift();

  log(`Tick: ${price} (Digit: ${digit})`);

  if (digit === targetDigit) {
    log(`MATCH! Digit is ${digit}`);
  } else {
    log(`DIFFERS: Digit ${digit} ≠ ${targetDigit}`);
  }

  log(digit % 2 === 0 ? `EVEN Digit: ${digit}` : `ODD Digit: ${digit}`);

  if (digit > 5) log(`OVER 5: ${digit}`);
  else if (digit < 5) log(`UNDER 5: ${digit}`);
  else log(`Digit is 5 (neutral)`);

  if (tickHistory.length >= 26) {
    const rsi = calculateRSI(tickHistory);
    const macd = calculateMACD(tickHistory);
    log(`RSI: ${rsi}, MACD: ${macd.macd}, Signal: ${macd.signal}, Histogram: ${macd.histogram}`);
  }

  if (totalProfit >= maxProfit) {
    log("Max profit reached. Stopping bot.");
    stopBot();
  }
  if (totalLoss >= maxLoss) {
    log("Max loss reached. Stopping bot.");
    stopBot();
  }
}

function calculateRSI(data, period = 14) {
  let gains = 0, losses = 0;
  for (let i = data.length - period; i < data.length - 1; i++) {
    const diff = data[i + 1] - data[i];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / (avgLoss || 1);
  return (100 - (100 / (1 + rs))).toFixed(2);
}

function calculateMACD(data) {
  const ema = (arr, span) => {
    const k = 2 / (span + 1);
    return arr.reduce((acc, val, i) => {
      if (i === 0) return [val];
      acc.push(val * k + acc[i - 1] * (1 - k));
      return acc;
    }, []);
  };
  const ema12 = ema(data, 12);
  const ema26 = ema(data, 26);
  const macdLine = ema12.map((v, i) => (v - ema26[i]) || 0);
  const signalLine = ema(macdLine, 9);
  return {
    macd: macdLine[macdLine.length - 1].toFixed(3),
    signal: signalLine[signalLine.length - 1].toFixed(3),
    histogram: (macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1]).toFixed(3)
  };
}

// Anti-theft Protection
if (window.location.hostname !== "ibrahimlagat.github.io") {
  document.body.innerHTML = "<h2>This bot is protected. Unauthorized usage is blocked.</h2>";
}
