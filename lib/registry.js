var fs = require('fs'),
    join = require('path').join;

var onlyJS = function(file) {
	return file.match(/^\d+.*\.js$/);
}

var Registry = function(env) {
	this.path = env.path;
	this.storage = env.storage;
};

Registry.prototype.get = function(cb) {
	var available = this.getAvailableMigrations();
	return this.getCompletedMigrations(function(completed) {
		cb({
			available: available,
			completed: completed
		});
	});
}

Registry.prototype.getAvailableMigrations = function() {
	return fs.readdirSync(this.path).filter(onlyJS).sort();
}

Registry.prototype.getCompletedMigrations = function(cb) {
	this.storage.get(function(data) {
		cb(JSON.parse(data));
	});
}

Registry.prototype.putCompletedMigrations = function(migrations, cb) {
	this.storage.set(JSON.stringify(migrations), cb);
}

Registry.prototype.getPendingMigrations = function(direction, cb) {
	return this.get(function(data) {
		if ('down' === direction) {
			cb(data.available.slice(0, data.completed.length).reverse());
		} else {
			cb(data.available.slice(data.completed.length));
		}
	});
}

Registry.prototype.create = function(name, templatePath) {
	var path = join(this.path, name);

	fs.createReadStream(templatePath)
		.pipe(fs.createWriteStream(path));

	return path;
}

Registry.prototype.appendCompletedMigrations = function(direction, diff, cb) {
	var self = this;
	this.getCompletedMigrations(function(completed) {
		if ('up' === direction) {
			completed = completed.concat(diff);
		} else {
			completed = completed.slice(0, completed.length - diff.length);
		}

		self.putCompletedMigrations(completed, cb);
	});
}

module.exports = Registry;
