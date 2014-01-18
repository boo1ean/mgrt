var Migrator = require('../lib/migrator'),
    Migration = require('../lib/migration'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    should = chai.should();

chai.use(sinonChai);

describe('Migrator', function() {

	it('Should fire complete event when there are no pending migrations', function() {
		var migrator = new Migrator([]);
		var expectedCompletions = 2;
		var spy = sinon.spy();

		migrator.on('nop', spy);

		migrator.up();
		migrator.down();

		spy.should.have.been.calledTwice;
	});

	it('Should fire migrate event on migration', function() {
		var title = 'such title',
		    counter = 0,
		    expectedCount = 10,
		    cb = function(next) { ++counter; next(); },
		    migration = new Migration(title, cb, cb),
		    migrator = new Migrator([migration, migration]);

		migrator.on('migration', function(migration) {
			++counter;
			migration.name.should.be.equal(title);
		});

		migrator.on('complete', function() {
			++counter;
		});

		migrator.up();
		migrator.down();

		counter.should.be.equal(expectedCount);
	});

	it('Should fire error event with given message', function() {
		var upmessage = 'very important',
		    downmessage = 'very down message',
		    name = 'really name',
		    up, down, migration, migrator, counter = 0, expectedCount = 2;

		up = function(success, error) {
			error(upmessage);
		};

		down = function(success, error) {
			error(downmessage);
		};

		migration = new Migration(name, up, down);
		migrator = new Migrator([migration]);

		migrator.on('error', function(migration, direction, reason) {
			counter += 1;
			migration.name.should.be.equal(name);
			if ('up' === direction) {
				reason.should.be.equal(upmessage);
			} else {
				reason.should.be.equal(downmessage);
			}
		});

		migrator.migrate('up');
		migrator.migrate('down');

		counter.should.be.equal(expectedCount);
	})
});
