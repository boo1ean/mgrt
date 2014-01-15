var Migrator = function(migrations) {
	this.migrations = migrations;
};

Migrator.prototype.__proto__ = require('events').EventEmitter.prototype;

Migrator.prototype.migrate = function(direction) {
	var migrations = this.migrations.slice(0),
	    self       = this;

	if (!migrations.length) {
		this.emit('nop', direction);
		return;
	}

	var next = function(migration) {
		if (!migrations.length) {
			self.emit('complete', self.migrations);
			return;
		}

		self.emit('migration', migration, direction);
		return migration[direction](function() {
			next(migrations.shift());
		});
	}

	this.emit('start', direction);
	next(migrations.shift());
}

Migrator.prototype.up = function() {
	this.migrate('up');
}

Migrator.prototype.down = function() {
	this.migrate('down');
}

module.exports = Migrator;
