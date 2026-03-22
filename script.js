async function analyze(){
let pair = document.getElementById("pair").value;
document.getElementById("result").innerHTML = "Analyzing market...";
let bullish = Math.floor(Math.random()*40)+50;
let bearish = 100-bullish;
setTimeout(()=>{
document.getElementById("result").innerHTML = `
market: ${pair} <br><br>
bullish probability: ${bullish}% <br>
bearish probability: ${bearish}% <br><br>
Al prediction: ${bullish > bearish ? "UP TREND" : "DOWN TREND"}
';
},1500)
}
