/*
* Polygon Engine
*
* Copyright (c) 2014 Mario Klingemann
*
*/

define([
	"polygon_engine/_libs/qlib.min",
	"three"
],
function(
	qlib,
	THREE
) {

	// namespace:
	//window["qlib"] = window.qlib || {};

	(function() {

		var PolygonEngine = function( canvasID, imageSrc, settings ) {
		  this.init(canvasID, imageSrc, settings );
		}

		PolygonEngine.styles = ["random1","random2","iso","straight1","straight2","voronoi","delaunay"];
		PolygonEngine.styleSettings = {
			random1:{
				baseGridMode: "delaunay",
				baseAngle:0,
				angleSteps:8,
				angleSpeedRange: 0.001,
				uMin:0.2,
				uRange:0.6,
				vMin:0.2,
				vRange:0.6,
				offsetSpeedRange: 0.000,
				offsetRadiusRange: 0.0,
				mode:"subdiv"
			},
			random2:{
				baseGridMode: "voronoi",
				baseAngle:0,
				angleSteps:360,
				angleSpeedRange: 0.003,
				uMin:0.2,
				uRange:0.6,
				vMin:0.2,
				vRange:0.6,
				offsetSpeedRange: 0.003,
				offsetRadiusRange: 0.0,
				mode:"subdiv"
			},
			iso:{
				baseAngle:0,
				angleSteps:3,
				angleSpeedRange: 0,
				uMin:0.4,
				uRange:0.2,
				vMin:0.4,
				vRange:0.2,
				offsetSpeedRange: 0.003,
				offsetRadiusRange: 0.3,
				mode:"subdiv"
			},
			straight1:{
				baseAngle:0,
				angleSteps:4,
				angleSpeedRange: 0,
				uMin:0.3,
				uRange:0.4,
				vMin:0.3,
				vRange:0.4,
				offsetSpeedRange: 0.001,
				offsetRadiusRange: 2,
				mode:"subdiv"
			},
			straight2:{
				baseAngle:45,
				angleSteps:4,
				angleSpeedRange: 0,
				uMin:0.3,
				uRange:0.4,
				vMin:0.3,
				vRange:0.4,
				offsetSpeedRange: 0.001,
				offsetRadiusRange: 2,
				mode:"subdiv"
			},
			voronoi:
			{
				mode:"voronoi",
				angleSpeedRange: 0.002,
				offsetRadiusRange: 1
			},
			delaunay:
			{
				mode:"delaunay",
				angleSpeedRange: 0.002,
				offsetRadiusRange: 1
			}

			};

		PolygonEngine.getDefaultSettingsObject = function()
		{
			return {
				style: "random",
				subdivisionCount: 256,
				animationSpeed: 1,
				interactionSpeed: 4,
				interactionRadius: 200,
				hasMouseInteraction: true,
				hasMotionInteraction: true
			}
		}

		var p = PolygonEngine.prototype;


		// public properties:

		p.inited = false;


		// public methods:

		p.updateSettings = function( settingsObject )
		{
			this.style = settingsObject.style || PolygonEngine.styles[0];
			this.subdivisionCount = settingsObject.subdivisionCount || 16;
			this.hasMouseInteraction = settingsObject.hasMouseInteraction || true;
			this.hasMotionInteraction = settingsObject.hasMotionInteraction || true;
			this.animationSpeed = (settingsObject.animationSpeed == null ? 0 : settingsObject.animationSpeed);
			this.interactionSpeed = (settingsObject.interactionSpeed == null ? 1 : settingsObject.interactionSpeed);
			this.interactionRadius= (settingsObject.interactionRadius == null ? 200 : settingsObject.interactionRadius);

			this.styleSettings = qlib.PolygonEngine.styleSettings[this.style];

			if ( this.currentImage && this.currentImage.complete)
			{
				this.processImage();
			}
		}

		p.getCurrentSettings = function()
		{
			return {
				style: this.style,
				subdivisionCount: this.subdivisionCount,
				hasMouseInteraction: this.hasMouseInteraction,
				hasMotionInteraction: this.hasMotionInteraction,
				animationSpeed: this.animationSpeed,
				interactionSpeed: this.interactionSpeed,
				interactionRadius: this.interactionRadius

			}
		}

		p.loadImage = function( src )
		{
	/*
			if ( !this.currentImage )
			{
				this.currentImage = document.createElement("img");
				this.currentImage.crossOrigin = "Anonymous";
				var scope = this;
				this.currentImage.onload = function(){ scope.processImage() };
			}
	*/

	/*
			if( Object.prototype.toString.call( src ) === '[object Array]' )
			{
				this.currentImage.src = src[(Math.random() * src.length)|0];
			} else {
				this.currentImage.src = src;
			}
	*/
		}

		p.setStyle = function( id )
		{
			this.style = id;
			this.styleSettings = qlib.PolygonEngine.styleSettings[this.style];

			this.resetSubdivision();
		}

		p.resetSubdivision = function()
		{
			this.uva = [];
			this.splitIndices = [];

			// return if we try to do before stuff happens -- usually happens inside Update in main.js
			if (this.colorMap == undefined){
				return
			}

			this.initVoronoiPoints();

			this.calculatePolys( this.colorMap.rect );
			this.renderSubdivision();
		}

		p.setSubdivisionCount = function( n )
		{
			this.subdivisionCount = n;
			this.processImage();
		}

		p.setAnimationSpeed = function( n )
		{
			this.animationSpeed = n;
		}

		p.setInteractionSpeed = function( n )
		{
			this.interactionSpeed = n;
		}

		p.setInteractionRadius = function( n )
		{
			this.interactionRadius = n;
		}

		p.backdrop_size = {
			width: 0,
			height: 0,
			devicePixelRatio: window.devicePixelRatio > 1 && !Cargo.Helper.isMobile() ? 2: 1,
		}

		p.onResize = function()
		{
			if ( this.renderer) {

				var plugWidth, plugHeight, plugLeft, plugTop, pixelRatio;

				var plugin = this.rootEl;

				if ( plugin !== null) {

					plugWidth = plugin.offsetWidth
					plugHeight = plugin.offsetHeight
					pixelRatio = this.backdrop_size.devicePixelRatio;


				} else {

					return;

				}

				if ( this.backdrop_size.width != plugWidth || this.backdrop_size.height != plugHeight ) {

					 this.parentWidth = plugWidth
					 this.parentHeight = plugHeight

	// 				var holder = this.canvas.parentNode;
					var canvas = this.canvas;

					this.backdrop_size = {
						width: plugWidth,
						height: plugHeight,
						devicePixelRatio: pixelRatio,
					}

					this.renderer.setPixelRatio( pixelRatio )

					this.renderer.setSize( plugWidth,plugHeight);


					var dist = plugHeight / 2 / Math.tan(Math.PI * 120 / 360);

					dist = dist -2


					var camera = new THREE.PerspectiveCamera( 120, plugWidth / plugHeight, 1, 5000 );


					if ( pixelRatio > 1){

						camera.position.set( plugWidth*-1.5, plugHeight*1.5, dist);
						camera.lookAt(new THREE.Vector3( plugWidth*-1.5, plugHeight*1.5, 0 ));

						this.scene.getObjectByName( "renderObject" ).position.x = 0;


					} else {

						camera.position.set( plugWidth*-0.5, plugHeight*0.5, dist);
						camera.lookAt(new THREE.Vector3( plugWidth*-0.5, plugHeight*0.5, 0 ));

						this.scene.getObjectByName( "renderObject" ).position.x = 0;

					}

					this.camera = camera;

					this.processImage();

				}


			}
		}

		p.setImage = function( image )
		{
			var scope = this;
			this.currentImage = image;
	// 		this.currentImage.crossOrigin = "";

			this.currentImage.onload = function(){ scope.processImage() };
			if ( this.currentImage.complete ) this.processImage();
		}

		p.stop = function()
		{
			if ( this.renderRequestID )
			{
				(window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
			     window.webkitCancelAnimationFrame || window.oCancelAnimationFrame)( this.renderRequestID );
				 this.renderRequestID = null;
			}
		}

		p.isActive = function()
		{
			return this.renderRequestID != null;
		}

		p.start = function()
		{
			if ( this.renderRequestID == null )
			{
				this.render();
			}
		}

		p.init = function( canvasID, imageSrc, settings )
		{


			// this value is to fix a render glitch in FF and should not be changed
			this.fringePadding = 0.6;

			this.canvasMousePos = {x:0,y:0};
			this.lastMouseMove = 0;

			var cv = this.canvas = document.getElementById(canvasID);
			this.rootEl = $(cv).closest('.backdrop').get(0);

			var w = cv.width = this.parentWidth = cv.parentNode.offsetWidth;
			var h = cv.height = this.parentHeight = cv.parentNode.offsetHeight;


			// No antialiasing for hidpi monitors - ADO
			// disabling antialiasing for speed gain
			if ( window.devicePixelRatio > 1 && !Cargo.Helper.isMobile() ){

				this.renderer = new THREE.WebGLRenderer({antialias:false,stencil: false, canvas:cv, alpha: true});

			} else {

				this.renderer = new THREE.WebGLRenderer({antialias:true,stencil: false, canvas:cv, alpha: true});

			}

			this.renderer.setClearColor( settings.overlay_hex, 1 );
			this.renderer.clear()

			var gl = this.renderer.context;

			if ( gl == null )
			{
				this.canvas_ctx = cv.getContext('2d');

			} else {
				this.renderer.setSize( cv.width,cv.height);

				this.scene = new THREE.Scene();

				// setup cameras
				var camera = new THREE.PerspectiveCamera( 45, w / h, 100, 5000 );

				var dist = this.canvas.height / 2 / Math.tan(Math.PI * 45 / 360);
				camera.position.set( w*0.5, h*0.5, dist * 0.8 );
				camera.lookAt(new THREE.Vector3( w*0.5, h*0.5, 0 ));

				this.camera = camera;

				this.maxVertexCount = 2600;
				var geometry = this.geometry = new THREE.BufferGeometry();
				var vertices = new Float32Array(this.maxVertexCount * 9 );
				var colors = new Float32Array(this.maxVertexCount * 9 );
				geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
				geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

				// backside for mesh flip - ADO
				var material = new THREE.MeshBasicMaterial( {
					side: THREE.BackSide,
					vertexColors: THREE.VertexColors,
					opacity: 1-settings.overlay_alpha,
					transparent: settings.overlay_alpha > 0
				});
				var mesh = new THREE.Mesh( geometry, material );
				//

				// flip mesh - ADO
				mesh.rotation.y = Math.PI;
				mesh.position.x = w;
				mesh.name = "renderObject";
				//

				this.scene.add(mesh);

			}

			this.renderRequestID = null;

			this.blur = new qlib.StackBlurFilter(32,32,2);

			this.matrix = new qlib.Matrix();

			this.alphaAvg = [];
			this.alphaSum = 0;
			this.betaAvg = [];
			this.betaSum = 0;
			this.uva = [];
			this.splitIndices = [];

			var scope = this;



	// Remove Mouse stuff from plugin, doing this inside main.js instead -- ADO

	/*
			this.canvas.addEventListener('mousemove', function(evt) {
				if (scope.hasMouseInteraction )
				{

					var rect = scope.canvas.getBoundingClientRect();
					scope.canvasMousePos.x = evt.clientX - rect.left;
					scope.canvasMousePos.y = evt.clientY - rect.top;
					if ( scope.lastMouseMove < 200 ) scope.lastMouseMove += 10;
				}

			}, false);

			this.canvas.addEventListener('touchmove', function(evt) {
				if (scope.hasMouseInteraction )
				{
					var rect = scope.canvas.getBoundingClientRect();
					scope.canvasMousePos.x = evt.targetTouches[0].pageX - rect.left;
					scope.canvasMousePos.y = evt.targetTouches[0].pageY - rect.top;
					if ( scope.lastMouseMove < 200 ) scope.lastMouseMove += 10;
				}
			}, false);


			window.addEventListener("deviceorientation", function(evt){
				if (scope.hasMotionInteraction )
				{
					scope.alphaSum += event.gamma;
					scope.alphaAvg.push(event.gamma);
					if ( scope.alphaAvg.length > 5 ) scope.alphaSum -= scope.alphaAvg.shift();

					scope.betaSum += event.beta;
					scope.betaAvg.push(event.beta);
					if ( scope.betaAvg.length > 5 ) scope.betaSum -= scope.betaAvg.shift();

				   if ( scope.lastAlpha ) scope.rotation1 -= (scope.lastAlpha - scope.alphaSum /  scope.alphaAvg.length) * 0.02;
				   scope.lastAlpha = scope.alphaSum /  scope.alphaAvg.length;
				   if ( scope.lastBeta ) scope.rotation2 += (scope.lastBeta - scope.betaSum  /  scope.betaAvg.length) *0.01;
				   scope.lastBeta =  scope.betaSum /  scope.betaAvg.length;
				}
			}, true);
	*/

			if ( !settings ) settings = this.getDefaultSettingsObject();

			this.updateSettings( settings );
			this.voronoi = new qlib.Voronoi();
			if ( imageSrc ) this.loadImage( imageSrc );
		}


		// Take in mouse values from plugin -- ADO
		p.updateMouse = function(n){

			var mousePosition = n;
			var mouseMoved = false;

			if (Math.abs(mousePosition.prev.x-mousePosition.current.x) > .1  && Math.abs(mousePosition.prev.y-mousePosition.current.y) > .1 ) {
				mouseMoved = true;
			}

			if ( this.hasMotionInteraction ){
				this.canvasMousePos.x = mousePosition.prev.x;
				this.canvasMousePos.y = mousePosition.prev.y;

			}

			if ( mouseMoved){
				this.lastMouseMove = 200;
			}

	/*
			if ( this.lastMouseMove < 200 && mouseMoved == true) {
				this.lastMouseMove += 10;
			}
	*/

		}
		//


		p.toString = function()
		{
			return "PolygonEngine";
		}

		// private methods:

		p.update = function()
		{
			return (window.requestAnimationFrame || window.mozRequestAnimationFrame ||
					   window.webkitRequestAnimationFrame || window.oRequestAnimationFrame)(p.render.bind(this));
		}

		p.processImage = function()
		{
			if ( !this.currentImage ) return;

			var m = this.matrix;
			var cv = this.canvas;
			var ci = this.currentImage;

			if ( this.backdrop_size.devicePixelRatio > 1){

				var cw = this.parentWidth 
				var ch = this.parentHeight 


				cv.width = cw * 2;
				cv.height = ch *2;

			} else {
				var cw = this.parentWidth  
				var ch = this.parentHeight 
			}


			var iw = ci.naturalWidth;
			var ih = ci.naturalHeight;


			if ( this.colorMap == null ||  this.colorMap.width!=cw ||   this.colorMap.height!=ch ){
				var bm = this.colorMap = new qlib.BitmapData(cw,ch,false,0);
			} else {
				bm = this.colorMap;
			}

			m.a = m.d = Math.max(cw / iw, ch / ih);
			m.tx = 0.5 * (cw - iw * m.a);
			m.ty = 0.5 * (ch - ih * m.a);


			bm.clear();
			bm.draw(ci, m, null, "normal", null, true );
			bm.applyFilter(bm,null,null,this.blur);

			this.splitIndices = [];
			this.initVoronoiPoints();
			this.calculatePolys( bm.rect );
			this.renderSubdivision();
			this.stop();
			if ( this.renderRequestID == null )
			{
				this.render();
			}
		}

		p.initVoronoiPoints = function()
		{
			var ss = this.styleSettings;
			var bm = this.colorMap;
			var p1 = this.points = [];
			var p2 = this.points2 = [];

			// return if we try to do before stuff happens -- usually happens inside Update in main.js
			if (bm == undefined){
				return
			}

			if ( ss.mode == "voronoi" || ss.mode == "delaunay" )
			{
				for ( var i = 0; i <= this.subdivisionCount; i++ )
				{
	// 				var p = new qlib.Vector2( Math.random() * bm.rect.width * 2 - bm.rect.width * 0.5, Math.random()  * bm.rect.height * 2 - bm.rect.height * 0.5);
					var p = new qlib.Vector2( Math.random() * bm.rect.width, Math.random()  * bm.rect.height);

					p1[i] = p;
					p2[i] = new qlib.Vector2();

					this.uva[i] = {
						r: Math.random() * Math.min(bm.rect.width,bm.rect.height)*ss.offsetRadiusRange,
						a: Math.random() * Math.PI * 2,
						aa: (Math.random()-Math.random())*ss.angleSpeedRange,
						ca:0,
						ut: 0,
						vt: 0
						};

					}


			}
		}

		p.setBgColor = function(hex, alpha){

			var scene_alpha = 1 - alpha

			this.renderer.setClearColor( hex, 1 );

			var renderObject = this.scene.getObjectByName( "renderObject" )
			if ( renderObject){
				if ( scene_alpha < 1){
					renderObject.material.transparent = true;
					renderObject.material.opacity = scene_alpha
				} else {
					renderObject.material.transparent = false;
					renderObject.material.opacity = scene_alpha				
				}

				renderObject.material.needsUpdate = true;
			} 
		}


		p.calculatePolys = function( boundingRect )
		{

			switch ( this.styleSettings.mode )
			{
				case "subdiv":
					this.polys = this.calculateSubdivision( boundingRect );
					break;
				case "voronoi":
					this.polys = this.calculateVoronoi( boundingRect, false );
					break;
				case "delaunay":
					this.polys = this.calculateVoronoi( boundingRect, true );
					break;
			}

			var bm = this.colorMap;
			var maxw = this.canvas.width-1;
			var maxh = this.canvas.height-1;
			var ply = this.polys;


			for ( var i = ply.length; --i > -1 ;)
			{
				if ( ply[i].pointCount < 3 )
				{
					ply.splice(i,1);
				} else
				{

					var centroid = ply[i].getCentroid();
					if ( centroid.x < 0 ) centroid.x = 0;
					if ( centroid.x > maxw ) centroid.x = maxw;
					if ( centroid.y < 0 ) centroid.y = 0;
					if ( centroid.y > maxh ) centroid.y = maxh;
					var fc = bm.getPixel(centroid.x,centroid.y);
					var r = ((fc >>> 16) & 0xff) / 255;
					var g = ((fc >>> 8) & 0xff) / 255;
					var b = (fc  & 0xff) / 255;

					if ( ply[i].pointCount > 3 )
					{
						var tris = ply[i].triangulate();
						for ( var j = 0; j < tris.length; j++)
						{
							var cp = tris[j].toConvexPolygon( true )
							cp.colors = new Float32Array([r,g,b]);
							if ( j == 0 ) ply[i] = cp;
							else ply.push(cp)
						}
					} else {
						ply[i].colors = new Float32Array([r,g,b]);
					}
				}
			}
		}

		p.calculateSubdivision = function( boundingRect )
		{

			var polys = [qlib.ConvexPolygon.fromRectangle(boundingRect)];
			var ssc = this.subdivisionCount;
			var spi = this.splitIndices;
			for ( var i = 0; i < ssc; i++ )
			{

				if ( spi[i] == null )
				{
					var biggestIndex = 0;
					var biggestArea = Math.abs(polys[0].getArea());
					for ( var j = 1; j < polys.length; j++ )
					{
						var area = Math.abs(polys[j].getArea());
						if ( area > biggestArea )
						{
							biggestArea = area;
							biggestIndex = j;
						}
					}
					spi[i] = biggestIndex;
				}

				var poly = polys.splice(spi[i],1)[0];

				if ( poly!=null) polys = polys.concat(this.subdivide( poly, i ));

			}

			return polys;
		}

		p.calculateVoronoi = function( boundingRect, getDelaunay )
		{

			var p1 = this.points;
			var p2 = this.points2;

			var ssc = this.subdivisionCount;

			for ( var i = 0; i <= ssc; i++ )
			{
				var uvi = this.uva[i];
				var a = uvi.a + uvi.ca;
				uvi.px = p2[i].x = p1[i].x + Math.cos(a) * uvi.r;
				uvi.py = p2[i].y = p1[i].y + Math.sin(a) * uvi.r;
			}

			var diagram = this.voronoi.compute(p2, {xl:0,xr:boundingRect.width-1,yt:0,yb:boundingRect.height-1});

			/*
			if ( getDelaunay )
			{
				var triangleList = diagram.getDelaunayTriangles();
				var polys = qlib.PolygonUtils.convexPolygonsFromDelaunayTriangles(triangleList);
			} else {
		    */
				var polyList = qlib.PolygonUtils.convexPolygonsFromVoronoiCells(diagram);
				var polys = [];
				for ( var i = 0; i < polyList.length; i++ )
				{
					polys[i] = polyList[i].poly;
				}
				if ( getDelaunay )
				{
					for ( var i = 0; i < polys.length; i++ )
					{
						var tris = polys[i].triangulate(qlib.ConvexPolygon.TRIANGULATE_CENTER );
						for ( var j = 0; j < tris.length; j++)
						{
							var cp = tris[j].toConvexPolygon( true )
							if ( j == 0 ) polys[i] = cp;
							else polys.push(cp)
						}
					}

				}
			//}
			this.voronoi.recycle(diagram);
			return polys;
		}

		p.subdivide = function( poly, index )
		{
			var u,v;
			var ss = this.styleSettings;

			if ( this.uva[index] == null )
			{

				u = ss.uMin + Math.random() * ss.uRange;
				v = ss.vMin + Math.random() * ss.vRange;
				this.uva[index] = {
					u:u,
					v:v,
					a: ss.baseAngle / 180 * Math.PI + (((Math.random()*ss.angleSteps)|0)*((Math.PI*2)/ss.angleSteps)),
					aa: (Math.random()-Math.random())*ss.angleSpeedRange,
					ca:0,
					ur: Math.random()*ss.offsetRadiusRange,
					vr: Math.random()*ss.offsetRadiusRange,
					ua: (Math.random()-Math.random())*ss.offsetSpeedRange,
					va: (Math.random()-Math.random())*ss.offsetSpeedRange,
					ut: Math.random()*Math.PI*2,
					vt: Math.random()*Math.PI*2
					};
			}

			var uvi = this.uva[index];

			u = uvi.u + uvi.ur * Math.cos(uvi.ut);
			v = uvi.v + uvi.vr * Math.sin(uvi.vt);
			if ( u <  ss.uMin ) u = ss.uMin;
			if ( u >  ss.uMin + ss.uRange ) u = ss.uMin + ss.uRange;

			if ( v <  ss.vMin ) v = ss.vMin;
			if ( v >  ss.vMin + ss.vRange ) v = ss.vMin + ss.vRange;

			var splitCenter = poly.getInsidePoint(u,v);

			uvi.px = splitCenter.x;
			uvi.py = splitCenter.y;
			var br = poly.getBoundingRect();
			var splitLine = qlib.LineSegment.fromPointAndAngleAndLength( splitCenter, uvi.a + uvi.ca,Math.max(br.width,br.height)*3,true);
			return poly.getSlices(splitLine);
		}

		p.renderSubdivision = function()
		{
			if ( this.canvas_ctx != null )
				this.renderSubdivisionCanvas();
			else
				this.renderSubdivisionWebGL();
		}


		p.renderSubdivisionCanvas = function()
		{

			var bm = this.colorMap;
			var canvas_ctx = this.canvas_ctx;
			var maxw = this.canvas.width-1;
			var maxh = this.canvas.height-1;

			canvas_ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
			canvas_ctx.lineWidth = 1;
			for ( var i=0; i < this.polys.length; i++ )
			{
				var centroid = this.polys[i].getCentroid();
				var fc = bm.getPixel(Math.min(maxw, Math.max(0,centroid.x)),Math.min(maxh,Math.max(0,centroid.y)));

				canvas_ctx.beginPath();
				canvas_ctx.strokeStyle = canvas_ctx.fillStyle = "rgb("+((fc>>16)&255)+","+((fc>>8)&255)+","+(fc&255)+")";
				this.polys[i].draw(canvas_ctx);

				canvas_ctx.fill();
				canvas_ctx.stroke();
			}
		}


		p.renderSubdivisionWebGL = function()
		{
			var ply = this.polys;
			var vertices = this.geometry.attributes.position;
			var colors = this.geometry.attributes.color;

			var va = vertices.array;
			var ca = colors.array;

			var w = this.canvas.width;
			var h = this.canvas.height;

			var j = 0;
			for ( var i=0; i < ply.length; i++ )
			{
				var pts = ply[i].points;
				var c = ply[i].colors;
				for ( var p = 0; p < 3; p++ )
				{
					va[ j ] = w - pts[p].x;
					va[ j + 1 ] = h - pts[p].y;
					va[ j + 2 ] =  0 ;
					ca[ j ] = c[0];
					ca[ j + 1 ] = c[1];
					ca[ j + 2 ] = c[2];
					j+=3;
				}
			}

			while ( j < va.length )
			{
				va[ j ] = 0;
				ca[j++] = 0;
			}

			colors.needsUpdate = vertices.needsUpdate = true;
			this.renderer.render( this.scene, this.camera );

		}

		p.render = function()
		{
			var scope = this;
			if ( !this.currentImage )
			{
				this.renderRequestID = this.update();
				return;
			}

			var cv = this.canvas;

			this.onResize();
			this.inited = true;

	/*
			if ( this.parentWidth != cv.parentNode.offsetWidth || this.parentHeight != cv.parentNode.offsetHeight )
			{
				this.processImage();
			}
	*/

			var speed = this.animationSpeed;
			var mouseSpeed = this.interactionSpeed;

			var uv = this.uva;
			var mp2 = Math.PI*2;
			var cmpx = cv.width - this.canvasMousePos.x;
			var cmpy = this.canvasMousePos.y;
			this.lastMouseMove--;
			var mouseSpeedFactor = this.hasMouseInteraction ? Math.min(1,Math.max(0,(this.lastMouseMove-100) / 100)) : 0;
			var r1 = this.interactionRadius;
			var r2 = r1*1.5;
			for ( var i=0;i < uv.length;i++)
			{
				var uvi = uv[i];
				var dx = uvi.px - cmpx;
				var dy = uvi.py - cmpy;
				var d = Math.sqrt(dx*dx+dy*dy);
				var speedFactor = d < r1 ? mouseSpeedFactor : ( d < r2 ? mouseSpeedFactor * (1 - (d-r1) / (r2-r1)) : 0 );
				var s = speedFactor * mouseSpeed + (1-speedFactor) * speed;

				uvi.ca=(uvi.ca+uvi.aa*s)%mp2;
				uvi.ut=(uvi.ut+uvi.ua*s)%mp2;
				uvi.vt=(uvi.vt+uvi.va*s)%mp2;
			}
			this.calculatePolys( this.colorMap.rect );
			this.renderSubdivision();
			this.renderRequestID = this.update();

		}

		qlib["PolygonEngine"] = PolygonEngine;
		
	}());
	
	return qlib;

});