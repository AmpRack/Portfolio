var fps = 30;			  // Target frame rate
var keyLeft = false;	  // Keydown Left
var keyRight = false;     // Keydown right
var keyShoot = false;	  // Keydown space
var playerSpeed = 25;	  // Pixels to move per unit
var	$player = ''; 		  // Player element
var $gameArea = '';		  // Gamearea element

var bulletSpeed = 100;	  // Pixels to move per unit
var bulletWaitTime = 10;  // Number of frames to wait
var bulletTimer = 0;      // Number of frames waited

function handleKeyDown(e) {
	if (e.keyCode == 37 || e.keyCode == 65) {
		keyLeft = true;
		console.log('Going left');
	}
	if (e.keyCode == 39 || e.keyCode == 68) {
		keyRight = true;
		console.log('Going right');
	}
	if (e.keyCode == 32) {
		keyShoot = true;
		console.log('Shooting');
	}
};

function handleKeyUp(e) {
	if (e.keyCode == 37 || e.keyCode == 65) {
		keyLeft = false;
		console.log('Not going left');
	}
	if (e.keyCode == 39 || e.keyCode == 68) {
		keyRight = false;
		console.log('Not going right');
	}
	if (e.keyCode == 32) {
		keyShoot = false;
		bulletTimer = bulletWaitTime;
		console.log('Not shooting');
	}
};

function calculateInput() {
	// Keep player within bounds of screen
	var playerPos = parseInt($player.css('left').replace('px', ''));
	if (playerPos <= 30) {
		keyLeft = false;
		$player.stop().css({left: '30px'});
	} else if (playerPos >= ($gameArea.width() - $player.width() - 30)) {
		keyRight = false;
		$player.stop().css({left: $gameArea.width() - $player.width() - 30 + 'px'});
	}
	// Move right
	if (keyRight && !keyLeft) {
		$('.player').animate({
			'left': '+=' + playerSpeed
		},{
			duration: 200,
			easing: 'easeOutQuint'
		}).dequeue();
	}
	// Move left
	if (keyLeft && !keyRight) {
		$('.player').animate({
			'left': '-=' + playerSpeed
		},{
			duration: 200,
			easing: 'easeOutQuint'
		}).dequeue();
	}
	// Shoot bullets
	if (keyShoot && bulletTimer >= bulletWaitTime) {
		createBullet();
		bulletTimer = 0;
	} else if (bulletTimer < bulletWaitTime) {
		bulletTimer++;
	}
};

function createBullet() {
	var bulletPos = {
		left: $player.position().left + ($player.width() / 2),
		top: $player.position().top - 30
	}
	$gameArea.append($('<div/>').addClass('bullet').css(bulletPos));
};

function moveBullets() {
	$('.bullet').animate({
		'top': '-=' + bulletSpeed
	},{
		duration: 100,
		easing: 'linear'
	}).dequeue();
};

function detectCollision() {
	$('.bullet').each(function() {
		var $bullet = $(this);
		var bulletPos = {
			top: $bullet.position().top,
			left: $bullet.position().left - 2,
			right: $bullet.position().left + $bullet.width() + 2,
			bottom: $bullet.position.top + $bullet.height()
		};
		var bulletHit = false;

		$('.enemy').each(function() {
			if (!bulletHit) {
				var $enemy = $(this);
				var enemy = {
					top: $enemy.position().top,
					left: $enemy.position().left,
					right: $enemy.position().left + $enemy.width(),
					bottom: $enemy.position().top + $enemy.height()
				};

				if (bulletPos.top <= enemy.bottom) {
					if (bulletPos.right > enemy.left && bulletPos.left < enemy.right || 
						bulletPos.left < enemy.right && bulletPos.right > enemy.left ) {

					console.log('Successful collision!');
					bulletHit = true;
					$bullet.remove();
					$enemy.remove();
					}
				}
			}
		});

		if (bulletPos.top < 0 - $bullet.height()) {
			$bullet.remove();
		}
	})
};

function propagateEnemies() {
	var $enemybox = $('#enemy-box');
	var enemySize = 100 + (15 * 2); // Tile size, plus spacing on both sides
	
	// Determine quantity of enemies and spacing first, then put them in place sequentially
	var x = Math.floor($enemybox.width() / enemySize);
	var xSpacing = ($enemybox.width() % enemySize) / (x + 1);
	var y = Math.floor($enemybox.height() / enemySize);
	var ySpacing = ($enemybox.height() % enemySize) / (y + 1);

	for (var j = 0; j < y; j++) {
		for (var i = 0; i < x; i++) {
			var position = { 'top': (j * enemySize) + 15 + (ySpacing * 2) + 'px',
							 'left': (i * enemySize) + 15 + (xSpacing * 2) + 'px' };
			$enemybox.append($('<div/>').addClass('enemy').css(position));
		}
	}
};

function mainLoop() {
	calculateInput();
	moveBullets();
	detectCollision();
};

$(document).ready(function() {
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);
	$player = $('.player');
	$gameArea = $('#game-area');
	propagateEnemies();
	setInterval(mainLoop, 1000 / fps);
});