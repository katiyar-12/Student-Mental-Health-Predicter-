const API_URL = "https://student-mental-health-predicter-3.onrender.com";
const CIRC = 2 * Math.PI * 86; // gauge circumference
const MAX_SCORE = 10;          // assumed scale of the model's output

const OPTIONS = {
  Gender: ["Male", "Female"],
  grouped_country: ["India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France", "Spain", "Other"],
  Academic_Level: ["Undergraduate", "Graduate", "High School"],
  Most_Used_Platform: ["Instagram", "TikTok", "YouTube", "WhatsApp", "Facebook", "Snapchat", "Twitter", "LinkedIn", "WeChat", "LINE", "KakaoTalk", "VKontakte"],
  Purpose_Of_Use: ["Entertainment", "Networking", "Education", "News"],
  Stress_Level: ["Low", "Medium", "High", "Very High"]
};
const DEFAULTS = { Gender: "Male", grouped_country: "India", Academic_Level: "Undergraduate",
  Most_Used_Platform: "Instagram", Purpose_Of_Use: "Education", Stress_Level: "Medium" };

const $ = id => document.getElementById(id);
const form = $("form"), submitBtn = $("submit"), spinner = submitBtn.querySelector(".spinner"),
      btnLabel = submitBtn.querySelector(".label"), errorBox = $("error"), result = $("result"),
      bar = $("bar"), scoreNum = $("scoreNum"), badge = $("badge"), message = $("message");

// Fill dropdowns
for (const [id, list] of Object.entries(OPTIONS)) {
  $(id).innerHTML = list.map(v => `<option value="${v}">${v}</option>`).join("");
  $(id).value = DEFAULTS[id];
}

function level(score) {
  const s = score / MAX_SCORE * 10;
  if (s >= 7.5) return ["good", "Healthy", "Your habits point to a healthy balance. Keep it up."];
  if (s >= 5.5) return ["mid", "Moderate", "A few habits, such as sleep or screen time, could be improved."];
  return ["bad", "At risk", "Consider more sleep, activity and screen breaks. Reach out to someone you trust if you feel overwhelmed."];
}

function animateNumber(to) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { scoreNum.textContent = to.toFixed(2); return; }
  const t0 = performance.now(), dur = 1200;
  (function frame(now) {
    const t = Math.min((now - t0) / dur, 1);
    scoreNum.textContent = (to * (1 - Math.pow(1 - t, 3))).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  })(t0);
}

function showScore(score) {
  const [lvl, label, text] = level(score);
  result.dataset.level = lvl;
  badge.textContent = label;
  message.textContent = text;
  bar.style.strokeDashoffset = CIRC * (1 - Math.min(Math.max(score / MAX_SCORE, 0), 1));
  animateNumber(score);
  result.classList.remove("pop"); void result.offsetWidth; result.classList.add("pop");
}

function setLoading(on) {
  submitBtn.disabled = on;
  spinner.hidden = !on;
  btnLabel.textContent = on ? "Predicting…" : "Predict score";
}

function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }

function readPayload() {
  const num = id => parseFloat($(id).value);
  return {
    Age: parseInt($("Age").value, 10),
    Gender: $("Gender").value,
    grouped_country: $("grouped_country").value,
    Academic_Level: $("Academic_Level").value,
    Most_Used_Platform: $("Most_Used_Platform").value,
    Purpose_Of_Use: $("Purpose_Of_Use").value,
    Avg_Daily_Usage_Hours: num("Avg_Daily_Usage_Hours"),
    Daily_Unlocks: parseInt($("Daily_Unlocks").value, 10),
    Study_Hours: num("Study_Hours"),
    Physical_Activity_Hours: num("Physical_Activity_Hours"),
    Sleep_Hours_Per_Night: num("Sleep_Hours_Per_Night"),
    Stress_Level: $("Stress_Level").value
  };
}

// Check numeric fields against the same rules as the API
function validate() {
  let ok = true;
  form.querySelectorAll("input").forEach(i => {
    const v = parseFloat(i.value), min = parseFloat(i.min), max = i.max ? parseFloat(i.max) : Infinity;
    const bad = isNaN(v) || v < min || v > max;
    i.classList.toggle("invalid", bad);
    if (bad) ok = false;
  });
  return ok;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  errorBox.hidden = true;
  if (!validate()) return showError("Some values are out of range. Hours must be above 0 and below 24, age between 11 and 100, unlocks at least 1.");

  setLoading(true);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readPayload())
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const d = Array.isArray(body.detail) ? body.detail[0] : null;
      throw new Error(d ? `${d.loc.slice(1).join(".")}: ${d.msg}` : `Server error (${res.status}).`);
    }
    const data = await res.json();
    showScore(data.predicted_mental_health_score);
  } catch (err) {
    showError(err instanceof TypeError
      ? `Can't reach the API at ${API_URL}. Make sure the FastAPI server is running.`
      : err.message);
  } finally {
    setLoading(false);
  }
});

form.addEventListener("input", e => e.target.classList.remove("invalid"));