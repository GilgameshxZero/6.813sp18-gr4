const cTagSuggestions = 4;

let zoomBounds = [3, 9];

var tfPhTime = 1500;
var onLanding = true;

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
var inputLogo;
var inputTags;
var inputTagDummy;
var inputWrapperMain;
var bottomBar;
var mfEmail;
var mfBookmarks;
var mfClear;
var mfUndo;

var tagSet;
var mapMarkers = [];
var gMapElement;
var tagSuggestions = new Set([]);
var acCurrentFocus;
var clearedBookmarks = [];

var unitedStates = false;
var selectedLanguages = [];
var selectedPriceRange;

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
	inputLogo = document.getElementById('input-logo');
	inputTags = document.getElementById('input-tags');
	inputTagDummy = document.getElementById('input-tag-dummy');
	inputWrapperMain = document.getElementById('input-wrapper-main');
	bottomBar = document.getElementById('bottom-bar');
	mfEmail = document.getElementById('more-funcs-email');
	mfBookmarks = document.getElementById('more-funcs-bookmarks');
	mfClear = document.getElementById('more-funcs-clear');
	mfUndo = document.getElementById('more-funcs-undo');

	tagSet = new Set([]);

	//input placeholder logic
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

	textField.focus();

	initAutocomplete();
	initHandlers();
	initMap();

	// checking if current location is USA
	var startPos;
	var geoOptions = {
		enableHighAccuracy: true
	}

	var geoSuccess = function(position) {
		startPos = position;
		var lat = startPos.coords.latitude;
		var long = startPos.coords.longitude;

		var topLat = 49.3457868;
		var leftLong = -124.7844079;
		var rightLong = -66.9513812;
		var bottomLat =  24.7433195;

		if ((bottomLat <= lat) && (lat <= topLat) && (leftLong <= long) && (long <= rightLong)){
			unitedStates = true;
		}

	};
	var geoError = function(error) {
		console.log('Error occurred. Error code: ' + error.code);
		// error.code can be:
		//   0: unknown error
		//   1: permission denied
		//   2: position unavailable (error response from location provider)
		//   3: timed out
	};

	navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
}

//buttons event handlers
function onSendToEmail() {
	var mail = 'mailto:?subject=' + 
	'Bookmarks' + '&body=' + 
	'Your bookmarks: ';

	for (var a = 0;a < mapMarkers.length;a++) {
		if (mapMarkers[a]['bookmarked']) {
			mail += jsonData['data-markers'][a]['name'] + '; ';
		}
	}

	console.log(encodeURI(mail));
	window.open(encodeURI(mail));
}

function onZoomToBookmarks() {
	if (typeof this.counter == 'undefined') {
		this.counter = 0;
	}

	var passes = 0;
	for(;passes < mapMarkers.length;this.counter = (this.counter + 1) % mapMarkers.length) {
		if (mapMarkers[this.counter]['bookmarked']) {
			gMapElement.panTo(mapMarkers[this.counter].position);
			animateMapZoomTo(gMapElement, zoomBounds[1]);
			this.counter = (this.counter + 1) % mapMarkers.length;

			break;
		} else
			passes++;
	}
}

function onClearBookmarks() {
	clearedBookmarks = []
	for (var a = 0;a < mapMarkers.length;a++) {
		if (mapMarkers[a]['bookmarked']) {
			mapMarkers[a]['bookmarked'] = false;
			clearedBookmarks.push(a);
		}
	}

	updateMap();
	if (clearedBookmarks.length > 0)
		mfUndo.disabled = false;
}

function onUndoClear() {
	for (var a = 0;a < clearedBookmarks.length;a++) {
		mapMarkers[clearedBookmarks[a]]['bookmarked'] = true;
	}

	updateMap();
	mfUndo.disabled = true;
}

//autocomplete helpers
function acAddActive(x) {
	/*a function to classify an item as "active":*/
	if (!x) return false;
	/*start by removing the "active" class on all items:*/
	acRemoveActive(x);
	if (acCurrentFocus >= x.length) acCurrentFocus = 0;
	if (acCurrentFocus < 0) acCurrentFocus = (x.length - 1);
	/*add class "autocomplete-active":*/
	x[acCurrentFocus].classList.add("autocomplete-active");
}

function acRemoveActive(x) {
	/*a function to remove the "active" class from all autocomplete items:*/
	for (var i = 0; i < x.length; i++) {
		x[i].classList.remove("autocomplete-active");
	}
}

