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

function gMapReady() {
	//called by google API, do nothing
}


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

	// //update the current slider value (each time you drag the slider handle)
	// prefPriceSlider.oninput = function() {
	// 	prefPriceDisplayCurrent.innerHTML = '$' + this.value;
	// }

	//idk what this does
	window.onclick = function(event) {
		var modal = document.getElementById('modal');
	    if (event.target == modal) {
	        modal.style.display = 'none';
	    }
	}

	textField.focus();
}

function makePopups(markers, locationName, position_x, position_y){
	var modal = document.getElementById('modal');
	var marker = markers[locationName];

	var existingPops = document.getElementsByClassName('popup');
	for (var i = 0; i < existingPops.length; i++)
		modal.removeChild(existingPops[i]);

	var popup = document.createElement('div');
	popup.classList.add('popup');
	popup.id = locationName;
	popup.style.top = (position_y - 100) + 'px';
	popup.style.left = (position_x - 100) + 'px';

	var close = document.createElement('span');
	close.classList.add('close');
	close.innerHTML = '&times;';
	//close.style.float = 'right';

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

	popup.appendChild(close);
	link.appendChild(bookmark);
	popup.appendChild(link);
	modal.appendChild(popup);

	close.classList.add('popup-non-image');
	bookmark.classList.add('popup-non-image');
	link.classList.add('popup-non-image');
	link.classList.add('popup-link');

	modal.style.display = 'block';
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

	//info and link 
	var info = document.createElement('div');
	info.innerHTML = data['info'];
	info.classList.add('popup-info');
	// var link = document.createElement('a');
	// link.setAttribute('href', data['link']);
	// link.style.zIndex = 2;
	// link.setAttribute('target', '_blank');
	// link.innerHTML = 'more...';
	popup.appendChild(info);
	// popup.appendChild(link);

	var link = document.createElement('img');
	link.src = 'assets/img/expedia.png';
	link.classList.add('link-image');
	popup.appendChild(link);
}

function animateMapZoomTo(map, targetZoom) {
    var currentZoom = arguments[2] || map.getZoom();
    if (currentZoom != targetZoom) {
        google.maps.event.addListenerOnce(map, 'zoom_changed', function (event) {
            animateMapZoomTo(map, targetZoom, currentZoom + (targetZoom > currentZoom ? 1 : -1));
        });
    }
	setTimeout(function(){ map.setZoom(currentZoom); }, 80);
}

function getZoomByBounds( map, bounds ){
	var MAX_ZOOM = map.mapTypes.get( map.getMapTypeId() ).maxZoom || 21 ;
	var MIN_ZOOM = map.mapTypes.get( map.getMapTypeId() ).minZoom || 0 ;

	var ne= map.getProjection().fromLatLngToPoint( bounds.getNorthEast() );
	var sw= map.getProjection().fromLatLngToPoint( bounds.getSouthWest() ); 

	var worldCoordWidth = Math.abs(ne.x-sw.x);
	var worldCoordHeight = Math.abs(ne.y-sw.y);

	var FIT_PAD = 40;

	for( var zoom = MAX_ZOOM; zoom >= MIN_ZOOM; --zoom ){ 
		if( worldCoordWidth*(1<<zoom)+2*FIT_PAD < $(map.getDiv()).width() && 
			worldCoordHeight*(1<<zoom)+2*FIT_PAD < $(map.getDiv()).height() )
			return zoom;
	}
	return 0;
}

