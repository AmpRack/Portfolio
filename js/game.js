/* #####################
	Basic vars and decs
   ##################### */
var fps = 60;			      	// Target frame rate
var keyLeft = false;
var keyRight = false;
var keyShoot = false;
var gameMode = false;
var controllable = false;
var displayHelp = true;

var $gameArea = '';		  
var	$enemyBox = '';
var	$player = '';		  
var slideHolder = [];	  	// Holds slides of htnk as custom objects
var activeSlide = 0;
var roundsPlayed = 1;
var $tiles = [];  		  	// Cache of all collidable $objects on screen
var tileCount = 0;

var score = 0;
var playerSpeed = 20;
var bulletSpeed = 160;
var bulletWaitTime = 15;  // Minimum time between bullets fired
var bulletTimer = 0; 	    // Number of frames since last bullet successfully fired


/* ##################
	  Helper functions 
   ################## */
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
	if (playerPos <= 12) {
		keyLeft = false;
		$player.stop().css({left: '12px'});
	} else if (playerPos >= ($gameArea.width() - $player.width() - 12)) {
		keyRight = false;
		$player.stop().css({left: $gameArea.width() - $player.width() - 12 + 'px'});
	}

	// Move right
	if (keyRight && !keyLeft) {
		$player.animate({
			'left': '+=' + playerSpeed
		},{
			duration: 150,
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
	if (controllable && keyShoot && bulletTimer >= bulletWaitTime) {
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
				var thisParent = target[i].parent();
				// Remove border from buttons
				if (thisParent.hasClass('btn-title shield')) {
        	thisParent.css('border-color', 'transparent');
        	thisParent.removeClass('shield');
        	target[i].removeClass('marked');
        	adjustScore(0.5);
        // Remove border from help-text buttons
			  } else if (target[i].hasClass('shield') && target[i].parent().hasClass('help-text')) {
			 	  target[i].children('span').css('border-color', 'transparent');
			 	  target[i].removeClass('shield marked');
        } else {
        // Destroy word
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

function fetchTarget (bulletPos) {
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
			duration: getRand(300) + 200,
			easing: 'linear'
		}).dequeue();

		$(this).data('animData').life--;
		if ($(this).data('animData').life <= 0) {
			$(this).remove();
		}
	});
};

function explode(element) {
	element.addClass('hit');
	var centerX = element.position().left + (element.width() / 2) - 4;
	var centerY = element.position().top + (element.height() / 2) - 2;
	if (element.parent().hasClass('help-text') && element.children('span')[0]) element = element.children('span');

	for (var i = 0; i < element.children('p').length; i++) {
		var letter = {
			content: element.children('p')[i].innerText.replace(' ',''),
			destX: getRand(50) - 25,
			destY: getRand(40) + 20,
			opacity: getRand(10) * .1,
			life: getRand(30) + 20
		};
			
		$enemyBox.append($('<div class="particle">' + letter.content + '</div>').css({
			top: centerY,
			left: centerX
		}).data({ 'animData': letter }))
	}
};


/* ############
    Game logic
   ############ */
function adjustScore(points) {
	score += (points * 10 * roundsPlayed);
	var zeros = '0'.repeat(7 - score.toString().length);
	$('#score-box p:nth-child(2)')[0].innerText = zeros + score;
};

// Read html and parse into separate, collidable pieces
function loadSlides() {
	$('.slide').each(function() {
		// Clickable buttons get processed first
		var bTitle = [];
		var bText = [];
		$(this).children('.btn-slide').each(function() {
			bTitle.push($(this).children('span')[0].innerText.split(' '));
			bText.push($(this).children('p')[0].innerText.split(' '));
		});
		
		var	buttonTitle = [];
		var	buttonText = [];
		for (var i = 0; i < bTitle.length; i++) {
			var temp = '';
			for (var j = 0; j < bTitle[i].length; j++) {
				temp += bTitle[i][j] + ' ';
			}
			buttonTitle.push(temp.trim());
		}

		for (var i = 0; i < bText.length; i++) {
			var temp = '';
			for (var j = 0; j < bText[i].length; j++) {
				temp += bText[i][j] + ' ';
			}
			buttonText.push(temp.trim());
		}

		var slide = {
			title: $(this).children('.slide-header')[0].innerText.split(' '),
			textAsWords: $(this).children('p')[0].innerText.split(' '),
			buttons: buttonTitle,
			buttonsText: buttonText
		};

		// Force special formatting for the splash title
		if (slide.title[0] === 'RobInSF.com'){
			slide.title = ['RobInSF', '.com']
		}
		slideHolder.push(slide);
	});	
};

// Break arrays of text into words, then letters, then convert to html
function levelBuilder(input, button) {
	var htmlPackage = [];

	for (i = 0; i < input.length; i++) {
		if (input[i] == '' || !input[i]) {
			wordTemplate = '';
		} else {
			var thisWord = input[i].split('');
			var wordTemplate = '<div class="word">';
			
			for (j = 0; j < thisWord.length; j++) {
				// Attach whitespace to the last character of the word
				if (j == (thisWord.length - 1) && i < (input.length - 1) && !button && input[i] != 'RobInSF') {
					thisWord[j] += ' ';
				}
				wordTemplate += '<p>' + thisWord[j] + '</p>';
				// Determine when to start a new word
				if (thisWord[j+1] == '-' || thisWord[j+1] == ' ' || thisWord[j] == '/' || thisWord[j] == '.' || thisWord[j+1] == '@') {
					wordTemplate += '</div><div class="word">';
				}
			}
			wordTemplate += '</div>';
			// Remove empty divs from the end of compiled template strings
			if (wordTemplate.substring(wordTemplate.length - 24, wordTemplate.length) == '<div class="word"></div>') {
				wordTemplate = wordTemplate.slice(0, wordTemplate.length - 24);
			}
			htmlPackage.push(wordTemplate);
		}
	}
	return htmlPackage;
};

// Convert slide object into collidable elements and append to screen
function loadLevel(slideNum) {
	$tiles = [];
	tileCount = 0;
	$enemyBox.empty();
	activeSlide = slideNum;
	var slide = slideHolder[slideNum];

	// Append title and center
	$enemyBox.append($('<div/>').addClass('slide-header'));
	var title = levelBuilder(slide.title, false);
	for (var i = 0; i < title.length; i++) {
		$enemyBox.children('.slide-header').append(title[i]);
	}

	// Append spacer and text
	$enemyBox.append($('<div/>').addClass('gameSpacer'));
	var text = levelBuilder(slide.textAsWords, false);
	for (var i = 0; i < text.length; i++) {
		$enemyBox.append(text[i]);
	}

	// Append spacer and buttons 
	$enemyBox.append($('<div/>').addClass('gameSpacer'));
	var buttons = levelBuilder(slide.buttons, true);
	var buttonsText = levelBuilder(slide.buttonsText, false);
	var btnHeader = '<div class="btn-slide"><div class="btn-title shield">';
	
	for (var i = 0; i < buttons.length; i++) {
		// Not all buttons have text
		if (!buttonsText[i]) {
			buttonsText[i] = '';
			var btnTextHeader = '';
		} else {
			var btnTextHeader = '</div><div class="btn-text">';
		}
		$enemyBox.append(btnHeader + buttons[i] + btnTextHeader + buttonsText[i] + '</div>');
	}

	// Only display help text on start
	if (displayHelp) {
		$enemyBox.append($('<div/>').addClass('gameSpacer'));
		$enemyBox.append($('#misc .btn-slide')[0].innerHTML);
	}

	// Log collidable elements
	$('#enemy-box .word').each(function() {
		$tiles.push($(this));
		tileCount++
	});
	controllable = true;
};

function toggleGamemode() {
	$gameArea.focus();
	gameMode = !gameMode;

	if (gameMode) {
		// Enable player and scorebox. Any additional transitions go here
		$('.player').show();
		$('#score-box').css('opacity', '1');
		$enemyBox.children('.help-text').show()
		controllable = true;
	} else {
		// Disable controls and reset screen
		$('.player').hide();
		$('#score-box').css('opacity', '0');
		$enemyBox.children('.help-text').hide()
		controllable = false;
		adjustScore(score * -.1);
		loadLevel(activeSlide);
	}
};

function levelComplete() { 
	controllable = false;
	displayHelp = false;
	// Load next slide when level is empty
	if (activeSlide >= slideHolder.length - 1) {
		activeSlide = 0;
		roundsPlayed++;
	} else {
		activeSlide++;
	}
	
	// Good enough for a placeholder, but need a better transition here!
	// And better styling
	$('#misc h1').slideDown(350);
	setTimeout(function() { $('#misc h1').slideUp(350) }, 850);
	setTimeout(function() { loadLevel(activeSlide) }, 1201);
};

// Determine button behavior for current slide
function buttonHandler() {
	$gameArea.on('click', '.btn-title', function(){
		var thisIndex = $('.btn-title').index(this);
		switch(activeSlide) {
			case 0:
				loadLevel(thisIndex + 1);
				break;
			case 1:
				break;
			case 2:
				var temp = $('.btn-text')[$('.btn-title').index(this)];
				console.log(temp);
				// Coming soon!
				break;
			case 3:
				var temp = $($($('.slide')[activeSlide]).children('.btn-slide')[thisIndex]).children('p')[0].innerText;
				if (temp == 'rob.hill@gmail.com') {
					temp = 'mailto:' + temp;
				} else {
					temp = 'http://www.' + temp;
				}
				window.open(temp, '_blank');
				break;
		}
	});
};

function init() {
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);
	$player = $('.player');
	$gameArea = $('#game-area');
	$enemyBox = $('#enemy-box');
	
	loadSlides();
	loadLevel(0);
	buttonHandler();
};

function mainLoop() {
	if (gameMode) calculateInput();
	if ($('.bullet'))	moveBullets();
	if ($('.particle')) moveParticles();
	if (controllable && tileCount <= 0) levelComplete();
};

$(document).ready(function() {
	init();
	setInterval(mainLoop, 1000 / fps);
});