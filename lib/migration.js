var Migration = function(name, up, down) {
	this.name = name;
	this.up = up;
	this.down = down;
}

module.exports = Migration;
