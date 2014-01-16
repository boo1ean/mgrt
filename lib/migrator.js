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
		if (!migration) {
			self.emit('complete', self.migrations);
			return;
		}

		return migration[direction](function() {
			self.emit('migration', migration, direction);
			next(migrations.shift());
		}, function(reason) {
			self.emit('error', migration, reason);
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
