let zoomBounds = [3, 10];

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

var tagSet;
var mapMarkers = [];
var gMapElement;

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
}

function initAutocomplete() {

}

function initHandlers() {
	textField.addEventListener('keydown', function(event) {
        if (event.keyCode === 13 && textField.value != '' && !tagSet.has(textField.value)) {
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
		} else if (event.keyCode === 8 && textField.value == '') {
			if (inputTags.lastChild.classList.has('input-tag-real')) { //not dummy
				event.preventDefault();
				textField.value = getTagText(inputTags.lastChild);
				removeTag(inputTags.lastChild);
			}
    	}
	});

	inputTags.addEventListener('click', function(event){
		var tag = event.target;

		//get correct ancestor
		while (tag.parentNode != inputTags)
			tag = tag.parentNode;

		if (tag.classList.contains('input-tag-elem'))
			removeTag(tag);
	});

	document.getElementById('pref-language-select')
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
	pref.classList.remove('pref-landing');
	body.classList.remove('body-landing');
	landingBkg.classList.add('landing-bkg-hidden');
	inputLogo.classList.remove('input-logo-landing');

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

//displays markers based on tags and prefs
function updateMap() {
	var tags = document.getElementsByClassName('input-tag-real');
	var allText = [];
	
	for (var i = 0; i < tags.length; i++){
		allText.push(getTagText(tags[i]));
	}
	
	for (var i = 0; i < jsonData['data-markers'].length; i++){
		var matched = true;
		
		dataText = jsonData['data-markers'][i]['text'];
		for (var j = 0; j < allText.length; j++){
			if (dataText.indexOf(allText[j]) < 0){
				matched = false;
				break;
			}
		}

		//TODO: match preferences here
		
		if (matched && !mapMarkers[i].getVisible())
			mapMarkers[i].setVisible(true);
		else if (!matched && !mapMarkers[i]['bookmarked'] && mapMarkers[i].getVisible())
			mapMarkers[i].setVisible(false);
	}
		
	//update map zoom & location
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