function initMap() {
	var mit = {lat: 42.358792, lng: -71.093493};
	var map = new google.maps.Map(mapElement, {
		zoom: 3,
		minZoom: 2.3,
		center: mit
	});

	var markers = [];
	for (var a = 0; a < jsonData['data-markers'].length;a++) {
		markers.push(new google.maps.Marker({position: {lat: jsonData['data-markers'][a]['lat'], lng: jsonData['data-markers'][a]['lng']}, map: map}));
		markers[markers.length - 1].setVisible(false);
		markers[markers.length - 1]['bookmarked'] = false;

		var listenerMaker = function(index) {
			return function() {
				makePopups(markers, index, event.clientX, event.clientY);
				fillPopups(index, jsonData['data-markers'][index]);
			};
		};
		var listener = listenerMaker(a);
		google.maps.event.addListener(markers[a], 'click', listener);
	}

	textField.focus();

	function checkData(){
		var tags = document.getElementsByClassName('tag');
    	var allText = [];
    	for (var i = 0; i < tags.length; i++){
    		allText.push(tags[i].innerHTML.toLowerCase());
    	}
    	for (var i = 0; i < jsonData['data-markers'].length; i++){
    		var matched = true;
			//check for text
    		dataText = jsonData['data-markers'][i]['text'];
    		for (var j = 0; j < dataText.length; j++){
    			if (allText.indexOf(dataText[j]) < 0){
    				matched = false;
    				break;
    			}
    		}

    		//language preference
    		var languageSelect = document.getElementById('pref-language-select');
			var l_option = languageSelect.options[languageSelect.selectedIndex].text;
			
			if (l_option.toLowerCase() != jsonData['data-markers'][i]['language']){
				matched = false;
			}

   //  		//citizenship preference
   //  		var citizenshipSelect = document.getElementById('pref-citizenship-select');
			// var c_option = citizenshipSelect.options[citizenshipSelect.selectedIndex].text;
			
			// if (c_option.toLowerCase() != datas[i]['citizenship']){
			// 	matched = false;
			// }
			var location = jsonData['data-markers'][i]['location'];
			var domestic = document.getElementById("pref-domestic");
			var international = document.getElementById("pref-international");
			if (domestic.classList.contains("clicked") && (location != "domestic")){
				matched = false;
			}
			else if (international.classList.contains("clicked") && (location != "international")){
				matched = false;
			}
			else if (!domestic.classList.contains("clicked") && !international.classList.contains("clicked")
				&& location != "---"){
				matched = false;
			}

			var budget = jsonData['data-markers'][i]['budget'];
			var lowBudget = document.getElementById("pref-$");
			var midBudget = document.getElementById("pref-$$");
			var highBudget = document.getElementById("pref-$$$");
			if (lowBudget.classList.contains("clicked") && (budget != "$")){
				matched = false;
			}
			else if (midBudget.classList.contains("clicked") && (budget != "$$")){
				matched = false;
			}
			else if (highBudget.classList.contains("clicked") && (budget != "$$$")){
				matched = false;
			}
			else if (!lowBudget.classList.contains("clicked") && !midBudget.classList.contains("clicked") && !highBudget.classList.contains("clicked")
				&& budget != "---"){
				matched = false;
			}

			var season = jsonData['data-markers'][i]['season'];
			var spring = document.getElementById("pref-spring");
			var summer = document.getElementById("pref-summer");
			var fall = document.getElementById("pref-fall");
			var winter = document.getElementById("pref-winter");
			if (spring.classList.contains("clicked") && (season != "spring")){
				matched = false;
			}
			else if (summer.classList.contains("clicked") && (season != "summer")){
				matched = false;
			}
			else if (fall.classList.contains("clicked") && (season != "fall")){
				matched = false;
			}
			else if (winter.classList.contains("clicked") && (season != "winter")){
				matched = false;
			}
			else if (!spring.classList.contains("clicked") && !summer.classList.contains("clicked") 
				&& !fall.classList.contains("clicked") && !winter.classList.contains("clicked")){
				matched = false;
			}

   //  		//pets preference
   //  		petsBool = datas[i]['pets'];
   //  		//console.log(document.getElementById('petsCheckbox').checked);
   //  		if (petsBool != document.getElementById('petsCheckbox').checked){
   //  			matched = false;
   //  		}

   //  		//kids preference
   //  		kidsBool = datas[i]['kids'];
   //  		if (kidsBool != document.getElementById('kidsCheckbox').checked){
   //  			matched = false;
   //  		}

   //  		//budget
   //  		var currentBudget = parseInt(document.getElementById('pref-price-display-current').innerHTML.slice(1));
   //  		if (Math.abs(currentBudget - datas[i]['budget']) > 50){
   //  			matched = false;
   //  		}
    		//if (datas[i]['budget'] < currentBudget){
    		//	matched = false;
			//}
			
    		if (matched && !markers[i].getVisible())
				markers[i].setVisible(true);
    		else if (!matched && !markers[i]['bookmarked'] && markers[i].getVisible())
				markers[i].setVisible(false);
    	}
			
		//update map zoom & location
		var bounds = new google.maps.LatLngBounds();
		var markersVisible = 0;
		for (var a = 0;a < markers.length;a++) {
			if (markers[a].getVisible()) {
				bounds.extend(markers[a].position);
				markersVisible++;
			}
		}

		if (markersVisible != 0) {
			map.panTo(bounds.getCenter());
			animateMapZoomTo(map, Math.max(Math.min(getZoomByBounds(map, bounds) - 1, zoomBounds[1]), zoomBounds[0]));
		}
	}

	textField.addEventListener('keydown', function(event) {
	    //Make a new timeout set to go off in 800ms
        if (event.keyCode === 13) {
	    	var tag = document.createElement('span');
	    	tag.classList.add('tag');
	    	//this.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,'');
	        tag.innerHTML = textField.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,'');;
	        inputWrapper.insertBefore(tag, textField);
	        textField.value = '';

	    	checkData();
	    }
	    //BUG with how to fix when only one word left in input value
	    else if (event.keyCode === 8 && textField.value == '') {
	    	var tag = inputWrapper.childNodes[inputWrapper.childNodes.length - 5];
	    	if (tag){
		    	inputWrapper.removeChild(tag);
		    	checkData();
		    }
    	}
	});

	inputWrapper.addEventListener('click', function(event){
		var tag = event.target;
		if (tag.classList.contains('tag')){
			var tag = event.target;
			if (tag.classList.contains('tag')){
				inputWrapper.removeChild(tag);
				textField.focus();
			}
			checkData();
		}
	});

	// document.getElementById('petsCheckbox')
	// 	.addEventListener('click', function(event){
	// 		checkData();
	// });

	// document.getElementById('kidsCheckbox')
	// 	.addEventListener('click', function(event){
	// 		checkData();
	// });

	document.getElementById('pref-language-select')
		.addEventListener('change', function() {
		    checkData();
	});

	// document.getElementById('pref-citizenship-select')
	// 	.addEventListener('change', function() {
	// 	    checkData();
	// });

	// document.getElementById('pref-price-slider')
	// 	.addEventListener('change', function() {
	// 	    checkData();
	// });

	var buttons = document.getElementsByTagName("button");
	var groups = {};
	for (var i = 0; i < buttons.length; i++){
		var parentName = buttons[i].parentNode.id.slice(5);
		if (parentName in groups){
			groups[parentName].push(buttons[i]);
		}
		else{
			groups[parentName] = [buttons[i]];
		}
	}
	// console.log(groups);
	var buttons = document.getElementsByTagName("button");
	for (let j = 0; j < buttons.length; j++) {
	  let button = buttons[j];
	  button.addEventListener('click', function() {

	  	if (button.classList.contains("clicked")){
	  		button.classList.remove("clicked");
	  	}
	  	else{
	  		var sametypes = groups[button.parentNode.id.slice(5)];
	  		for (var i = 0; i < sametypes.length; i++){
	  			if (sametypes[i] != button && sametypes[i].classList.contains("clicked")){
	  				sametypes[i].classList.remove("clicked");
	  			}
		  	}
	    	button.classList.add("clicked");
	    }
	    checkData();
	  });
	}

	//taking care of centering and not leaving bounds of the world map
	google.maps.event.addListener(map, 'center_changed', function() {
	    checkBounds(map);
	});
	//If the map position is out of range, move it back
	function checkBounds(map) {
		var latNorth = map.getBounds().getNorthEast().lat();
		var latSouth = map.getBounds().getSouthWest().lat();

		var newLat;

        if(latNorth > 85.5) {
        	//console.log('n');
            newLat =  map.getCenter().lat() - (latNorth-85);   /* too north, centering */
        }
        if(latSouth < -85.5) {
        	//console.log('s'); 
            newLat =  map.getCenter().lat() - (latSouth+85);   /* too south, centering */
		}   
		if(newLat) {
		    var newCenter= new google.maps.LatLng( newLat ,map.getCenter().lng() );
		    map.panTo(newCenter);
		}   
	}
}