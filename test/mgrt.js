var Mgrt = require('../lib/mgrt'),
    Registry = require('../lib/registry'),
    Migration = require('../lib/migration'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    fs = require('fs'),
    should = chai.should()
    fileStorage = require('mgrt-file-storage');

chai.use(sinonChai);

var migrations = [
	'1390047616649-such-migration.js',
	'1390047623625-many-steps.js',
	'1390047653908-so-sequential.js'
];

describe('Mgrt facade', function() {
	it('Should add middlewares', function() {
		var mgrt = new Mgrt({}),
		    mdl = function() {};

		mgrt.use(mdl);
		mgrt.use(mdl);

		mgrt.middleware.should.have.lengthOf(2);
	});

	it('Should yield middleware with env context', function() {
		var mgrt = new Mgrt({}),
		    mdl1 = sinon.spy(),
		    mdl2 = sinon.spy();

		mgrt.use(mdl1);
		mgrt.use(mdl2);
		mgrt.applyMiddleware();

		mdl1.should.have.been.calledOn(mgrt.env);
		mdl2.should.have.been.calledOn(mgrt.env);
	});

	it('Should apply middleware and call ward', function() {
		var mgrt = new Mgrt({}),
		    setupSpy = sinon.spy(),
		    wardSpy, md1;

		wardSpy = sinon.spy(function(next) {
			next();
		});

		mdl1 = sinon.spy(function(next) {
			this.wards.push(wardSpy);
		});

		mgrt.use(mdl1);
		mgrt.setup(setupSpy);

		wardSpy.should.have.been.calledOn(mgrt.env);
		setupSpy.should.have.been.calledOn(mgrt);
	});

	it('Should yield sequance of middlewares', function() {
		var mgrt = new Mgrt({}),
		    setupSpy = sinon.spy(),
		    spy = sinon.spy(function(next) {
				next();
			});

		mgrt.use(function() {
			this.wards = [spy, spy, spy];
		});

		mgrt.setup(setupSpy);

		setupSpy.should.have.been.calledOn(mgrt);
		setupSpy.should.have.been.calledOnce;
		spy.should.have.been.calledThrice;
		spy.should.have.been.calledOn(mgrt.env);
	});

	it('Should yield registry.create', function() {
		var mgrt = new Mgrt({}),
		    templatePath = 'such path',
		    name = 'so name',
		    nameRegex = /^\d+-so name.\js$/,
		    spy = sinon.spy();

		mgrt.initRegistry = function() { return { create: spy } };

		mgrt.create(name, templatePath);

		spy.should.have.been.calledWith(sinon.match(nameRegex), templatePath);
	});

	it('Should save completed migrations to storage on up fail', function(done) {
		var path = 'test/migrations';
		var storageFilePath = path + '/.migrations';

		var mgrt = new Mgrt({
			path: path
		});

		mgrt.on('error', function() {
			var data = fs.readFileSync(storageFilePath);
			var completedMigrations = JSON.parse(data);
			completedMigrations.should.have.lengthOf(1);
			completedMigrations[0].should.be.equal(migrations[0]);
			fs.unlink(storageFilePath, done);
		});

		mgrt.use(fileStorage).run('up');
	})

	it('Should save completed migrations to storage on down fail', function(done) {
		var path = 'test/migrations';
		var storageFilePath = path + '/.migrations';

		var mgrt = new Mgrt({
			path: path
		});

		fs.writeFileSync(storageFilePath, JSON.stringify(migrations));

		mgrt.on('error', function() {
			var data = fs.readFileSync(storageFilePath);
			var completedMigrations = JSON.parse(data);
			completedMigrations.should.have.lengthOf(2);
			completedMigrations[0].should.be.equal(migrations[0]);
			completedMigrations[1].should.be.equal(migrations[1]);
			fs.unlink(storageFilePath, done);
		});

		mgrt.use(fileStorage).run('down');
	})
});
