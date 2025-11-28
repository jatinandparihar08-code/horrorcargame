// game.js - Full updated with horror emoji obstacles and animations
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restart');
const bgMusic = document.getElementById('bgMusic');
const crashSound = document.getElementById('crashSound');

const LANE_WIDTH = 80;
const LANES = 4;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 80;
const OBSTACLE_SIZE = 60;

let gameState = {
  score: 0,
  level: 0,
  currentLane: 1,
  gameSpeed: 2,
  gameRunning: true,
  obstacles: [],
  lastObstacleTime: 0,
  keys: {},
  shakeX: 0,
  shakeY: 0,
  particles: []
};

const levels = [
  { speed: 2, spawnRate: 1800, name: 'Slow' },
  { speed: 4, spawnRate: 1400, name: 'Medium' },
  { speed: 6, spawnRate: 1000, name: 'Fast' },
  { speed: 8, spawnRate: 700, name: 'Insane' }
];

// Music control
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play().catch(e => console.log('Music autoplay blocked'));
  } else {
    bgMusic.pause();
  }
}

// Input handling
window.addEventListener('keydown', (e) => {
  gameState.keys[e.key] = true;
  if (e.key === ' ') toggleMusic();
});
window.addEventListener('keyup', (e) => {
  gameState.keys[e.key] = false;
});

restartBtn.addEventListener('click', initGame);

function initGame() {
  gameState = {
    score: 0,
    level: 0,
    currentLane: 1,
    gameSpeed: 2,
    gameRunning: true,
    obstacles: [],
    lastObstacleTime: 0,
    keys: {},
    shakeX: 0,
    shakeY: 0,
    particles: []
  };
  gameOverEl.classList.add('hidden');
  bgMusic.play().catch(e => {});
  updateUI();
  gameLoop();
}

function updateUI() {
  levelEl.textContent = gameState.level + 1;
  scoreEl.textContent = gameState.score;
  speedEl.textContent = levels[gameState.level].name;
}

function handleInput() {
  if (!gameState.gameRunning) return;

  if (gameState.keys['ArrowLeft'] && gameState.currentLane > 0) {
    gameState.currentLane--;
    gameState.keys['ArrowLeft'] = false;
    createLaneChangeEffect();
  }
  if (gameState.keys['ArrowRight'] && gameState.currentLane < LANES - 1) {
    gameState.currentLane++;
    gameState.keys['ArrowRight'] = false;
    createLaneChangeEffect();
  }

  if (gameState.keys['ArrowUp'] && gameState.level < levels.length - 1) {
    gameState.level++;
    gameState.gameSpeed = levels[gameState.level].speed;
    gameState.keys['ArrowUp'] = false;
  }
  if (gameState.keys['ArrowDown'] && gameState.level > 0) {
    gameState.level--;
    gameState.gameSpeed = levels[gameState.level].speed;
    gameState.keys['ArrowDown'] = false;
  }
}

function createLaneChangeEffect() {
  for (let i = 0; i < 10; i++) {
    gameState.particles.push({
      x: gameState.currentLane * LANE_WIDTH + 40 + (Math.random() - 0.5) * 80,
      y: canvas.height - 50,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 3 - 2,
      life: 30,
      maxLife: 30
    });
  }
}

function spawnObstacle() {
  const now = Date.now();
  const levelConfig = levels[gameState.level];
  
  if (now - gameState.lastObstacleTime > levelConfig.spawnRate) {
    const lane = Math.floor(Math.random() * LANES);
    gameState.obstacles.push({
      lane: lane,
      y: -OBSTACLE_SIZE,
      x: lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_SIZE) / 2 + 40,
      rot: 0,
      scale: 1
    });
    gameState.lastObstacleTime = now;
  }
}

function updateObstacles() {
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obs = gameState.obstacles[i];
    obs.y += gameState.gameSpeed;
    obs.rot += 0.1;
    obs.scale = 0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2;
    
    if (obs.y > canvas.height) {
      gameState.obstacles.splice(i, 1);
      gameState.score += 10;
      createPassEffect(obs.x, obs.y);
      continue;
    }
    
    const carX = gameState.currentLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2 + 40;
    const carY = canvas.height - CAR_HEIGHT - 20;
    
    if (obs.x < carX + CAR_WIDTH &&
        obs.x + OBSTACLE_SIZE > carX &&
        obs.y < carY + CAR_HEIGHT &&
        obs.y + OBSTACLE_SIZE > carY) {
      gameOver();
    }
  }
}

