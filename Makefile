
MOCHA_OPTS= --check-leaks --bail
REPORTER = spec

check: test

test: 
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) ./test

debug-test: 
	@NODE_ENV=test, DEBUG=* ./node_modules/.bin/mocha --reporter $(REPORTER) ./test

.PHONY: test 