function acCloseAllLists(elmnt) {
	/*close all autocomplete lists in the document,
	except the one passed as an argument:*/
	var x = document.getElementsByClassName("autocomplete-items");
	for (var i = 0; i < x.length; i++) {
		if (elmnt != x[i] && elmnt != textField) {
			x[i].parentNode.removeChild(x[i]);
		}
	}
}

function acRefresh(elem) {
	var a, b, i, val = elem.value;
	/*close any already open lists of autocompleted values*/
	acCloseAllLists();
	if (!val) { return false; }
	acCurrentFocus = -1;
	/*create a DIV element that will contain the items (values):*/
	a = document.createElement("DIV");
	a.setAttribute("id", elem.id + "autocomplete-list");
	a.setAttribute("class", "autocomplete-items");
	/*append the DIV element as a child of the autocomplete container:*/
	elem.parentNode.appendChild(a);
	/*for each item in the array...*/
	for (var item of tagSuggestions) {
		//don't suggest anything that's already entered
		if (tagSet.has(item))
			continue;

		//limit suggestions count
		if (a.childElementCount >= cTagSuggestions)
			break;

		/*check if the item starts with the same letters as the text field value:*/
		if (item.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
			/*create a DIV element for each matching element:*/
			b = document.createElement("DIV");
			/*make the matching letters bold:*/
			b.innerHTML = "<strong>" + item.substr(0, val.length) + "</strong>";
			b.innerHTML += item.substr(val.length);
			/*insert a input field that will hold the current array item's value:*/
			b.innerHTML += "<input type='hidden' value='" + item + "'>";
			/*execute a function when someone clicks on the item value (DIV element):*/
			b.addEventListener("click", function (e) {
				/*insert the value for the autocomplete text field:*/
				textField.value = this.getElementsByTagName("input")[0].value;
				/*close the list of autocompleted values,
				(or any other open lists of autocompleted values:*/
				acCloseAllLists();

				//simulate an enter
				enterTag();
				textField.focus();
			});
			a.appendChild(b);
		}
	}
}

//code from online to set up autocomplete, with some personal tweaks
function initAutocomplete() {
	for (var a = 0;a < jsonData['data-markers'].length;a++)
		for (var b = 0;b < jsonData['data-markers'][a]['text'].length;b++)
		tagSuggestions.add(jsonData['data-markers'][a]['text'][b]);

	/*the autocomplete function takes two arguments,
	the text field element and an array of possible autocompleted values:*/
    /*execute a function when someone writes in the text field:*/
	textField.addEventListener("input", function (e) {
		acRefresh(this);
	});
    /*execute a function presses a key on the keyboard:*/
    textField.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            acCurrentFocus++;
            /*and and make the current item more visible:*/
            acAddActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            acCurrentFocus--;
            /*and and make the current item more visible:*/
            acAddActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (acCurrentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[acCurrentFocus].click();
            }
        }
    });
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        acCloseAllLists(e.target);
    });
}

function enterTag() {
	if (onLanding) {
		endLanding();
		onLanding = false;
	}

	var newTag = inputTagDummy.cloneNode(deep=true);
	newTag.classList.remove('input-tag-hidden');
	newTag.classList.add('input-tag-real');
	newTag.id = '';
	for (var a = 0;a < newTag.childNodes.length;a++) {
		if (newTag.childNodes[a].className == 'input-tag-elem-text') {
			newTag.childNodes[a].innerHTML = textField.value;
			break;
		}
	}

	tagSet.add(textField.value);
	inputTags.appendChild(newTag);
	textField.value = '';
	
	updateMap();
	updateMapPos();
	acRefresh(textField);
}

