var Registry     = require('./registry'),
    EventEmitter = require('events').EventEmitter,
    Migration    = require('./migration'),
    Migrator     = require('./migrator'),
    fs           = require('fs'),
    join         = require('path').join;

var Mgrt = function(env) {
	this.env = env;
	this.env.wards = []
	this.middleware = [];
}

Mgrt.prototype.__proto__ = EventEmitter.prototype;

Mgrt.prototype.use = function(middleware) {
	this.middleware.push(middleware);
	return this;
}

Mgrt.prototype.applyMiddleware = function() {
	for (var i in this.middleware) {
		this.middleware[i].call(this.env);
	}
}

Mgrt.prototype.setup = function(cb) {
	this.applyMiddleware();
	if (this.env.wards) {
		var wards = this.env.wards.slice(0);
		var self = this;
		var next = function(ward) {
			if (!ward) {
				return cb.apply(self);
			}

			ward.call(self.env, function() {
				next(wards.shift());
			});
		}

		next(wards.shift());
	} else {
		cb.apply(this);
	}
}

Mgrt.prototype.initRegistry = function() {
	return this.registry = new Registry(this.env);
}

Mgrt.prototype.buildMigration = function(name) {
    var mod = require(join(process.cwd(), this.env.path, name));
	return new Migration(name, mod.up, mod.down);
}

Mgrt.prototype.run = function(direction, options, steps) {
	options = options || {};

	var extractName = function(item) {
		return item.name;
	}

	var self = this;
	this.setup(function() {
		var process = function(migrations) {
			var migrator = new Migrator(migrations.map(self.buildMigration, self));

			var completedMigrations = [];
			var saveCompletedMigrations = function(migrations, cb) {
				if (options['nosave']) {
					cb()
				} else {
					migrations = migrations.map(extractName);

					if (options.force) {
						if ('down' === direction) {
							migrations = [];
						}

						self.registry.putCompletedMigrations(migrations, cb);
					} else {
						self.registry.updateCompletedMigrations(direction, migrations, cb);
					}
				}
			};

			migrator.on('nop', function(direction) {
				self.emit('nop', direction);
			})

			migrator.on('start', function() {
				self.emit('start', direction);
			});

			migrator.on('migration', function(migration, direction) {
				completedMigrations.push(migration);
				self.emit('migration', migration, direction);
			});

			migrator.on('error', function(migration, direction, reason) {
				saveCompletedMigrations(completedMigrations, function() {
					self.emit('error', migration, direction, reason);
				});
			});

			migrator.on('complete', function(migrations) {
				saveCompletedMigrations(completedMigrations, function() {
					self.emit('complete', direction, migrations);
				});
			});

			migrator.migrate(direction, options, steps);
		};

		var registry = this.initRegistry();
		if (options.force) {
			var migrations = registry.getAvailableMigrations();
			if ('down' == direction) {
				migrations = migrations.reverse();
			}

			process(migrations);
		} else {
			registry.getPendingMigrations(direction, process);
		}
	});
}

Mgrt.prototype.create = function(name, templatePath) {
	var wrapMigrationName = function(name) {
		return new Date().getTime() + '-' + name + '.js';
	}

	var filename = wrapMigrationName(name);
	var customTemplatePath = this.lookForTemplate();
	if (customTemplatePath) {
		templatePath = customTemplatePath;
	}
	this.setup(function() {
		var migration = this.initRegistry().create(filename, templatePath);
		this.emit('create', migration);
	});
}

Mgrt.prototype.lookForTemplate = function() {
	var path = join(this.env.path, 'template.js');
	var exists = fs.existsSync(path);
	if (exists) {
		return path;
	}
};

module.exports = Mgrt;
