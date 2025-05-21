const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');

// Game constants
const LANES = 3;
const LANE_WIDTH = canvas.width / LANES;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const PLAYER_Y = canvas.height - PLAYER_HEIGHT - 10;
const PLAYER_SPEED = 1; // Not used, movement is lane-based
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPEED = 4;
const OBSTACLE_INTERVAL = 1000; // ms (1 second)

let player = {
  lane: 1, // 0: left, 1: center, 2: right
  y: PLAYER_Y,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT
};

let obstacles = [];
let lastObstacleTime = 0;
let startTime = null;
let gameOver = false;
let score = 0;

// Sound for collision
function playGameOverSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = 220;
  g.gain.value = 0.2;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => {
    o.stop();
    ctx.close();
  }, 250);
}

function laneX(lane) {
  // Center player in lane
  return lane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
}

function drawBackground() {
  // Draw background
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw lane lines
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  for (let i = 1; i < LANES; i++) {
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(i * LANE_WIDTH, 0);
    ctx.lineTo(i * LANE_WIDTH, canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPlayer() {
  const x = laneX(player.lane);
  const y = player.y;
  // Body
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
  // Head
  ctx.beginPath();
  ctx.arc(x + PLAYER_WIDTH / 2, y + 15, 15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe0b2';
  ctx.fill();
  // Face (eyes, smile)
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x + PLAYER_WIDTH / 2 - 5, y + 15, 2, 0, Math.PI * 2);
  ctx.arc(x + PLAYER_WIDTH / 2 + 5, y + 15, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + PLAYER_WIDTH / 2, y + 20, 5, 0, Math.PI);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Arms
  ctx.strokeStyle = '#ffe0b2';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 30);
  ctx.lineTo(x - 10, y + 50);
  ctx.moveTo(x + PLAYER_WIDTH, y + 30);
  ctx.lineTo(x + PLAYER_WIDTH + 10, y + 50);
  ctx.stroke();
  // Hat
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 2, y + 2, PLAYER_WIDTH - 4, 8);
  ctx.fillRect(x + 10, y - 8, PLAYER_WIDTH - 20, 10);
}

function drawObstacle(obstacle) {
  // Draw as a barrel
  ctx.save();
  ctx.translate(obstacle.x + OBSTACLE_WIDTH / 2, obstacle.y + OBSTACLE_HEIGHT / 2);
  ctx.fillStyle = '#a0522d';
  ctx.beginPath();
  ctx.ellipse(0, 0, OBSTACLE_WIDTH / 2, OBSTACLE_HEIGHT / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Barrel bands
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, OBSTACLE_WIDTH / 2.2, OBSTACLE_HEIGHT / 2.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const x = laneX(lane);
  obstacles.push({
    lane,
    x,
    y: -OBSTACLE_HEIGHT,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT
  });
}

function resetGame() {
  player.lane = 1;
  player.y = PLAYER_Y;
  obstacles = [];
  lastObstacleTime = 0;
  startTime = null;
  gameOver = false;
  score = 0;
  gameOverDiv.style.display = 'none';
  loop(performance.now());
}

function checkCollision(player, obstacle) {
  // Only check if in same lane
  if (player.lane !== obstacle.lane) return false;
  const px = laneX(player.lane);
  const py = player.y;
  return (
    px < obstacle.x + obstacle.width &&
    px + player.width > obstacle.x &&
    py < obstacle.y + obstacle.height &&
    py + player.height > obstacle.y
  );
}

function loop(timestamp) {
  if (!startTime) startTime = timestamp;
  if (gameOver) return;

  drawBackground();

  // Move obstacles
  for (let obs of obstacles) {
    obs.y += OBSTACLE_SPEED;
  }
  // Remove off-screen obstacles
  obstacles = obstacles.filter(obs => obs.y < canvas.height);

  // Spawn obstacles
  if (timestamp - lastObstacleTime > OBSTACLE_INTERVAL) {
    spawnObstacle();
    lastObstacleTime = timestamp;
  }

  // Draw player and obstacles
  drawPlayer();
  for (let obs of obstacles) {
    drawObstacle(obs);
    if (checkCollision(player, obs)) {
      gameOver = true;
      gameOverDiv.style.display = 'block';
      finalScoreSpan.textContent = `Score: ${score}`;
      playGameOverSound();
      return;
    }
  }

  // Update score
  score = Math.floor((timestamp - startTime) / 1000);
  scoreDiv.textContent = `Score: ${score}`;

  requestAnimationFrame(loop);
}

// Keyboard controls for lane movement
window.addEventListener('keydown', (e) => {
  if (gameOver && e.key === 'r') resetGame();
  if (gameOver) return;
  if (e.key === 'ArrowLeft' && player.lane > 0) {
    player.lane--;
  }
  if (e.key === 'ArrowRight' && player.lane < LANES - 1) {
    player.lane++;
  }
});

// Start game
loop(performance.now()); 