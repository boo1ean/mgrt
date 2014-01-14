var Migration = function(title, up, down) {
	this.title = title;
	this.up = up;
	this.down = down;
}

module.exports = Migration;
