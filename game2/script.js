const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 900;

// Box properties
const boxSize = 200;
const boxX = (canvas.width - boxSize) / 2;
const boxY = (canvas.height - boxSize) / 2;

// Player properties
const playerSize = 20;
let playerX = boxX - playerSize + 10;
let playerY = boxY + boxSize - 10;

// Animation properties
let isAnimating = false;
let animationProgress = 0;
const animationDuration = 8; // Frames
let startPlayerX, startPlayerY, targetPlayerX, targetPlayerY;
let isHorizontalAnimation = true;

// Corner positions
const corners = {
  topLeft: { x: boxX - playerSize + 10, y: boxY - playerSize + 10 },
  topRight: { x: boxX + boxSize - 10, y: boxY - playerSize + 10 },
  bottomLeft: { x: boxX - playerSize + 10, y: boxY + boxSize - 10 },
  bottomRight: { x: boxX + boxSize - 10, y: boxY + boxSize - 10 },
};

// Current corner
let currentCorner = 'bottomLeft';

// Gray dashes (cannons)
const dashes = [
  { x: boxX - 310, y: boxY - 5, width: 30, height: 10, direction: 'right', isStretching: false },
  { x: boxX + boxSize + 300, y: boxY + 195, width: 30, height: 10, direction: 'left', isStretching: false },
  { x: boxX + 195, y: boxY - 300, width: 10, height: 30, direction: 'down', isStretching: false },
  { x: boxX - 5, y: boxY + boxSize + 300, width: 10, height: 30, direction: 'up', isStretching: false },
];

// Lasers array
const lasers = [];
let laserSpeed = 5; // Starting speed of lasers
const speedIncrement = 0.1; // Increment for each laser
let score = 0; // Score counter

// Track the last cannon that fired
let lastCannonIndex = -1;

// Game state
let gameOver = false;
let gameOverAlpha = 0; // Fading effect for Game Over text

// Key press event listener
document.addEventListener('keydown', (event) => {
  if (isAnimating || gameOver) return;

  if (event.key === 'w') moveToCorner('up');
  if (event.key === 'a') moveToCorner('left');
  if (event.key === 's') moveToCorner('down');
  if (event.key === 'd') moveToCorner('right');
});

// Move to a new corner
function moveToCorner(direction) {
  let newCorner = currentCorner;
  if (currentCorner === 'bottomLeft') {
    if (direction === 'right') newCorner = 'bottomRight';
    if (direction === 'up') newCorner = 'topLeft';
  } else if (currentCorner === 'bottomRight') {
    if (direction === 'left') newCorner = 'bottomLeft';
    if (direction === 'up') newCorner = 'topRight';
  } else if (currentCorner === 'topLeft') {
    if (direction === 'right') newCorner = 'topRight';
    if (direction === 'down') newCorner = 'bottomLeft';
  } else if (currentCorner === 'topRight') {
    if (direction === 'left') newCorner = 'topLeft';
    if (direction === 'down') newCorner = 'bottomRight';
  }

  if (newCorner !== currentCorner) {
    const targetPosition = corners[newCorner];
    isHorizontalAnimation = targetPosition.x !== playerX; // Determine animation axis
    startAnimation(targetPosition);
    currentCorner = newCorner;
  }
}

// Start animation
function startAnimation(targetPosition) {
  isAnimating = true;
  animationProgress = 0;

  startPlayerX = playerX;
  startPlayerY = playerY;
  targetPlayerX = targetPosition.x;
  targetPlayerY = targetPosition.y;
}

// Update the animation
function updateAnimation() {
  if (!isAnimating) return;

  animationProgress++;
  const t = animationProgress / animationDuration;

  // Interpolate position
  playerX = startPlayerX + t * (targetPlayerX - startPlayerX);
  playerY = startPlayerY + t * (targetPlayerY - startPlayerY);

  // Calculate shrinking rectangle
  let playerWidth = playerSize;
  let playerHeight = playerSize;

  if (isHorizontalAnimation) {
    playerWidth = boxSize * (1 - t) + playerSize * t;
  } else {
    playerHeight = boxSize * (1 - t) + playerSize * t;
  }

  ctx.fillStyle = 'cyan';
  ctx.fillRect(
    playerX - (playerWidth - playerSize) / 2,
    playerY - (playerHeight - playerSize) / 2,
    playerWidth,
    playerHeight
  );

  if (animationProgress >= animationDuration) {
    isAnimating = false;
    playerX = targetPlayerX;
    playerY = targetPlayerY;
  }
}

// Animate the cannon stretching
function stretchCannon(cannon) {
  cannon.isStretching = true;
  setTimeout(() => {
    cannon.isStretching = false;
  }, 200);
}

