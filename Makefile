
MOCHA_OPTS= --check-leaks --bail
REPORTER = spec

check: test

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha $(MOCHA_OPTS) --reporter $(REPORTER) ./test

.PHONY: test 
