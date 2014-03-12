## Env Vars:

* SAUCE_JAR: path to the Sauce Labs connect 3.0 Jar file.

## Development environment

Requisites:

### codeswarm-gateway

Have codeswarm-gateway globally installed. For now you can do it like this:

```
$ git clone git@github.com:codeswarm/codeswarm-gateway.git
$ cd codeswarm-gateway
$ npm link
```

### php-cgi

If you're running php tests you must have php-cgi executable installed.

In Mac with Homebrew you can install it like this:

```bash
$ brew tap homebrew/dupes
$ brew tap josegonzalez/homebrew-php
$ brew install php54
```