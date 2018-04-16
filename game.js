// Hand it in this way: for simpler testing, always use the same seed.
Math.seedrandom(0);

// constants
const DEFAULT_BOARD_SIZE = 8;
// set size from URL or to default
const size = Math.min(10, Math.max(3, +Util.getURLParam("size") || DEFAULT_BOARD_SIZE));

// Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
var dom = {};

// data model at global scope for easier debugging
// initialize board model
var board = new Board(size);

// load a rule
var rules = new Rules(board);

//variables by gilgamesh

//state of hints
var hintCandies = [];

//use this to mute board view updates
var muteBoardEvents = false;

//number of move animations ongoing
var movingCandies = 0;

//use this when setting new game
var muteAnimations = false;

//delay for some properties to not aggregate
var nonAggregateDelay = 50;

//various dom elements
var scoreboard;
var scoreDisplay;
var newGameButton;
var showHintButton;
var inputField;
var moveButtons;
var crushOnceButton;

//css constants
var durationFade = 0.4;
var durationCell = 0.1;

function disableMoveButtons() {
	for (var a = 0;a < moveButtons.length;a++) {
		moveButtons.item(a).disabled = true;
	}
}

function disableCrushButton() {
	crushOnceButton.disabled = true;
}

function getInputData() {
	var text = inputField.value;
	var col = text.charCodeAt(0) - "a".charCodeAt(0);
	var row = -1;
	if (col < 0) //accept lowercase as well
		col = text.charCodeAt(0) - "A".charCodeAt(0);
	if (text.length > 3)
		return [-1, 0];
	else if (text.length == 3)
		row = (text.charCodeAt(1) - "0".charCodeAt(0)) * 10 + text.charCodeAt(2) - "0".charCodeAt(0) - 1;
	else if (text.length == 2)
		row = text.charCodeAt(1) - "0".charCodeAt(0) - 1;
	else
		return [-1, 0];
		
	if (row < 0 || row >= size || col < 0 || col >= size)
		return [-1, 0];
	
	return [row, col];
}

//assumes there exists a valid move
function showHint() {
	//ensure that a new hint is shown
	oldHintCandies = Object.assign({}, hintCandies);
	removeHint();

	while (hintCandies.length == 0 || 
		(hintCandies[0] == oldHintCandies[0] && 
		hintCandies[1] == oldHintCandies[1] && 
		hintCandies[2] == oldHintCandies[2])) {
		var validMove = rules.getRandomValidMove();

		//simulate moving hint to find crush triplet
		muteBoardEvents = true;
		var otherCandy = board.getCandyInDirection(validMove.candy, validMove.direction);
		board.flipCandies(validMove.candy, otherCandy);

		hintCandies = rules.getCandyCrushes()[0];
		board.flipCandies(validMove.candy, otherCandy);
		muteBoardEvents = false;
	}

	//add css animation to each hint candy
	for (var a = 0;a < hintCandies.length;a++) {
		var cellElem = document.getElementById("cell-" + hintCandies[a].row + "-" + hintCandies[a].col);
		cellElem.firstChild.classList.add("animation-pulsate");
	}
}

//robust even if no hint is showing
function removeHint() {
	if (hintCandies.length == 0)
		return;

	for (var a = 0;a < hintCandies.length;a++) {
		var cellElem = document.getElementById("cell-" + hintCandies[a].row + "-" + hintCandies[a].col);
		cellElem.firstChild.classList.remove("animation-pulsate");
	}

	hintCandies = [];
}

