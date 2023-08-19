const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

type Coordinates = { x: number; y: number };

const gravity = 1;

const colors = ["#44001A", "#600047", "#770058", "#8E0045", "#9E0031"];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const getDistance = (from: Coordinates, to: Coordinates) => {
  const xDist = to.x - from.x;
  const yDist = to.y - from.y;

  return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
};

const rotateSystem = (coords: Coordinates, angle: number) => ({
  x: coords.x * Math.cos(angle) - coords.y * Math.sin(angle),
  y: coords.x * Math.cos(angle) + coords.y * Math.sin(angle),
});

const resolveCollision = (e1: Ball, e2: Ball) => {
  const xVelocityDiff = e1.velocity.x - e2.velocity.x;
  const yVelocityDiff = e1.velocity.y - e2.velocity.y;

  const xDist = e2.coordinates.x - e1.coordinates.x;
  const yDist = e2.coordinates.y - e1.coordinates.y;

  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    const angle = Math.atan2(
      e2.coordinates.y - e1.coordinates.y,
      e2.coordinates.x - e1.coordinates.x
    );

    const u1 = rotateSystem(e1.velocity, angle);
    const u2 = rotateSystem(e2.velocity, angle);

    const v1 = {
      x:
        (u1.x * (e1.mass - e2.mass)) / (e1.mass + e2.mass) +
        (u2.x * 2 * e2.mass) / (e1.mass + e2.mass),
      y: u1.y,
    };
    const v2 = {
      x:
        (u2.x * (e1.mass - e2.mass)) / (e1.mass + e2.mass) +
        (u1.x * 2 * e2.mass) / (e1.mass + e2.mass),
      y: u2.y,
    };

    e1.velocity = rotateSystem(v1, -angle);
    e2.velocity = rotateSystem(v2, -angle);
  }
};

class Ball {
  private x;
  private y;

  private dy = (Math.random() - 0.5) * this.initialForce;
  private dx = (Math.random() - 0.5) * this.initialForce;

  private color = getRandomColor();

  constructor(
    private size: number,
    private initialForce: number,
    private friction: number,
    public mass: number,
    entities: Ball[]
  ) {
    const { x, y } = this.generateUniqueCoordinates(entities);
    this.x = x;
    this.y = y;
  }

  private generateUniqueCoordinates(entities: Ball[]): Coordinates {
    const x = Math.random() * (window.innerWidth - this.size * 2) + this.size;
    const y = Math.random() * (window.innerHeight - this.size * 2) + this.size;

    for (const e of entities) {
      if (getDistance(this.coordinates, e.coordinates) < this.size * 2) {
        return this.generateUniqueCoordinates(entities);
      }
    }

    return { x, y };
  }

  private draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = this.color;

    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  private async collisionWorker(entities: Ball[]) {
    for (const e of entities) {
      if (e === this) continue;

      if (getDistance(this.coordinates, e.coordinates) < this.size * 2)
        resolveCollision(this, e);
    }
  }

  private checkCollisions(entities: Ball[]) {
    this.collisionWorker(entities);

    if (this.y + this.size > window.innerHeight && this.dy > 0)
      this.dy = -this.dy * this.friction;
    else if (this.y + this.size < window.innerHeight)
      this.dy += gravity * this.mass;

    if (
      (this.x + this.size > window.innerWidth && this.dx > 0) ||
      (this.x - this.size < 0 && this.dx < 0)
    )
      this.dx = -this.dx * this.friction;
  }

  get coordinates(): Coordinates {
    return { x: this.x, y: this.y };
  }

  get velocity() {
    return { x: this.dx, y: this.dy };
  }

  set velocity(force: Coordinates) {
    this.dx = force.x;
    this.dy = force.y;
  }

  update(ctx: CanvasRenderingContext2D, entities: Ball[]) {
    this.y += this.dy;
    this.x += this.dx;

    this.checkCollisions(entities);

    this.draw(ctx);
  }
}

const updateCanvas = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
};

const balls: Ball[] = [];

for (let i = 0; i < 2; i++) balls.push(new Ball(30, 20, 0.9, 1, balls));

const update = () => {
  updateCanvas();

  for (const ball of balls) ball.update(ctx, balls);

  requestAnimationFrame(update);
};

update();