function initHandlers() {
	mfEmail.addEventListener('click', onSendToEmail);
	mfBookmarks.addEventListener('click', onZoomToBookmarks);
	mfClear.addEventListener('click', onClearBookmarks);
	mfUndo.addEventListener('click', onUndoClear);

	textField.addEventListener('keydown', function(event) {
        if (event.keyCode === 13 && textField.value != '' && !tagSet.has(textField.value))
			enterTag();
		else if (event.keyCode === 8 && textField.value == '') {
			if (inputTags.lastChild.classList.contains('input-tag-real')) { //not dummy
				event.preventDefault();
				textField.value = getTagText(inputTags.lastChild);
				removeTag(inputTags.lastChild);
				acRefresh(textField);
			}
    	}
	});

	inputTags.addEventListener('click', function(event) {
		var tag = event.target;

		//get correct ancestor
		while (tag.parentNode != inputTags)
			tag = tag.parentNode;

		if (tag.classList.contains('input-tag-elem'))
			removeTag(tag);
	});

	document.getElementById('pref-language-select')
		.addEventListener('change', function() {
			selectedLanguages = [];
			var select = document.getElementById("pref-language-select").options;
			for (var i = 0; i < select.length; i++){
				if (select[i].selected){
					selectedLanguages.push(select[i].value.toLowerCase());
				}
			}
		    updateMap();
	});

	document.getElementById('pref-price-select')
		.addEventListener('change', function() {
			var select = document.getElementById("pref-price-select").options;
			for (var i = 0; i < select.length; i++){
				if (select[i].selected){
					selectedPriceRange = select[i].value;
				}
			}
		    updateMap();
	});

	document.getElementById('tripDuration')
		.addEventListener('change', function() {
		    updateMap();
	});

	var buttons = document.getElementsByTagName('button');
	var groups = {};
	for (var i = 0; i < buttons.length; i++) {
		var parentName = buttons[i].parentNode.id.slice(5);
		if (parentName in groups){
			groups[parentName].push(buttons[i]);
		}
		else{
			groups[parentName] = [buttons[i]];
		}
	}

	var buttons = document.getElementsByTagName('button');
	for (let j = 0; j < buttons.length; j++) {
	  let button = buttons[j];
	  button.addEventListener('click', function() {
	  		if (button.classList.contains('location')){
	  			var actives = document.getElementsByClassName('active');
	  			for (var i = 0; i < actives.length; i++){
	  				if (actives[i].classList.contains('location')){
	  					actives[i].classList.remove('active');
	  				}
	  			}
				button.classList.add('active');

			}
			if (button.classList.contains('clicked')) {
				button.classList.remove('clicked');
			}
			else{
				var sametypes = groups[button.parentNode.id.slice(5)];
				for (var i = 0; i < sametypes.length; i++){
					if (sametypes[i] != button && sametypes[i].classList.contains('clicked')){
						sametypes[i].classList.remove('clicked');
					}
				}
				button.classList.add('clicked');
			}
			updateMap();
	  	});
	}

}

//get text of a tag node
function getTagText(tag) {
	for (var a = 0;a < tag.childNodes.length;a++)
		if (tag.childNodes[a].className == 'input-tag-elem-text')
			return tag.childNodes[a].innerHTML;
}

//remove a tag from the list
function removeTag(tag) {
	inputTags.removeChild(tag);
	tagSet.delete(getTagText(tag));
	textField.focus();
	updateMap();
	updateMapPos();
}

//animate landing away into main page
//called when user enters a tag
function endLanding(event) {
	textField.placeholder = '';
	tfPhTime = 0;
	
	landing.style.height = '0px';
	landing.classList.add('hidden');
	mapElement.classList.remove('map-landing');
	inputWrapper.classList.remove('input-wrapper-landing');
	bottomBar.classList.remove('bottom-bar-landing');
	body.classList.remove('body-landing');
	landingBkg.classList.add('landing-bkg-hidden');
	inputLogo.classList.remove('input-logo-landing');
	inputWrapperMain.classList.remove('input-wrapper-main-landing');

	textField.focus();
}

//map helper function
function animateMapZoomTo(map, targetZoom) {
    var currentZoom = arguments[2] || map.getZoom();
    if (currentZoom != targetZoom) {
        google.maps.event.addListenerOnce(map, 'zoom_changed', function (event) {
            animateMapZoomTo(map, targetZoom, currentZoom + (targetZoom > currentZoom ? 1 : -1));
        });
    }
	setTimeout(function(){ map.setZoom(currentZoom); }, 80);
}

