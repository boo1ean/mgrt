var Registry    = require('./registry'),
    fileStorage = require('./mgrt-file-storage'),
    migrations  = require('./mgrt-migrations'),
    Migration   = require('./migration'),
    Migrator    = require('./migrator'),
    colors      = require('colors'),
    join        = require('path').join;

var Mgrt = function(env) {
	this.env = env;
	this.env.wards = []
	this.middleware = [];

	this.use(migrations);
	this.use(fileStorage);
}

Mgrt.prototype.use = function(middleware) {
	this.middleware.push(middleware);
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

Mgrt.prototype.run = function(direction) {
	var extractName = function(item) {
		return item.name;
	}

	var verbs = {
		up: 'migrate',
		down: 'reverse'
	}

	var self = this;
	this.setup(function() {
		this.initRegistry().getPendingMigrations(direction, function(migrations) {
			var migrator = new Migrator(migrations.map(self.buildMigration, self));

			migrator.on('nop', function(direction) {
				console.log(('Nothing to ' + verbs[direction]).red);
			})

			migrator.on('start', function() {
				console.log('Migration started'.blue);
			});

			migrator.on('migration', function(migration, direction) {
				console.log(('Successfully ' + verbs[direction] + 'd: ').green + migration.name);
			});

			migrator.on('complete', function(migrations) {
				console.log("Migration completed".blue);
				self.registry.update(direction, migrations.map(extractName));
			});

			migrator.migrate(direction);
		});
	});
}

Mgrt.prototype.create = function(name, templatePath) {
	var wrapMigrationName = function(name) {
		return new Date().getTime() + '-' + name + '.js';
	}

	var filename = wrapMigrationName(name);
	this.setup(function() {
		var migration = this.initRegistry().create(filename, templatePath);
		console.log('Successfully created migration: '.green + migration);
	});
}

module.exports = Mgrt;
