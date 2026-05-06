var mode = 0;
let splash;
let splashHidden = false;

let gameState = "start";
let score = 0;
let startTime = 0;
let gameDuration = 60;

let circles = [];
let bursts = [];

let audioStarted = false;
let audioCtx;
let masterGain;

let phase = 1;

let majorProgression = [
  [261.63, 329.63, 392.0, 523.25],
  [196.0, 246.94, 293.66, 392.0],
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23]
];

let minorProgression = [
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23],
  [196.0, 246.94, 293.66, 392.0],
  [164.81, 196.0, 246.94, 329.63]
];

let dorianProgression = [
  [293.66, 349.23, 440.0, 523.25],
  [329.63, 392.0, 493.88, 587.33],
  [349.23, 440.0, 523.25, 659.25],
  [392.0, 493.88, 587.33, 698.46]
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");

  splash = new Splash();

  audioCtx = getAudioContext();
  getAudioContext().suspend();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.48;
  masterGain.connect(audioCtx.destination);
}

function draw() {
  if (mode == 0) {
    return;
  }

  updatePhase();
  drawBackground();

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "play") {
    runGame();
  } else if (gameState === "end") {
    drawEndScreen();
  }

  for (let i = bursts.length - 1; i >= 0; i--) {
    bursts[i].update();
    bursts[i].display();
    if (bursts[i].done()) bursts.splice(i, 1);
  }
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;
  }

  if (mode == 0) {
    if (splash.update() == true) {
      mode = 1;

      if (!splashHidden) {
        splash.hide();
        splashHidden = true;
      }
    }
    return;
  }

  if (gameState === "start") {
    if (overButton(width / 2, height / 2 + 150, 190, 58)) {
      startGame();
    }
    return;
  }

  if (gameState === "end") {
    if (overButton(width / 2, height / 2 + 105, 220, 58)) {
      startGame();
    }
    return;
  }

  if (gameState !== "play") return;

  for (let i = circles.length - 1; i >= 0; i--) {
    if (circles[i].contains(mouseX, mouseY)) {
      let tx = circles[i].x;
      let ty = circles[i].y;
      let tr = circles[i].r;

      circles.splice(i, 1);
      score++;
      updatePhase();

      playHitSound(tx);
      addMusicLayer(tx);

      bursts.push(new Burst(tx, ty, tr));
      circles.push(new Target());
      break;
    }
  }
}

function updatePhase() {
  if (score >= 70) phase = 3;
  else if (score >= 30) phase = 2;
  else phase = 1;
}

function drawBackground() {
  background(0);

  if (phase === 2 && gameState === "play") {
    noFill();
    stroke(160, 0, 0, 180);
    strokeWeight(10);
    rect(5, 5, width - 10, height - 10);

    stroke(255, 0, 0, 70);
    strokeWeight(2);
    rect(22, 22, width - 44, height - 44);
  }

  if (phase === 3 && gameState === "play") {
    noFill();
    stroke(255);
    strokeWeight(10);
    rect(5, 5, width - 10, height - 10);

    stroke(255, 180);
    strokeWeight(2);
    rect(22, 22, width - 44, height - 44);
  }
}

function drawStartScreen() {
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(64);
  text("Six Shot", width / 2, height / 2 - 120);

  fill(255);
  textSize(24);
  text("Yichen Liu", width / 2, height / 2 - 60);

  fill(180);
  textSize(15);
  text("https://editor.p5js.org/17790015728/full/brNXGr4Rx", width / 2, height / 2 - 28);

  fill(255, 210);
  textSize(18);
  text(
    "An aim-style six-target reaction game.\nPhase 2 begins after 30 hits. Final Phase begins after 70 hits.",
    width / 2,
    height / 2 + 35
  );

  fill(255, 170);
  textSize(15);
  text("60 seconds • 6 targets • musical layers", width / 2, height / 2 + 90);

  drawButton(width / 2, height / 2 + 150, 190, 58, "START");
}

function runGame() {
  let elapsed = floor((millis() - startTime) / 1000);
  let timeLeft = gameDuration - elapsed;

  if (timeLeft <= 0) {
    gameState = "end";
    return;
  }

  while (circles.length < 6) {
    circles.push(new Target());
  }

  for (let i = 0; i < circles.length; i++) {
    circles[i].display();
  }

  drawHUD(timeLeft);
}

function drawHUD(timeLeft) {
  noStroke();

  fill(255);
  textAlign(LEFT, TOP);
  textSize(24);
  text("Score", 24, 18);
  textSize(36);
  text(score, 24, 44);

  textAlign(CENTER, TOP);
  textSize(20);

  if (phase === 1) {
    fill(220);
    text("PHASE 1", width / 2, 24);
  } else if (phase === 2) {
    fill(255, 40, 40);
    text("PHASE 2", width / 2, 24);
  } else {
    fill(255);
    text("FINAL PHASE", width / 2, 24);
  }

  fill(255);
  textAlign(RIGHT, TOP);
  textSize(24);
  text("Time", width - 24, 18);
  textSize(36);
  text(timeLeft, width - 24, 44);
}

