var 
	// Constants
	canvas = document.createElement("canvas"),
	context = canvas.getContext("2d"),
	WIDTH = 889,
	HEIGHT = 500,
	keystate = {},
	wKey = 87,
	background = new Image(),
	slow_backgorund = [new Image(), new Image()],
	fast_backgorund = [new Image(), new Image()],
	enemySpriteSheet = [],
	enemies = [],

	// Game variables
	score = 0,
	highscore = 0,
	click = false,

	// Parameters; play with them and experiment
	impulse = -40,
	spawnChance = 0.04,
	minEnemyDistance = 120,
	enemySpeed = 7,
	hitboxReducer = 0.7,

	slow = {
		setup: function() {
			slow_backgorund[0].src = 'images/slow.png';
			slow_backgorund[1].src = 'images/slow.png';
		},

		init: function() {
			this.x0 = 0;
			this.x1 = WIDTH;
		},

		update: function() {
			this.x0--;
			this.x1--;
			if (this.x0 <= -WIDTH)
				this.x0 = WIDTH;
			if (this.x1 <= -WIDTH)
				this.x1 = WIDTH;
		},

		draw : function() {
			context.drawImage(slow_backgorund[0], this.x0, 0);
			context.drawImage(slow_backgorund[1], this.x1, 0);
		}
	},

	fast = {
		setup: function() {
			fast_backgorund[0].src = 'images/fast.png';
			fast_backgorund[1].src = 'images/fast.png';
		},

		init: function() {
			this.x0 = 0;
			this.x1 = WIDTH - 1;
		},

		update: function() {
			this.x0 -= 3;
			this.x1 -= 3;
			if (this.x0 <= -(WIDTH - 1)) {
				this.x0 = WIDTH - 1;
				this.x1 = 0;
			}
			if (this.x1 <= -(WIDTH - 1)) {
				this.x1 = WIDTH - 1;
				this.x0 = 0;
			}
		},

		draw : function() {
			context.drawImage(fast_backgorund[0], this.x0, 0);
			context.drawImage(fast_backgorund[1], this.x1, 0);
		}
	},

	hero = {
		// Constants
		width: 75,
		height: 75,
		ground: 129,
		x: 30,
		running_sprite: [],
		jumping_sprite: [],
		tot_run_img: 6,
		tot_jump_img: 4,

		setup: function() {
			for(var i = 0; i < this.tot_run_img; i++) {
				img = new Image();
				img.src = 'images/run_' + i + '.png';
				this.running_sprite.push(img);
			}

			for(var i = 0; i < this.tot_jump_img; i++) {
				img = new Image();
				img.src = 'images/jump_' + i + '.png';
				this.jumping_sprite.push(img);
			}
		},

		init: function() {
			// State variables
			this.y = HEIGHT - 75 - 129;
			this.dy = 0;
			this.jumping = false;
			this.curr_img = 0;
			this.frames = 0;

		},

		update: function() {
			if (!this.jumping && (keystate[wKey] || click)) {
				this.dy = impulse;
				this.jumping = true;
				this.curr_img = 0;
				this.frames = 0;
			}

			if (this.jumping) {
				this.y += this.dy;
				this.dy += 3;
			}

			// Keep hero between top and bottom margin
			this.y = Math.max(Math.min(this.y, HEIGHT - this.height - this.ground), 0);
			
			if (this.y == HEIGHT - this.height - this.ground) {
				this.dy = 0;
				this.jumping = false;
			}
		},

		draw: function() {
			this.frames++;
			if (this.frames > 3) {
				this.frames = 0;
				this.curr_img = (this.curr_img + 1) % (this.jumping? this.tot_jump_img : this.tot_run_img);
			}
			var img = this.jumping? this.jumping_sprite[this.curr_img] : this.running_sprite[this.curr_img];
			context.drawImage(img, this.x, this.y);
		}
	};

function enemySetup() {
	var img = new Image();
	img.src = 'images/enemy_1.png';
	enemySpriteSheet.push(img);

	var img = new Image();
	img.src = 'images/enemy_2.png';
	enemySpriteSheet.push(img);
}

function enemySpawn() {
	sheet = enemySpriteSheet;
	enemies.push({
		// Constants
		width: 40,
		height: 43,
		x: WIDTH + 40, 
		y: HEIGHT - 43 - hero.ground,

		// State variables
		frames: 0,
		curr_img: 0,
		sprites: sheet,
		tot_img: sheet.length,

		update: function() {
			this.x -= enemySpeed;
		},

		draw: function() {
			this.frames++;
			if (this.frames > 7) {
				this.frames = 0;
				this.curr_img = (this.curr_img + 1) % this.tot_img;
			}
			context.drawImage(this.sprites[this.curr_img], this.x, this.y);
		}
	})
}

function enemyUpdate() {
	for(var i = 0; i < enemies.length; i++) {
		enemies[i].update();

		// The multiplier reduces the enemies' hitbox, making the game a little easier (aka less frustrating)
		if(rectCollision(enemies[i].x, enemies[i].y, enemies[i].width * hitboxReducer, enemies[i].height * hitboxReducer,
			hero.x, hero.y, hero.width, hero.height)) {
			if (score > highscore)
				highscore = score;
			score = 0;

			init();
			return;
		}
	}
}

function enemyRemove() {
	// I only check the first enemy because the others can't be this close anyway
	if (enemies.length > 0 && enemies[0].x < -enemies[0].width){
		enemies.splice(0, 1);
		score++;
		if (score > highscore)
			highscore = score;
	}
}

function rectCollision(ax, ay, aw, ah, bx, by, bw, bh) {
	return ax < bx + bw && ay < by + bh && bx < ax + aw && by < ay + ah;
}

function drawScore() {
	context.fillText("Score: " + score, 20, HEIGHT - 20);
	context.fillText("High Score: " + highscore, WIDTH - 275, HEIGHT - 20);
}

function setup() {
	document.body.appendChild(canvas);
	canvas.width = WIDTH;
	canvas.height = HEIGHT;

	document.addEventListener("keydown", function(evt) {
		keystate[evt.keyCode] = true;
	});
	document.addEventListener("keyup", function(evt) {
		keystate[evt.keyCode] = false;
	});
	document.addEventListener("mousedown", function() {
		click = true;
	});
	document.addEventListener("mouseup", function() {
		click = false;
	});

	background.src = 'images/background.png';
	context.fillStyle = 'red';
	context.font = "30px Arial Black";

	slow.setup();
	fast.setup();
	hero.setup();
	enemySetup();
}

function init() {
	slow.init();
	fast.init();
	hero.init();
	enemies = [];

	click = false;
}

function update() {
	slow.update();
	fast.update();
	hero.update();
	enemyUpdate();
	enemyRemove();
}

function draw() {
	context.drawImage(background, 0, 0);
	slow.draw();
	fast.draw();
	hero.draw();

	for(var i = 0; i < enemies.length; i++)
		enemies[i].draw();

	drawScore();
}

function start() {
	setup();
	init();

	var loop = function() {
		update();
		draw();

		if ((enemies.length == 0 ||  enemies[enemies.length - 1].x <= WIDTH - minEnemyDistance) && Math.random() > (1 - spawnChance))
			enemySpawn();

		window.requestAnimationFrame(loop);
	};
	window.requestAnimationFrame(loop);
}

start()