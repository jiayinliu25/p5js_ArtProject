// REFERENCE
// 3D Snake Game Structure by Dave Briccetti
// https://github.com/dcbriccetti/3D-Snake-Game/blob/master/lesson-3/sketch.js
// perlin noise flow map
// https://editor.p5js.org/BarneyCodes/sketches/2eES4fBEL
// Generative Noise
// https://editor.p5js.org/lomz/sketches/626EhZftR



let pos;
let direction;
let center;
let angleX = 0;
let angleY = 0;
let nextMoveTime;
let keyMappings;
let applePos;

//3d boundary setter
let cMin;
let cMax;
let zeroVector;
let segments = [];
let snakeLength = 1;

//create two color gradient
let gradientTop;
let gradientBottom;
let gradientShift = 0;

//title screen
let gameStarted = false;
let startButton;
let customFont;

//track score
let score = 0;
let scoreDisplay;

const cell_dimension = 11;
const starting_seg = 0;
const cell_center = (cell_dimension - 1) / 2;
const MS_PER_MOVE = 1000;
const SPEEDUP_FACTOR = 3;

//alternate models
let isModelA = true;
let modelA;
let modelB;

let props = [];
let propModel;
let propModel2;
let propPos2;
let propPos;
let currentProp;

//load noise
let particles = [];
const num = 1000;
const noiseScale = 0.01 / 2;


// load sound 
let currentNote = null;
let notes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
let oscillators = [];

//preload fonts and models for both snake and apple
function preload() {
  customFont = loadFont("RussoOne-Regular.ttf");
  modelA = loadModel("star_obj.obj", true);
  modelB = loadModel("star_obj2.obj", true);
  propModel = loadModel("prop1.obj", true);
  propModel2 = loadModel("prop2.obj", true);
  snakeModel = loadModel("snake_body.obj", true);
  img = loadImage("control.png");
  // preload sound 
   for (let i = 0; i < notes.length; i++) {
    oscillators[i] = new p5.Oscillator();
    oscillators[i].setType('sine');
    oscillators[i].freq(notes[i]);
    oscillators[i].amp(0); // Set amplitude to 0 initially
    oscillators[i].start();
  }
  
}