function drawEndScreen() {
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(56);
  text("Finished", width / 2, height / 2 - 75);

  textSize(30);
  text("Final Score: " + score, width / 2, height / 2);

  fill(255, 190);
  textSize(16);
  text("Click below to restart.", width / 2, height / 2 + 42);

  drawButton(width / 2, height / 2 + 105, 220, 58, "PLAY AGAIN");
}

function drawButton(x, y, w, h, label) {
  rectMode(CENTER);
  noStroke();
  fill(255);
  rect(x, y, w, h, 999);

  fill(10);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(label, x, y + 1);
}

function startGame() {
  gameState = "play";
  score = 0;
  phase = 1;
  circles = [];
  bursts = [];
  startTime = millis();

  for (let i = 0; i < 6; i++) {
    circles.push(new Target());
  }
}

function overButton(x, y, w, h) {
  return (
    mouseX > x - w / 2 &&
    mouseX < x + w / 2 &&
    mouseY > y - h / 2 &&
    mouseY < y + h / 2
  );
}

function playHitSound(x) {
  let now = audioCtx.currentTime;
  let notes;

  if (phase === 1) {
    notes = [523.25, 587.33, 659.25, 783.99, 880.0];
  } else if (phase === 2) {
    notes = [440.0, 523.25, 659.25, 698.46, 783.99];
  } else {
    notes = [587.33, 659.25, 698.46, 783.99, 880.0, 1046.5];
  }

  let freq = random(notes);

  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  let pan = audioCtx.createStereoPanner();
  let filter = audioCtx.createBiquadFilter();
  let distortion = null;

  osc.type = phase === 3 ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.08);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(phase === 3 ? 3200 : 2400, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(phase === 3 ? 0.09 : 0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  pan.pan.setValueAtTime(map(x, 0, width, -0.8, 0.8), now);

  if (phase === 3) {
    distortion = audioCtx.createWaveShaper();
    distortion.curve = makeDistortionCurve(45);
    distortion.oversample = "2x";

    osc.connect(distortion);
    distortion.connect(filter);
  } else {
    osc.connect(filter);
  }

  filter.connect(gain);
  gain.connect(pan);
  pan.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.18);

  osc.onended = function() {
    try {
      osc.disconnect();
      if (distortion) distortion.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
    } catch (e) {}
  };
}

function addMusicLayer(x) {
  let now = audioCtx.currentTime;

  let progression;
  if (phase === 1) progression = majorProgression;
  else if (phase === 2) progression = minorProgression;
  else progression = dorianProgression;

  let chordIndex = floor(score / 8) % progression.length;
  let chord = progression[chordIndex];

  let step = 0.16;

  let melody = [
    random(chord),
    random(chord) * 2,
    random(chord),
    random(chord) * 1.5,
    random(chord) * 2,
    random(chord),
    random(chord) * 1.5,
    random(chord)
  ];

  let noteCount = phase === 3 ? 5 : 8;

  for (let i = 0; i < noteCount; i++) {
    playLayerNote(melody[i], now + i * step, x, i);
  }
}

function makeDistortionCurve(amount) {
  let k = amount;
  let n_samples = 44100;
  let curve = new Float32Array(n_samples);
  let deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    let x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }

  return curve;
}

