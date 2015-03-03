$(document).ready(function() {	
	var tiles = new L.tileLayer('http://a.tiles.mapbox.com/v3/briegn1.cfc1a74d/{z}/{x}/{y}.png',{attribution: "<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox &copy; OpenStreetMap</a> <a class='mapbox-improve-map' href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a>"});
	var leafletMap = L.map('map', {
		center: [40.5, -112],
		zoom: 10,
	});
	leafletMap.addLayer(tiles);
	
	//Important line to make sure the tiles (more specifically the continental labels) show up on top of the grids.
	$('.leaflet-tile-pane').css('z-index',10);
	
	//Helps to control file loads so that there aren't a lot of file reads/renders in the chain.
	var holdUp = false;
	
	var glLayer = L.canvasOverlay()
					.drawing(drawingOnCanvas)
					.addTo(leafletMap);
	var canvas = glLayer.canvas();
	
	glLayer.canvas.width = canvas.clientWidth;
	glLayer.canvas.height = canvas.clientHeight;
	
	var gl = canvas.getContext('experimental-webgl');
	
	// -- WebGL setup
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, document.getElementById('vshader').text);
	gl.compileShader(vertexShader);
	
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
	gl.compileShader(fragmentShader);
	
	//link shader to create our program
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);
	
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	
	//initialize shaders
	program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
	program.vertexColorAttribute = gl.getAttribLocation(program, "aVertexColor");
	
	program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	
	//create matrices and set their uniforms
	var pMatrix = new Float32Array(16);
	var mapMatrix = new Float32Array(16);
	
	pMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.uniformMatrix4fv(program.mvMatrixUniform, false, pMatrix);
	
	//initialize position and color buffers
	var squareVertexPositionBuffer;
	var squareVertexColorBuffer;
	
	squareVertexPositionBuffer = gl.createBuffer();
	squareVertexColorBuffer = gl.createBuffer();
	
	// -- data
	var Colors2Get = {'temp':[[94,79,162],[50,136,189],[102,194,165],[171,221,164],[230,245,191],[255,255,191],[254,224,139],[253,174,97],[244,109,67],[213,62,79],[158,1,66],[0,0,0]],
						'rh':[[84,48,5],[140,81,10],[191,129,45],[223,194,125],[246,232,195],[245,245,245],[199,234,229],[128,205,193],[53,151,143],[1,102,94],[0,60,48],[0,0,0]],
						'wind':[[241,252,253],[224,236,244],[191,211,230],[158,188,218],[140,150,198],[140,107,177],[136,65,157],[129,15,124],[77,0,75],[0,0,0]],
						'prec':[[255,255,255],[229,245,224],[199,233,192],[161,217,155],[116,196,118],[65,171,93],[35,139,69],[0,109,44],[0,68,27],[0,0,0]]};
	var vertz = [];
	var colorz = [];
	var data;
	var numPoints;
	var vertArray;
	var colorArray;
	var showVar = 'temp';
	legSwitch(showVar);
	holdUp = true;
	$.ajax({
		url: "./simple-data/simple-0-"+showVar+".json",
		success: function(dat) {
			data = dat.a;
			data.map(function(d,i) {
				var pixel = LatLongToPixelXY(lats[i]/100., lons[i]/100);
				vertz.push(pixel.x, pixel.y)
				var colors = Colors2Get[showVar][d];
				if (colors[0] < 1) {
					colorz.push(colors[0]/256., colors[1]/256., colors[2]/256., 0.0);
				} else {
					colorz.push(colors[0]/256., colors[1]/256., colors[2]/256., 1.0);
				}
			});
			numPoints = data.length;
			if (gl) {
				vertArray = new Float32Array(vertz);
				colorArray = new Float32Array(colorz);
				gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
				gl.vertexAttribPointer(program.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(program.vertexPositionAttribute);
				gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
				gl.vertexAttribPointer(program.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
				gl.enableVertexAttribArray(program.vertexColorAttribute);
				glLayer.redraw();
			}
			
			holdUp = false;
		},
		dataType: 'json'
	});
	
	document.onkeydown = function(e) {
		if (holdUp) {
			console.log('Hold On');
			return false;
		}
		switch(e.which) {
			case 87:
			holdUp = true;
			updateColor('varUp');
			break
			case 83:
			holdUp = true;
			updateColor('varDown');
			break
			default:
				return;
		}
	};
	
	function drawingOnCanvas(canvasOverlay, params) {
		if (gl == null) return;
		
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		pMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
		gl.viewport(0, 0, canvas.width, canvas.height);
		
		console.log(leafletMap.getZoom());

		// -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
		mapMatrix.set(pMatrix);
		
		var bounds = leafletMap.getBounds();
		var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
		var offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
		
		// -- Scale to current zoom
		var scale = Math.pow(2, leafletMap.getZoom());
		scaleMatrix(mapMatrix, scale, scale);

		translateMatrix(mapMatrix, -offset.x, -offset.y);
		
		// -- attach matrix value to 'mapMatrix' uniform in shader
		gl.uniformMatrix4fv(program.mvMatrixUniform, false, mapMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, numPoints);
	}
	
	function updateColor(direction) {
		if (direction === 'varUp') {
			if (showVar === 'temp') {showVar = 'rh';}
			else if (showVar === 'rh') {showVar = 'wind';}
			else if (showVar === 'wind') {showVar = 'prec';}
			else if (showVar === 'prec') {showVar = 'temp';}
		} else if (direction === 'varDown') {
			if (showVar === 'temp') {showVar = 'prec';}
			else if (showVar === 'rh') {showVar = 'temp';}
			else if (showVar === 'wind') {showVar = 'rh';}
			else if (showVar === 'prec') {showVar = 'wind';}
		}
		var colorz = [];
		var tstart = new Date();
		if (showVar === 'prec') {
			var getUrl = "./east-data/east_data-0-"+showVar+".json"
		} else {
			var getUrl = "./east-data/east_data-0-"+showVar+".json"
		}
		$.ajax({
			url: getUrl,
			success: function(dat) {
				data = dat.a;
				data.map(function(d,i) {
					var colors = Colors2Get[showVar][d];
					if (colors[2] < 1) {
						colorz.push(colors[0]/256., colors[1]/256., colors[2]/256., 0.0);
					} else {
						colorz.push(colors[0]/256., colors[1]/256., colors[2]/256., 1.0);
					}
				});
				numPoints = data.length;
				if (gl) {
					colorArray = new Float32Array(colorz);
					gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
					gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
					gl.vertexAttribPointer(program.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
					gl.enableVertexAttribArray(program.vertexColorAttribute);
					
					glLayer.redraw();
				}
				holdUp = false;
			},
			dataType: 'json'
		});
	}
	
	// -- converts latlon to pixels at zoom level 0 (for 256x256 tile size) , inverts y coord )
	// -- source : http://build-failed.blogspot.cz/2013/02/displaying-webgl-data-on-google-maps.html
	
	function LatLongToPixelXY(latitude, longitude) {
		var pi_180 = Math.PI / 180.0;
		var pi_4 = Math.PI * 4;
		var sinLatitude = Math.sin(latitude * pi_180);
		var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
		var pixelX = ((longitude + 180) / 360) * 256;

		var pixel = { x: pixelX, y: pixelY };

		return pixel;
	}

	function translateMatrix(matrix, tx, ty) {
		// translation is in last column of matrix
		matrix[12] += matrix[0] * tx + matrix[4] * ty;
		matrix[13] += matrix[1] * tx + matrix[5] * ty;
		matrix[14] += matrix[2] * tx + matrix[6] * ty;
		matrix[15] += matrix[3] * tx + matrix[7] * ty;
	}

	function scaleMatrix(matrix, scaleX, scaleY) {
		// scaling x and y, which is just scaling first two columns of matrix
		matrix[0] *= scaleX;
		matrix[1] *= scaleX;
		matrix[2] *= scaleX;
		matrix[3] *= scaleX;

		matrix[4] *= scaleY;
		matrix[5] *= scaleY;
		matrix[6] *= scaleY;
		matrix[7] *= scaleY;
	}
});