function setup() {
  const len = min(windowWidth, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  textFont(customFont);
  pos = createVector(0, 0, 0);
  zeroVector = createVector(0, 0, 0);
  direction = createVector(0, 0, 0);
  propPos = createVector(0, 0, 0);
  propPos2 = createVector(0, 0, 0);
  //snake segment
  segments = [createVector(0, 0, 0), createVector(0, 0, 0)];
  

  
  //width of the game bound
  arenaWidth = round(width * 0.5);
  cellWidth = round(arenaWidth / cell_dimension);
  center = cellWidth * cell_center;
  mapKeys();
  placeApple();
  placeProp();
 

  //everytime generate randomized two color gradient
  generateRandomGradient();

  //set game bound
  cMax = center + cellWidth / 2;
  cMin = -cMax;

  // display game score
  textFont(customFont);
  scoreDisplay = createDiv("Score: 0");
  scoreDisplay.position(10, 10);
  scoreDisplay.style("color", "white");

  // add perlin noise overlay the game
  for (let i = 0; i < num; i++) {
    particles.push(createVector(random(windowWidth), random(windowHeight)));
  }
  

  stroke(255);
  clear();

}

// main draw
function draw() {
  // if the game has not started, draw the title screen and game instructions
  if (!gameStarted) {
    drawInstructions();
  } else {
    // else move snake base on the user key input
    if (millis() > nextMoveTime) {
      moveSnake();
      nextMoveTime += keyIsDown(SHIFT)
        ? MS_PER_MOVE / SPEEDUP_FACTOR
        : MS_PER_MOVE;
    }

    background(0);
    drawArena();
    drawNoise();
    smooth();
    drawSnake();
    drawApple();
    drawProp();

   
    updateScore();
  }
}

// draw flow perlin noise that overlays the the game
function drawNoise() {
  for (let i = 0; i < num; i++) {
    let p = particles[i];
    point(p.x, p.y);
    let n = noise(
      p.x * noiseScale,
      p.y * noiseScale,
      frameCount * noiseScale * noiseScale
    );
    let a = TAU * n;
    p.x += cos(a);
    p.y += sin(a);
    if (!onScreen(p)) {
      p.x = random(width);
      p.y = random(height);
    }
  }
}

function onScreen(v) {
  return v.x >= 0 && v.x <= width && v.y >= 0 && v.y <= height;
}

// draw instructions on screen
function drawInstructions() {
  if (!startButton && !gameStarted) {
    createStartButton();

    background(0);
    drawArena();
    textAlign(CENTER, CENTER);
    textSize(100);

    text("Snake Game", 0, -150);

    textSize(24);
    fill(255);
    image(img, 0 - 150, 0 - 80, 300, 130);

    text("\nClick 'Start' to play.", 0, 70);
  }
}

// Create a start button styled with css
function createStartButton() {
  startButton = createButton("START");
  startButton.position(width / 2 - 100, height / 2 + 250);
  startButton.mousePressed(startGame);
  startButton.style("font-size", "20px");
  startButton.style("font-family", customFont);
  startButton.style("padding", "30px 60px");
  startButton.style("background-color", "rgba(172, 217, 230, 0.3)");
  startButton.style("color", "white");
  startButton.style("border", "5px solid white");
  startButton.style("border-radius", "0"); // Remove rounded corners
  startButton.style("cursor", "pointer");
}

//start game function would remove the button once clicked
function startGame() {
  gameStarted = true;
  startButton.remove();
}

// map player control
function mapKeys() {
  const v = createVector;
  const up = v(0, -1, 0);
  const down = v(0, 1, 0);
  const left = v(-1, 0, 0);
  const right = v(1, 0, 0);
  const away = v(0, 0, -1);
  const towards = v(0, 0, 1);
  keyMappings = {
    w: away,
    s: towards,
    ArrowLeft: left,
    ArrowRight: right,
    ArrowUp: up,
    ArrowDown: down,
  };
}

// draw snake game bounds, the arena drawn us8ing character mapping 
function drawArena() {
  gradientShift += 0.01;
  const cMax = center + cellWidth / 2;
  const cMin = -cMax;
  const camZ = height / 4.0 / tan((PI * 30.0) / 180.0);
  camera(0, 0, camZ, 0, 0, 0, 0, 1, 0);

  stroke("gray");
  [
    "⊤↑I", // Right horizontal
    "⊤I↑", // Vertical
    "I↑⊥", // Back horizontal
    "↑I⊥", // Vertical
    "I⊤↑", // Bottom “horizontal”
    "↑⊤I", // “Vertical”
    "I⊥↑", // Top “horizontal”
    "↑⊥I", //  “Vertical
    "⊥I↑", // Left “horizontal”
    "⊥↑I", // “Vertical”
  ].forEach((codeSet) => {
    for (let v = cMin; v <= cMax; v += cellWidth) {
      const coords = [0, 0, 0, 0, 0, 0];
      codeSet.split("").forEach((code, i) => {
        switch (code) {
          case "⊤":
            coords[i] = coords[i + 3] = cMax;
            break;
          case "⊥":
            coords[i] = coords[i + 3] = cMin;
            break;
          case "↑":
            coords[i] = coords[i + 3] = v;
            break;
          case "I":
            coords[i] = cMin;
            coords[i + 3] = cMax;
            break;
        }
      });
      // for each cord, draw gradient 
      drawGradientLine(...coords);
    }
  });
}

//generate two random color
function generateRandomGradient() {
  gradientTop = color(random(255), random(255), random(255));
  gradientBottom = color(random(255), random(255), random(255));
}

// animated shifting gradient line usin lerp and the two randomly generated color
function drawGradientLine(x1, y1, z1, x2, y2, z2) {
  for (let i = 0; i <= cellWidth; i++) {
    const inter = map(i, 0, cellWidth, 0, 1);
    const animatedShift = (gradientShift + i * 0.01) % 1;

    const c = lerpColor(gradientTop, gradientBottom, animatedShift);

    const x = lerp(x1, x2, i / cellWidth);
    const y = lerp(y1, y2, i / cellWidth);
    const z = lerp(z1, z2, i / cellWidth);

    stroke(c);
    point(x, y, z);
  }
}
// update score every collision and put score on to the screen
function updateScore() {
  scoreDisplay.html("Score: " + score);
}

// collision tracking if the snake collide with itself
function collides(pos) {
  // Check if the new position collides with the snake body
  for (let i = 0; i < segments.length; i++) {
    const segmentPos = segments[i];
    if (
      dist(pos.x, pos.y, pos.z, segmentPos.x, segmentPos.y, segmentPos.z) <
      cellWidth
    ) {
      return true;
    }
  }
  return false;
}

// collision tracking if the snake collide with apple
function collidesWithApple(pos) {
  return (
    dist(pos.x, pos.y, pos.z, applePos.x, applePos.y, applePos.z) < cellWidth
  );
}



function placeApple() {
  // Randomly place the red cube (apple) within the arena, and the apple must be within the cell of the grid 
  const randomX = floor(random(-cell_center, cell_center)) * cellWidth;
  const randomY = floor(random(-cell_center, cell_center)) * cellWidth;
  const randomZ = floor(random(-cell_center, cell_center)) * cellWidth;
  applePos = createVector(randomX, randomY, randomZ);
  //drawReferenceStructures(applePos,1);
}


// draw snake onto frame 
function drawSnake() {
  // the size of the snake must be also aligned with the grid cell 
  const segmentWidth = cellWidth * 0.9;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    //fill(i === 0 ? 255 : 0, 255, 0, 70);
    push();
    translate(segment.x, segment.y, segment.z);
    //rotateX(PI / 2);
    //rotateY(PI / 4);
    scale(0.2);
    normalMaterial();
    model(snakeModel);
    //box(map(i, 0, segments.length, segmentWidth, segmentWidth * 0.5));
    pop();
    stroke(185, 172, 230, 100);
    fill(185, 172, 230, 20);
    drawReferenceStructures(segments[0], segmentWidth);
  }
}

