var Registry = require('../lib/registry'),
    fs = require('fs'),
    unlink = fs.unlinkSync,
    read = fs.readFileSync,
    exists = fs.existsSync,
    join = require('path').join,
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    should = chai.should();

chai.use(sinonChai);

describe('Registry', function() {
	var env, registry, storage, migrations, path,
	availableMigrations, completedMigrations, notCompletedMigrations;

	path = __dirname + '/migrations';

	availableMigrations = [
		'1390047616649-such-migration.js',
		'1390047623625-many-steps.js',
		'1390047653908-so-sequential.js'
	];

	notCompletedMigrations = [
		'1390047623625-many-steps.js',
		'1390047653908-so-sequential.js'
	];

	completedMigrations = [
		'1390047616649-such-migration.js'
	];

	storage = {
		get: sinon.spy(function(cb) {
			cb(JSON.stringify(completedMigrations));
		}),

		set: sinon.spy(function(value, cb) {
			cb(value);
		})
	};

	env = {
		path: path,
		storage: storage
	};

	registry = new Registry(env);

	it('Should get list of completed migrations from storage', function() {
		var spy = sinon.spy();

		registry.getCompletedMigrations(spy);
		spy.should.have.been.calledWith(completedMigrations);
	});

	it('Should put list of completed migrations to storage', function() {
		var spy = sinon.spy(),
		    val = ['very', 'val'];

		registry.putCompletedMigrations(val, spy);
		spy.should.have.been.calledOnce;
		spy.should.have.been.calledWith(JSON.stringify(val));
	});

	it('Should return list of available migrations', function() {
		var migrations = registry.getAvailableMigrations();
		migrations.should.have.members(availableMigrations);
	});

	it('Should yield with list of pending migrations for down direction', function() {
		registry.getPendingMigrations('down', function(migrations) {
			migrations.should.have.members(completedMigrations);
			migrations.should.not.have.members(notCompletedMigrations);
		});
	});

	it('Should yield with list of pending migrations for up direction', function() {
		registry.getPendingMigrations('up', function(migrations) {
			migrations.should.have.members(availableMigrations);
			migrations.should.not.have.members(completedMigrations);
		});
	});

	it('Should yield callback with available and completed migrations lists', function() {
		registry.get(function(data) {
			data.available.should.have.members(availableMigrations);
			data.completed.should.have.members(completedMigrations);
			data.completed.should.not.have.members(notCompletedMigrations);
		});
	});

	it('Should update completed migrations for up direction', function() {
		var spy = sinon.spy();
		registry.updateCompletedMigrations('up', notCompletedMigrations, spy);
		spy.should.have.been.calledWith(JSON.stringify(availableMigrations));
	});

	it('Should update completed migrations for down direction', function() {
		var spy = sinon.spy();
		registry.updateCompletedMigrations('down', completedMigrations, spy);
		spy.should.have.been.calledWith('[]');
	});

	it('Should copy file from one path to another', function() {
		var name = 'very name',
		    template = __dirname + '/../lib/template/default.js',
		    templateContent = read(template).toString(),
		    migration;

		migration = registry.create(name, template);
		migration.should.contain(name);
		read(migration).toString().should.be.equal(templateContent);
		unlink(migration);
		exists(migration).should.not.be.ok;
	});
});