//enable/disable move buttons and crush buttons and text input field based on the board and what is in the input field
//assumes board is in valid state right now
function updateInputs() {
	crushOnceButton.disabled = (rules.getCandyCrushes().length == 0);
	if (crushOnceButton.disabled) {
		inputField.disabled = false;
		disableMoveButtons();

		var inputData = getInputData();
		//if error, make a distinction between valid input with no moves
		if (inputData[0] == -1) {
			inputField.className = "invalid-input";
		} else {
			inputField.className = "";
			var fromCandy = board.getCandyAt(inputData[0], inputData[1]);
			var dirs = ["up", "right", "down", "left"];
			for (var a in dirs) {
				if (rules.isMoveTypeValid(fromCandy, dirs[a]))
					document.getElementsByName("move-" + dirs[a]).item(0).disabled = false;
			}
		}
	} else {
		inputField.disabled = true;
		inputField.className = "";
		disableMoveButtons();
	}

	//show hint button
	var validMove = rules.getRandomValidMove();
	if (validMove == null || !crushOnceButton.disabled) {
		removeHint();
		showHintButton.disabled = true;
	}
	else
		showHintButton.disabled = false;
}

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
	// Final initalization entry point: the Javascript code inside this block
	// runs at the end of start-up when the DOM is ready
	"DOMContentLoaded": function() {
		//query dom for persistent elements
		scoreboard = document.getElementById("scoreboard");
		scoreDisplay = document.getElementById("score-display");
		newGameButton = document.getElementById("new-game-button");
		showHintButton = document.getElementById("show-hint-button");
		inputField = document.getElementById("input-field");
		moveButtons = document.getElementsByClassName("move-button");
		crushOnceButton = document.getElementById("crush-once-button");

		//set css constants
		document.documentElement.style.setProperty("--duration-fade", durationFade + "s");
		document.documentElement.style.setProperty("--duration-cell", durationCell + "s");

		//adapt to size
		document.documentElement.style.setProperty("--board-size", size);

		//draw labels
		var bWRef = document.getElementById("board-col-labels");
		for (var a = 0;a < size;a++) {
			var labelElem = document.createElement("div");
			labelElem.className = "board-label-col";
			labelElem.appendChild(document.createTextNode(String.fromCharCode("a".charCodeAt(0) + a)));
			bWRef.appendChild(labelElem);
		}

		var bWRef = document.getElementById("board-row-labels");
		for (var a = 0;a < size;a++) {
			var labelElem = document.createElement("div");
			labelElem.className = "board-label-row";
			labelElem.appendChild(document.createTextNode(a + 1));
			bWRef.appendChild(labelElem);
		}

		//create board structure
		var boardRef = document.getElementById("board");
		for (var a = 0;a < size;a++) {
			var rowElem = document.createElement("div");
			rowElem.className = "board-row";
			boardRef.appendChild(rowElem);
			for (var b = 0;b < size;b++) {
				var cellElem = document.createElement("div");
				cellElem.className = "board-cell";
				cellElem.id = "cell-" + a + "-" + b;
				rowElem.appendChild(cellElem);
			}
		}

		//update views
		muteAnimations = true;
		rules.prepareNewGame();
		muteAnimations = false;
		inputField.focus();
		updateInputs();
	},

	// Keyboard events arrive here
	"keyup": function(evt) { //keyup to only process events when key has been entered into input field
		if (evt.target == inputField)
		updateInputs();
	},

	// Click events arrive here
	"click": function(evt) {
		if (evt.target == newGameButton) {//new game button
			removeHint();
			muteAnimations = true;
			rules.prepareNewGame();
			muteAnimations = false;
			inputField.value = "";
			inputField.focus();
			updateInputs();
		} else if (evt.target.className == "move-button") { //one of the arrow buttons
			removeHint();

			//disable input while things are moving
			disableMoveButtons();
			disableCrushButton();
			inputField.disabled = true;

			var text = inputField.value;
			var dir = evt.target.getAttribute("name").slice(5);
			var inputData = getInputData(); //guaranteed not error
			var fromCandy = board.getCandyAt(inputData[0], inputData[1]);
			if (rules.isMoveTypeValid(fromCandy, dir)) {
				board.flipCandies(fromCandy, board.getCandyInDirection(fromCandy, dir));
			}

			inputField.value = "";
			//move automatically updates inputs
		} else if (evt.target == crushOnceButton) { //crush once button
			removeHint();
			//disable input while things are moving
			disableMoveButtons();
			disableCrushButton();
			inputField.disabled = true;

			rules.removeCrushes(rules.getCandyCrushes());
			setTimeout(function(){
				rules.moveCandiesDown();},
				durationFade * 1000);
		} else if (evt.target == showHintButton) { //hint button
			showHint();
		}
	}
});

