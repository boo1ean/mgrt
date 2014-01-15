# mgrt

  Node just database migration tool

## Installation

    $ npm install -g mgrt

## Usage

```
  Usage: mgrt [options] [command]

  Commands:

    up      [options]        Apply pending migrations
    down    [options]        Rollback applied migrations
    refresh [options]        Down and up migrations
    create  [options] <name> Create new migration

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## Create Migration

To create a new migration, run the following command:

	mgrt create <name>

It will generate new timestamped file under migrations directory (defaults to `./migrations`)

```javascript
exports.up = function(next) {
	next();
};

exports.down = function(next) {
	next();
};
```
You need to populate up and down functions with some useful stuff and invoke `next()` when job is done.

## Migration examples

Create migration:

	mgrt create create-users-table

It will generate `./migrations/1389782358593-create-users-table.js`.
Now we can populate it:

```js
var db = require('./your-sql-db-adapter');

exports.up = function(next){
	// Raw sql create table query
	var query = "                       \
		create table users              \
		id bigserial primary key,       \
		email varchar(255) not null,    \
		password varchar(255) not null, \
		UNIQUE(email)                   \
	";

	// Assuming db adapter is connected and provides sync query execution
	db.query(query);
	next();
};

exports.down = function(next){
	var query = "        \
		drop table users \
	";

	db.query(query);
	next();
};
```

now run migration:

	mgrt up

it should produce output:

	Migration started up
	Successfully migrated: 1389782358593-create-users-table.js
	Migration completed up

and reverse the migration:

	mgrt down
	Migration started down
	Successfully reversed: 1389782358593-create-users-table.js
	Migration completed down

### Async migration

```js
var db = require('./your-promise-based-sql-db-adapter');

exports.up = function(next){
	var query = "..."

	// Just execute next when promise is resolved
	db.query(query).done(next);
};

exports.down = function(next){
	var query = "..."
	db.query(query).done(next);
};
```

## Rerun migrations

If you want reverse all applied migration and migrate them back just:

	mgrt refresh

# Soon...
	- Errors handling
	- Custom migration templates
	- Configuration
	- DB storage for applied migrations data
	- Custom migrations type support
	- Namespaces
