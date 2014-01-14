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
	var all = this.getAvailableMigrations();
	return this.getCompletedMigrations(function(completed) {
		cb({
			all: all,
			completed: completed
		});
	});
}

Registry.prototype.getAvailableMigrations = function() {
	return fs.readdirSync(this.path).filter(onlyJS).sort();
}

Registry.prototype.getCompletedMigrations = function(cb) {
	this.storage.get(cb);
}

Registry.prototype.pending = function(direction, cb) {
	return this.get(function(data) {
		if ('down' === direction) {
			cb(data.all.slice(0, data.completed.length));
		} else {
			cb(data.all.slice(data.completed.length));
		}
	});
}

Registry.prototype.create = function(name, templatePath) {
	var path = join(this.path, name);

	fs.createReadStream(templatePath)
		.pipe(fs.createWriteStream(path));

	return path;
}

module.exports = Registry;
