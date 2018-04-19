var mapElement = 'map';
var placeholder;

window.onload = function () {
	var map = document.getElementById("map");
	map.style.filter = "blur(2px)";

	var suggestions = ["What kind of weather are you looking for?","What activities do you want to do?","Any specific region in mind?"];
	var input = document.getElementById("input");
	input.addEventListener('keydown', mainContentLoad);
	placeholder = setInterval(rotate, 2000);
	var counter = 0;
	function rotate() { 
  		input.placeholder = suggestions[counter];
	  	counter++;
	  	if (counter >= suggestions.length) {
			counter = 0;
	  	}
	}
}

function mainContentLoad() {
	clearInterval(placeholder);

	// map
	var map = document.getElementById("map");
	map.style.filter = "";
	
	// textfield
	var textField = document.getElementById("text-field");
	var logo = document.getElementById("logo");
	if (logo) {
		textField.removeChild(logo);
	}
	textField.className = "content-loaded";
	document.getElementById("input-wrapper").style.width = "auto";
	var input = document.getElementById("input");
	input.placeholder = "";
	input.removeEventListener('keydown', mainContentLoad);

	// restrictions
	document.getElementById("restrictions").style.display = "flex";
	var rstPriceSlider = document.getElementById("rst-price-slider");
	var rstPriceDisplayCurrent = document.getElementById("rst-price-display-current");
	rstPriceDisplayCurrent.innerHTML = '$' + rstPriceSlider.value; // Display the default slider value
	
	// Update the current slider value (each time you drag the slider handle)
	rstPriceSlider.oninput = function() {
		rstPriceDisplayCurrent.innerHTML = '$' + this.value;
	}

	window.onclick = function(event) {
		var modal = document.getElementById("modal");
	    if (event.target == modal) {
	        modal.style.display = "none";
	    }
	}
}

function makePopups(markers, locationName, position_x, position_y){
	var modal = document.getElementById("modal");
	var marker = markers[locationName][0];
	// console.log(modal);

	var existingPops = document.getElementsByClassName("popup");
	for (var i = 0; i < existingPops.length; i++)
		modal.removeChild(existingPops[i]);

	var popup = document.createElement("div");
	popup.classList.add("popup");
	popup.id = locationName;
	popup.style.top = (position_y - 100) + "px";
	popup.style.left = (position_x - 100) + "px";

	var close = document.createElement("span");
	close.classList.add("close");
	close.innerHTML = "&times;";
	// close.style.float = "right";

	close.onclick = function(){
		modal.style.display = "none";
		document.getElementById("input").focus();
	}
	var link = document.createElement("a");
	var bookmark = document.createElement("img");
	bookmark.src = "assets/bookmark.png";
	bookmark.classList.add("bookmark");
	if (markers[locationName][1]){
		bookmark.style.filter = "grayscale(0%)";
	}

	bookmark.onclick = function(){
		if (markers[locationName][1]){
			bookmark.style.filter = "grayscale(100%)";
			marker.setIcon("");

			markers[locationName][1] = false;
		}
		else{
			bookmark.style.filter = "grayscale(0%)";
			marker.setIcon('assets/bookmark_marker.png');
			markers[locationName][1] = true;
		}
	}

	// popup.appendChild(bookmark);
	popup.appendChild(close);
	link.appendChild(bookmark);
	popup.appendChild(link);
	modal.appendChild(popup);

	modal.style.display = "block";
};

function fillPopups(popupid, data){
	var popup = document.getElementById(popupid);

	var heading = document.createElement("h2");
	heading.innerHTML = data["name"];

	var image = document.createElement("img");
	image.src = "assets/" + popupid + ".jpg";
	image.classList.add("popupImage");

	popup.appendChild(heading);
	popup.appendChild(image);
}

