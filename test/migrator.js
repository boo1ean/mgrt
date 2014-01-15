var Migrator = require('../lib/migrator'),
    Migration = require('../lib/migration');

describe('Migrator', function() {

	it('Should fire complete event when there are no pending migrations', function() {
		var migrator = new Migrator([]);
		var completions = 0;
		var expectedCompletions = 2;

		migrator.on('nop', function() {
			++completions;
		});

		migrator.up();
		migrator.down();

		completions.should.be.exactly(expectedCompletions);
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

		counter.should.be.exactly(expectedCount);
	});

});
