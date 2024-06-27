// To make custom vector2 function
function vecLength(vector) {
  return (vector.x ** 2 + vector.y ** 2) ** 0.5;
}

function normalize(vector) {
  return vector.extend(1 / vecLength(vector));
}

let mesh = [];
cols = 50;
rows = 40;

for (let i = 0; i < rows; ++i) {
  array = [];
  for (let j = 0; j < cols; ++j) {
    
    if (i == 0) {
      array.push(!(j % 6));
    } else {
      array.push(0);
    }
  }
  mesh.push(array);
}

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  add(v2) {
    return new Vector2(this.x + v2.x, this.y + v2.y);
  }
  subtract(v2) {
    return new Vector2(this.x - v2.x, this.y - v2.y);
  }
  extend(scale) {
    return new Vector2(this.x * scale, this.y * scale);
  }
}

class Point {
  constructor(position) {
    this.position = position;
    this.prevPosition = this.position;
    this.locked;
  }
}

class Stick {
  constructor(pointA, pointB) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.length = vecLength(
      this.pointA.position.subtract(this.pointB.position)
    );
  }
}

function drawLine(ctx, pointA, pointB, width, color) {
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pointA.position.x, pointA.position.y);
  ctx.lineTo(pointB.position.x, pointB.position.y);
  ctx.stroke();
}

const canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

let numIterations = 3;

const points = [];
const sticks = [];

let offset = new Vector2(
  canvas.width / cols,
  canvas.height / rows/1.5
);

const modes = ["0", "1"];
let mode = "0";
const gravity = 9.8;
let i = 1;

document.addEventListener("keydown", (event) => {
  if (event.code == "Space") {
    i++;
    mode = modes[i % 2];
  }
});

const lockedPoints = [];

function createMesh() {
  for (let j = 0; j < mesh.length; j++) {
    for (let i = 0; i < mesh[j].length; i++) {
      const point = new Point(
        new Vector2(i * offset.x + offset.x / 2 , j * offset.y + offset.y / 2 )
      );
      if (mesh[j][i]) {
        point.locked = true;
      }
      points.push(point);
      if (i >= 1) {
        sticks.push(
          new Stick(
            points[j * mesh[j].length + i],
            points[j * mesh[j].length + (i - 1)]
          )
        );
      }
      if (j >= 1) {
        sticks.push(
          new Stick(
            points[j * mesh[j].length + i],
            points[(j - 1) * mesh[j - 1].length + i]
          )
        );
      }
    }
  }
  for (let i = 0; i < points.length; ++i) {
    if (points[i].locked) {
      lockedPoints.push(points[i]);
    }
  }
}

function simulate(deltaTime) {
  for (let i = 0; i < points.length; i++) {
    p = points[i];
    if (!p.locked) {
      let positionBeforeUpdate = p.position;
      p.position = p.position.add(p.position.subtract(p.prevPosition));
      p.position = p.position.add((new Vector2(0, 1)).extend(gravity * deltaTime));
      p.prevPosition = positionBeforeUpdate;
    }
  }

  for (let j = 0; j < numIterations; j++) {
    for (let i = 0; i < sticks.length; ++i) {
      s = sticks[i];
      stickCentre = s.pointA.position.add(s.pointB.position).extend(.5);
      stickDir = normalize(s.pointA.position.subtract(s.pointB.position));

      if (!s.pointA.locked) {
        s.pointA.position = stickCentre.add((stickDir).extend(s.length*.5));
      }
      if (!s.pointB.locked) {
        s.pointB.position = stickCentre.subtract((stickDir).extend(s.length*.5));
      }
    }
  }
}
createMesh();

let lastTime = 0;
const deltaTime = 1 / 60;
let currTime = 0;

function update(time) {
  currTime += (time - lastTime) / 1000;
  while (currTime > deltaTime) {

    ctx.fillStyle = "#92d1a3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    

    let radius = 2;
    for (let i = 0; i < sticks.length; ++i) {
      drawLine(ctx, sticks[i].pointA, sticks[i].pointB, 1, "#000", radius / 2);
    }
    for (let i = 0; i < lockedPoints.length; ++i) {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(
        lockedPoints[i].position.x - radius / 2,
        lockedPoints[i].position.y - radius / 2,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    if (mode == "1") {
      simulate(deltaTime);
    }
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "20px Arial";
    ctx.fillText(`Space=Play/Pause`, canvas.width / 2, canvas.height - 70);

    currTime -= deltaTime;
  }
  lastTime = time;

  requestAnimationFrame(update);
}

update(0);