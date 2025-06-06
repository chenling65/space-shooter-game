let ship;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let bg;
let playerScore = 0;
let gameOver = false;
let bgImg, shipImg, bulletImg, enemyImg, enemyBulletImg;
let bgAudio, gameOverAudio, laserSound, explosionSound;

function preload() {
    bgImg = loadImage('imgs/bg.png');
    shipImg = loadImage('imgs/ship.png');
    bulletImg = loadImage('imgs/bullet.png');
    enemyImg = loadImage('imgs/enemy.png');
    enemyBulletImg = loadImage('imgs/bullet_enemy.png');
    
    bgAudio = loadSound('sounds/kick_shock.wav');
    gameOverAudio = loadSound('sounds/game_over.wav');
    laserSound = loadSound('sounds/laser.wav');
    explosionSound = loadSound('sounds/explosion.wav');
}

function setup() {
    createCanvas(1280, 720);
    bg = new Background();
    ship = new Ship();
    spawnEnemies();
    document.addEventListener('click', () => {
        if (getAudioContext().state !== 'running') {
            getAudioContext().resume();
        }
    });
    document.addEventListener('click', startBgAudioOnce, { once: true });

    document.getElementById('loading').style.display = 'none';
}

function startBgAudioOnce() {
    bgAudio.loop();
}

function draw() {
    if (!gameOver) {
        bg.draw();
        ship.draw();
        ship.move();
        
        for (let bullet of bullets) {
            bullet.draw();
            bullet.move();
        }
        
        for (let enemy of enemies) {
            enemy.draw();
            enemy.move();
        }
        
        for (let enemyBullet of enemyBullets) {
            enemyBullet.draw();
            enemyBullet.move();
        }
        
        handleCollisions();
        
        if (enemies.length === 0) {
            spawnEnemies();
        }
        
        updateScore();
    } else {
        displayGameOver();
    }
}

function keyPressed() {
    if (key === ' ') {
        ship.fire();
    }
}

function spawnEnemies() {
    let x = 200; 
    let y = -enemyImg.height;
    let spacer = y * 2;
    for (let i = 1; i <= 27; i++) {
        enemies.push(new Enemy(x, y));
        x += enemyImg.width + 50;
        if (i % 9 === 0) {
            x = 200; 
            y += spacer;
        }
    }
}

function handleCollisions() {
    for (let bullet of bullets) {
        for (let enemy of enemies) {
            if (bullet.hits(enemy)) {
                bullet.remove();
                enemy.remove();
                playerScore += 10;
                explosionSound.play();
            }
        }
    }
    
    for (let enemyBullet of enemyBullets) {
        if (enemyBullet.hits(ship)) {
            enemyBullet.remove();
            ship.remove();
            gameOver = true;
            bgAudio.stop();
            gameOverAudio.play();
            document.getElementById('game-over').style.display = 'block';
        }
    }
    
    bullets = bullets.filter(bullet => !bullet.toRemove);
    enemies = enemies.filter(enemy => !enemy.toRemove);
    enemyBullets = enemyBullets.filter(enemyBullet => !enemyBullet.toRemove);
}

function updateScore() {
    document.getElementById('score').innerText = playerScore;
}

function displayGameOver() {
    document.getElementById('game-over').style.display = 'block';
}

function restartGame() {
    gameOver = false;
    playerScore = 0;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    ship = new Ship();
    spawnEnemies();
    bgAudio.loop();
    document.getElementById('game-over').style.display = 'none';
}

class Background {
    constructor() {
        this.y = 0;
        this.speed = 1;
    }
    
    draw() {
        image(bgImg, 0, this.y, width, height);
        image(bgImg, 0, this.y - height, width, height);
        this.y += this.speed;
        if (this.y >= height) {
            this.y = 0;
        }
    }
}

class Ship {
    constructor() {
        this.x = width / 2 - shipImg.width;
        this.y = height - shipImg.height * 2;
        this.speed = 3;
        this.toRemove = false;
    }
    
    draw() {
        image(shipImg, this.x, this.y, shipImg.width * 1.5, shipImg.height * 1.5); 
    }
    
    move() {
        if (keyIsDown(LEFT_ARROW)) {
            this.x -= this.speed;
            if (this.x < 0) this.x = 0;
        }
        if (keyIsDown(RIGHT_ARROW)) {
            this.x += this.speed;
            if (this.x > width - shipImg.width * 1.5) this.x = width - shipImg.width * 1.5; 
        }
        if (keyIsDown(UP_ARROW)) {
            this.y -= this.speed;
            if (this.y < height / 4 * 3) this.y = height / 4 * 3;
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.y += this.speed;
            if (this.y > height - shipImg.height * 1.5) this.y = height - shipImg.height * 1.5; 
        }
    }
    
    fire() {
        bullets.push(new Bullet(this.x + 9, this.y, -3, bulletImg)); 
        bullets.push(new Bullet(this.x + 49.5, this.y, -3, bulletImg)); 
        laserSound.play();
    }
    
    remove() {
        this.toRemove = true;
    }
}

class Bullet {
    constructor(x, y, speed, img) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.img = img;
        this.toRemove = false;
    }
    
    draw() {
        image(this.img, this.x, this.y, this.img.width * 1.5, this.img.height * 1.5); 
    }
    
    move() {
        this.y += this.speed;
        if (this.y < 0 || this.y > height) {
            this.remove();
        }
    }
    
    hits(target) {
        return collideRectRect(this.x, this.y, this.img.width * 1.5, this.img.height * 1.5, target.x, target.y, enemyImg.width * 1.5, enemyImg.height * 1.5); // Adjusted for enlarged images
    }
    
    remove() {
        this.toRemove = true;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 2;
        this.speedX = 0;
        this.speedY = this.speed;
        this.toRemove = false;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 90;
        this.bottomEdge = this.y + 140;
    }
    
    draw() {
        image(enemyImg, this.x, this.y, enemyImg.width * 1.5, enemyImg.height * 1.5); 
    }
    
    move() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x <= this.leftEdge) {
            this.speedX = this.speed;
        } else if (this.x >= this.rightEdge + enemyImg.width * 1.5) {
            this.speedX = -this.speed;
        } else if (this.y >= this.bottomEdge) {
            this.speed = 1.5;
            this.speedY = 0;
            this.y -= 5;
            this.speedX = -this.speed;
        }

        if (random(1) < 0.01) {
            this.fire();
        }
    }

    fire() {
        enemyBullets.push(new Bullet(this.x + enemyImg.width * 0.75, this.y + enemyImg.height * 1.5, 3, enemyBulletImg)); 
    }

    remove() {
        this.toRemove = true;
    }
}