// provide guidelin on where the head of the snake sits within 3D space
function drawReferenceStructures(pos, objWidth) {
  const { x, y, z } = pos;
  const l = arenaWidth / 2;
  const s = -l;
  line(x, y, z, l, y, z);
  line(x, y, z, x, l, z);
  line(x, y, z, x, y, s);
  const w = objWidth;

  at(x, y, z, () => box(w, w, w));
}

//helper
function at(x, y, z, fn) {
  push();
  translate(x, y, z);
  fn();
  pop();
}

// draw "apple" with rotating animation
function drawApple() {
  push();
 
  translate(applePos.x, applePos.y, applePos.z);
  rotateX(frameCount * 0.02); // Adjust rotation speed as needed
  rotateY(frameCount * 0.02);
  const itemWidth = cellWidth * 0.8;
  
  normalMaterial();
  //drawReferenceStructures(createVector(0, 0, 0), itemWidth);

  scale(0.3);

  if (isModelA) {
    model(modelA);
  } else {
    model(modelB);
  }
  
  pop();
}

// generate random locations for the chess pieces, but their buttom will always be touching the floor 
function placeProp() {
  const randomX = floor(random(-cell_center, cell_center)) * cellWidth;

  propPos = createVector(randomX, -180, -100);
  propPos2 = createVector(randomX, -260, -100);
}

//draw prop to canvas (2) 
function drawProp() {
  push();

  rotateX(PI);
  translate(propPos.x, propPos.y + cellWidth * 0.2, propPos.z); // Adjust translation to place bottom of prop on the floor
  const propWidth = cellWidth * 0.8;

  ambientMaterial(185, 172, 230, 127); 
  scale(1.2);

  model(propModel);
  pop();

  push();
  translate(propPos2.x, propPos2.y + cellWidth * 0.2, propPos2.z);
  ambientMaterial(185, 172, 230, 127); 
  scale(0.5);
  model(propModel2);
}



// main function that check bound with snake head and move head 
function moveSnake() {
  if (!direction.equals(zeroVector)) {
    const newHeadPos = p5.Vector.add(
      segments[0],
      p5.Vector.mult(direction, cellWidth)
    );

    // Check if the new head position is within the grid bounds
    if (
      newHeadPos.x < cMin ||
      newHeadPos.x > cMax ||
      newHeadPos.y < cMin ||
      newHeadPos.y > cMax ||
      newHeadPos.z < cMin ||
      newHeadPos.z > cMax
    ) {
      // if the Snake collided with the grid bounds, reset the game
      resetGame();
    } else {
      if (collides(newHeadPos)) {
        // if Snake collided with itself, reset the game
        resetGame();
      } else {
        if (collidesWithApple(newHeadPos)) { // if the head of the snake collides with the apple, add to score, snake length, generate new apple 
          score++;
          snakeLength++;
          //use a different model of the apple  when generating the new appple 
          isModelA = !isModelA;
          placeApple();
          //generate new random gradient upon collision 
          generateRandomGradient();
           // Play three random notes consecutively when the snake collides with the apple 
          for (let i = 0; i < 3; i++) {
            // Choose a random note index
            const noteIndex = Math.floor(random(notes.length));

            // Play the selected note
            oscillators[noteIndex].amp(0.5, 0.1);

            // Stop the note after 1 second
            setTimeout(() => {
              oscillators[noteIndex].amp(0, 0.1)
            }, 1000 * (i + 1));
          }
        } else {
          segments.pop(); // Discard last seggment 
        }
        segments.unshift(newHeadPos); // Put new head on front
      }
    }
  }
}


// handle key press, play notes in the list of notes when the key is poressed 
function keyPressed() {
  const requestedDir = keyMappings[key];
  if (requestedDir) {
    const oppositeOfCurrentDir = p5.Vector.mult(direction, -1);
    if (!requestedDir.equals(oppositeOfCurrentDir)) {
      direction = requestedDir;

      // Reset the nextMoveTime every time a key is pressed
      nextMoveTime = millis();

      // Stop the current note if there is one
      if (currentNote !== null) {
        oscillators[currentNote].amp(0, 0.1);
      }

      // Choose a random note index
      const noteIndex = Math.floor(random(notes.length));

      // Play the corresponding note
      oscillators[noteIndex].amp(0.5, 0.1);
      currentNote = noteIndex;

      // Stop the note after 1 second 
      setTimeout(() => {
        oscillators[noteIndex].amp(0, 0.1);
        currentNote = null;
      }, 1000);
    }
  }
}





// draw game over screen
function drawGameOver() {
  if (!gameStarted) {
    background(0);
    drawArena();
    drawArena();
    textAlign(CENTER, CENTER);
    textSize(100);

    text("Game Over", 0, -150);
    textSize(50);
    fill(255);
  }
}

// reset game and score
function resetGame() {
  // Stop all oscillators when resetting the game
  for (let i = 0; i < oscillators.length; i++) {
    oscillators[i].amp(0, 0.1); // Set amplitude to 0 over 0.1 seconds
  }

  gameStarted = false;
  drawGameOver();
  score = 0;
  updateScore();

  createStartButton();
  setup();
}