function initMap() {
	var mit = {lat: 42.358792, lng: -71.093493};
	var florida = {lat: 27.775295, lng: -81.576485};
	var regensburg = {lat: 49.013454, lng: 12.100383};
	var bryceCanyon = {lat: 37.593833, lng: -112.187092}
	// var shanghai = {lat: 31.2240453, lng: 121.1965744};
	var map = new google.maps.Map(document.getElementById(mapElement), {
		zoom: 2,
		minZoom:2.3,
		center: mit
	});

	var florida_data = {
		"name": "florida",
		"position": florida,
		"text": ["warm", "beach"],
		"language": "---",
		"citizenship": "---",
		"pets": false,
		"kids": false,
		"budget": 0
	};
	var marker_florida = new google.maps.Marker({
		position: florida,
		map: map
	});
	marker_florida.setVisible(false);

	var regensburg_data = {
		"name": "regensburg",
		"position": regensburg,
		"text": ["europe", "oldcities", "castles"],
		"language": "german",
		"citizenship": "---",
		"pets": false,
		"kids": false,
		"budget": 200,
	}
	var marker_regensburg = new google.maps.Marker({
		position: regensburg,
		map: map
	});
	marker_regensburg.setVisible(false);

	var bryce_data = {
		"name": "bryce",
		"position": bryceCanyon,
		"text": ["hiking", "camping"],
		"language": "---",
		"citizenship": "canada",
		"pets": true,
		"kids": true,
		"budget": 0
	};
	var marker_bryce = new google.maps.Marker({
		position: bryceCanyon,
		map: map
	});
	marker_bryce.setVisible(false);

	var datas = [florida_data, regensburg_data, bryce_data];
	var markers = {
		"bryce": [marker_bryce, false], 
		"florida": [marker_florida, false], 
		"regensburg": [marker_regensburg, false]
	};

	google.maps.event.addListener(marker_florida, 'click', function(){
		makePopups(markers, "florida", event.clientX, event.clientY);
		fillPopups("florida", florida_data);
		// marker_florida.setIcon('assets/bookmark_marker.png');
	});
	google.maps.event.addListener(marker_bryce, 'click', function(){
		makePopups(markers, "bryce", event.clientX, event.clientY);
		fillPopups("bryce", bryce_data);
	});
	google.maps.event.addListener(marker_regensburg, 'click', function(){
		makePopups(markers, "regensburg", event.clientX, event.clientY);
		fillPopups("regensburg", regensburg_data);
	});

	var inputWrapper = document.getElementById("input-wrapper");
	var input = document.getElementById("input");
	input.focus();

	function checkData(){
		var tags = document.getElementsByClassName("tag");
    	var allText = [];
    	for (var i = 0; i < tags.length; i++){
    		allText.push(tags[i].innerHTML.toLowerCase());
    	}
    	for (var i = 0; i < datas.length; i++){
    		var matched = true;
    		// check for text
    		dataText = datas[i]["text"];
    		for (var j = 0; j < dataText.length; j++){
    			if (allText.indexOf(dataText[j]) < 0){
    				matched = false;
    				break;
    			}
    		}

    		// language preference
    		var languageSelect = document.getElementById("rst-language-select");
			var l_option = languageSelect.options[languageSelect.selectedIndex].text;
			
			if (l_option.toLowerCase() != datas[i]['language']){
				matched = false;
			}

    		// citizenship preference
    		var citizenshipSelect = document.getElementById("rst-citizenship-select");
			var c_option = citizenshipSelect.options[citizenshipSelect.selectedIndex].text;
			
			if (c_option.toLowerCase() != datas[i]['citizenship']){
				matched = false;
			}

    		// pets preference
    		petsBool = datas[i]["pets"];
    		// console.log(document.getElementById("petsCheckbox").checked);
    		if (petsBool != document.getElementById("petsCheckbox").checked){
    			matched = false;
    		}

    		// kids preference
    		kidsBool = datas[i]["kids"];
    		if (petsBool != document.getElementById("kidsCheckbox").checked){
    			matched = false;
    		}

    		// budget
    		var currentBudget = parseInt(document.getElementById("rst-price-display-current").innerHTML.slice(1));
    		if (Math.abs(currentBudget - datas[i]["budget"]) > 50){
    			matched = false;
    		}

    		if (matched){
    			markers[datas[i]["name"]][0].setVisible(true);
    		}
    		else if (! matched && !markers[datas[i]["name"]][1]) {
    			markers[datas[i]["name"]][0].setVisible(false);
    		}
    	}
	}

	input.addEventListener("keyup", function(event) {
	    event.preventDefault();
	    // Make a new timeout set to go off in 800ms
        if (event.keyCode === 13) {
	    	var tag = document.createElement("span");
	    	tag.classList.add("tag");
	    	// this.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,'');
	        tag.innerHTML = input.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,'');;
	        inputWrapper.insertBefore(tag, input);
	        input.value = "";

	    	checkData();
	    }
	    // BUG with how to fix when only one word left in input value
	    else if (event.keyCode === 8 && input.value == "") {
	    	// console.log(inputWrapper.childNodes);
	    	var tag = inputWrapper.childNodes[inputWrapper.childNodes.length - 5];
	    	if (tag){
		    	inputWrapper.removeChild(tag);
		    	checkData();
		    }

    	}
	});

	inputWrapper.addEventListener("click", function(event){
		var tag = event.target;
		if (tag.classList.contains("tag")){
			var tag = event.target;
			if (tag.classList.contains("tag")){
				inputWrapper.removeChild(tag);
				input.focus();
			}
			checkData();
		}
	});

	document.getElementById("petsCheckbox")
		.addEventListener("click", function(event){
			checkData();
	});

	document.getElementById("kidsCheckbox")
		.addEventListener("click", function(event){
			checkData();
	});

	document.getElementById("rst-language-select")
		.addEventListener("change", function() {
		    checkData();
	});

	document.getElementById("rst-citizenship-select")
		.addEventListener("change", function() {
		    checkData();
	});

	document.getElementById("rst-price-slider")
		.addEventListener("change", function() {
		    checkData();
	});

	// taking care of centering and not leaving bounds of the world map
	google.maps.event.addListener(map, 'center_changed', function() {
	    checkBounds(map);
	});
	// If the map position is out of range, move it back
	function checkBounds(map) {

		var latNorth = map.getBounds().getNorthEast().lat();
		var latSouth = map.getBounds().getSouthWest().lat();

		var newLat;

        if(latNorth > 85.5)   {
        	// console.log("n");
            newLat =  map.getCenter().lat() - (latNorth-85);   /* too north, centering */
        }
        if(latSouth<-85.5){
        	// console.log("s"); 
            newLat =  map.getCenter().lat() - (latSouth+85);   /* too south, centering */
		 }   
		if(newLat) {
		    var newCenter= new google.maps.LatLng( newLat ,map.getCenter().lng() );
		    map.panTo(newCenter);
		 }   
	 }

}
