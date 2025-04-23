
let isRunning = false;

function log(msg) {
  const box = document.getElementById('logBox');
  box.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
  box.scrollTop = box.scrollHeight;
}

function startBot() {
  const token = document.getElementById('token').value.trim();
  const stake = parseFloat(document.getElementById('stake').value);
  const maxLoss = parseFloat(document.getElementById('maxLoss').value);
  const maxProfit = parseFloat(document.getElementById('maxProfit').value);

  if (!token) return log("API Token required!");

  log("Starting Deriv bot...");
  isRunning = true;

  // This is where you'd add logic for:
  // - Connecting to Deriv WebSocket
  // - Matches/Differs analysis
  // - Over/Under, Even/Odd logic
  // - RSI/MACD analysis
  // - Entry control using stake, maxLoss, maxProfit

  log(`Using stake: $${stake}, Max Loss: $${maxLoss}, Max Profit: $${maxProfit}`);
  log("Bot logic placeholder active... Add your trading logic in bot.js");
}

function stopBot() {
  isRunning = false;
  log("Bot stopped.");
}
let socket;

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

  socket.onerror = (err) => {
    log("WebSocket error: " + err.message);
  };

  socket.onclose = () => {
    log("WebSocket disconnected.");
  };
}

function subscribeTicks() {
  log("Subscribing to ticks for market: R_100...");
  socket.send(JSON.stringify({
    ticks: "R_100"
  }));
}
let tickHistory = [];

function handleTick(tick) {
  const price = tick.quote.toFixed(2);
  const digit = price.slice(-1);
  tickHistory.push(Number(price));

  log(`Tick: ${price} (Digit: ${digit})`);

  if (tickHistory.length > 50) tickHistory.shift(); // keep only latest 50 ticks

  // Placeholder: Analyze RSI, digit patterns here
  // We'll plug in logic next step
}log("Starting Deriv bot...");
isRunning = true;
authenticate(token);
let targetDigit = 7; // You can make this dynamic later

function handleTick(tick) {
  const price = tick.quote.toFixed(2);
  const digit = Number(price.slice(-1));
  tickHistory.push(Number(price));

  log(`Tick: ${price} (Digit: ${digit})`);

  if (tickHistory.length > 50) tickHistory.shift();

  // Check Match/Differs
  if (digit === targetDigit) {
    log(`MATCH! Digit is ${digit} (target ${targetDigit})`);
    // You could trigger a MATCH trade here
  } else {
    log(`DIFFERS: Digit ${digit} ≠ ${targetDigit}`);
    // You could trigger a DIFFERS trade here
  }
}
function sendMatchContract(token, stake, digit) {
  socket.send(JSON.stringify({
    buy: 1,
    price: stake,
    parameters: {
      amount: stake,
      basis: "stake",
      contract_type: "DIGITMATCH",
      currency: "USD",
      duration: 1,
      duration_unit: "t",
      symbol: "R_100",
      barrier: digit
    }
  }));
}
sendMatchContract(token, 0.35, 7);
// Even/Odd Analysis
  if (digit % 2 === 0) {
    log(`EVEN Digit: ${digit}`);
    // Trigger Even trade here (optional)
  } else {
    log(`ODD Digit: ${digit}`);
    // Trigger Odd trade here (optional)
  }
// Over/Under Analysis (5 as mid-point)
  if (digit > 5) {
    log(`Digit OVER 5: ${digit}`);
    // Trigger Over trade here
  } else if (digit < 5) {
    log(`Digit UNDER 5: ${digit}`);
    // Trigger Under trade here
  } else {
    log(`Digit is exactly 5 (neutral)`);
  }
function calculateRSI(data, period = 14) {
  let gains = 0, losses = 0;

  for (let i = data.length - period; i < data.length - 1; i++) {
    const diff = data[i + 1] - data[i];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  const rs = averageGain / (averageLoss || 1);
  const rsi = 100 - (100 / (1 + rs));

  return rsi.toFixed(2);
}

function calculateMACD(data) {
  const ema = (arr, span) => {
    const k = 2 / (span + 1);
    return arr.reduce((acc, price, i) => {
      if (i === 0) return [price];
      acc.push(price * k +
