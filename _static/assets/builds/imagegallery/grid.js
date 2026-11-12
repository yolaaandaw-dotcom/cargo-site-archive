define([
	__cargo_context__ === "staging" ? '/_jsapps/imagegallery/base.js' : '/_static/assets/builds/imagegallery/base.js'
],
function(
	GalleryBase
) {

	return GalleryBase.extend({

		name: 'Grid',
		parentView: null,
		mobile_active: false,

		/**
		 * Set attributes to el for layout options.
		 *
		 * @return {Object} attributes
		 */
		setElAttributes: function () {
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(Object.assign({},model_data), model_data.mobile_data);
			}

			this.$el.removeClass('slick')
			this.el.style.paddingBottom = ''
			this.$el.removeAttr('image-gallery-horizontal-align image-gallery-vertical-align image-gallery-pad image-gallery-gutter data-exploded image-gallery-row data-slideshow-in-transition');
			this.$el.attr({
				'image-gallery'	: this.name.toLowerCase(),
				'image-gallery-row'	: '',
				'image-gallery-pad'    : model_data.image_padding,
				'image-gallery-gutter'	: model_data.image_padding * 2,
				'style' : ''
			});
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

			if ( options.mobile_active){
				this.mobile_active = options.mobile_active
			}

			this.mobileToggle = this.mobileToggle.bind(this)
			Cargo.Event.on('BaseUnit:refresh', this.mobileToggle);

			return this;
		},

		mobileToggle: function(){

			var isMobileSize = Cargo.Helper.IsMobileWindowSize( document.documentElement.clientWidth )

			if ( !this.mobile_active && isMobileSize ){
				this.mobile_active = true;
				this.requestTick();

			} else if ( this.mobile_active && !isMobileSize ){
				this.mobile_active = false;
				this.requestTick();
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

		requestTick: function(){
			var _this = this;
			if ( !this.ticking ){
				window.requestAnimationFrame(function(){
					_this.handleUpdates(null, {changing: 'mobile_active'})
					_this.ticking = false;
				})
				this.ticking = true;

			}
		},

		destroy: function(){
			Cargo.Event.off('BaseUnit:refresh', this.mobileToggle);
		},

		remove: function(){

			Backbone.View.prototype.remove.apply(this, arguments);

		},

		/**
		 * Handle the changes to the model triggered from the admin panel
		 * @param  {Object} event
		 * @param  {Object} options sent from settings model, changing and value
		 */
		handleUpdates: function(galleryOptions, options){


			if (galleryOptions){
				this.galleryOptions = Object.assign({}, galleryOptions);
			}

			if ( !options){
				return
			}

			switch (options.changing) {

				case 'mobile_active':
					if ( this.galleryOptions.data.responsive ){
						this.updateColumns();
						this.updatePadding();
					}
					break;

				case 'responsive':
					if ( this.mobile_active){
						this.updateColumns();
						this.updatePadding();
					}
    				break;

				case 'thumbnail_mode':
					break;

				case 'metadata':
					break;
				case 'captions':

					this.render();

					break;		

				case 'columns':
				case 'responsive_columns':
					this.updateColumns();
					break;

				case 'image_padding':
				case 'responsive_image_padding':
					this.updatePadding();
					break;

				default:
				    break;
			}

		},

		/**
		 * @return {Object} this
		 */
		render: function () {
			var _this = this;
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(Object.assign({},model_data), model_data.mobile_data);
			}
			// set defaults for galleries that havent gotten updated settings
			if ( !model_data.hasOwnProperty('captions') ){
				model_data.captions = true;
			}
			var fragment = document.createDocumentFragment();


			var images = _.sortBy(this.parentView.images, 'index');

			_.each( images, function(imageObject, index) {

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

					interiorImage.setAttribute('data-elementresizer-no-resize' , '');
					interiorImage.setAttribute('data-elementresizer-no-centering' , '');
					interiorImage.setAttribute('data-elementresizer-no-vertical-resize', '');
					interiorImage.removeAttribute('data-icon-mode');

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
				thumb.setAttribute('image-gallery-col' , 'x' + model_data.column_size);
				thumb.setAttribute('image-gallery-pad' , model_data.image_padding);
				thumb.setAttribute('data-gallery-item-id' , index);
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

				if ( imageObject.caption && model_data.captions){
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

			this.setElAttributes();
			this.el.classList.add('initialized');

			Cargo.Plugins.elementResizer.requestRefreshTick();
			Cargo.Event.trigger('image_gallery_rendered', this);
			return this;
		},

		updatePadding: function(){

			var model_data = Object.assign({}, this.galleryOptions.data);

			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(Object.assign({},model_data), model_data.mobile_data);
			}

			var thumbs = this.el.querySelectorAll('.gallery_card')

			for (var i = 0; i< thumbs.length; i++){
				thumbs[i].setAttribute('image-gallery-pad', model_data.image_padding)
			}

			this.el.setAttribute('image-gallery-pad', model_data.image_padding)
			this.el.setAttribute('image-gallery-gutter', model_data.image_padding * 2)

			Cargo.Plugins.elementResizer.requestTick();

		},

		updateColumns: function(){

			var model_data = Object.assign({}, this.galleryOptions.data);

			
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(Object.assign({},model_data), model_data.mobile_data);
			}

			var thumbs = this.el.querySelectorAll('.gallery_card')

			for (var i = 0; i< thumbs.length; i++){
				thumbs[i].setAttribute('image-gallery-col', 'x'+model_data.column_size)
			}

			Cargo.Plugins.elementResizer.requestTick();

		},


	})


});
