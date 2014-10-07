var Migrator = function(migrations) {
	this.migrations = migrations;
};

Migrator.prototype.__proto__ = require('events').EventEmitter.prototype;

Migrator.prototype.migrate = function(direction, opts, steps) {
	var migrations = this.migrations.slice(0),
			steps 		 = steps ? steps : Object.keys(migrations).length,
	    self       = this;

	if (!migrations.length) {
		this.emit('nop', direction);
		return;
	}

	var next = function(migration, steps) {
		if (!migration || steps === 0) {
			self.emit('complete', self.migrations);
			return;
		}

		return migration[direction](function() {
			self.emit('migration', migration, direction);
			steps--;
			next(migrations.shift(), steps);
		}, function(reason) {
			self.emit('error', migration, direction, reason);
		});
	}

	this.emit('start', direction);
	next(migrations.shift(), steps);
}

Migrator.prototype.up = function(steps) {
	this.migrate('up', steps);
}

Migrator.prototype.down = function(steps) {
	this.migrate('down', steps);
}

module.exports = Migrator;