// Attaching events to the board
Util.events(board, {
	// add a candy to the board
	//animate from outside top of board into square
	"add": function(e) {
		var candy = e.detail.candy;
		var cellElem = document.getElementById("cell-" + candy.row + "-" + candy.col);
		var picElem = document.createElement("img");
		picElem.classList.add("cell-img");
		picElem.src = "graphics/" + candy.color + "-candy.png";

		//check if we need to animate
		if (e.detail.fromRow == null) { //not dropping candy in
			cellElem.appendChild(picElem)
		} else {
			//drop candy in from the top
			movingCandies++;


			//instantly reposition candy outside of board before drop
			cellElem.appendChild(picElem);

			picElem.style.setProperty("top", "calc(50% + " + (e.detail.fromRow - candy.row) * 100 + "%)");

			setTimeout(function(){
				var time = -(e.detail.fromRow - candy.row) * durationCell;
				picElem.style.setProperty("transition-duration", time + "s");
				picElem.style.setProperty("top", "50%");

				setTimeout(function(){
					//remove the transition duration so that future changes are instant
					picElem.style.setProperty("transition-duration", "0s");
					movingCandies--;
					
					if (movingCandies == 0) { //all the move animations are done, so update inputs
						updateInputs();
						inputField.focus();
					}},
					time * 1000); },
					nonAggregateDelay);
		}
	},

	// move a candy from location 1 to location 2
	//assumes crushing sends move before add events
	"move": function(e) {
		if (muteBoardEvents)
			return;

		movingCandies++;

		var candyCell1 = document.getElementById("cell-" + e.detail.fromRow + "-" + e.detail.fromCol);
		var candyCell2 = document.getElementById("cell-" + e.detail.toRow + "-" + e.detail.toCol);
		var picElem = candyCell1.firstChild;
		
		var horiDist = -(e.detail.fromCol - e.detail.toCol);
		var vertDist = -(e.detail.fromRow - e.detail.toRow);
		var time = (Math.abs(horiDist) + Math.abs(vertDist)) * durationCell;

		//add a transition duration to animate the move
		//delay the beginning of animation by constant to match add animation delay
		setTimeout(function(){
			picElem.style.setProperty("transition-duration", time + "s");

			picElem.style.setProperty("top", "calc(50% + " + vertDist * 100 + "%)");
			picElem.style.setProperty("left", "calc(50% + " + horiDist * 100 + "%)");

			//attach image of cell 1 to cell 2
			setTimeout(function(){
				candyCell2.appendChild(picElem);

				//remove the transition duration so that changes are instant
				picElem.style.setProperty("transition-duration", "0s");

				//move the candies back to their original relative positions
				picElem.style.setProperty("top", "50%");
				picElem.style.setProperty("left", "50%");

				movingCandies--;
				
				if (movingCandies == 0) { //all the move animations are done, so update inputs
					updateInputs();
					inputField.focus();
				}},
				time * 1000); },
			nonAggregateDelay);
	},

	// remove a candy from the board
	"remove": function(e) {
		var cellElem = document.getElementById("cell-" + e.detail.fromRow + "-" + e.detail.fromCol);

		if (!muteAnimations) {
			cellElem.firstChild.classList.add("animation-fade-out");
			setTimeout(function(){
				cellElem.removeChild(cellElem.firstChild); },
				durationFade * 1000 - nonAggregateDelay);
		} else {
			cellElem.removeChild(cellElem.firstChild);
		}
	},

	// update the score
	"scoreUpdate": function(e) {
		if (e.detail.score == 0) {
			scoreboard.style.backgroundColor = "var(--color-light-gray)";
			scoreboard.style.color = "black";
		} else {
			scoreboard.style.backgroundColor = "var(--color-" + e.detail.candy.color + ")";
			scoreboard.style.color = "white";
		}
		scoreDisplay.innerHTML = e.detail.score;
	},
});
