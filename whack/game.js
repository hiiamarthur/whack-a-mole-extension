const grid = document.getElementById('grid');

for (let i = 0; i < 9; i++) {
  const hole = document.createElement('div');
  hole.className = 'hole';
  hole.dataset.index = i;
  
  // Calculate row and assign z-index based on row position
  const row = Math.floor(i / 3); // 0, 1, or 2
  const zIndex = (row + 1) * 10; // 10, 20, or 30
  hole.dataset.row = row;
  hole.dataset.zIndex = zIndex;
  
  grid.appendChild(hole);
}

let score = 0;
const scoreDisplay = document.getElementById('score');
const activeHoles = new Set(); // Track which holes have active moles

function randomHole() {
  const holes = document.querySelectorAll('.hole');
  const index = Math.floor(Math.random() * holes.length);
  return holes[index];
}

function getRandomMoleType() {
  const random = Math.random();
  if (random < 0.6) {
    return 'normal'; // 60% chance for normal mole
  } else if (random < 0.85) {
    return 'super'; // 25% chance for super mole
  } else {
    return 'bomb'; // 15% chance for bomb mole
  }
}

async function showMole() {
  const hole = randomHole();
  const holeIndex = parseInt(hole.dataset.index);
  
  // Check if the hole already has an active mole
  if (activeHoles.has(holeIndex)) {
    return; // Skip this iteration if hole already has a mole
  }
  
  const moleType = getRandomMoleType();
  const mole = document.createElement('img');
  mole.className = 'mole';
  
  // Set different classes and colors based on mole type
  switch (moleType) {
    case 'super':
      mole.classList.add('super-mole');
      mole.style.backgroundColor = '#e74c3c'; // Red color for super mole
      let superMoleUrl = 'icons/xmark-solid.svg';
      let localSupermole = localStorage.getItem('customSuperMole');
   
      if(window.sharedState && window.customSuperMoleUrl) {

        superMoleUrl = window.customSuperMoleUrl; 
      } else if(localSupermole){
    
        superMoleUrl = localSupermole;
      }
      mole.setAttribute('src', superMoleUrl);
      mole.title = '+2 points';
      break;
    case 'bomb':
      mole.classList.add('bomb-mole');
      mole.style.backgroundColor = '#green'; // Dark gray for bomb mole
      let bombUrl = 'icons/mug-hot-solid.svg';
      let localBomb = localStorage.getItem('customBomb');
      if(window.sharedState && window.customBombUrl) {
        bombUrl = window.customBombUrl; 
      } else if(localBomb){
        bombUrl = localBomb;
      }
      mole.setAttribute('src', bombUrl);
      mole.title = '-1 point';
      break;
    default:
      mole.style.backgroundColor = 'orange';
      let moleUrl = 'icons/bug-solid.svg';
      let localMole = localStorage.getItem('customMole');
      if(window.sharedState && window.customMoleUrl) {
        moleUrl = window.customMoleUrl; 
      } else if(localMole){
        moleUrl = localMole;
      }
      mole.setAttribute('src', moleUrl);
      mole.title = '+1 point';
  }
  
  mole.onclick = () => {
    let points = 1;
    switch (moleType) {
      case 'super':
        points = 2;
        break;
      case 'bomb':
        points = -1;
        break;
    }
    
    score += points;
    updateScore(score);
    if (scoreDisplay) {
      scoreDisplay.textContent = score;
    }
    
    // Play hit sound based on mole type
    if (window.soundManager) {
      window.soundManager.playHitSound(moleType);
    }
    
    // Hammer click animation
    document.body.style.cursor = 'url("images/minimal-hammer-pointer-clicked.png"), pointer';
    setTimeout(() => {
      document.body.style.cursor = 'url("images/minimal-hammer-pointer.png"), auto';
    }, 150);
    
    // Show points animation
    showPointsAnimation(mole, points);
    
    // Remove from active holes and remove the mole
    activeHoles.delete(holeIndex);
    mole.remove();
  };
  
  // Get the grid and hole positions
  const grid = document.getElementById('grid');
  const gridRect = grid.getBoundingClientRect();
  const holeRect = hole.getBoundingClientRect();
  
  // Calculate the relative position within the grid (0-1 range)
  const gridWidth = gridRect.width;
  const gridHeight = gridRect.height;
  const relativeX = (holeRect.left - gridRect.left) / gridWidth;
  const relativeY = (holeRect.top - gridRect.top) / gridHeight;
  
  // Apply 3D perspective correction for 60-degree rotation
  // Different rows need different corrections due to perspective distortion
  const angleRad = 60 * Math.PI / 180;
  const baseY = holeRect.top;
  
  // Calculate perspective correction based on row position
  // Top row needs more correction, bottom row needs less
  let perspectiveCorrection;
  if (relativeY < 0.33) {
    // Top row - needs more upward correction
    perspectiveCorrection = 25;
  } else if (relativeY > 0.66) {
    // Bottom row - needs less correction
    perspectiveCorrection = 5;
  } else {
    // Middle row - moderate correction
    perspectiveCorrection = 15;
  }
  
  // Calculate X position correction based on column position
  // Left column needs to move right, right column needs to move left
  let xCorrection = 0;
  // Middle column stays centered (xCorrection = 0)
  
  // Calculate the visual center
  const centerX = holeRect.left + holeRect.width / 2 + xCorrection;
  const centerY = baseY + holeRect.height / 2 - perspectiveCorrection;
  
  mole.style.position = 'fixed';
  mole.style.left = `${centerX - 30}px`; // Center the 60px mole
  mole.style.top = `${centerY - 30}px`; // Center the 60px mole
  mole.style.zIndex = hole.dataset.zIndex; // Use inherited z-index from hole
  
  // Add to active holes and append to document
  activeHoles.add(holeIndex);
  document.body.appendChild(mole);
  
  // Remove the mole after a random time (1-3 seconds)
  setTimeout(() => {
    if (mole.parentNode) {
      activeHoles.delete(holeIndex);
      mole.remove();
    }
  }, Math.random() * 2000 + 1000);
}