// Draw the cannons
function drawCannons() {
  dashes.forEach((cannon) => {
    ctx.fillStyle = cannon.isStretching ? '#ff3e3e' : 'gray';
    const stretchFactor = cannon.isStretching ? 1.5 : 1;

    if (cannon.direction === 'right' || cannon.direction === 'left') {
      // Horizontal cannons now stretch along the Y-axis
      ctx.fillRect(
        cannon.x,
        cannon.y - (cannon.height * (stretchFactor - 1)) / 2,
        cannon.width,
        cannon.height * stretchFactor
      );
    } else {
      // Vertical cannons now stretch along the X-axis
      ctx.fillRect(
        cannon.x - (cannon.width * (stretchFactor - 1)) / 2,
        cannon.y,
        cannon.width * stretchFactor,
        cannon.height
      );
    }
  });
}

// Static laser (middle of the right side)
const staticLaser = {
  x: boxX + boxSize - 30, // Position at the right edge of the box
  y: boxY + boxSize / 2 - 5, // Centered vertically
  width: 100, // Same length as other lasers
  height: 10, // Laser thickness
  active: false, // Laser starts inactive
};

// Function to draw the static laser
function drawStaticLaser() {
  if (staticLaser.active) {
    ctx.fillStyle = 'red';
    ctx.fillRect(staticLaser.x, staticLaser.y, staticLaser.width, staticLaser.height);
  }
}

// Function to check when the static laser should appear/disappear
function updateStaticLaserState() {
  // Only activate after reaching 1000 points
  if (score >= 10) { 
    staticLaser.active = Math.floor(score / 10) % 2 === 1;
  } else {
    staticLaser.active = false; // Ensure it's inactive before 1000 points
  }
}

// Check collision with the static laser
function checkStaticLaserCollision() {
  if (staticLaser.active && 
      playerX < staticLaser.x + staticLaser.width &&
      playerX + playerSize > staticLaser.x &&
      playerY < staticLaser.y + staticLaser.height &&
      playerY + playerSize > staticLaser.y) {
    gameOver = true;
  }
}

// Create a laser
function shootLaser(cannon) {
  stretchCannon(cannon); // Stretch the cannon before firing
  setTimeout(() => {
    let laser = null;
    if (cannon.direction === 'right') {
      laser = {
        x: cannon.x + cannon.width,
        y: cannon.y,
        width: cannon.width * 2,
        height: cannon.height,
        dx: laserSpeed,
        dy: 0,
      };
    } else if (cannon.direction === 'left') {
      laser = {
        x: cannon.x - cannon.width * 2,
        y: cannon.y,
        width: cannon.width * 2,
        height: cannon.height,
        dx: -laserSpeed,
        dy: 0,
      };
    } else if (cannon.direction === 'down') {
      laser = {
        x: cannon.x,
        y: cannon.y + cannon.height,
        width: cannon.width,
        height: cannon.height * 2,
        dx: 0,
        dy: laserSpeed,
      };
    } else if (cannon.direction === 'up') {
      laser = {
        x: cannon.x,
        y: cannon.y - cannon.height * 2,
        width: cannon.width,
        height: cannon.height * 2,
        dx: 0,
        dy: -laserSpeed,
      };
    }
    lasers.push(laser);
    score++; // Increment the score
  }, 200); // Fire after stretching
}

// Update lasers
function updateLasers() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.x += laser.dx;
    laser.y += laser.dy;

    // Check collision with player
    if (
      playerX < laser.x + laser.width &&
      playerX + playerSize > laser.x &&
      playerY < laser.y + laser.height &&
      playerY + playerSize > laser.y
    ) {
      gameOver = true;
    }

    // Remove laser if it leaves the canvas
    if (
      laser.x < 0 ||
      laser.x > canvas.width ||
      laser.y < 0 ||
      laser.y > canvas.height
    ) {
      lasers.splice(i, 1);
    }
  }
}

// Randomly select a cannon that isn't the last one
function getNextCannon() {
  let nextCannonIndex;
  do {
    nextCannonIndex = Math.floor(Math.random() * dashes.length);
  } while (nextCannonIndex === lastCannonIndex);

  lastCannonIndex = nextCannonIndex;
  return dashes[nextCannonIndex];
}

// Game loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the main box
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxSize, boxSize);

  // Draw the player
  if (!isAnimating && !gameOver) {
    ctx.fillStyle = 'cyan';
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
  } else if (!gameOver) {
    updateAnimation();
  }

  // Draw the cannons
  drawCannons();

  // Draw the lasers
  ctx.fillStyle = 'red';
  lasers.forEach((laser) => {
    ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
  });

  // Draw the static laser
  drawStaticLaser();

 // Check for collision with static laser
 checkStaticLaserCollision();

 // Update static laser state
 updateStaticLaserState();

  // Draw the score
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score * 100}`, 10, 30);

  // Draw Game Over text
  if (gameOver) {
    gameOverAlpha = Math.min(gameOverAlpha + 0.02, 1);
    ctx.fillStyle = `rgba(255, 0, 0, ${gameOverAlpha})`;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  } else {
    updateLasers();
  }

  requestAnimationFrame(draw);
}

// Shoot lasers periodically, one cannon at a time
setInterval(() => {
  if (!gameOver) {
    const cannon = getNextCannon();
    shootLaser(cannon);
    laserSpeed += speedIncrement; // Increase laser speed slightly
  }
}, 1000);

// Start the game loop
draw();
