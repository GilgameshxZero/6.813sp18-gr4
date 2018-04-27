var tfPhTime = 1500;

var mapElement;
var textField;
var landingWrapper;
var landing;
var body;
var inputWrapper;
var pref;
var prefPriceDisplayCurrent;
var prefPriceSlider;

function gMapReady() {
	//called by google API, do nothing
}

window.onload = function () {
	mapElement = document.getElementById('map');
	textField = document.getElementById('text-field');
	landingWrapper = document.getElementById('landing-wrapper');
	landing = document.getElementById('landing');
	body = document.body;
	inputWrapper = document.getElementById('input-wrapper');
	pref = document.getElementById('pref');
	prefPriceSlider = document.getElementById('pref-price-slider');
	prefPriceDisplayCurrent = document.getElementById('pref-price-display-current');

	textField.addEventListener('keydown', endLanding);
	prefPriceDisplayCurrent.innerHTML = '$' + prefPriceSlider.value; //display the default slider value

	function tfPhInterval() {
		if (typeof this.counter == 'undefined') {
			this.tfPhText = jsonData['textfield-placeholder'];
			this.counter = 0;
		}
	
		textField.placeholder = this.tfPhText[this.counter++ % tfPhText.length];
		if (tfPhTime != 0)
			setTimeout(tfPhInterval, tfPhTime);
		else
			textField.placeholder = '';
	}
	tfPhInterval();

	initMap();

}

function endLanding() {
	mapElement.classList.remove('map-landing');
	tfPhTime = 0;
	textField.removeEventListener('keydown', endLanding);
	
	//animate landing away into main page
	landing.removeChild(inputWrapper);
	body.appendChild(inputWrapper);
	landingWrapper.classList.add('hidden');
	inputWrapper.classList.remove('input-wrapper-landing');
	pref.classList.remove('pref-landing');

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
}