function showPointsAnimation(mole, points) {
  const pointsDiv = document.createElement('div');
  pointsDiv.className = 'points-animation';
  pointsDiv.textContent = points > 0 ? `+${points}` : `${points}`;
  pointsDiv.style.color = points > 0 ? '#27ae60' : '#e74c3c';
  
  // Get the mole's position on screen
  const moleRect = mole.getBoundingClientRect();
  const centerX = moleRect.left + moleRect.width / 2;
  const centerY = moleRect.top + moleRect.height / 2;
  
  // Position the points text at the mole's screen position
  pointsDiv.style.left = `${centerX}px`;
  pointsDiv.style.top = `${centerY}px`;
  pointsDiv.style.transform = 'translate(-50%, -50%)';
  
  document.body.appendChild(pointsDiv);
  
  // Animate the points text
  let position = 0;
  const animation = setInterval(() => {
    position += 3;
    pointsDiv.style.top = `${centerY - position}px`;
    pointsDiv.style.opacity = 1 - (position / 60);
    
    if (position >= 60) {
      clearInterval(animation);
      pointsDiv.remove();
    }
  }, 50);
}

// Show moles at random intervals (0.5 to 2 seconds)
function scheduleNextMole() {
  const delay = Math.random() * 1500 + 500;
  setTimeout(() => {
    showMole();
    scheduleNextMole();
  }, delay);
}

// Start the game
scheduleNextMole();

// Global hammer cursor click animation
document.addEventListener('click', function() {
  document.body.style.cursor = 'url("images/minimal-hammer-pointer-clicked.png"), pointer';
  setTimeout(() => {
    document.body.style.cursor = 'url("images/minimal-hammer-pointer.png"), auto';
  }, 150);
});
