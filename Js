let ws, balance = 1000, stake, profitTarget, lossLimit, matchType, targetDigit, token;
let currentStake = 0.35, maxStake = 50, lossStreak = 0, lastPrice = null;

function log(msg) {
  const logBox = document.getElementById("log");
  logBox.innerText += `\n${msg}`;
  logBox.scrollTop = logBox.scrollHeight;
}

function startBot() {
  token = document.getElementById("token").value.trim();
  targetDigit = parseInt(document.getElementById("digit").value);
  matchType = document.getElementById("type").value;
  stake = parseFloat(document.getElementById("stake").value);
  profitTarget = balance + parseFloat(document.getElementById("profit").value);
  lossLimit = balance - parseFloat(document.getElementById("loss").value);
  currentStake = stake;

  log("Connecting to Deriv...");
  ws = new WebSocket("wss://ws.deriv.com/websockets/v3?app_id=1089");

  ws.onopen = () => {
    ws.send(JSON.stringify({ authorize: token }));
    ws.send(JSON.stringify({ ticks: "R_100", subscribe: 1 }));
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.tick) {
      const digit = parseInt(data.tick.quote.toString().slice(-1));
      const quote = parseFloat(data.tick.quote);
      const movement = lastPrice ? (quote > lastPrice ? "Rise" : "Fall") : "N/A";
      lastPrice = quote;

      log(`Digit: ${digit} | Movement: ${movement}`);
      evaluateTrade(digit);
    }
  };
}

function evaluateTrade(digit) {
  let isWin = false;
  if (matchType === "matches") isWin = digit === targetDigit;
  else if (matchType === "differs") isWin = digit !== targetDigit;
  else if (matchType === "over") isWin = digit > targetDigit;
  else if (matchType === "under") isWin = digit < targetDigit;

  if (isWin) {
    balance += currentStake;
    log(`WIN! Stake: $${currentStake.toFixed(2)} | Balance: $${balance.toFixed(2)}`);
    currentStake = stake;
    lossStreak = 0;
  } else {
    balance -= currentStake;
    log(`LOSS. Stake: $${currentStake.toFixed(2)} | Balance: $${balance.toFixed(2)}`);
    lossStreak++;
    currentStake = Math.min(currentStake * 2, maxStake);
  }

  if (balance >= profitTarget) {
    log("Profit target reached. Bot stopping.");
    ws.close();
  } else if (balance <= lossLimit) {
    log("Loss limit reached. Bot stopping.");
    ws.close();
  }
}
