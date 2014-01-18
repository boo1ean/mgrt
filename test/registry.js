var Registry = require('../lib/registry'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    should = chai.should();

chai.use(sinonChai);

describe('Registry', function() {
	var env, registry, storage, migrations;

	migrations = [1,2,3];

	storage = {
		get: function(cb) {
			cb(JSON.stringify(migrations));
		},

		set: function(value, cb) {
			cb(value);
		}
	};

	env = {
		path: __dirname + '/migrations',
		storage: storage
	};

	registry = new Registry(env);

	it('Should get list of completed migrations from storage', function() {
		var spy = sinon.spy();

		registry.getCompletedMigrations(spy);
		spy.should.have.been.calledWith(migrations);
	});

	it('Should put list of completed migrations to storage', function() {
		var spy = sinon.spy(),
		    val = ['very', 'val'];

		registry.putCompletedMigrations(val, spy);
		spy.should.have.been.calledOnce;
		spy.should.have.been.calledWith(JSON.stringify(val));
	});

	it('Should return list of available migrations', function() {
		var expectedMigrations = [
			'1390047616649-such-migration.js',
			'1390047623625-many-steps.js',
			'1390047653908-so-sequential.js'
		];

		var migrations = registry.getAvailableMigrations();
		migrations.should.have.members(expectedMigrations);
	});
});
