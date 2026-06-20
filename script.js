const wordSets = {
  easy: [
    'the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but',
    'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an',
    'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
  ],
  medium: [
    'program', 'function', 'variable', 'computer', 'keyboard', 'monitor',
    'database', 'network', 'internet', 'software', 'hardware', 'developer',
    'algorithm', 'language', 'project', 'system', 'process', 'method',
    'object', 'class', 'array', 'string', 'number', 'boolean', 'return',
    'import', 'export', 'module', 'library', 'framework', 'terminal',
    'compile', 'execute', 'debug', 'console', 'output', 'input', 'server',
    'client', 'request', 'response', 'browser', 'render', 'deploy', 'build'
  ],
  hard: [
    'asynchronous', 'authentication', 'implementation', 'configuration',
    'infrastructure', 'encapsulation', 'polymorphism', 'inheritance',
    'abstraction', 'optimization', 'documentation', 'architectural',
    'microservices', 'containerization', 'orchestration', 'virtualization',
    'serialization', 'deserialization', 'normalization', 'cryptography',
    'concurrency', 'parallelism', 'distributed', 'scalability', 'reliability',
    'maintainability', 'accessibility', 'responsiveness', 'interoperability',
    'electromagnetic', 'thermodynamics', 'computational', 'differentiation'
  ]
};

let difficulty = 'easy';
let testDuration = 60;
let currentText = '';
let typedChars = 0;
let errors = 0;
let timeLeft = 60;
let timer = null;
let testStarted = false;
let testEnded = false;
let history = JSON.parse(localStorage.getItem('typing-history') || '[]');
let personalBest = parseInt(localStorage.getItem('typing-pb') || '0');

function generateText() {
  const words = wordSets[difficulty];
  const count = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 50 : 40;
  let text = '';
  for (let i = 0; i < count; i++) {
    text += words[Math.floor(Math.random() * words.length)];
    if (i < count - 1) text += ' ';
  }
  return text;
}

function renderText() {
  const display = document.getElementById('textDisplay');
  display.innerHTML = currentText.split('').map((char, i) => {
    let cls = i === 0 ? 'char current' : 'char';
    return `<span class="${cls}" id="c${i}">${char === ' ' ? '&nbsp;' : char}</span>`;
  }).join('');
}

function setDifficulty(diff, btn) {
  difficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    if (['easy','medium','hard'].some(d => b.textContent.toLowerCase() === d)) {
      b.classList.remove('active');
    }
  });
  btn.classList.add('active');
  restartTest();
}

function setTime(seconds, btn) {
  testDuration = seconds;
  document.querySelectorAll('[id^="time-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  restartTest();
}

function handleInput() {
  if (testEnded) return;
  const input = document.getElementById('typingInput');
  const typed = input.value;

  if (!testStarted && typed.length > 0) {
    startTest();
  }

  typedChars = typed.length;
  errors = 0;

  typed.split('').forEach((char, i) => {
    const el = document.getElementById(`c${i}`);
    if (!el) return;
    if (char === currentText[i]) {
      el.className = 'char correct';
    } else {
      el.className = 'char incorrect';
      errors++;
    }
  });

  const nextEl = document.getElementById(`c${typed.length}`);
  if (nextEl) {
    document.querySelectorAll('.char.current').forEach(el => {
      if (!el.classList.contains('correct') && !el.classList.contains('incorrect')) {
        el.className = 'char';
      }
    });
    nextEl.className += ' current';
  }

  updateLiveStats();

  if (typed.length >= currentText.length) endTest();
}

function handleKeydown(e) {
  if (e.key === 'Tab') { e.preventDefault(); restartTest(); }
}

function startTest() {
  testStarted = true;
  timeLeft = testDuration;
  document.getElementById('timeStat').textContent = timeLeft;
  document.getElementById('timeBar').style.width = '100%';
  document.getElementById('timeBar').style.background = '#7c3aed';

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('timeStat').textContent = timeLeft;
    const pct = (timeLeft / testDuration) * 100;
    document.getElementById('timeBar').style.width = pct + '%';
    if (pct < 30) document.getElementById('timeBar').style.background = '#ef4444';
    else if (pct < 60) document.getElementById('timeBar').style.background = '#f59e0b';
    if (timeLeft <= 0) endTest();
  }, 1000);
}

