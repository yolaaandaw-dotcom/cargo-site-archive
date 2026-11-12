define(["_libs/pixi.min"],
function(
	PIXI
) {

/**
 * slit-scan style filter
 * Andrew Ohlmann
 * andrewohlmann.com
 *
 * @class ScanFilter
 * @extends AbstractFilter
 * @constructor
 */

var ScanFilter = function(){

    PIXI.AbstractFilter.call( this,

	    // no vertex shader
	    null,

	    // fragment shader
		[

	        'precision mediump float;',
	        'uniform vec2 dimensions;',
	        'uniform vec2 imgDimensions;',
	        'uniform float mouseX;',
	        'uniform float mouseY;',
	        'uniform sampler2D uSampler;',
	        'uniform float horizontal;',
	        'uniform float scanSize;',
	        'uniform float scanCycles;',
	        'uniform float scanCyclesLarge;',
	        'uniform float wiggle;',

	        'void main()',
	        '{',

	        // Scale coordinates to screen dimensions , (-1.0,1.0)
			'	vec2 uv = gl_FragCoord.xy / dimensions.xy;',

		        // gotta flip the y coordinates for some reason
	        '	uv.y = (1.0 - uv.y);',

				// number of layers. more than 2 will slow down mobile
				'const int num_samples = 4;',
				'const float num_samples_f = float(num_samples);',

				// band distance
				'vec2 dist = vec2(0.0);',

				'if ( horizontal < 1.0 ) {',
					'dist = vec2(0,4.0) / dimensions.xy;',

				'} else {',
					'dist = vec2(4.0,0) / dimensions.xy;',
				'};',

				'vec2 p0 = uv - 0.5*dist;',
				'vec2 p1 = uv + 0.5*dist;',
				'vec2 stepvec = (p1-p0)/(num_samples_f-1.0);',

				'vec2 sumvec = vec2(0.0);',
				'vec2 waveone = vec2(0.0);',
				'vec2 wavetwo = vec2(0.0);',
				'vec2 tempwave = vec2(0.0);',

				'const float MIP_BIAS = 100.0;',
				'vec4 sum_bandy = vec4( 0.0 );',


	        '	if ( horizontal < 1.0) {',

					'for(int i=1;i<num_samples;++i)',
					'{',
					'	p0+=stepvec;',

						'tempwave.y = (uv.y +p0.y)*2.0*(dimensions.y/imgDimensions.y);',
						'waveone.y = (uv.y +p0.y)*scanCycles*2.0*(dimensions.y/imgDimensions.y);',
						'wavetwo.y = (uv.y +p0.y)*scanCyclesLarge*2.0*(dimensions.y/imgDimensions.y);',

						// max scanSize = 40% , shortwave
						'waveone.y = (sin((waveone.y* (imgDimensions.x / dimensions.x))+mouseY*3.0)*0.5*scanSize+0.5*scanSize)*0.4;',

						// max scanSize = 60% , longwave
						'wavetwo.y = (cos((wavetwo.y*(imgDimensions.x / dimensions.x)+mouseX)+mouseY*-0.6)*0.5*scanSize+0.5*scanSize)*0.6;',

						// add horiz wiggle
						'sumvec.x = uv.x*(1.0-wiggle) +wiggle*.5  + (sin(tempwave.y*30.0*wiggle+mouseY*1.0)*.5 + cos(tempwave.y*34.0*wiggle+mouseY*-.3+2.0)*.3 + sin(tempwave.y*53.0*wiggle+mouseY*-0.2+30.0)*.2 + sin(tempwave.y*2.0*wiggle+mouseY*1.0+3.0)*.5 ) *wiggle*.25;',

						// add it together + a longer wave that's inverse to scan size
						'sumvec.y = waveone.y+wavetwo.y+(1.0-scanSize)*0.5 + (sin(mouseY*-0.1)*0.5)*(1.0-scanSize);',

						//  render to texture
						'sum_bandy += texture2D( uSampler, sumvec, MIP_BIAS );',
					'}',


		    '	} else {',


					'for(int i=1;i<num_samples;++i)',
					'{',
					'	p0+=stepvec;',

						'tempwave.x = (uv.x +p0.x)*2.0*(dimensions.x/imgDimensions.x);',
						'waveone.x = (uv.x +p0.x)*scanCycles*2.0*(dimensions.x/imgDimensions.x);',
						'wavetwo.x = (uv.x +p0.x)*scanCyclesLarge*2.0*(dimensions.x/imgDimensions.x);',

						// max scanSize = 40% , shortwave
						'waveone.x = (sin((waveone.x* (imgDimensions.y / dimensions.y))+mouseX*3.0)*0.5*scanSize+0.5*scanSize)*0.4;',

						// max scanSize = 60% , longwave
						'wavetwo.x = (cos((wavetwo.x*(imgDimensions.y / dimensions.y)+mouseY)+mouseX*-0.6)*0.5*scanSize+0.5*scanSize)*0.6;',

						// add horiz wiggle
						'sumvec.y = uv.y*(1.0-wiggle) +wiggle*.5  + (sin(tempwave.x*30.0*wiggle+mouseX*1.0)*.5 + cos(tempwave.x*34.0*wiggle+mouseX*-.3+2.0)*.3 + sin(tempwave.x*53.0*wiggle+mouseX*-0.2+30.0)*.2 + sin(tempwave.x*2.0*wiggle+mouseX*1.0+3.0)*.5 ) *wiggle*.25;',

						// add it together + a longer wave that's inverse to scan size
						'sumvec.x = waveone.x+wavetwo.x+(1.0-scanSize)*0.5 + (sin(mouseX*-0.1)*0.5)*(1.0-scanSize);',

						//  render to texture
						'sum_bandy += texture2D( uSampler, sumvec, MIP_BIAS );',
					'}',

		    '	};',

				'sum_bandy /= (num_samples_f-1.0);',

	        '   gl_FragColor = sum_bandy;',
	        '}'


	    ].join('\n'),

	    // custom  uniforms
		{
	        dimensions: {type: '2fv', value:  new Float32Array([512.0, 512.0]) },
	        imgDimensions: {type: '2fv', value: new Float32Array([512.0, 512.0]) },
	        mouseX: {type: '1f', value: 0.0},
	        mouseY: {type: '1f', value: 0.0},
	        horizontal: {type: '1f', value: 1.0},
	        scanSize: {type: '1f', value: 1.0},
	        scanCycles: {type: '1f', value: 1.0},
	        scanCyclesLarge: {type: '1f', value: 1.0},
	        wiggle: {type: '1f', value: 1.0 }
// 	        uSampler: {type: 'sampler2D', value: texture},
	    }
	);

//     texture.baseTexture._powerOf2 = true;


/*
    if(texture.baseTexture.hasLoaded) {
        this.uniforms.imgDimensions.value.x = texture.width;
        this.uniforms.imgDimensions.value.y = texture.height;
    } else {
        this.boundLoadedFunction = this.onTextureLoaded.bind(this);

        texture.baseTexture.on('loaded', this.boundLoadedFunction);
    }
*/

};

ScanFilter.prototype = Object.create( PIXI.AbstractFilter.prototype );
ScanFilter.prototype.constructor = ScanFilter;

/**
 * Sets the map dimensions uniforms when the texture becomes available.
 *
 * @method onTextureLoaded
 */
/*
ScanFilter.prototype.onTextureLoaded = function()
{
    this.uniforms.imgDimensions.value.x = this.uniforms.uSampler.value.width;
    this.uniforms.imgDimensions.value.y = this.uniforms.uSampler.value.height;

    this.uniforms.uSampler.value.baseTexture.off('loaded', this.boundLoadedFunction);
};
*/


// Time to set all the properties

Object.defineProperties( ScanFilter.prototype, {

	/**
	* The mouseX number used by the filter.
	*
	* @type Number
	*/

	mouseX: {
    	get: function() {
    	    return this.uniforms.mouseX.value;
		},

		set: function(value) {
			this.dirty = true;
			this.uniforms.mouseX.value = value;
    	}
	},

	/**
	* The mouseY number used by the filter.
	*
	* @type Number
	*/

	mouseY: {
	    get: function() {
    	    return this.uniforms.mouseY.value;
		},
		set: function(value) {
			this.dirty = true;
        this.uniforms.mouseY.value = value;
	    }
    },

	/**
	* used to update/set filter dimensions.
	*
	* @type PIXI Float32 Array
	*/

    dimensions: {
	    get: function() {
    	    return this.uniforms.dimensions.value;
		},
		set: function(value) {
	        this.dirty = true;
	        this.uniforms.dimensions.value = value;
	    }
    },

	/**
	* used to update/set source image dimensions, aspect ratio.
	*
	* @type PIXI Float32 Array
	*/

	imgDimensions: {
	    get: function() {
	        return this.uniforms.imgDimensions.value;
	    },
	    set: function(value) {
	        this.dirty = true;
	        this.uniforms.imgDimensions.value = value;
	    }
    },

	/**
	* used to choose horiz
	*
	* @type Number
	*/

	horizontal: {
	    get: function() {
	        return this.uniforms.horizontal.value;
	    },
	    set: function(value) {
	        this.dirty = true;
	        this.uniforms.horizontal.value = value;
	    }
    },

	/**
	* used to choose scanCycles
	*
	* @type Number
	*/

 	scanCycles: {
	    get: function() {
	        return this.uniforms.scanCycles.value;
	    },
	    set:
	    function(value) {
	        this.dirty = true;
	        this.uniforms.scanCycles.value = value;
	    }
    },

	/**
	* used to choose scanCyclesLarge
	*
	* @type Number
	*/

	scanCyclesLarge: {
	    get: function() {
	        return this.uniforms.scanCyclesLarge.value;
	    },
	    set:
	    function(value) {
	        this.dirty = true;
	        this.uniforms.scanCyclesLarge.value = value;
	    }
    },

	/**
	* used to choose scanSize
	*
	* @type Number
	*/

	scanSize: {
	    get: function() {
	        return this.uniforms.scanSize.value;
	    },
	    set:
	    function(value) {
	        this.dirty = true;
	        this.uniforms.scanSize.value = value;
	    }
	},

	/**
	* used to add wiggle
	*
	* @type Number
	*/

	wiggle: {
	    get: function() {
	        return this.uniforms.wiggle.value;
	    },
	    set:
	    function(value) {
	        this.dirty = true;
	        this.uniforms.wiggle.value = value;
	    }
	}
});

return ScanFilter;
});