function makePopups(markers, locationName, position_x, position_y){
	var modal = document.getElementById('modal');
	var marker = markers[locationName][0];

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
	if (markers[locationName][1]){
		bookmark.style.filter = 'grayscale(0%)';
	}

	bookmark.onclick = function(){
		if (markers[locationName][1]){
			bookmark.style.filter = 'grayscale(100%)';
			marker.setIcon('');

			markers[locationName][1] = false;
		}
		else{
			bookmark.style.filter = 'grayscale(0%)';
			marker.setIcon('assets/img/bookmark-marker.png');
			markers[locationName][1] = true;
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
	
	//image
	var image = document.createElement('img');
	image.src = 'assets/img/' + popupid + '.jpg';
	image.classList.add('popup-image');
	popup.appendChild(image);

	//non-image background
	var nonImage = document.createElement('div');
	nonImage.classList.add('popup-non-image');
	popup.appendChild(nonImage);
	
	//heading
	var heading = document.createElement('div');
	heading.innerHTML = data['name'] + ',<br \>' + data['country'];
	heading.classList.add('popup-heading');
	nonImage.appendChild(heading);

	//suggested date
	var dateLabel = document.createElement('div');
	dateLabel.innerHTML = 'Suggested Dates:';
	dateLabel.classList.add('popup-datelabel');
	var date = document.createElement('div');
	date.innerHTML = data['date'];
	date.classList.add('popup-date');
	nonImage.appendChild(dateLabel);
	nonImage.appendChild(date);

	//info and link 
	var info = document.createElement('div');
	info.innerHTML = data['info'];
	info.classList.add('popup-info');
	var link = document.createElement('a');
	link.setAttribute('href', data['link']);
	link.style.zIndex = 2;
	link.setAttribute('target', '_blank');
	link.innerHTML = 'more...';
	nonImage.appendChild(info);
	nonImage.appendChild(link);
}

function initMap() {
	var mit = {lat: 42.358792, lng: -71.093493};
	var map = new google.maps.Map(mapElement, {
		zoom: 2,
		minZoom:2.3,
		center: mit
	});

	var florida = {lat: 27.775295, lng: -81.576485};
	var florida_data = {
		'name': 'Florida',
		'country': 'United States',
		'position': florida,
		'text': ['warm', 'beach'],
		'language': '---',
		'domestic': null,
		'budget': 0,
		'date': 'Mar 19 - Mar 24',
		'info': 'Florida is the southernmost contiguous state in the United States. The state is bordered to the west by the Gulf of Mexico, to the northwest by Alabama, to the north by Georgia, to the east by the Atlantic Ocean, and to the south by the Straits of Florida.',
		'link': 'https://en.wikipedia.org/wiki/Florida'
	};
	var marker_florida = new google.maps.Marker({
		position: florida,
		map: map
	});
	marker_florida.setVisible(false);

	var regensburg = {lat: 49.013454, lng: 12.100383};
	var regensburg_data = {
		'name': 'Regensburg',
		'country': 'Germany',
		'position': regensburg,
		'text': ['europe', 'oldcities', 'castles'],
		'language': 'german',
		'domestic': null,
		'budget': 200,
		'date': 'January 19 - January 23',
		'info': 'Regensburg is an old city in south-east Germany in Bavaria. It is located at the confluence of the Danube, Naab, and Regen rivers, ' +
				+ 'and it is the political, economic,and cultural centre of easter Bavaria. The medieval centre of the city is UNESCO Worlk Heritage  Site, '
				+ 'and in 2014, it was among the top sights in Germany.',
		'link': 'https://en.wikipedia.org/wiki/Regensburg'
	}
	var marker_regensburg = new google.maps.Marker({
		position: regensburg,
		map: map
	});
	marker_regensburg.setVisible(false);

	var bryceCanyon = {lat: 37.593833, lng: -112.187092}
	var bryce_data = {
		'name': 'Bryce Canyon',
		'country': 'United States',
		'position': bryceCanyon,
		'text': ['hiking', 'camping'],
		'language': '---',
		'domestic': false,
		'budget': 0,
		'date': 'June 7 - June 9',
		'info': 'Bryce Canyon National Park is a United States national park located in southwestern Utah. The major feature of the park is Bryce Canyon, which despite its name, is not a canyon, but a collection of giant natural amphitheaters along the eastern side of the Paunsaugunt Plateau. Bryce is distinctive due to geological structures called hoodoos, formed by frost weathering and stream erosion of the river and lake bed sedimentary rocks. The red, orange, and white colors of the rocks provide spectacular views for park visitors. Bryce sits at a much higher elevation than nearby Zion National Park. The rim at Bryce varies from 8,000 to 9,000 feet (2,400 to 2,700 m).',
		'link': 'https://en.wikipedia.org/wiki/Bryce_Canyon_National_Park'
	};
	var marker_bryce = new google.maps.Marker({
		position: bryceCanyon,
		map: map
	});
	marker_bryce.setVisible(false);

	var datas = [florida_data, regensburg_data, bryce_data];
	var markers = {
		'Bryce Canyon': [marker_bryce, false], 
		'Florida': [marker_florida, false], 
		'Regensburg': [marker_regensburg, false]
	};

	google.maps.event.addListener(marker_florida, 'click', function(){
		makePopups(markers, 'Florida', event.clientX, event.clientY);
		fillPopups('Florida', florida_data);
	});
	google.maps.event.addListener(marker_bryce, 'click', function(){
		makePopups(markers, 'Bryce Canyon', event.clientX, event.clientY);
		fillPopups('Bryce Canyon', bryce_data);
	});
	google.maps.event.addListener(marker_regensburg, 'click', function(){
		makePopups(markers, 'Regensburg', event.clientX, event.clientY);
		fillPopups('Regensburg', regensburg_data);
	});

	var inputWrapper = document.getElementById('input-wrapper');
	textField.focus();

	function checkData(){
		var tags = document.getElementsByClassName('tag');
    	var allText = [];
    	for (var i = 0; i < tags.length; i++){
    		allText.push(tags[i].innerHTML.toLowerCase());
    	}
    	for (var i = 0; i < datas.length; i++){
    		var matched = true;
    		//check for text
    		dataText = datas[i]['text'];
    		for (var j = 0; j < dataText.length; j++){
    			if (allText.indexOf(dataText[j]) < 0){
    				matched = false;
    				break;
    			}
    		}

    		//language preference
    		var languageSelect = document.getElementById('pref-language-select');
			var l_option = languageSelect.options[languageSelect.selectedIndex].text;
			
			if (l_option.toLowerCase() != datas[i]['language']){
				matched = false;
			}

    		//citizenship preference
   //  		var citizenshipSelect = document.getElementById('pref-citizenship-select');
			// var c_option = citizenshipSelect.options[citizenshipSelect.selectedIndex].text;
			
			// if (c_option.toLowerCase() != datas[i]['citizenship']){
			// 	matched = false;
			// }

			var domesticPref = document.getElementById("pref-domestic");
			var internationalPref = document.getElementById("pref-international");

    		// //pets preference
    		// petsBool = datas[i]['pets'];
    		// //console.log(document.getElementById('petsCheckbox').checked);
    		// if (petsBool != document.getElementById('petsCheckbox').checked){
    		// 	matched = false;
    		// }

    		// //kids preference
    		// kidsBool = datas[i]['kids'];
    		// if (kidsBool != document.getElementById('kidsCheckbox').checked){
    		// 	matched = false;
    		// }

    		// //budget
    		// var currentBudget = parseInt(document.getElementById('pref-price-display-current').innerHTML.slice(1));
    		// if (Math.abs(currentBudget - datas[i]['budget']) > 50){
    		// 	matched = false;
    		// }
    		//if (datas[i]['budget'] < currentBudget){
    		//	matched = false;
    		//}

    		if (matched){
    			markers[datas[i]['name']][0].setVisible(true);
    		}
    		else if (!matched && !markers[datas[i]['name']][1]) {
    			markers[datas[i]['name']][0].setVisible(false);
    		}
    	}
	}

	textField.addEventListener('keyup', function(event) {
	    event.preventDefault();
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
	    	//console.log(inputWrapper.childNodes);
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

	var myFunction = function() {
	    console.log("he");
	};

	for (var i = 0; i < buttons.length; i++) {
	    buttons[i].addEventListener('click', myFunction, false);
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
        if(latSouth<-85.5) {
        	//console.log('s'); 
            newLat =  map.getCenter().lat() - (latSouth+85);   /* too south, centering */
		}   
		if(newLat) {
		    var newCenter= new google.maps.LatLng( newLat ,map.getCenter().lng() );
		    map.panTo(newCenter);
		}   
	}
}