//map helper function
function getZoomByBounds(map, bounds) {
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
	gMapElement = new google.maps.Map(mapElement, {
		zoom: 3,
		minZoom: 2.3,
		center: {lat: 42.358792, lng: -71.093493}
	});

	//taking care of centering and not leaving bounds of the world map
	google.maps.event.addListener(gMapElement, 'center_changed', function() {
	    var latNorth = gMapElement.getBounds().getNorthEast().lat();
		var latSouth = gMapElement.getBounds().getSouthWest().lat();

		var newLat;

        if (latNorth > 85.5)
            newLat =  gMapElement.getCenter().lat() - (latNorth - 85);   /* too north, centering */
        if (latSouth < -85.5)
            newLat =  gMapElement.getCenter().lat() - (latSouth + 85);   /* too south, centering */
		if (newLat) {
		    var newCenter= new google.maps.LatLng(newLat, gMapElement.getCenter().lng() );
		    gMapElement.panTo(newCenter);
		}  
	});

	//make markers for data beforehand
	for (var a = 0; a < jsonData['data-markers'].length;a++) {
		mapMarkers.push(new google.maps.Marker({position: {lat: jsonData['data-markers'][a]['lat'], lng: jsonData['data-markers'][a]['lng']}, map: gMapElement}));
		mapMarkers[mapMarkers.length - 1].setVisible(false);
		mapMarkers[mapMarkers.length - 1]['bookmarked'] = false;

		var listenerMaker = function(index) {
			return function() {
				makePopups(mapMarkers, index, event.clientX, event.clientY);
				fillPopups(index, jsonData['data-markers'][index]);
			};
		};
		var listener = listenerMaker(a);
		google.maps.event.addListener(mapMarkers[a], 'click', listener);
	}
}

//update map zoom & location
function updateMapPos() {
	var bounds = new google.maps.LatLngBounds();
	var markersVisible = 0;
	for (var a = 0;a < mapMarkers.length;a++) {
		if (mapMarkers[a].getVisible() && !mapMarkers[a]['bookmarked']) {
			bounds.extend(mapMarkers[a].position);
			markersVisible++;
		}
	}

	if (markersVisible != 0) {
		gMapElement.panTo(bounds.getCenter());
		animateMapZoomTo(gMapElement, Math.max(Math.min(getZoomByBounds(gMapElement, bounds) - 1, zoomBounds[1]), zoomBounds[0]));
	}
}

//displays markers based on tags and prefs
function updateMap() {
	//set icons
	for (var a = 0;a < mapMarkers.length;a++) {
		if (mapMarkers[a]['bookmarked']) {
			mapMarkers[a].setIcon('assets/img/bookmark-marker.png');
		} else {
			mapMarkers[a].setIcon('');
		}
	}

	var tags = document.getElementsByClassName('input-tag-real');
	var allText = [];
	
	for (var i = 0; i < tags.length; i++){
		allText.push(getTagText(tags[i]));
	}
	
	for (var i = 0; i < jsonData['data-markers'].length; i++){
		var matched = true;
		var data = jsonData['data-markers'][i];
		
		var dataText = data['text'];
		for (var j = 0; j < allText.length; j++){
			if (dataText.indexOf(allText[j]) < 0){
				matched = false;
				break;
			}
		}

		//TODO: match preferences here
		dataLanguage = data['language'];
		for (var j = 0; j < selectedLanguages.length; j++){
			if (! dataLanguage.includes(selectedLanguages[j])){
				matched = false;
				break;
			}
		}

		dataLocation = data['country'];
		var locationButtons = document.getElementsByClassName("location");
		var locationChoice; 
		for (var j = 0; j < locationButtons.length; j++){
			if (locationButtons[j].classList.contains("active")){
				locationChoice = locationButtons[j].innerHTML.toLowerCase();
			}
		}

		if (unitedStates && dataLocation == "United States" && locationChoice == "international"){
			matched = false;
		}
		else if (unitedStates && dataLocation != "United States" && locationChoice == "domestic"){
			matched = false;
		}

		dataBudget = data['budget'];
		var duration = document.getElementById("tripDuration").value;
		if (duration && selectedPriceRange){
			var priceArray = selectedPriceRange.split('-');
			var low = Number(priceArray[0].substring(1).replace(/,/g , ""));
			var high = Number(priceArray[1].substring(1).replace(/,/g , ""));
			if (((high/duration) <= dataBudget)){
				matched = false;
			}
		}

		
		if (matched && !mapMarkers[i].getVisible())
			mapMarkers[i].setVisible(true);
		else if (!matched && !mapMarkers[i]['bookmarked'] && mapMarkers[i].getVisible())
			mapMarkers[i].setVisible(false);
	}
}

