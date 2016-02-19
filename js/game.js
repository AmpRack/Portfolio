/* ####################
    Basic declarations
   #################### */
var fps = 60;			      	// Target frame rate
var keyLeft = false;
var keyRight = false;
var keyShoot = false;
var gameMode = false;

var $gameArea = '';		  
var	$enemyBox = '';
var	$player = '';		  
var slideHolder = [];	  	// Holds slides of htnk as custom objects
var activeSlide = 0;
var roundsComplete = 0;
var $tiles = [];  		  	// Cache of all collidable $objects on screen
var tileCount = 0;

var score = 0;
var playerSpeed = 25;
var bulletSpeed = 160;
var bulletWaitTime = 15;  // Minimum time between bullets fired
var bulletTimer = 0; 	    // Number of frames since last bullet successfully fired

function getRand(max) {
	return Math.floor(Math.random() * max);
}


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

	// Load next slide when level is empty
	if (tileCount <= 0) {
		if (activeSlide >= slideHolder.length - 1) {
			activeSlide = 0;
			roundsComplete++;
		} else {
			activeSlide++;
		}
			loadLevel(activeSlide);
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
		if (bulletTop <= target[0] + 5) {
			for (var i = 1; i < target.length; i++) {
				if (target[i].parent().hasClass('btn-title shield')) {
        	target[i].parent().css('border-color', 'transparent').removeClass('shield');
        	target[i].removeClass('marked');
        	adjustScore(0.5);
        } else {
					adjustScore(target[i].children('p').length);
					explode(target[i]);
					tileCount--;
        }
			}
			$(this).remove();
		}

		// Remove bullet when it goes off-screen
		if (bulletTop < 5) {
			$(this).remove();
		}
	});
};

