var fps = 30;			  // Target frame rate
var keyLeft = false;	  // Keydown Left
var keyRight = false;     // Keydown right
var playerSpeed = 25;	  // Pixels to move per unit

function handleKeyDown(e) {
	if (e.keyCode == 37 || e.keyCode == 65) {
		keyLeft = true;
		console.log('Going left');
	}
	if (e.keyCode == 39 || e.keyCode == 68) {
		keyRight = true;
		console.log('Going right');
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
};


function calculateInput() {
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
}

function mainLoop() {
	calculateInput();
};

$(document).ready(function() {
	window.addEventListener('keydown', handleKeyDown, true);
	window.addEventListener('keyup', handleKeyUp, true);
	setInterval(mainLoop, 1000 / fps);
});