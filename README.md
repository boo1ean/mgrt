# mgrt [![Build Status](https://travis-ci.org/boo1ean/mgrt.png?branch=master)](https://travis-ci.org/boo1ean/mgrt)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/boo1ean/mgrt?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Database migration tool for node.js

## Installation

    $ npm install -g mgrt

## Usage

```
Usage: mgrt <command> [options]

Commands:

  up        [steps]            Apply pending migrations
  down      [steps]            Rollback applied migrations
  refresh                      Down and up migrations
  create    <migration-name>   Create new migration

Options:

  -h, --help     output this message
  -v, --version  output the version number
```

## Create Migration

To create a new migration, run the following command:

	mgrt create <name>

It will generate new timestamped file under migrations directory (defaults to `./migrations`)

```javascript
exports.up = function(success, error) {
	error('Please populate migration');
};

exports.down = function(success, error) {
	error('Please populate migration');
};
```

You need to populate up and down functions with some useful stuff and invoke `success()` when migration is done and everything is ok.
If some error occurred you should invoke `error()` callback passing (optional) error reason for additional info (e.g. error message string).
Example of migration error handling is below.

## Migration examples

Create migration:

	mgrt create create-users-table

It will generate `./migrations/1389782358593-create-users-table.js`.
Now we can populate it:

```js
var db = require('./your-sql-db-adapter');

exports.up = function(success, error) {
	// Raw sql create table query
	var query = "                       \
		create table users              \
		id bigserial primary key,       \
		email varchar(255) not null,    \
		password varchar(255) not null, \
		UNIQUE(email)                   \
	";

	// Assuming db adapter is connected and provides sync query execution

	try {
		db.query(query);
		success();
	} catch (reason) {
		// Will stop migrations chain and exit with error message
		error(reason);
	}
};

exports.down = function(success, error) {
	var query = "        \
		drop table users \
	";

	try {
		db.query(query);
		success();
	} catch (reason) {
		// You may not pass reason argumen to error, it will stilltra
		error();
	}
};
```

now run migration:

	mgrt up

it should produce output if there are no errors:

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

exports.up = function(success, error) {
	var query = "..."

	// Assign success and error callbacks for resolve and reject respectively
	db.query(query).done(success, error);
};

exports.down = function(success, error) {
	var query = "..."
	db.query(query).done(success, error);
};
```

## Store completed migrations in db

You can specify custom migrations metadata storage with `--storage` option:

	mgrt up --storage utils/migrations-storage.js

Storage module should look like:

```javascript
var db = require('../your-db-adapter');

module.exports = {
	// Should invoke callback with data string
	get: function(callback) {
		db.get_data_string_async(callback); // should be invoked with data string
	},

	// Should save data string somewhere and then invoke callback
	// You only need to store single string somewhere in db
	set: function(data_string, callback) {
		db.store_data_string_somewhere_async(data_string, callback);
	}
};
```

## Rerun migrations

If you want reverse all applied migration and migrate them back just:

	mgrt refresh

## Force up/down all migrations without marking them as completed/reversed

	mgrt up --force --nosave

## Using custom temlpates

You can place file ```template.js``` into ```migrations``` folder and it will be 
used instead of the default one.

# Soon...
- Custom migration templates
- Configuration
- DB storage for applied migrations data
- Custom migrations type support
- Namespaces

# License

The MIT License (MIT)
Copyright (c) 2014 Egor Gumenyuk <boo1ean0807@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.
