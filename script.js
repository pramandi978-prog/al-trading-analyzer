<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Trading Analyzer</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container text-center mt-5">
    <h1>AI Forex & Crypto Analyzer</h1>

    <input type="text" id="search" placeholder="Search pair..." class="form-control w-25 mx-auto mt-3">

    <select id="pair" class="form-select w-25 mx-auto mt-3"></select>

    <button class="btn btn-primary mt-3" onclick="analyze()">Analyze</button>

    <div id="loading" class="mt-3"></div>

    <div id="result" class="mt-4"></div>
  </div>

  <script src="script.js"></script>
</body>
</html>


/* style.css */
body {
  background: #0b0f19;
  color: white;
  font-family: Arial;
}

#result {
  background: #111827;
  padding: 20px;
  border-radius: 10px;
}


// script.js
const pairSelect = document.getElementById("pair");
const searchInput = document.getElementById("search");

async function loadPairs() {
  const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await res.json();

  const pairs = data.symbols
    .filter(s => s.status === "TRADING" && s.symbol.endsWith("USDT"))
    .map(s => s.symbol);

  pairSelect.innerHTML = pairs.map(p => `<option>${p}</option>`).join("");

  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    pairSelect.innerHTML = pairs
      .filter(p => p.toLowerCase().includes(value))
      .map(p => `<option>${p}</option>`)
      .join("");
  });
}

async function analyze() {
  const pair = pairSelect.value;
  document.getElementById("loading").innerText = "Analyzing...";

  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=5m&limit=100`);
  const data = await res.json();

  const closes = data.map(c => parseFloat(c[4]));

  const rsi = calculateRSI(closes, 14);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  let bullish = 0;
  let bearish = 0;

  if (rsi < 30) bullish++;
  if (rsi > 70) bearish++;

  if (ema9 > ema21) bullish++;
  else bearish++;

  const trend = closes[closes.length - 1] > closes[closes.length - 10];
  if (trend) bullish++;
  else bearish++;

  const total = bullish + bearish;

  const bullishPerc = ((bullish / total) * 100).toFixed(2);
  const bearishPerc = ((bearish / total) * 100).toFixed(2);

  const result = document.getElementById("result");

  result.innerHTML = `
    <h4>${pair}</h4>
    <p>RSI: ${rsi.toFixed(2)}</p>
    <p>EMA 9: ${ema9.toFixed(2)}</p>
    <p>EMA 21: ${ema21.toFixed(2)}</p>
    <p>Bullish: ${bullishPerc}%</p>
    <p>Bearish: ${bearishPerc}%</p>
    <h3>${bullish > bearish ? "UP TREND 📈" : "DOWN TREND 📉"}</h3>
  `;

  document.getElementById("loading").innerText = "";
}

function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(data, period) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

loadPairs();

// Auto refresh every 15 sec
setInterval(() => {
  if (pairSelect.value) analyze();
}, 15000);
