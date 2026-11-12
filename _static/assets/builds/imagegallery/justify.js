var resizeObserver = new ResizeObserver(function(entries){
					
	entries.forEach(function(entry){
		// do not trigger resize if everything collapses to 0
		entry.target.dispatchEvent(new CustomEvent('elementResize', {
			detail: {},
			bubbles: false,
			composed: true,
		}));		

	});

});




define([
	__cargo_context__ === "staging" ? '/_jsapps/imagegallery/base.js' : '/_static/assets/builds/imagegallery/base.js'
],
function(
	GalleryBase
) {

	return GalleryBase.extend({

		name: 'Justify',
		rendered: false,
		parentView: null,
		mobile_active: false,

		// tandem array to hold image sizes
		image_meta: [],

		// cached el sizes at various baseunit dimensions
		cached_el_sizes : {

		},

		/**
		 * Set attributes to el for layout options.
		 *
		 */

		setElAttributes: function () {
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}
			if ( parseFloat(model_data.padding) > 0){
				this.el.removeAttribute('data-padding-zero', '')
			} else {
				this.el.setAttribute('data-padding-zero', '')
			}

			this.el.classList.remove('slick');
			this.el.removeAttribute('image-gallery-horizontal-align');
			this.el.removeAttribute('image-gallery-vertical-align');
			this.el.removeAttribute('data-exploded');
			this.el.removeAttribute('image-gallery-row');
			this.el.removeAttribute('data-slideshow-in-transition')

			this.el.setAttribute('image-gallery',this.name.toLowerCase());
			this.el.setAttribute('image-gallery-row','');
			this.el.setAttribute('image-gallery-pad',model_data.image_padding);
			this.el.setAttribute('image-gallery-gutter',model_data.image_padding * 2);
			this.el.setAttribute('style','');

		},

		/**
		 * Bind event listeners.
		 *
		 * @return {Object} this
		 */
		initialize: function (options) {

			if (!options){
				return
			}

			if( options.parentView) {
				this.parentView = options.parentView;
			}

			if ( options.galleryOptions){
				this.galleryOptions = options.galleryOptions
			}

			if ( options.mobile_active ){
				this.mobile_active = options.mobile_active
			}
			this.onResize = this.onResize.bind(this);
			this.updateThumbSize = this.updateThumbSize.bind(this)
			this.mobileToggle = this.mobileToggle.bind(this);

			Cargo.Event.once('BaseUnit:set', _.bind(function(){
				this.cached_el_sizes = {}
			}, this));

			Cargo.Event.on('BaseUnit:refresh', this.mobileToggle);

			this.first_render = false;

			return this;
		},


		mobileToggle: function(){

			if ( !document.body.contains(this.el) ){
				this.destroy();
				return;
			}

			var isMobileSize = Cargo.Helper.IsMobileWindowSize( baseUnit.cache.window.w )

			this.cached_el_sizes = {};

			if ( !this.mobile_active && isMobileSize ){
				this.mobile_active = true;
				this.updatePadding();

			} else if ( this.mobile_active && !isMobileSize ){
				this.mobile_active = false;
				this.updatePadding();
			}


			// since padding needs to be updated regardless of size, we trigger it regardless of mobile state
			this.requestTick();

		},

		requestTick: function(){
			var _this = this;
			if ( !this.ticking ){
				window.requestAnimationFrame(function(){
					_this.updateThumbSize();
					_this.ticking = false;
				})
				this.ticking = true;

			}
		},

		destroy: function(){

			resizeObserver.unobserve(this.el);
			this.el.removeEventListener('elementResize', this.onResize)

			Cargo.Event.off('mobile_padding_update', this.clearElementCache);

			Cargo.Event.off('BaseUnit:refresh', this.mobileToggle);


		},

		remove: function(){

			Backbone.View.prototype.remove.apply(this, arguments);
		},

		handleUpdates: function(galleryOptions, options){

			if ( galleryOptions ){
				this.galleryOptions = Object.assign({},galleryOptions);
			}

			if ( !options){
				return
			}

			switch (options.changing) {
				case 'image_padding':
				case 'responsive_image_padding':
					this.updatePadding();
					this.setElAttributes();
					this.updateThumbSize()
				    break;

				case 'mobile_active':
					if ( this.galleryOptions.data.responsive ){
						this.updatePadding();
						this.updateThumbSize();
					}
					break;
				case 'captions':
				
					this.padding_calculated = false;
					this.render();

					break;		
				case 'responsive':
					if ( this.mobile_active ){
						this.updatePadding();
						this.updateThumbSize();
					}
    				break;

				case 'layout_mode':
					break;

				case 'variation_index':
					this.padding_calculated = false;
					this.render();
					break;

				case 'row_height':
				case 'responsive_row_height':

					this.updateThumbSize();
					break;

				default:
				    break;

			}

		},

		getThumbRectPositionRelatedToPoint: function(point,rect){

			var in_y = false,
				in_x = false,
				above = false,
				below = false,
				to_left = false,
				to_right = false,
				distance = 0,
				rise = 0,
				run = 0,
				midpoint_distance = 0,
				midpoint_rise = 0,
				midpoint_run = 0;

			if ( point.x >= (rect.left) && point.x <= (rect.left+rect.width) ){
				in_x = true;
			}

			if ( point.y >= (rect.top) && point.y <= (rect.top+rect.height) ){
				in_y = true;
			}

			if ( rect.left > point.x ){
				to_right = true;
			} else if ( point.x > rect.left+rect.width ){
				to_left = true;
			}

			if ( rect.top > point.y ){
				below = true;
			} else if ( point.y > rect.top+rect.height ){
				above = true;
			}

			if ( in_x && in_y){

				var midpoint_rise = rect.midPoint.y - point.y;
				var midpoint_run = rect.midPoint.x - point.x;
				midpoint_distance = Math.sqrt(midpoint_rise*midpoint_rise + midpoint_run*midpoint_run)

			} else {

				if ( below ){

					rise = rect.top - point.y;

				} else if ( above ) {

					rise = (rect.top+rect.height) - point.y;

				}

				if ( to_right ){

					run = rect.left - point.x;

				} else if (to_left){

					run = (rect.left + rect.width) - point.x;

				}

			}

			distance = Math.sqrt( (rise*rise)+(run*run) );

			return {
				in_x: in_x,
				in_y: in_y,
				above: above,
				below: below,
				to_right: to_right,
				to_left: to_left,
				distance: distance,
				midpoint_rise: midpoint_rise,
				midpoint_run: midpoint_run,
				midpoint_distance: midpoint_distance,
				rise: rise,
				run: run,
				inside: in_x && in_y
			}

		},

		indicateInsertion: function(event, dragged, dragRect){

			if ( !dragRect ){
				return;
			}

			var m = {x: event.clientX, y: event.clientY}

			var minDistAbove = 9e9;
			var minDistBelow = 9e9;
			var minDistToRight = 9e9;
			var minDistToLeft = 9e9;
			var minDist = 9e9;

			var closestThumbToLeft = "default";
			var closestThumbToRight = "default";
			var closestThumbAbove = "default";
			var closestThumbBelow = "default";
			var closestThumb = "default";

			// build data into cache rects, also find closest thumb index
			for (var i in this.parentView.cachedRects.rects ){

				if ( i == 'default'){
					continue
				}

				var positions = this.getThumbRectPositionRelatedToPoint(m, this.parentView.cachedRects.rects[i] )
				this.parentView.cachedRects.rects[i].positions = positions;

				if ( this.parentView.cachedRects.rects[i].positions.distance < minDist ){
					minDist = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumb = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.above && this.parentView.cachedRects.rects[i].positions.distance < minDistAbove){
					minDistAbove = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbAbove = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.below && this.parentView.cachedRects.rects[i].positions.distance < minDistBelow){
					minDistBelow = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbBelow = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.to_left && this.parentView.cachedRects.rects[i].positions.distance < minDistToLeft){
					minDistToLeft = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbToLeft = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.to_right && this.parentView.cachedRects.rects[i].positions.distance < minDistToRight){
					minDistToRight = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbToRight = i;
				}
			}

			/**
			*
			*	FOR GRID, JUSTIFY, FREEFORM, SLIDESHOW
			*
			***/
			var targetNext = targetPrev = horizVertical = indicatePrev = indicateNext = "default";

			if ( this.parentView.cachedRects.rects[closestThumb].midPoint.x > m.x){

				// we know where to insert the item

				// now to figure out where it gets indiciated
				var prevItem = $('[data-gallery-item-id="'+(parseInt(closestThumb)-1)+'"]');

				if (prevItem.length > 0){

					if (
						(
							this.parentView.cachedRects.rects.hasOwnProperty(prevItem.attr('data-gallery-item-id') ) &&
							this.parentView.cachedRects.rects[ prevItem.attr('data-gallery-item-id') ].midPoint.x < this.parentView.cachedRects.rects[closestThumb].midPoint.x
						) ||
						prevItem.attr('data-gallery-item-id') == closestThumbToLeft
					) {
						indicatePrev = prevItem.attr('data-gallery-item-id');
					}

				}
				targetNext = closestThumb;
				indicateNext = targetNext;

			} else {

				// now to figure out where it gets indiciated
				var nextItem = $('[data-gallery-item-id="'+(parseInt(closestThumb)+1)+'"]');

				if (nextItem.length > 0){

					if (
						(
							this.parentView.cachedRects.rects.hasOwnProperty(nextItem.attr('data-gallery-item-id') ) &&
							this.parentView.cachedRects.rects[ nextItem.attr('data-gallery-item-id') ].midPoint.x > this.parentView.cachedRects.rects[closestThumb].midPoint.x
						) ||
						nextItem.attr('data-gallery-item-id') == closestThumbToRight
					) {
						// $('#indicate_next').html(nextItem.attr('data-gallery-item-id'))
						indicateNext = nextItem.attr('data-gallery-item-id')
					}

					targetNext = nextItem.attr("data-gallery-item-id");

				} else {

					targetNext = 9e9;

				}

				indicatePrev = closestThumb
			}


			var rotatedPrevItem = this.$el.find('[data-gallery-item-id="'+indicatePrev+'"] [data-rotation]');
			var rotatedNextItem = this.$el.find('[data-gallery-item-id="'+indicateNext+'"] [data-rotation]');
			var nextRotation = 0;
			var prevRotation = 0;

			if ( rotatedPrevItem.length >0){
				prevRotation = rotatedPrevItem.attr('data-rotation');
			}

			if ( rotatedNextItem.length >0){
				nextRotation = rotatedNextItem.attr('data-rotation');
			}


			this.$el.find('.indication-prev, .indication-next').removeClass('indication-prev indication-next')

			if ( indicatePrev != 'default' ){
				this.$el.find('[data-gallery-item-id="'+indicatePrev+'"]').addClass('indication-prev').css({
					'transform' : 'translateX(-2.5rem) rotate('+prevRotation+'deg)',
					'transition' : 'transform .08s cubic-bezier(0, 0, 0, 1)',
					'position': 'relative',
					'z-index' : '99'
				})
			}

			if ( indicateNext != 'default' ){
				this.$el.find('[data-gallery-item-id="'+indicateNext+'"]').addClass('indication-next').css({
					'transform' : 'translateX(2.5rem) rotate('+nextRotation+'deg)',
					'transition' : 'transform .08s cubic-bezier(0, 0, 0, 1)',
					'position': 'relative',
					'z-index' : '99'
				})
			}

			var galleryCards = 	this.$el.find('.gallery_card').not('.indication-next, .indication-prev');
			galleryCards.each(function(card){

				var $card = $(this);
				var rotation = 0;
				var rotationItem = $card.find('[data-rotation]');
				if ( rotationItem.length >0 ){
					rotation = rotationItem.attr('data-rotation');
				}
				$card.css({
					'position': '',
					'transform' : rotation ? 'rotate('+rotation+'deg)': '',
					'z-index' : ''
				})
			})

			this.parentView.insertionPoint = targetNext

		},

		resetIndication: function(){

			this.parentView.insertionPoint = 0;

			var $galleryCards = this.$el.find('.gallery_card');
			$galleryCards.each(function(index, card){

				var $card = $(this);
				var rotation = 0;
				var rotationItem = $card.find('[data-rotation]');
				if ( rotationItem.length >0 ){
					rotation = rotationItem.attr('data-rotation');
				}
				$card.css({
					'position': '',
					'transform' : rotation ? 'rotate('+rotation+'deg)': '',
					'z-index' : ''
				})
			})
			$galleryCards.removeClass('indication-next indication-prev')

		},


		calcRowHeights: function(){
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}

			// calculate row widths
			var row_data = [];
			var row_width = 0;
			var row_indexes = [0]
			var row_index = 0;
			var new_row = true;
			var target_width = 100;
			var variation_seed = model_data.variation_seed || 0;

			for (var index = 0; index < this.images.length; index++){

				var image = this.images[index];
				var isLink = this.images[index].tagName === 'A';

				var imageW, imageH;

				imageW = this.images[index].width;
				imageH = this.images[index].height;


				var target_height = model_data.row_height*.8 + 6;
				if ( new_row ){

					// variation itself is used as a 'seed' to prevent first row from always being the same
					switch (model_data.variation_mode) {

						// try to match uniform height
						case 0:
							target_width = 100;
						    break;

						// use 0 +1 0 -1 pattern
						case 1:
							target_width = Math.cos(Math.PI*.5*(row_index+variation_seed)) * model_data.variation + 100
							break;

						// use -1 +1 pattern
						case 2:
							target_width = Math.cos(Math.PI*(row_index+variation_seed)) * model_data.variation*(model_data.row_height/100) + 100
							break;

						case 3:
						// go completely random
							target_width = Math.cos(row_index+variation_seed*index) * model_data.variation + 100 + Math.abs(Math.sin(variation_seed)*100)
							break;

						default:
							target_width = 100;
						    break;
					}

					new_row = false;
				}

				var scaled_width = (target_height/imageH) * imageW

				var redo = 0;
				var redo_index = 0;

				row_width+= scaled_width;
				var imageCount = this.images.length;

				// if ending a row, we tally up the widths make it fill a line
				if ( row_width > target_width || index == imageCount + -1 ){

					var last_row = false;

					if ( index == imageCount + -1 ){
						last_row = true;
					}

					var occupied_width = row_width;

					// reset row_width
					row_width = 0;

					// mark completed row
					row_index++;

					// mark start of next line with index + 1
					row_indexes.push(index+1)

					var thumbs_in_row = row_indexes[row_index] - row_indexes[row_index-1]
					var remaining_percent = ((target_width - occupied_width) / target_width)

					// if the thumbnails would be enlarged by a lot, we leave them be
					// if ( remaining_percent > .5  && settings.row_variance < 0.5){
					if ( remaining_percent > .5 ){
						remaining_percent = .05 / thumbs_in_row
					}

					for (var i = row_indexes[row_index-1]; i < row_indexes[row_index]; i++ ){

						var offsetImageW, offsetImageH;

						offsetImageW = this.images[i].width
						offsetImageH = this.images[i].height

						var new_scaled_width = (target_height/offsetImageH) * offsetImageW
						var percent = (new_scaled_width / target_width )* 100;
						var scale_up_percent = ((new_scaled_width / occupied_width) * remaining_percent) *100
						percent = (percent + scale_up_percent);

						percent = Math.floor(percent*1000)/1000;

						this.image_meta[i] = [percent, row_index];

						row_data[i] = percent;

					}

					row_width = 0;
					new_row = true;

				} else {
					row_data[index] = 0;
				}

			}
		},


		/**
		 * @return {Object} this
		 */
		render: function () {

			this.el.removeEventListener('elementResize', this.onResize)
			resizeObserver.unobserve(this.el);

			var _this = this;
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}
						// set defaults for galleries that havent gotten updated settings
			if ( !model_data.hasOwnProperty('captions') ){
				model_data.captions = true;
			}
			this.images = _.sortBy(this.parentView.images, 'index');

			this.setElAttributes();
			// this.calcRowHeights();

			var fragment = document.createDocumentFragment()


			_.each( this.images, function(imageObject, index) {

				var image = _this.createItem(imageObject);

				// this step realigns serialized order with render order
				image.setAttribute('data-gallery-item-index', index);
				image.setAttribute('data-gallery-item', '');

				var interiorImages = image.querySelectorAll('img[width][height], iframe[width][height], video[width][height]')
				var caption = document.createElement('DIV')
				var isLink = false

				caption.className = 'gallery_image_caption'
				if ( imageObject.caption ){
					if (  /<[a-z][\s\S]*>/i.test(imageObject.caption)  ){
						caption.innerHTML = imageObject.caption;
					} else {
						caption.innerText = imageObject.caption;
					}
				}

				_.each(interiorImages, function(interiorImage){

					if ( interiorImage.hasAttribute('data-elementresizer-child') ){
						return
					}

					interiorImage.removeAttribute('data-icon-mode')
					interiorImage.setAttribute('data-elementresizer-no-resize' , '');
					interiorImage.setAttribute('data-elementresizer-no-centering' , '');
					interiorImage.setAttribute('data-elementresizer-no-vertical-resize', '');

					interiorImage.style.width = ''
					interiorImage.style.height = ''
				});

				if ( image.hasAttribute('width') && image.hasAttribute('height') && !image.hasAttribute('data-elementresizer-child') ){

					image.removeAttribute('data-icon-mode')
					image.setAttribute('data-elementresizer-no-resize' , '');
					image.setAttribute('data-elementresizer-no-centering' , '');
					image.setAttribute('data-elementresizer-no-vertical-resize', '');

					image.style.width = ''
					image.style.height = ''
				}

				var ratio,
					thumb;

				if ( image.tagName === 'A' && interiorImages.length == 1 ){
					isLink = true
					thumb = image;
					ratio = interiorImages[0].getAttribute('height')/ interiorImages[0].getAttribute('width');
				} else {
					ratio = image.getAttribute('height')/image.getAttribute('width')
					thumb = document.createElement('DIV')
				}

				var setRotation = false;
				if ( !isNaN(imageObject.rotation) && imageObject.rotation !== 0 && imageObject.rotation!== 360 ){
					setRotation = true;
				}


				if ( imageObject.draggable){
					thumb.setAttribute('data-draggable', '')
				}

				thumb.setAttribute('class' , 'gallery_card');
				if ( imageObject.activeClass){
					image.classList.add('active')
				}				
				thumb.setAttribute('image-gallery-pad' , model_data.image_padding);
				thumb.setAttribute('image-gallery-col' , '');
				thumb.setAttribute('data-gallery-item-id' , index);

				// thumb.setAttribute('data-row', _this.image_meta[index][1]);
				thumb.style.transform = setRotation ? 'rotate('+imageObject.rotation+'deg)' : ''

				var thumb_inner = document.createElement('DIV')

				if ( isLink ){

					interiorImages[0].removeAttribute('data-scale');
					interiorImages[0].style.width = '';
					interiorImages[0].style.height = '';
					interiorImages[0].style.margin = '';
					thumb_inner.appendChild(interiorImages[0])

				} else {

					image.removeAttribute('data-scale');
					image.style.width = '';
					image.style.height = '';
					image.style.margin = '';
					thumb_inner.appendChild(image);
				}

				thumb_inner.setAttribute('class', 'gallery_card_image');
				thumb_inner.setAttribute('data-elementresizer-no-resize' , '');
				thumb_inner.setAttribute('data-elementresizer-no-centering' , '');
				thumb_inner.setAttribute('style', 'height: 0px; padding-bottom: ' + (ratio*100) + '%');


				thumb.appendChild(thumb_inner)

				if ( imageObject.caption ){
					if (  /<[a-z][\s\S]*>/i.test(imageObject.caption)  ){
						caption.innerHTML = imageObject.caption;
					} else {
						caption.innerText = imageObject.caption;
					}
				}

				if ( imageObject.caption && model_data.captions ){
					thumb.appendChild(caption);
					thumb.classList.add('has_caption');
				}

				fragment.appendChild(thumb)
			});

			if ( Cargo.Helper.IsAdminEdit() ){
				this.el.innerHTML = '';
				this.el.appendChild(fragment);
			} else {
				var newEl = document.createElement('div');

				var elAttributes = this.el.attributes;

				_.each(elAttributes, function(attr){
					newEl.setAttribute(attr.name, attr.value);
				});

				newEl.appendChild(fragment)
				var oldEl = this.el;
				oldEl.parentNode.insertBefore(newEl, oldEl);
				oldEl.parentNode.removeChild(oldEl);
				this.parentView.setElement(newEl)
			}

			this.el.addEventListener('elementResize', this.onResize)
			resizeObserver.observe(this.el);

			this.el.classList.add('initialized');

			Cargo.Plugins.elementResizer.requestRefreshTick();
			Cargo.Event.trigger('image_gallery_rendered', this);
			this.updateThumbSize();

			return this;

		},

		onResize: function(){
			this.cached_el_sizes = {}			
			this.requestTick();
		},

		updatePadding: function(){

			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}

			var padding = model_data.image_padding;

			var thumbs = this.el.querySelectorAll('.gallery_card');

			this.el.setAttribute('image-gallery-pad',model_data.image_padding);
			this.el.setAttribute('image-gallery-gutter',model_data.image_padding * 2);			

			if ( thumbs.length == 0){
				return
			}

			for (var k = 0; k <thumbs.length; k++){
				thumbs[k].setAttribute('image-gallery-pad', padding)
			}
			this.padding_calculated = false;
		},

		updateThumbSize: function(){

			var cachedMeta = Object.assign({}, this.image_meta);
			this.calcRowHeights();

			// if we've already rendered everything, we update layout instead of rerendering
			var thumbs = this.el.querySelectorAll('.gallery_card');
			if ( thumbs.length == 0){
				return
			}


			for ( var j = 0; j < thumbs.length; j++){

				var thumb = thumbs[j]
				if (
					!this.padding_calculated
					|| !cachedMeta[j]
					|| cachedMeta[j][0] !== this.image_meta[j][0]
					|| cachedMeta[j][1] !== this.image_meta[j][1]
				){
					thumb.style.width = this.image_meta[j][0] + "%"
					thumb.dataset.width = this.image_meta[j][0]
					thumb.dataset.row = this.image_meta[j][1]
				}
			}

			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}

			var padding = model_data.image_padding;

			var baseSize = baseUnit.cache.size;
			var baseWidth = baseUnit.cache.window.w;

			var cachedPadding = Cargo.Core.ImageGallery.getCachedPaddingSize(baseSize, padding);
			var pad_size = 0;
			var elWidth = 0;

			if ( cachedPadding && padding > 0){

				pad_size = cachedPadding;

			} else if ( padding > 0 ){

				var measure_div_container = document.createElement('DIV');

				measure_div_container.style.cssText = 'position: fixed; top: -999px; left: -9999px; width: 0;'

				if (model_data.responsive && this.mobile_active ) {
					measure_div_container.setAttribute('responsive-layout','')
				}
				for (var j = 0; j < 10; j++){
					var measure_div = document.createElement('DIV')
					measure_div.setAttribute('image-gallery-pad', padding)
					measure_div_container.appendChild(measure_div)
				}

				this.el.appendChild(measure_div_container)
				pad_size = measure_div_container.offsetHeight / 10;
				this.el.removeChild(measure_div_container);

				if ( pad_size !== 0){
					Cargo.Core.ImageGallery.setCachedPaddingSize(baseSize, pad_size, padding);
				}

			}


			if ( this.cached_el_sizes.hasOwnProperty(baseWidth) ){

				elWidth = this.cached_el_sizes[baseWidth];

			} else {

				var measurement_wrapper = document.createElement('DIV')
					measurement_wrapper.setAttribute('image-gallery-pad', model_data.image_padding)
					measurement_wrapper.style.boxSizing = "border-box"
					measurement_wrapper.style.width = "100%"
					measurement_wrapper.style.height = "10px"

				var measurement_inner = document.createElement('DIV')
					measurement_inner.style.width = "100%"
					measurement_inner.style.boxSizing = "border-box"
					measurement_inner.style.height = "10px"
					measurement_inner.className = "measure_inner"

				measurement_wrapper.appendChild(measurement_inner)

				this.el.appendChild(measurement_wrapper)
				elWidth = measurement_inner.getBoundingClientRect().width

				this.el.removeChild(measurement_wrapper);

				if ( elWidth > 0 ){

					this.cached_el_sizes[baseWidth] = elWidth;
				}

			}

			var pad_percent = (pad_size)/(elWidth+pad_size);
			var last_row = parseInt(thumbs[thumbs.length-1].dataset.row);

			var counter = 0;
			for ( var i = 1; i <= last_row; i++){
				var thumb_row = this.el.querySelectorAll('[data-row="'+i+'"]')
				var percent_reduction = ((elWidth+pad_size) - (pad_percent*thumb_row.length)*(elWidth+pad_size))/(elWidth+pad_size);

				var pxH;
				for (var j = 0; j<thumb_row.length; j++){

					var base_width = parseFloat(this.image_meta[counter][0]);
					var new_width = Math.max(base_width * percent_reduction, 0);

					thumb_row[j].style.width = (new_width+(pad_percent*100)) + '%';

					var w = parseInt(this.images[counter].width);
					var h = parseInt(this.images[counter].height);
					var ratio = w/h;
					var pxW = Math.floor((new_width*.01)*(elWidth+pad_size)+pad_size)

					counter = counter+1;

					// has issues inside of display:inline-block elements
					// some various other sizing scenarios — possibly
					// if ( j == 0){
					// 	pxH = (1/ratio)*(pxW-pad_size);
					// }

					// thumb_row[j].children[0].children[0].style.height = pxH+'px';
					// thumb_row[j].children[0].style.paddingBottom = ''
					// thumb_row[j].children[0].style.height = pxH+'px';

				}

			}

			this.padding_calculated = true;

		},

	})


});
