var fs = require('fs'),
    mkdirp = require('mkdirp');

module.exports = function() {
	this.wards.push(function(next) {
		if (!fs.existsSync(this.path)) {
			mkdirp.sync(this.path);
		}

		next();
	});
}
