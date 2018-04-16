/* Copyright (c) 2018 MIT 6.813/6.831 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/**
 * Board represents the state of the candy-board. A candy-board is a square
 * array of squares. The candy-board can be any size.
 *
 * Each square of the candy-board contains exactly one candy.
 * Each square is identified by its row and column, numbered from 0 to
 * size-1.	Square [0,0] is in the upper-left corner of the candy-board.
 * Rows are numbered downward, and columns are numbered to the right.
 * The candy type on each square is random.
 *
 * Candies are mutable: a candy can be added, removed, and moved.
 * (The size of a board is immutable, however.)
 *
 * The board broadcasts four event types: "add",
 * "remove", "move", and "scoreUpdate".
 */

class Board extends EventTarget {
	constructor(size) {
		super();

		// A unique ID for each candy.
		this.candyCounter = 0;

		// Score, one point per candy crushed.
		this.score = 0;

		// boardSize is number of squares on one side of candy-board
		Util.assertNumeric(size, "Board size must be a number.");
		this.boardSize = size;

		// square is a two dimensional array representating the candyboard
		// square[row][col] is the candy in that square, or null if square is empty
		this.square = new Array(this.boardSize);

		// make an empty candyboard
		for (var i = 0; i <= this.boardSize; i++) {
			this.square[i] = [];
		}
	}

	/*
	 * Returns true/false depending on whether row and column
	 * identify a valid square on the board.
	 */
	isValidLocation(row, col) {
		return (row >= 0 && col >= 0 &&
		       row < this.boardSize && col < this.boardSize &&
		       row == Math.round(row) && col == Math.round(col));
	}

	/*
	 * Returns true/false depending on whether the
	 * square at [row,col] is empty (does not contain a candy).
	 */
	isEmptyLocation(row, col) {
		Util.assertNumeric(row, "row must be a number");
		Util.assertNumeric(col, "col must be a number");

		if (this.getCandyAt(row, col)) {
			return false;
		}
		return true;
	}

	/*
	* Perform an a valid move automatically on the board. Flips the
	* appropriate candies, but does not crush the candies.
	*/
	doAutoMove() {
		var move = rules.getRandomValidMove();
		var toCandy = board.getCandyInDirection(move.candy, move.direction);
		this.flipCandies(move.candy, toCandy);
	}


	/*
	 * Returns the number of squares on each side of the board
	 */
	getSize() {
		return this.boardSize;
	}

	/**
	 * Get the candy found on the square at [row,column], or null
	 * if the square is empty.	Requires row,column < size.
	 */
	getCandyAt(row, col) {
		Util.assertNumeric(row, "row must be a number");
		Util.assertNumeric(col, "col must be a number");

		if (this.isValidLocation(row, col)) {
			return this.square[row][col];
		}
	}

	/**
	 * Get location of candy (row and column) if it's found on this
	 * board, or null if not found.
	 */
	getLocationOf(candy) {
		return {row:candy.row, col:candy.col};
	}

	/**
	 * Get a list of all candies on the board, in no particular order.
	 */
	getAllCandies() {
		var results = [];

		for (var r in this.square) {
			for (var c in this.square[r]) {
				if (this.square[r][c]) {
				 results.push(this.square[r][c]);
				}
			}
		}
		return results;
	}

	/*
	* Add a new candy to the board.	Requires candies to be not currently
	* on the board, and (row,col) must designate a valid empty square.
	*
	* The optional spawnRow, spawnCol indicate where the candy
	* was "spawned" the moment before it moved to row, col. This location,
	* which may be off the board, is added to the 'add' event and
	* can be used to animate new candies that are coming in from offscreen.
	*/
	add(candy, row, col, spawnRow, spawnCol) {
		if (this.isEmptyLocation(row, col)) {
			var detail = {
				candy: candy,
				toRow: row,
				toCol: col,
				fromRow: spawnRow,
				fromCol: spawnCol
			};

			candy.row = row;
			candy.col = col;

			this.square[row][col] = candy;

			this.dispatchEvent(new CustomEvent("add", {detail}));
		}
		else {
			console.log("add already found a candy at " + row + "," + col);
		}
	}

	/**
	* Move a candy from its current square to another square.
	* Requires candy to be already found on this board, and (toRow,toCol)
	* must denote a valid empty square.
	*/
	moveTo(candy, toRow, toCol) {
		if (this.isEmptyLocation(toRow, toCol)) {
			var detail = {
				candy:candy,
				toRow:toRow,
				toCol:toCol,
				fromRow:candy.row,
				fromCol:candy.col};

			delete this.square[candy.row][candy.col];
			this.square[toRow][toCol] = candy;

			candy.row = toRow;
			candy.col = toCol;

			this.dispatchEvent(new CustomEvent("move", {detail}));
		}
	}