function updateLiveStats() {
  const elapsed = testDuration - timeLeft;
  const minutes = elapsed / 60 || 0.0001;
  const words = typedChars / 5;
  const wpm = Math.round(words / minutes) || 0;
  const totalTyped = typedChars;
  const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;

  document.getElementById('wpmStat').textContent = wpm;
  document.getElementById('accStat').textContent = acc + '%';
  document.getElementById('errorStat').textContent = errors;
}

function endTest() {
  if (testEnded) return;
  testEnded = true;
  clearInterval(timer);

  const input = document.getElementById('typingInput');
  input.disabled = true;

  const elapsed = testDuration - timeLeft;
  const minutes = (elapsed || testDuration) / 60;
  const words = typedChars / 5;
  const wpm = Math.round(words / minutes) || 0;
  const totalTyped = typedChars;
  const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
  const isPB = wpm > personalBest;

  if (isPB) {
    personalBest = wpm;
    localStorage.setItem('typing-pb', wpm);
    document.getElementById('pbStat').textContent = wpm;
  }

  history.unshift({
    wpm, acc, errors,
    time: testDuration - timeLeft,
    difficulty,
    isPB,
    date: new Date().toLocaleString()
  });

  localStorage.setItem('typing-history', JSON.stringify(history.slice(0, 20)));

  document.getElementById('finalWpm').textContent = wpm;
  document.getElementById('finalAcc').textContent = acc + '%';
  document.getElementById('finalErrors').textContent = errors;
  document.getElementById('finalTime').textContent = (testDuration - timeLeft) + 's';

  const icon = document.getElementById('resultIcon');
  if (wpm >= 80) icon.textContent = '🏆';
  else if (wpm >= 50) icon.textContent = '🎉';
  else if (wpm >= 30) icon.textContent = '👍';
  else icon.textContent = '💪';

  if (isPB) {
    document.getElementById('pbBanner').classList.remove('hidden');
  }

  document.getElementById('resultModal').classList.remove('hidden');
  renderHistory();
}

function restartTest() {
  clearInterval(timer);
  testStarted = false;
  testEnded = false;
  typedChars = 0;
  errors = 0;
  timeLeft = testDuration;

  currentText = generateText();
  renderText();

  const input = document.getElementById('typingInput');
  input.value = '';
  input.disabled = false;
  input.focus();

  document.getElementById('wpmStat').textContent = '0';
  document.getElementById('accStat').textContent = '100%';
  document.getElementById('timeStat').textContent = testDuration;
  document.getElementById('errorStat').textContent = '0';
  document.getElementById('pbStat').textContent = personalBest || '—';
  document.getElementById('timeBar').style.width = '100%';
  document.getElementById('timeBar').style.background = '#7c3aed';
  document.getElementById('resultModal').classList.add('hidden');
  document.getElementById('pbBanner').classList.add('hidden');
}

function closeResult() {
  document.getElementById('resultModal').classList.add('hidden');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (history.length === 0) {
    list.innerHTML = '<div class="history-empty">No tests yet — take your first test!</div>';
    return;
  }
  list.innerHTML = history.slice(0, 8).map(h => `
    <div class="history-item">
      <span class="history-wpm">${h.wpm} WPM</span>
      <span class="history-meta">${h.acc} accuracy · ${h.errors} errors · ${h.difficulty}</span>
      ${h.isPB ? '<span class="history-pb">🏆 PB</span>' : ''}
      <span class="history-time">${h.date}</span>
    </div>`).join('');
}

function clearHistory() {
  history = [];
  localStorage.setItem('typing-history', JSON.stringify([]));
  renderHistory();
}

window.onload = () => {
  currentText = generateText();
  renderText();
  document.getElementById('pbStat').textContent = personalBest || '—';
  renderHistory();
  document.getElementById('textDisplay').addEventListener('click', () => {
    document.getElementById('typingInput').focus();
  });
};