$(document).ready(function() {	
	var controlContainer = L.Control.extend({
		options: {
			position: 'topright',
			truePos: '',
			text: '',
			title: '',
			contents: [],
			hasClickFunc: true,
			clickFunc: function() {return false},
			size: 'normal',
			divClass: '',
			txtClass: ''
		},
		
		initialize: function(options) {
			L.Util.setOptions(this, options);
		},
		
		onAdd: function(map) {
			var posMod = 'leaflet-custom';
			if (this.options.truePos.indexOf('center')>-1) {
				posMod += '-'+this.options.truePos;
			}
			var container = L.DomUtil.create('div', posMod+' leaflet-control '+this.options.divClass);
			this.txtFld = L.DomUtil.create('h5', 'leaflet-custom-text '+this.options.txtClass, container);
			this.txtFld.innerHTML = '<p class="contTitle">'+this.options.text+'</p>';
			this.txtFld.title = this.options.title;
			L.DomEvent.on(this.txtFld, 'click', this._click, this);
			
			var contDivs = [];
			for (i=0;i<this.options.contents.length;i++) {
				contDivs.push(L.DomUtil.create(this.options.contents[i].typ, this.options.contents[i].cls, this.txtFld));
				contDivs[i].innerHTML = this.options.contents[i].text+'<br>';
				if (this.options.hasClickFunc) {
					L.DomEvent.on(contDivs[i], 'click', this.options.clickFunc, this);
				}
			}
			
			return container;
		},
		
		_click: function(e) {
			if (e===false) {
				var exClass = 'leaflet-custom-expanded-'+this.options.size;
				if (L.DomUtil.hasClass(this.txtFld, exClass)) {
					L.DomUtil.removeClass(this.txtFld,exClass);
				}
			} else if (e===true) {
				var exClass = 'leaflet-custom-expanded-'+this.options.size;
				if (!L.DomUtil.hasClass(this.txtFld, exClass)) {
					L.DomUtil.addClass(this.txtFld,exClass);
				}
			} else {
				L.DomEvent.stopPropagation(e);
				var exClass = 'leaflet-custom-expanded-'+this.options.size;
				if (L.DomUtil.hasClass(this.txtFld, exClass)) {
					L.DomUtil.removeClass(this.txtFld,exClass);
				} else {
					L.DomUtil.addClass(this.txtFld,exClass);
				}
			}
		}
	});

	var tiles = new L.tileLayer('http://a.tiles.mapbox.com/v3/briegn1.cfc1a74d/{z}/{x}/{y}.png',{attribution: "<a href='https://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox &copy; OpenStreetMap</a> <a class='mapbox-improve-map' href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a>"});
	var leafletMap = L.map('map', {
		center: [41, -74],
		zoom: 8,
	});
	leafletMap.addLayer(tiles);
	
	//Important line to make sure the tiles (more specifically the continental labels) show up on top of the grids.
	$('.leaflet-tile-pane').css('z-index',10);
	
	var legControl = new controlContainer({
		hasClickFunc: false,
		position: 'topright',
		size: 'xxtall',
		text: 'LEGEND',
		contents: [
			{typ: "div", 
			 cls: "leglist", 
			 text: ''
			},
			{typ: "button", cls: "close", text: "Close"}
		]
	});
	legControl.addTo(leafletMap);
	legControl._click(true);
	
	var timeControl = new controlContainer({
		hasClickFunc: false,
		truePos: 'topcenter',
		text: "",
		txtClass: 'timetxt'
	});
	timeControl.addTo(leafletMap);
	
	var holdUp = false
	var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var month = (new Date()).getUTCMonth();
	var date = (new Date()).getUTCDate();
	var hour = (new Date()).getUTCHours();
	var realHour = 21;
	var ival0;
	var ival1; 
	var ival2;
	var pval0;
	var pval1;
	var pval2;
	if (hour<3 || hour>=21) {
		realHour = 21;
		ival0 = 1;
		ival1 = 26;
		ival2 = 40;
		pval0 = 0;
		pval1 = 4;
		pval2 = 8;			
	} else if (hour>=3 && hour<9) {
		realHour = 3;
		ival0 = 19;
		ival1 = 38;
		ival2 = 46;
		pval0 = 3;
		pval1 = 7;
		pval2 = 11;
	} else if (hour>=9 && hour<15) {
		realHour = 9;
		ival0 = 13;
		ival1 = 34;
		ival2 = 44;
		pval0 = 2;
		pval1 = 6;
		pval2 = 10;
	} else if (hour>=15 && hour<21) {
		realHour = 15;
		ival0 = 8;
		ival1 = 32;
		ival2 = 42;
		pval0 = 1;
		pval1 = 5;
		pval2 = 9;
	}
	var times = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,39,42,45,48,51,54,57,60,63,66,69]
	var ptimes = [3,9,15,21,27,33,39,45,51,57,63,69]
	var helpControl = new controlContainer({
		hasClickFunc: false,
		position: 'bottomleft',
		size: 'xtall',
		text: 'NDFD FORECAST GRIDS',
		contents: [
			{typ: "div",
			 cls: "helplist",
			 text: "<span class='varname'>Issued "+date+" "+months[month]+" 2015</span><br>"+
				   "<span class='varname'>"+realHour+" UTC</span><br><br>"+
				   "<span class='varname'><u>TIME CONTROLS</u></span><br>"+
				   "<span class='varname'>To move forward:</span><br>"+
				   "<span class='varname'>Press D</span><br><br>"+
				   "<span class='varname'>To move backward:</span><br>"+
				   "<span class='varname'>Press A</span><br><br>"+
				   "<span class='varname'><u>VARIABLE CONTROLS</u></span><br>"+
				   "<span class='varname'>Cycle through the following list:</span><br>"+
				   "<span class='varname'>Temperature, RH, Wind Speed</span><br><br>"+
				   "<span class='varname'>To move forward:</span><br>"+
				   "<span class='varname'>Press W</span><br><br>"+
				   "<span class='varname'>To move backward:</span><br>"+
				   "<span class='varname'>Press S</span><br><br>"+
				   "<span class='varname'>Built by Matt Lammers</span><br>"+
				   "<span class='varname'>University of Utah/MesoWest</span>"
			}
		]
	});
	helpControl.addTo(leafletMap);
	helpControl._click(true);
	
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
	var fc2Pfc = [0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,8,8,9,9,9,9,9,9,10,10,10,10,10,10,11,11,11,11,11,11]
	var pfc2Fc = [2,8,14,20,26,32,36,38,40,42,44,46]
	var forecast = 0;
	var pfcst = 0;
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
		url: "./east-data/east_data-"+forecast+"-"+showVar+".json",
		success: function(dat) {
			if (showVar === 'prec') {
				console.log('Success with east_data-'+pfcst+'-'+showVar+'.json');
			} else {
				console.log('Success with east_data-'+forecast+'-'+showVar+'.json');
			}
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
			
			if (showVar === 'prec') {
				var showTime = realHour+ptimes[pfcst];
				var showDate = date;
				var showMonth = month;
				if (showTime>23) {
					showTime = showTime - 24;
					showDate = (new Date(new Date()+24*3600*1000)).getUTCDate();
					showMonth = (new Date(new Date()+24*3600*1000)).getUTCMonth();
				}
				$('.timetxt').text('Valid 6 Hour Accumulation Starting '+showDate+' '+months[showMonth]+' 2015 '+showTime+'00 UTC');
			} else {
				var showTime = realHour+times[forecast];
				var showDate = date;
				var showMonth = month;
				if (showTime>23) {
					showTime = showTime - 24;
					showDate = (new Date(new Date()+24*3600*1000)).getUTCDate();
					showMonth = (new Date(new Date()+24*3600*1000)).getUTCMonth();
				}
				$('.timetxt').text('Valid '+showDate+' '+months[showMonth]+' 2015 '+showTime+'00 UTC');
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
			case 65:
			holdUp = true;
			updateColor('down');
			break
			case 68:
			holdUp = true;
			updateColor('up');
			break
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
		if (direction === 'up') {
			if (showVar === 'prec') {
				pfcst += 1;
				if (pfcst>pval2) {
					pfcst = 0;
				}
			} else {
				forecast += 1;
				if (forecast>ival2) {
					forecast = 0;
				}
			}
		} else if (direction === 'down') {
			if (showVar === 'prec') {
				pfcst -= 1;
				if (pfcst<0) {
					pfcst = pval2;
				}
			} else {
				forecast -= 1;
				if (forecast<0) {
					forecast = ival2;
				}
			}
		} else if (direction === 'varUp') {
			if (showVar === 'temp') {showVar = 'rh';}
			else if (showVar === 'rh') {showVar = 'wind';}
			else if (showVar === 'wind') {
				showVar = 'prec';
				pfcst = fc2Pfc[forecast];
			}
			else if (showVar === 'prec') {
				showVar = 'temp';
				forecast = pfc2Fc[pfcst];
			}
		} else if (direction === 'varDown') {
			if (showVar === 'temp') {
				showVar = 'prec';
				pfcst = fc2Pfc[forecast];
			}
			else if (showVar === 'rh') {showVar = 'temp';}
			else if (showVar === 'wind') {showVar = 'rh';}
			else if (showVar === 'prec') {
				showVar = 'wind';
				forecast = pfc2Fc[pfcst]
			}
		}
		legSwitch(showVar);
		var colorz = [];
		var tstart = new Date();
		if (showVar === 'prec') {
			var getUrl = "./east-data/east_data-"+pfcst+"-"+showVar+".json"
		} else {
			var getUrl = "./east-data/east_data-"+forecast+"-"+showVar+".json"
		}
		$.ajax({
			url: getUrl,
			success: function(dat) {
				if (showVar === 'prec') {
					console.log('Success with east_data-'+pfcst+'-'+showVar+'.json');
				} else {
					console.log('Success with east_data-'+forecast+'-'+showVar+'.json');
				}
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
				console.log((new Date() - tstart)/1000)
				
				var dt = date;
				var subt = 0;
				if (showVar === 'prec') {
					if (pfcst>=pval0 && pfcst<pval1) {
						dt = dt+1
						subt = 24;
					} else if (pfcst>=pval1 && pfcst<pval2) {
						dt = dt+2
						subt = 48;
					} else if (pfcst >= pval2) {
						dt = dt+3
						subt = 72;
					}
					$('.timetxt').text('Valid 6 Hour Accumulation Starting '+dt+' '+months[month]+' 2015 '+(realHour+ptimes[pfcst]-subt)+'00 UTC');
				} else {
					if (forecast>=ival0 && forecast<ival1) {
						dt = dt+1
						subt = 24;
					} else if (forecast>=ival1 && forecast<ival2) {
						dt = dt+2
						subt = 48;
					} else if (forecast >= ival2) {
						dt = dt+3
						subt = 72;
					}
					$('.timetxt').text('Valid '+dt+' '+months[month]+' 2015 '+(realHour+times[forecast]-subt)+'00 UTC');
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
	
	function legSwitch(varName) {
		$('.leglist').empty();
		if (varName == 'temp') {
			$('.leglist').html("<span class='varname'>Temperature [F]</span><br><br>"+
				   "<p class='col 1' style='background-color:rgb(94,79,162);'>&nbsp;</p><span class='val 1'>&lt;-20</span><br>"+
				   "<p class='col 2' style='background-color:rgb(50,136,189);'>&nbsp;</p><span class='val 2'>-20 to -10</span><br>"+
				   "<p class='col 3' style='background-color:rgb(102,194,165);'>&nbsp;</p><span class='val 3'>-10 to 0</span><br>"+
				   "<p class='col 4' style='background-color:rgb(171,221,164);'>&nbsp;</p><span class='val 4'>0 to 10</span><br>"+
				   "<p class='col 5' style='background-color:rgb(230,245,191);'>&nbsp;</p><span class='val 5'>10 to 20</span><br>"+
				   "<p class='col 6' style='background-color:rgb(255,255,191);'>&nbsp;</p><span class='val 6'>20 to 30</span><br>"+
				   "<p class='col 7' style='background-color:rgb(254,224,139);'>&nbsp;</p><span class='val 7'>30 to 40</span><br>"+
				   "<p class='col 8' style='background-color:rgb(253,174,97);'>&nbsp;</p><span class='val 8'>40 to 50</span><br>"+
				   "<p class='col 9' style='background-color:rgb(244,109,67);'>&nbsp;</p><span class='val 9'>50 to 60</span><br>"+
				   "<p class='col 10' style='background-color:rgb(213,62,79);'>&nbsp;</p><span class='val 10'>60 to 70</span><br>"+
				   "<p class='col 11' style='background-color:rgb(158,1,66);'>&nbsp;</p><span class='val 11'>&gt;70</span>");
		} else if (varName == 'rh') {
			$('.leglist').html("<span class='varname'>Relative Humidity [%]</span><br><br>"+
				   "<p class='col 1' style='background-color:rgb(0,60,48);'>&nbsp;</p><span class='val 1'>100</span><br>"+
				   "<p class='col 2' style='background-color:rgb(1,102,94);'>&nbsp;</p><span class='val 2'>90 to 100</span><br>"+
				   "<p class='col 3' style='background-color:rgb(53,151,143);'>&nbsp;</p><span class='val 3'>80 to 90</span><br>"+
				   "<p class='col 4' style='background-color:rgb(128,205,193);'>&nbsp;</p><span class='val 4'>70 to 80</span><br>"+
				   "<p class='col 5' style='background-color:rgb(199,234,229);'>&nbsp;</p><span class='val 5'>60 to 70</span><br>"+
				   "<p class='col 6' style='background-color:rgb(245,245,245);'>&nbsp;</p><span class='val 6'>50 to 60</span><br>"+
				   "<p class='col 7' style='background-color:rgb(246,232,195);'>&nbsp;</p><span class='val 7'>40 to 50</span><br>"+
				   "<p class='col 8' style='background-color:rgb(223,194,125);'>&nbsp;</p><span class='val 8'>30 to 40</span><br>"+
				   "<p class='col 9' style='background-color:rgb(191,129,45);'>&nbsp;</p><span class='val 9'>20 to 30</span><br>"+
				   "<p class='col 10' style='background-color:rgb(140,81,10);'>&nbsp;</p><span class='val 10'>10 to 20</span><br>"+
				   "<p class='col 11' style='background-color:rgb(84,48,5);'>&nbsp;</p><span class='val 11'>0 to 10</span><br>");
		} else if (varName == 'wind') {
			$('.leglist').html("<span class='varname'>Wind Speed [mph]</span><br><br>"+
				   "<p class='col 1' style='background-color:rgb(77,0,75);'>&nbsp;</p><span class='val 1'>&gt;40</span><br>"+
				   "<p class='col 2' style='background-color:rgb(129,15,124);'>&nbsp;</p><span class='val 2'>35 to 40</span><br>"+
				   "<p class='col 3' style='background-color:rgb(136,65,157);'>&nbsp;</p><span class='val 3'>30 to 35</span><br>"+
				   "<p class='col 4' style='background-color:rgb(140,107,177);'>&nbsp;</p><span class='val 4'>25 to 30</span><br>"+
				   "<p class='col 5' style='background-color:rgb(140,150,198);'>&nbsp;</p><span class='val 5'>20 to 25</span><br>"+
				   "<p class='col 6' style='background-color:rgb(158,188,218);'>&nbsp;</p><span class='val 6'>15 to 20</span><br>"+
				   "<p class='col 7' style='background-color:rgb(191,211,230);'>&nbsp;</p><span class='val 7'>10 to 15</span><br>"+
				   "<p class='col 8' style='background-color:rgb(224,236,244);'>&nbsp;</p><span class='val 8'>5 to 10</span><br>"+
				   "<p class='col 9' style='background-color:rgb(241,252,253);'>&nbsp;</p><span class='val 9'>0 to 5</span>");
		} else if (varName == 'prec') {
			$('.leglist').html("<span class='varname'>Accumulated Precipitation [in]</span><br><br>"+
				   "<p class='col 1' style='background-color:rgb(0,68,27);'>&nbsp;</p><span class='val 1'>&gt;1.5</span><br>"+
				   "<p class='col 2' style='background-color:rgb(0,109,44);'>&nbsp;</p><span class='val 2'>1.25 to 1.5</span><br>"+
				   "<p class='col 3' style='background-color:rgb(35,139,69);'>&nbsp;</p><span class='val 3'>1.0 to 1.25</span><br>"+
				   "<p class='col 4' style='background-color:rgb(65,171,93);'>&nbsp;</p><span class='val 4'>0.75 to 1.0</span><br>"+
				   "<p class='col 5' style='background-color:rgb(116,196,118);'>&nbsp;</p><span class='val 5'>0.5 to 0.75</span><br>"+
				   "<p class='col 6' style='background-color:rgb(161,217,155);'>&nbsp;</p><span class='val 6'>0.25 to 0.5</span><br>"+
				   "<p class='col 7' style='background-color:rgb(199,233,192);'>&nbsp;</p><span class='val 7'>0.1 to 0.25</span><br>"+
				   "<p class='col 8' style='background-color:rgb(229,245,224);'>&nbsp;</p><span class='val 8'>0.01 to 0.1</span><br>"+
				   "<p class='col 9' style='background-color:rgb(255,255,255);'>&nbsp;</p><span class='val 9'>0 to 0.01</span>");
		}
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