function fetchTarget(bulletPos) {
	var hitList = [];
	var lowBound = 0;
	var bulletWidth = 6;
	var damageRadius = 3; 

	// Scan the $tiles backwards, look for any tile in the bullet's path, and then mark the lowest tiles for later collision
	for (var i = $tiles.length - 1; i >= 0; i--) {
		var $this = $tiles[i];
		
		if (!$this.hasClass('marked') && (($this.position().left < bulletPos.left + (bulletWidth + damageRadius) && 
			 $this.position().left + $this.width() > bulletPos.left - damageRadius)))  {
			if ($this.position().top + $this.height() >= lowBound) {
       	// console.log('Bullet: (' + bulletPos.left + ' / ' + (bulletPos.left + bulletWidth) + ')  Tile: (' + $this.position().left + ' / ' + ($this.position().left + $this.width()) + ')');
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
};

function moveParticles() {
	$('.particle').each(function() {
		var animData = $(this).data('animData');
		$(this).animate({
			'top': '-=' + animData.destY,
			'left': '+=' + animData.destX,
			'opacity:': '-=' + animData.opacity
		},{
			duration: getRand(300) + 500,
			easing: 'linear'
		}).dequeue();

		animData.life--;
		if (animData.life <= 0) {
			$(this).remove();
		}
	});
};

function explode(element) {
	element.addClass('hit');
	var centerX = element.position().left + (element.width() / 2) - 4;
	var centerY = element.position().top + (element.height() / 2) - 2;
	for (var i = 0; i < element.children('p').length; i++) {
		var letter = {
			content: element.children('p')[i].innerText.replace(' ',''),
			destX: getRand(100) - 50,
			destY: getRand(60) + 20,
			opacity: (Math.random() / 10),
			life: getRand(60) + 30
		};
		$enemyBox.append($('<div class="particle">' + letter.content + '</div>').css({
			top: centerY,
			left: centerX
		}).data({ 'animData': letter }))
	}
};


/* #############
    Level setup
   ############# */
function adjustScore(points) {
	score += (points * 10);
	var zeros = '0'.repeat(7 - score.toString().length);
	$('#score-box p:nth-child(2)')[0].innerText = zeros + score;
};

// Read html and parse into separate, collidable pieces
function loadSlides() {
	$('.slide').each(function() {
		// Clickable buttons get processed first, since they need extra attention
		var buttonTitle = [];
		var buttonText = [];
		$(this).children('.btn-slide').each(function() {
			buttonTitle.push($(this).children('span')[0].innerText.split(' '));
			buttonText.push($(this).children('p')[0].innerText.split(' '));
		});
		
		var	buttons = [];
		var	buttonsText = [];
		for (var i = 0; i < buttonTitle.length; i++) {
			var temp = '';
			for (var j = 0; j < buttonTitle[i].length; j++) {
				temp += buttonTitle[i][j] + ' ';
			}
			buttons.push(temp.trim());
		}
		buttons[buttons.length - 1] += ' ';

		for (var i = 0; i < buttonText.length; i++) {
			var temp = '';
			for (var j = 0; j < buttonText[i].length; j++) {
				temp += buttonText[i][j] + ' ';
			}
			buttonsText.push(temp.trim());
		}

		var slide = {
			title: $(this).children('.slide-header')[0].innerText.split(' '),
			textAsWords: $(this).children('p')[0].innerText.split(' '),
			buttons: buttons,
			buttonsText: buttonsText
		};

		// Force special formatting for the splash title
		if (slide.title[0] === 'RobInSF.com'){
			slide.title = ['RobInSF', '.com']
		}
		slideHolder.push(slide);
	});	
};

// Parse words and letters into appropriate html
function levelBuilder(input) {
	var htmlPackage = [];
	
	for (i = 0; i < input.length; i++) {
		var thisWord = input[i].split('');
		var wordTemplate = '<div class="word">';
		
		for (j = 0; j < thisWord.length; j++) {
			if (j == thisWord.length - 1 && i < input.length - 1 && input[i] != 'RobInSF') {
				thisWord[j] += ' ';
			}
			wordTemplate += '<p>' + thisWord[j] + '</p>';
			if (thisWord[j+1] == '-' || thisWord[j+1] == ' ' || thisWord[j+1] == '/' || thisWord[j] == '.' || thisWord[j+1] == '@') {
				wordTemplate += '</div><div class="word">';
			}
		}
		wordTemplate += '</div>';
		htmlPackage.push(wordTemplate);
	}
	return htmlPackage;
};

// Convert slides into html-ready strings, and append to screen
function loadLevel(slideNum) {
	$tiles = [];
	tileCount = 0;
	$enemyBox.empty();
	activeSlide = slideNum;
	var slide = slideHolder[slideNum];

	// Append title and center
	$enemyBox.append($('<div/>').addClass('slide-header'));
	var title = levelBuilder(slide.title);
	for (var i = 0; i < title.length; i++) {
		$enemyBox.children('.slide-header').append(title[i]);
	}

	// Append spacer and text
	$enemyBox.append($('<div/>').addClass('gameSpacer'));
	var text = levelBuilder(slide.textAsWords);
	for (var i = 0; i < text.length; i++) {
		$enemyBox.append(text[i]);
	}

	// Append spacer and buttons 
	$enemyBox.append($('<div/>').addClass('gameSpacer'));
	var buttons = levelBuilder(slide.buttons);
	var buttonsText = levelBuilder(slide.buttonsText);
	var btnHeader = '<div class="btn-slide"><div class="btn-title shield">';
	for (var i = 0; i < buttons.length; i++) {
		$enemyBox.append(btnHeader + buttons[i] + '</div><div class="btn-text">' + buttonsText[i] + '</div>');
	}

	// Log collidable elements
	$('#enemy-box .word').each(function() {
		$tiles.push($(this));
		tileCount++
	});
};


/* ######################
    ...and all the rest!
   ###################### */
function toggleGamemode() {
	$gameArea.focus();
	gameMode = !gameMode;
	if (gameMode) {
		// Enable player and scorebox. Any additional transitions can go here, too
		$('.player').css('display', 'block');
		$('#score-box').css('opacity', '1');
	} else {
		$('.player').css('display', 'none');
		$('#score-box').css('opacity', '0');
		adjustScore(score * -.1);
		loadLevel(activeSlide);
	}
};

function init() {
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);
	$player = $('.player');
	$gameArea = $('#game-area');
	$enemyBox = $('#enemy-box');

	// In-game button clicking handler
	$gameArea.on('click', '.btn-title', function(){
		if (activeSlide === 0) {
			loadLevel($('.btn-title').index(this) + 1);
		} else if (activeSlide == 3) {
			var temp = $('.btn-title').index(this) + 1;
			console.log(temp);
			//window.open('url', '_blank');
		}
	});
	loadSlides();
	loadLevel(0);
};

function mainLoop() {
	calculateInput();
	if ($('.bullet'))	moveBullets();
	if ($('.particle')) moveParticles();
};

$(document).ready(function() {
	init();
	setInterval(mainLoop, 1000 / fps);
});