function playLayerNote(freq, start, x, index) {
  let osc = audioCtx.createOscillator();
  let osc2 = null;
  let gain = audioCtx.createGain();
  let filter = audioCtx.createBiquadFilter();
  let pan = audioCtx.createStereoPanner();
  let distortion = null;

  if (phase === 3) {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);

    osc2 = audioCtx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(freq * 1.005, start);
  } else {
    osc.type = phase === 2 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, start);
  }

  filter.type = "lowpass";

  if (phase === 1) {
    filter.frequency.setValueAtTime(1200 + index * 280, start);
    filter.frequency.exponentialRampToValueAtTime(650, start + 0.8);
  } else if (phase === 2) {
    filter.frequency.setValueAtTime(900 + index * 220, start);
    filter.frequency.exponentialRampToValueAtTime(420, start + 0.8);
  } else {
    filter.frequency.setValueAtTime(3600 + index * 280, start);
    filter.frequency.exponentialRampToValueAtTime(1500, start + 0.75);
  }

  pan.pan.setValueAtTime(map(x, 0, width, -0.55, 0.55), start);

  gain.gain.setValueAtTime(0.0001, start);

  if (phase === 3) {
    gain.gain.linearRampToValueAtTime(0.03, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.018, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
  } else {
    gain.gain.linearRampToValueAtTime(phase === 2 ? 0.022 : 0.028, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(phase === 2 ? 0.011 : 0.014, start + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.15);
  }

  if (phase === 3) {
    distortion = audioCtx.createWaveShaper();
    distortion.curve = makeDistortionCurve(55);
    distortion.oversample = "2x";

    osc.connect(distortion);
    osc2.connect(distortion);
    distortion.connect(filter);
  } else {
    osc.connect(filter);
  }

  filter.connect(gain);
  gain.connect(pan);
  pan.connect(masterGain);

  osc.start(start);
  osc.stop(start + (phase === 3 ? 1.0 : 1.25));

  if (osc2) {
    osc2.start(start);
    osc2.stop(start + 1.0);
  }

  osc.onended = function() {
    try {
      osc.disconnect();
      if (osc2) osc2.disconnect();
      if (distortion) distortion.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
    } catch (e) {}
  };
}

class Target {
  constructor() {
    this.r = 30;
    this.placeSafely();
    this.offset = random(TWO_PI);
    this.hue = random(360);
  }

  placeSafely() {
    let valid = false;

    while (!valid) {
      this.x = random(this.r + 60, width - this.r - 60);
      this.y = random(120, height - this.r - 60);
      valid = true;

      for (let other of circles) {
        let d = dist(this.x, this.y, other.x, other.y);
        if (d < this.r * 3.2) {
          valid = false;
          break;
        }
      }
    }
  }

  display() {
    let pulse = sin(frameCount * 0.08 + this.offset) * 1.2;

    noStroke();

    if (phase === 1) {
      fill(255, 18);
      circle(this.x, this.y, this.r * 3 + pulse * 2);

      fill(255);
      circle(this.x, this.y, this.r * 2.2 + pulse);

      fill(220, 230, 245);
      circle(this.x, this.y, this.r * 1.45 + pulse * 0.7);

      fill(75, 95, 130);
      circle(this.x, this.y, this.r * 0.7 + pulse * 0.3);

      stroke(255, 70);
    } else if (phase === 2) {
      fill(255, 0, 0, 28);
      circle(this.x, this.y, this.r * 3.2 + pulse * 2);

      fill(190, 0, 0);
      circle(this.x, this.y, this.r * 2.25 + pulse);

      fill(25, 0, 0);
      circle(this.x, this.y, this.r * 1.45 + pulse * 0.7);

      fill(255, 35, 35);
      circle(this.x, this.y, this.r * 0.65 + pulse * 0.3);

      stroke(255, 0, 0, 110);
    } else {
      colorMode(HSB, 360, 100, 100, 100);
      let h = (this.hue + frameCount * 2) % 360;

      fill(h, 90, 100, 25);
      circle(this.x, this.y, this.r * 3.4 + pulse * 2);

      fill(h, 90, 100, 95);
      circle(this.x, this.y, this.r * 2.25 + pulse);

      fill((h + 80) % 360, 90, 100, 90);
      circle(this.x, this.y, this.r * 1.45 + pulse * 0.7);

      fill((h + 160) % 360, 90, 100, 100);
      circle(this.x, this.y, this.r * 0.65 + pulse * 0.3);

      colorMode(RGB, 255);
      stroke(255, 180);
    }

    strokeWeight(1.5);
    noFill();
    circle(this.x, this.y, this.r * 2.6 + pulse * 0.5);
  }

  contains(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r * 1.1;
  }
}

class Burst {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.t = 0;
    this.particles = [];

    for (let i = 0; i < 14; i++) {
      let a = random(TWO_PI);
      let s = random(2.2, 5.2);
      this.particles.push({
        x: x,
        y: y,
        vx: cos(a) * s,
        vy: sin(a) * s,
        size: random(2, 4.5),
        hue: random(360)
      });
    }
  }

  update() {
    this.t += 0.05;
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }

  display() {
    let alpha = 255 * (1 - this.t);

    noFill();

    if (phase === 1) {
      stroke(255, alpha);
    } else if (phase === 2) {
      stroke(255, 0, 0, alpha);
    } else {
      stroke(255, alpha);
    }

    strokeWeight(2);
    circle(this.x, this.y, this.r * 2 + this.t * 95);

    if (phase === 1) {
      stroke(180, 210, 255, alpha * 0.8);
      fill(255, alpha * 0.72);
    } else if (phase === 2) {
      stroke(255, 40, 40, alpha * 0.8);
      fill(255, 20, 20, alpha * 0.72);
    } else {
      stroke(255, alpha * 0.8);
    }

    strokeWeight(1);
    circle(this.x, this.y, this.r * 1.2 + this.t * 45);

    noStroke();

    if (phase === 3) {
      colorMode(HSB, 360, 100, 100, 100);
      for (let p of this.particles) {
        fill((p.hue + frameCount * 3) % 360, 90, 100, alpha * 0.3);
        circle(p.x, p.y, p.size);
      }
      colorMode(RGB, 255);
    } else {
      for (let p of this.particles) {
        circle(p.x, p.y, p.size);
      }
    }
  }

  done() {
    return this.t >= 1;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}