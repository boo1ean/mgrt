var Registry    = require('./registry'),
	fileStorage = require('./mgrt-file-storage'),
	migrations  = require('./mgrt-migrations'),
    Migrator    = require('./migrator');

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
		var env = this.env;
		var next = function(ward) {
			if (!ward) {
				return cb();
			}

			ward.call(env, function() {
				next(wards.shift());
			});
		}

		next(wards.shift());
	} else {
		cb();
	}
}

Mgrt.prototype.run = function(direction) {
	var self = this;
	this.setup(function() {
		var registry = new Registry(self.env);
		registry.pending(direction, function(migrations) {
			var migrator = new Migrator(migrations);

			migrator.on('migrate', function(migration) {
				console.log('migrate event fired');
			});

			migrator.on('complete', function(migrations) {
				console.log('complete event fired', migrations);
			});

			migrator.migrate(direction);
		});
	});
}

module.exports = Mgrt;
