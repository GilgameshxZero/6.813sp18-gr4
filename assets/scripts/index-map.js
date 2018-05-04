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
        if (event.keyCode === 13) {
	    	var tag = document.createElement('span');
	    	tag.classList.add('tag');
	        tag.innerHTML = textField.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,'');;
	        inputWrapper.insertBefore(tag, textField);
	        textField.value = '';

	    	checkData();
	    }
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

	document.getElementById('pref-language-select')
		.addEventListener('change', function() {
		    checkData();
	});

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