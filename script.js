// ===== CONFIG =====
const proxy = "https://corsproxy.io/?";

const pairSelect = document.getElementById("pair");
const searchInput = document.getElementById("search");
const loading = document.getElementById("loading");
const resultDiv = document.getElementById("result");

let allPairs = [];

// ===== LOAD PAIRS =====
async function loadPairs() {
  try {
    loading.innerText = "Loading pairs...";

    const res = await fetch(proxy + "https://api.binance.com/api/v3/exchangeInfo");
    const data = await res.json();

    allPairs = data.symbols
      .filter(s => s.status === "TRADING" && s.symbol.endsWith("USDT"))
      .map(s => s.symbol);

    renderPairs(allPairs);
    loading.innerText = "";

  } catch (err) {
    console.error(err);
    loading.innerText = "Error loading pairs ⚠️";
  }
}

function renderPairs(pairs) {
  pairSelect.innerHTML = pairs.map(p => `<option>${p}</option>`).join("");
}

// ===== SEARCH =====
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = allPairs.filter(p => p.toLowerCase().includes(value));
  renderPairs(filtered);
});

// ===== ANALYZE =====
async function analyze() {
  try {
    const pair = pairSelect.value;
    if (!pair) return;

    loading.innerText = "Analyzing...";
    resultDiv.innerHTML = "";

    const res = await fetch(
      proxy + `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=5m&limit=100`
    );

    const data = await res.json();

    if (!data || data.length === 0) {
      loading.innerText = "No data!";
      return;
    }

    const closes = data.map(c => parseFloat(c[4]));

    const rsi = calculateRSI(closes, 14);
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const macd = calculateMACD(closes);

    let bullish = 0;
    let bearish = 0;

    // RSI
    if (rsi < 30) bullish++;
    else if (rsi > 70) bearish++;

    // EMA
    if (ema9 > ema21) bullish++;
    else bearish++;

    // Trend
    const trendUp = closes[closes.length - 1] > closes[closes.length - 10];
    if (trendUp) bullish++;
    else bearish++;

    // MACD
    if (macd > 0) bullish++;
    else bearish++;

    const total = bullish + bearish;

    const bullishPerc = ((bullish / total) * 100).toFixed(2);
    const bearishPerc = ((bearish / total) * 100).toFixed(2);

    resultDiv.innerHTML = `
      <h4>${pair}</h4>
      <p>RSI: ${rsi.toFixed(2)}</p>
      <p>EMA 9: ${ema9.toFixed(2)}</p>
      <p>EMA 21: ${ema21.toFixed(2)}</p>
      <p>MACD: ${macd.toFixed(4)}</p>
      <p style="color:lightgreen;">Bullish: ${bullishPerc}%</p>
      <p style="color:red;">Bearish: ${bearishPerc}%</p>
      <h3>${bullish > bearish ? "UP TREND 📈" : "DOWN TREND 📉"}</h3>
    `;

    loading.innerText = "";

  } catch (err) {
    console.error(err);
    loading.innerText = "Error loading data ⚠️";
  }
}

// ===== EMA =====
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data[0];

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }

  return ema;
}

// ===== RSI =====
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

// ===== MACD =====
function calculateMACD(data) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  return ema12 - ema26;
}

// ===== AUTO REFRESH =====
setInterval(() => {
  if (pairSelect.value) analyze();
}, 15000);

// ===== INIT =====
loadPairs();
