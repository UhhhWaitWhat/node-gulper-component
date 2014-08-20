var resolve = require('component-resolver');
var build = require('component-builder');
var path = require('path');
var es = require('event-stream');
var gutil = require('gulp-util');

module.exports = function(location) {
	return {
		css: {
			name: 'component',
			output: 'styles',
			glob: ['component.json', path.join(location, '**/*.css')],
			streamer: function(input) {
				var output = es.through();
				var timer = 0;
				var end = false;

				input.on('end', function() {
					end = true;
					time();
				});

				input.on('data', time);

				function time() {
					clearTimeout(timer);
					timer = setTimeout(function() {
						run();
					}, 200);
				}

				function run() {
					resolve(process.cwd(), {
						install: true,
						out: location
					}, function(err, tree) {
						if(err) return output.emit('error', err);

						build.styles(tree)
							.use('styles', build.plugins.css())
							.end(function(err, str) {
								if(err) return output.emit('error', err);
								
								if(str) {
									output.emit('data', new gutil.File({
										cwd: process.cwd(),
										base: location,
										path: path.join(location, 'component/build.css'),
										contents: new Buffer(str)
									}));

									if(end) output.emit('end');
								}
							});
					});
				}

				return output;
			}
		},
		js: {
			name: 'component',
			output: 'scripts',
			glob: ['component.json', path.join(location, '**/*.js')],
			streamer: function(input) {
				var output = es.through();
				var timer = 0;
				var end = false;
				
				input.on('end', function() {
					end = true;
					time();
				});

				input.on('data', time);

				function time() {
					clearTimeout(timer);
					timer = setTimeout(function() {
						run();
					}, 200);
				}

				function run() {
					resolve(process.cwd(), {
						install: true,
						out: location
					}, function(err, tree) {
						if(err) return output.emit('error', err);

						for(var dep in tree.dependencies) {
							(function(dep) {
								var entr = tree.dependencies[dep];

								if(entr.node.scripts) {
									build.scripts(entr)
										.use('scripts', build.plugins.js())
										.end(function(err, str) {
											var canon = build.scripts.canonical(entr);
											var js = build.scripts.umd(canon.canonical, entr.node.standalone || entr.node.name, str);

											output.emit('data', new gutil.File({
												cwd: process.cwd(),
												base: location,
												path: path.join(location,  'component/umd/'+(entr.node.standalone || entr.node.name)+ '.js'),
												contents: new Buffer(js)
											}));

											if(end) output.emit('end');
										});
								}
							})(dep);
						}
					});
				}

				return output;
			}
		},
		assets: {
			name: 'component',
			output: 'scripts',
			glob: ['component.json', path.join(location, '**/*'), '!' + path.join(location, '**/*.+(js|css)')],
			streamer: function(input) {
				return input.pipe(es.through(function(data) {
					if(data.contents) {
						var arr = data.path.split(data.base);
						arr[arr.length-1] = '/component/' + arr[arr.length-1];
						data.path = path.normalize(arr.join(data.base));
						this.emit('data', data);
					}
				}));
			}
		}
	};
};