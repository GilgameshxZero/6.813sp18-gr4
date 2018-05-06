let zoomBounds = [3, 10];

var tfPhTime = 1500;

var mapElement;
var textField;
var landing;
var body;
var inputWrapper;
var pref;
var prefPriceDisplayCurrent;
var prefPriceSlider;
var landingLogo;
var landingBkg;

var tagSet;

window.onload = function () {
	mapElement = document.getElementById('map');
	textField = document.getElementById('text-field');
	landing = document.getElementById('landing');
	body = document.body;
	inputWrapper = document.getElementById('input-wrapper');
	pref = document.getElementById('pref');
	prefPriceSlider = document.getElementById('pref-price-slider');
	prefPriceDisplayCurrent = document.getElementById('pref-price-display-current');
	landingLogo = document.getElementById('landing-logo');
	landingBkg = document.getElementById('landing-bkg');

	textField.addEventListener('keydown', endLanding, {once: true});
	// prefPriceDisplayCurrent.innerHTML = '$' + prefPriceSlider.value; //display the default slider value

	function tfPhInterval() {
		if (typeof this.counter == 'undefined') {
			this.tfPhText = jsonData['textfield-placeholder'];
			this.counter = 0;
		}
	
		if (tfPhTime != 0) {
			textField.placeholder = this.tfPhText[this.counter++ % this.tfPhText.length];
			setTimeout(tfPhInterval, tfPhTime);
		}
	}
	tfPhInterval();

	//dynamically sizing the landing page for smoother animations
	landing.style.height = landing.offsetHeight + 'px';
	landingLogo.classList.add('landing-logo-postsize');

	//event handlers
	tagSet = new Set([]);

	initMap();
}

function endLanding(event) {
	textField.placeholder = '';
	tfPhTime = 0;
	
	//animate landing away into main page
	landing.style.height = '0px';
	landing.classList.add('hidden');
	mapElement.classList.remove('map-landing');
	inputWrapper.classList.remove('input-wrapper-landing');
	pref.classList.remove('pref-landing');
	body.classList.remove('body-landing');
	landingBkg.classList.add('landing-bkg-hidden');

	textField.focus();
}

function makePopups(markers, locationName, position_x, position_y){
	var modal = document.getElementById('modal');
	var marker = markers[locationName];

	// clear all popups
	var existingPops = document.getElementsByClassName('popup');
	for (var i = 0; i < existingPops.length; i++)
		modal.removeChild(existingPops[i]);

	var popup = document.createElement('div');
	popup.classList.add('popup');
	popup.id = locationName;

	var popupHeader = document.createElement('div');
	popupHeader.classList.add('popup-header-content');

	// close btn
	var close = document.createElement('span');
	close.classList.add('close');
	close.innerHTML = '&times;';
	close.onclick = function(){
		modal.style.display = 'none';
		textField.focus();
	}

	var link = document.createElement('a');
	var bookmark = document.createElement('img');
	bookmark.src = 'assets/img/bookmark.png';
	bookmark.classList.add('bookmark');
	if (markers[locationName]['bookmarked']){
		bookmark.style.filter = 'grayscale(0%)';
	}
	bookmark.onclick = function(){
		if (markers[locationName]['bookmarked']){
			bookmark.style.filter = 'grayscale(100%)';
			marker.setIcon('');

			markers[locationName]['bookmarked'] = false;
		}
		else{
			bookmark.style.filter = 'grayscale(0%)';
			marker.setIcon('assets/img/bookmark-marker.png');
			markers[locationName]['bookmarked'] = true;
		}
	}

	link.appendChild(bookmark);
	popupHeader.appendChild(link);
	popupHeader.appendChild(close);
	popup.appendChild(popupHeader);
	modal.appendChild(popup);
	modal.style.display = 'flex';
};

function fillPopups(popupid, data){
	var popup = document.getElementById(popupid);

	//heading
	var heading = document.createElement('div');
	heading.innerHTML = data['name'] + ', ' + data['country'];
	heading.classList.add('popup-heading');
	popup.appendChild(heading);

	//suggested date
	var dateLabel = document.createElement('div');
	dateLabel.innerHTML = 'Suggested Dates:';
	dateLabel.classList.add('popup-datelabel');
	var date = document.createElement('div');
	date.innerHTML = data['date'];
	date.classList.add('popup-date');
	popup.appendChild(dateLabel);
	popup.appendChild(date);

	//image
	var image = document.createElement('img');
	image.src = data['img'];
	image.classList.add('popup-image');
	popup.appendChild(image);

	//info
	var info = document.createElement('div');
	info.innerHTML = data['info'];
	info.classList.add('popup-info');
	popup.appendChild(info);

	//link
	var link = document.createElement('img');
	link.src = 'assets/img/expedia.png';
	link.classList.add('link-image');
	popup.appendChild(link);
}