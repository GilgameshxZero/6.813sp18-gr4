var mapElement = 'map';

function initMap() {
	var uluru = {lat: -25.363, lng: 131.044};
	var shanghai = {lat: 31.2240453, lng: 121.1965744};
	var map = new google.maps.Map(document.getElementById(mapElement), {
		zoom: 4,
		center: uluru
	});
	var marker = new google.maps.Marker({
		position: uluru,
		map: map
	});
	var marker2 = new google.maps.Marker({
		position: shanghai,
		map: map
	});
}

window.onload = function () {
	var rstPriceSlider = document.getElementById("rst-price-slider");
	var rstPriceDisplayCurrent = document.getElementById("rst-price-display-current");
	rstPriceDisplayCurrent.innerHTML = '$' + rstPriceSlider.value; // Display the default slider value
	
	// Update the current slider value (each time you drag the slider handle)
	rstPriceSlider.oninput = function() {
		rstPriceDisplayCurrent.innerHTML = '$' + this.value;
	}
}