function makePopups(markers, locationName, position_x, position_y){
	var modal = document.getElementById('modal');
	var marker = mapMarkers[locationName];

	// clear all popups
	var existingPops = document.getElementsByClassName('popup');
	for (var i = 0; i < existingPops.length; i++)
		modal.removeChild(existingPops[i]);

	var popup = document.createElement('div');
	popup.classList.add('popup');
	popup.id = locationName;

	var popupHeader = document.createElement('div');
	popupHeader.classList.add('popup-header-container');

	// close btn
	var close = document.createElement('img');
	close.src = 'assets/img/x.png';
	close.classList.add('close');
	close.onclick = function(){
		modal.style.display = 'none';
		textField.focus();
	}

	//expedia link
	var weblink = document.createElement('a');
	var expedia = document.createElement('img');
	expedia.src = 'assets/img/expedia.png';
	expedia.classList.add('expedia-image');

	// var bookmarklink = document.createElement('a');
	var bookmark = document.createElement('img');
	bookmark.src = 'assets/img/bookmark.png';
	bookmark.classList.add('bookmark');
	if (mapMarkers[locationName]['bookmarked']){
		bookmark.style.filter = 'grayscale(0%)';
	}
	bookmark.onclick = function(){
		if (mapMarkers[locationName]['bookmarked']){
			bookmark.style.filter = 'grayscale(100%)';
			marker.setIcon('');
			mapMarkers[locationName]['bookmarked'] = false;
		}
		else{
			bookmark.style.filter = 'grayscale(0%)';
			marker.setIcon('assets/img/bookmark-marker.png');
			mapMarkers[locationName]['bookmarked'] = true;
		}
	}

	popupHeader.appendChild(bookmark);
	weblink.appendChild(expedia);
	popupHeader.appendChild(weblink);
	popupHeader.appendChild(weblink);
	popupHeader.appendChild(close);
	popup.appendChild(popupHeader);
	modal.appendChild(popup);
	modal.style.display = 'flex';
};

function fillPopups(popupid, data){
	// console.log(popupid, data);
	var popup = document.getElementById(popupid);

	//heading
	var heading = document.createElement('div');
	heading.innerHTML = data['name'] + ', ' + data['country'];
	heading.classList.add('popup-heading');
	popup.appendChild(heading);

	//image
	var carouselTemp = document.getElementById("imgCarousel");
	var carousel = carouselTemp.cloneNode(true);
	carousel.id = "images"+data.name;
	var left = carousel.getElementsByClassName('left')[0];
	left.href = '#'+carousel.id;
	carousel.getElementsByClassName('right')[0].href = '#'+carousel.id;
	var images = carousel.getElementsByTagName('img');
	for (var i = 0; i < images.length; i++){
		images[i].src = 'assets/img/'+data.name+String(i)+'.jpg';
		images[i].id = "img"+data.name+String(i);
	}
	carousel.style.display = 'block';
	popup.appendChild(carousel);
	// var image = document.createElement('img');
	// image.src = data['img'];
	// image.classList.add('popup-image');
	// popup.appendChild(image);

	//suggested date
	var dateContainer = document.createElement('div');
	dateContainer.classList.add('popup-date-container');
	var dateLabel = document.createElement('div');
	dateLabel.innerHTML = 'Suggested Dates:';
	dateLabel.classList.add('popup-datelabel');
	var date = document.createElement('div');
	date.innerHTML = data['date'];
	date.classList.add('popup-date');
	dateContainer.appendChild(dateLabel);
	dateContainer.appendChild(date);
	popup.appendChild(dateContainer);

	//suggested date
	var priceContainer = document.createElement('div');
	priceContainer.classList.add('popup-price-container');
	var priceLabel = document.createElement('div');
	priceLabel.innerHTML = 'Price Breakdown:';
	priceLabel.classList.add('popup-pricelabel');
	var price = document.createElement('div');
	price.innerHTML = "blah blah blah";
	price.classList.add('popup-price');
	priceContainer.appendChild(priceLabel);
	priceContainer.appendChild(price);
	popup.appendChild(priceContainer);

	// info
	var cardTemp = document.getElementById('cardTemp');
	var card = cardTemp.cloneNode(true);
	card.id = "info"+date.name;
	var text = card.getElementsByClassName('card-body')[0];
	text.innerHTML = data.info;
	card.style.display = 'block';
	popup.appendChild(card);

	//info
	// var info = document.createElement('div');
	// info.innerHTML = data['info'];
	// info.classList.add('popup-info');
	// popup.appendChild(info);
}