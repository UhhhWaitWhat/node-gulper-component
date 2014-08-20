Component gulper plugin
===================

A [gulper](https://github.com/PaulAvery/node-gulper) plugin to include component packages:

``` js
var component = require('gulper-component')(location);
var gulper = new require('gulper')(config)

gulper.plugin(component.js);
gulper.plugin(component.css);
gulper.plugin(component.assets);
```