function createPassEffect(x, y) {
  for (let i = 0; i < 5; i++) {
    gameState.particles.push({
      x: x + Math.random() * OBSTACLE_SIZE,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      life: 20,
      maxLife: 20,
      color: '#ff6666'
    });
  }
}

function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vy += 0.1;
    
    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

function gameOver() {
  gameState.gameRunning = false;
  finalScoreEl.textContent = gameState.score;
  gameOverEl.classList.remove('hidden');
  crashSound.play().catch(e => {});
  bgMusic.pause();
  
  // Screen shake effect
  gameState.shakeX = 10;
  gameState.shakeY = 10;
}

function drawRoad() {
  ctx.save();
  ctx.translate(gameState.shakeX * 0.1, gameState.shakeY * 0.1);
  
  ctx.fillStyle = '#111';
  ctx.fillRect(40, 0, LANE_WIDTH * LANES, canvas.height);
  
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(40 + i * LANE_WIDTH, 0);
    ctx.lineTo(40 + i * LANE_WIDTH, canvas.height);
    ctx.stroke();
  }
  
  const time = Date.now() * 0.01;
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 5;
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 10;
  
  ctx.setLineDash([25, 25]);
  ctx.lineDashOffset = -time * 5;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(40 + i * LANE_WIDTH, 0);
    ctx.lineTo(40 + i * LANE_WIDTH, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  
  ctx.restore();
}

function drawPlayerCar() {
  const x = gameState.currentLane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2 + 40;
  const y = canvas.height - CAR_HEIGHT - 20;
  
  ctx.save();
  ctx.translate(gameState.shakeX * 0.3, gameState.shakeY * 0.3);
  
  ctx.fillStyle = '#440000';
  ctx.shadowColor = '#880000';
  ctx.shadowBlur = 8;
  ctx.fillRect(x, y, CAR_WIDTH, CAR_HEIGHT);
  
  ctx.shadowBlur = 0;
  ctx.fillStyle = `hsl(0, 100%, ${40 + Math.sin(Date.now() * 0.01) * 10}%)`;
  ctx.fillRect(x + 5, y + 10, CAR_WIDTH - 10, 20);
  ctx.fillRect(x + 5, y + CAR_HEIGHT - 30, CAR_WIDTH - 10, 20);
  
  const headlightIntensity = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
  ctx.fillStyle = `rgba(255, 255, 136, ${headlightIntensity})`;
  ctx.shadowColor = '#ffff88';
  ctx.shadowBlur = 15;
  ctx.fillRect(x + 8, y - 15, 12, 15);
  ctx.fillRect(x + CAR_WIDTH - 20, y - 15, 12, 15);
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

// Updated obstacle drawing to horror emojis
function drawObstacles() {
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const horrorEmojis = ['💀', '🩸', '👻', '🕷️', '🧟‍♂️'];

  gameState.obstacles.forEach((obs, index) => {
    ctx.save();
    ctx.translate(obs.x + OBSTACLE_SIZE / 2, obs.y + OBSTACLE_SIZE / 2);
    ctx.rotate(obs.rot);
    ctx.scale(obs.scale, obs.scale);

    const emoji = horrorEmojis[index % horrorEmojis.length];

    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 50, 50, 0.95)';
    ctx.fillText(emoji, 0, 0);

    ctx.restore();
  });
}

function drawParticles() {
  gameState.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color || '#ff4444';
    ctx.shadowColor = '#ff6666';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawUI() {
  ctx.save();
  ctx.translate(gameState.shakeX * 0.1, gameState.shakeY * 0.1);
  
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, 40, canvas.height);
  ctx.fillRect(40 + LANE_WIDTH * LANES, 0, 40, canvas.height);
  
  ctx.fillStyle = 'rgba(150, 0, 0, 0.1)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(
      20 + Math.random() * 20,
      100 + i * 120 + Math.sin(Date.now() * 0.005 + i) * 10,
      30 + Math.random() * 20,
      0, Math.PI * 2
    );
    ctx.fill();
  }
  
  ctx.restore();
  
  gameState.shakeX *= 0.9;
  gameState.shakeY *= 0.9;
}

function gameLoop() {
  if (!gameState.gameRunning) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  handleInput();
  spawnObstacle();
  updateObstacles();
  updateParticles();
  
  drawUI();
  drawRoad();
  drawParticles();
  drawObstacles();
  drawPlayerCar();
  
  updateUI();
  
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
  toggleMusic();
  initGame();
});
