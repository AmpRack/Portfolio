/* #####################
	Basic vars and decs
   ##################### */
var fps = 60;			  // Target frame rate
var keyLeft = false;	  // Keydown Left
var keyRight = false;     // Keydown right
var keyShoot = false;	  // Keydown space
var playerSpeed = 25;
var	$player = '';		  
var $gameArea = '';		  
var textFromPage = [];    // Holds all text from page, as individual characters
var $tiles = [];  		  // Cache of all collidable $objects on screen

var bulletSpeed = 150;
var bulletWaitTime = 16;  // Minimum time between bullets fired
var bulletTimer = 0; 	  // Number of frames since last bullet successfully fired


/* ##################
	Helper functions 
   ################## */
Array.prototype.last = function() {
	return this[this.length - 1];
};


/* ####################
	Input and Controls
   #################### */
function handleKeyDown(e) {
	if (e.keyCode == 37 || e.keyCode == 65) {
		keyLeft = true;
	}
	if (e.keyCode == 39 || e.keyCode == 68) {
		keyRight = true;
	}
	if (e.keyCode == 32) {
		keyShoot = true;
	}
};

function handleKeyUp(e) {
	if (e.keyCode == 37 || e.keyCode == 65) {
		keyLeft = false;
	}
	if (e.keyCode == 39 || e.keyCode == 68) {
		keyRight = false;
	}
	if (e.keyCode == 32) {
		keyShoot = false;
		bulletTimer = bulletWaitTime;
	}
};

function calculateInput() {
	var playerPos = parseInt($player.css('left').replace('px', ''));

	// Keep player within bounds of screen!
	if (playerPos <= 30) {
		keyLeft = false;
		$player.stop().css({left: '30px'});
	} else if (playerPos >= ($gameArea.width() - $player.width() - 30)) {
		keyRight = false;
		$player.stop().css({left: $gameArea.width() - $player.width() - 30 + 'px'});
	}

	// Move right
	if (keyRight && !keyLeft) {
		$player.animate({
			'left': '+=' + playerSpeed
		},{
			duration: 200,
			easing: 'easeOutQuint'
		}).dequeue();
	}
	// Move left
	if (keyLeft && !keyRight) {
		$player.animate({
			'left': '-=' + playerSpeed
		},{
			duration: 200,
			easing: 'easeOutQuint'
		}).dequeue();
	}

	// Fire guns, with cool-down timer
	if (keyShoot && bulletTimer >= bulletWaitTime) {
		createBullet();
		bulletTimer = 0;
	} else if (bulletTimer < bulletWaitTime) {
		bulletTimer++;
	}
};


/* #############################
	Projectiles and moving bits
   ############################# */
function createBullet() {
	var bulletPos = {
		left: $player.position().left + ($player.width() / 2),
		top: $player.position().top - 25
	};
	var bulletTarget = fetchTarget(bulletPos);
	$gameArea.append($('<div/>').addClass('bullet').css(bulletPos).data({ 'target': bulletTarget }));
};

function moveBullets() {
	$('.bullet').each(function() {
		$(this).animate({
			'top': '-=' + bulletSpeed
		},{
			duration: 100,
			easing: 'linear'
		}).dequeue();

		var target = $(this).data('target');
		var bulletTop = $(this).position().top;

		// Successful bullet-tile collision
		if (bulletTop <= target[0]) {
			for (var i = 1; i < target.length; i++) {
				target[i].addClass('hit');
			}
			$(this).remove();
		}

		// Remove bullet when it goes off-screen
		if (bulletTop < 25) {
			$(this).remove();
		}
	});
};

function fetchTarget(bulletPos) {
	var hitList = [];
	var lowBound = 0;
	
	// Scan the $tiles backwards, look for any tile in the bullet's path, and then mark the lowest tiles for later collision
	for (var i = $tiles.length - 1; i >= 0; i--) {
		var $this = $tiles[i];
		if (!$this.hasClass('marked') && (($this.position().left < bulletPos.left + 11 && 
			 $this.position().left + $this.width() > bulletPos.left - 5)))  {
			if ($this.position().top + $this.height() >= lowBound) {
				hitList.push($this);
				lowBound = $this.position().top + $this.height();
				$this.addClass('marked');
			} else {
				break;
			}
		}
	};
	
	hitList.push(lowBound);
	return hitList.reverse();
}


/* #############
	Level setup
   ############# */
function parseText() {
	// Divide all text on page into individual letters
	$('.slide p').each(function() {
		var temp = this.innerText.split('');
		for (var i = 0; i < temp.length; i++) {
			if (!(/\w/.test(temp[i]))) {
				temp[i - 1] += temp[i];
				temp.splice(i, 1);
				i--;
			}
		}
		textFromPage.push(temp); 
	});
};

function loadLevel(slideNum) {
	$tiles = [];
	for (i = 0; i < textFromPage[slideNum].length; i++) {
		$('#enemy-box').append($('<p>' + textFromPage[slideNum][i] + '</p>').removeClass('hit marked'));
	}

	$('#enemy-box p').each(function() {
		$tiles.push($(this));
	});
};
	

/* ############
	Game logic
   ############ */
function init() {
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);
	$player = $('.player');
	$gameArea = $('#game-area');
	parseText();
	loadLevel(0);
}

function mainLoop() {
	calculateInput();
	moveBullets();
};

$(document).ready(function() {
	init();
	setInterval(mainLoop, 1000 / fps);
});