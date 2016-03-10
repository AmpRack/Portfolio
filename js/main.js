$(document).ready(function() {
	$('#play-button span').mouseover(function() {
		$(this).parent().css('border-color', 'white');
	});
	$('#play-button span').mouseout(function() {
		$(this).parent().css('border-color', 'red');
	});

  // Close the Responsive Menu on Menu Item Click
  $('.navbar-collapse ul li a').click(function() {
      $('.navbar-toggle:visible').click();
  });
});