	/**
	* Remove a candy from this board.
	* Requires candy to be found on this board.
	*/
	remove(candy) {
		var detail = {
			candy: candy,
			fromRow: candy.row,
			fromCol: candy.col
		};
		delete this.square[candy.row][candy.col];
		candy.row = candy.col = null;
		this.dispatchEvent(new CustomEvent("remove", {detail}));
	}

	/**
	* Remove a candy at a given location from this board.
	* Requires candy to be found on this board.
	*/
	removeAt(row, col) {
		if (this.isEmptyLocation(row, col)) {
			console.log("removeAt found no candy at " + r + "," + c);
		}
		else {
			this.remove(this.square[row][col]);
		}
	}


	/**
	* Remove all candies from board.
	*/
	clear() {
		for (var r = 0; r < this.square.length; r++) {
			for (var c = 0; c < this.square[r].length; c++) {
				if (this.square[r][c]) {
					this.removeAt(r, c);
				}
			}
		}
	}


	// //////////////////////////////////////////////
	// Utilities
	//

	/*
	Adds a candy of specified color to row, col.
	*/
	addCandy(color, row, col, spawnRow, spawnCol) {
		var candy = new Candy(color, this.candyCounter++);
		this.add(candy, row, col, spawnRow, spawnCol);
	}

	/**
	* Adds a candy of random color at row, col.
	*/
	addRandomCandy(row, col, spawnRow, spawnCol) {
		var random_color = Math.floor(Math.random() * Candy.colors.length);
		var candy = new Candy(Candy.colors[random_color], this.candyCounter++);
		this.add(candy, row, col, spawnRow, spawnCol);
	}

	/*
	Returns the candy immediately in the direction specified by direction
	['up', 'down', 'left', 'right'] from the candy passed as fromCandy
	*/
	getCandyInDirection(fromCandy, direction) {
		switch (direction) {
			case "up":	{
				return this.getCandyAt(fromCandy.row-1, fromCandy.col);
			}

			case "down": {
				return this.getCandyAt(fromCandy.row+1, fromCandy.col);
			}

			case "left": {
				return this.getCandyAt(fromCandy.row, fromCandy.col-1);
			}

			case "right": {
				return this.getCandyAt(fromCandy.row, fromCandy.col+1);
			}
		}
	}


	/* Flip candy1 with candy2 in one step, firing two move events.
	 * Does not verify the validity of the flip. Does not crush candies
	 * produced by flip. */
	flipCandies(candy1, candy2) {
		// Swap the two candies simultaneously.
		var details1 = {
			candy: candy1,
			toRow: candy2.row,
			toCol: candy2.col,
			fromRow: candy1.row,
			fromCol: candy1.col
		};
		var details2 = {
			candy: candy2,
			toRow: candy1.row,
			toCol: candy1.col,
			fromRow: candy2.row,
			fromCol: candy2.col
		};
		candy1.row = details1.toRow;
		candy1.col = details1.toCol;
		this.square[details1.toRow][details1.toCol] = candy1;
		candy2.row = details2.toRow;
		candy2.col = details2.toCol;
		this.square[details2.toRow][details2.toCol] = candy2;

		// Trigger two move events.
		this.dispatchEvent(new CustomEvent("move", {detail: details1}));
		this.dispatchEvent(new CustomEvent("move", {detail: details2}));
	}

	/*
	* Resets the score
	*/
	resetScore() {
		this.score = 0;
		this.dispatchEvent(new CustomEvent("scoreUpdate", {detail: {score: 0}}));
	}

	/*
	 * Adds some score.
	 */
	incrementScore(candy, row, col) {
		this.score += 1;
		this.dispatchEvent(new CustomEvent("scoreUpdate", {detail: {
			score: this.score,
			candy: candy,
			row: row,
			col: col
		}}));
	}

	/*
	 * Gets the current score
	 */
	getScore() {
		return this.score;
	}

	/**
	 * Get a string representation for the board as a multiline matrix.
	 */
	toString() {
		var result = "";

		for (var r = 0; r < this.boardSize; ++r) {
			for (var c = 0; c < this.boardSize; ++c) {
				var candy = this.square[r][c];

				if (candy) {
				 result += candy.toString().charAt(0) + " ";
				}
				else {
				 result += "_ ";
				}
			}
			result += "<br/>";
		}
		return result.toString();
	}
}
