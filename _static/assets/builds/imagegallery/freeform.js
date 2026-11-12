define([
	__cargo_context__ === "staging" ? '/_jsapps/imagegallery/base.js' : '/_static/assets/builds/imagegallery/base.js'
],
function(
	GalleryBase
) {

	return GalleryBase.extend({

		name: 'Freeform',
		parentView: null,

		// allows images to be resized inside the Cargo editor
		allowsResize: true,

		/**
		 * Set attributes to el for layout options.
		 *
		 * @return {Object} attributes
		 */
		setElAttributes: function () {
			var model_data = Object.assign({}, this.galleryOptions.data);
			if ( this.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}
			this.$el.removeClass('slick')
			this.$el.removeAttr('image-gallery-horizontal-align image-gallery-vertical-align image-gallery-pad image-gallery-gutter data-exploded image-gallery-row data-slideshow-in-transition');
			this.$el.attr({
				'image-gallery': this.name.toLowerCase(),
				'image-gallery-row'   : '',
				'image-gallery-pad'   : model_data.image_padding,
				'image-gallery-gutter': model_data.image_padding *2,
				'image-gallery-vertical-align': model_data.image_vertical_align,
				'image-gallery-horizontal-align': model_data.image_horizontal_align,
				'style' :''
			});

		},

		setVerticalAlignment: function(){
			this.el.setAttribute('image-gallery-vertical-align', this.galleryOptions.data.image_vertical_align)
		},
		setHorizontalAlignment: function(){
			this.el.setAttribute('image-gallery-horizontal-align', this.galleryOptions.data.image_horizontal_align)
		},

		/**
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
				this.galleryOptions = Object.assign({}, options.galleryOptions);
			}


			return this;
		},

		destroy: function() {


		},


		interactive: false,


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

		resizeImage: function(targetImage, scale){

			// bring focus to gallery element right away
			this.parentView.enableEditable();

			scale = Math.min(Math.max(1, scale), 100);

			var target_thumb = $(targetImage).closest('[data-gallery-item-id]')
			var meta_target = $(targetImage).closest('.gallery_card').find('[data-meta]');

			if ( meta_target.length == 0 || target_thumb.length == 0) { return }

			var card_pad_width = target_thumb.get(0).hasAttribute('image-gallery-pad') ? target_thumb.outerWidth() - target_thumb.width(): 0;
			var px_value_of_percent = scale*.01 * (this.$el.width()-card_pad_width);

			var real_px_width = px_value_of_percent + card_pad_width;
			var real_percent_width = real_px_width / this.$el.width()

			scale = Math.min(Math.max(5, real_percent_width*100), 100);

			targetImage.removeAttribute('data-scale')

			var current_meta_data = Cargo.Core.ImageGallery.parseGalleryOptions( meta_target.attr('data-meta') );

			current_meta_data.freeform = {
				width: scale
			}

			meta_target.attr({
				'data-meta': JSON.stringify(current_meta_data),
			});

			target_thumb.css({
				width: scale+'%'
			})

			var id = target_thumb.attr("data-gallery-item-id")

			var meta_data = Object.assign({}, this.galleryOptions.data.meta_data)
			meta_data[id] = {width: scale};

			this.galleryOptions.data.meta_data = Object.assign({}, meta_data);

			if ( this.parentView.options && this.parentView.options.data ){
				this.parentView.options.data.meta_data = Object.assign({}, meta_data);
				this.parentView.updateOptions(this.parentView.options, true)
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

			var positioningRect = this.el.getBoundingClientRect();
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

				// now to figure out where it gets indicated
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

				// now to figure out where it gets indicated
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

			var meta_data = {};

			if (dragged && dragged.hasAttribute('data-meta')  ){

				meta_data = Cargo.Core.ImageGallery.parseGalleryOptions(dragged.getAttribute('data-meta'));

			}

			this.parentView.insertionPoint = targetNext

		},

		resetIndication: function(){

			this.parentView.insertionPoint = 0;
			this.parentView.meta_data_cache = null;

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

		/**
		* Randomize thumbnail size. Triggered from settings view
		**/
		random_index: 0,

		randomizeThumbSize: function(){
			var model_data = Object.assign({}, this.galleryOptions.data);

			var base_sizes = [
				[50,50],
				[66.6, 33.33, 33.33, 66.6],
				[25,50,25, 50, 50],
				[25, 75, 50, 75, 25, 50]
			];

			if ( this.random_index == 4 ){

				for(var i in this.parentView.images){
					var width = Math.floor(Math.random()*30 + 30);
					// var current_meta_data = Cargo.Core.ImageGallery.parseGalleryOptions(thumbs[i].getAttribute('data-meta'));
					// thumbs[i].style.width = width + "%";
					this.parentView.images[i].meta.freeform = {width: width}
				}

			} else {

				var index = 0;
				var sizeArray = base_sizes[this.random_index];


				for(var i in this.parentView.images){
					var width = sizeArray[index%sizeArray.length];
					// var current_meta_data = Cargo.Core.ImageGallery.parseGalleryOptions(thumbs[i].getAttribute('data-meta'));

					this.parentView.images[i].meta.freeform = {width: width}
					// thumbs[i].style.width = width + "%";
					// current_meta_data.width = width;
					// thumbs[i].setAttribute('data-meta', JSON.stringify(current_meta_data) );
					index++;
				}
			}

			// this.galleryOptions.data = model_data
			// delete model_data.meta_data['undefined']
			// this.handleUpdates(null, {changing: 'thumbnail_size'})
			this.parentView.updateOptions(this.galleryOptions, true);

			this.random_index = (this.random_index+1) % (base_sizes.length+1);
			this.render();
			// this.updateElementResizer()
		},

		updatePadding: function(){

			var model_data = Object.assign({}, this.galleryOptions.data);

			if ( this.galleryOptions.mobile_active && model_data.responsive){
				model_data = _.extend(model_data, model_data.mobile_data);
			}

			var thumbs = this.el.querySelectorAll('.gallery_card')

			for (var i = 0; i< thumbs.length; i++){
				thumbs[i].setAttribute('image-gallery-pad', model_data.image_padding)
			}

			this.el.setAttribute('image-gallery-pad', model_data.image_padding)
			this.el.setAttribute('image-gallery-gutter', model_data.image_padding * 2)

			this.updateElementResizer()

		},

		updateElementResizer: _.debounce(function(){
			Cargo.Plugins.elementResizer.update()
		}, 200),

		/**
		 * Handle the changes to the model triggered from the admin panel
		 * @param  {Object} galleryOptions new options object from imagegallery.js
		 * @param  {Object} options what value is changing inside view
		 */
		handleUpdates: function(galleryOptions, options){

			if ( galleryOptions ){
				this.galleryOptions = Object.assign({}, galleryOptions)
			}

			if ( !options){
				return
			}

			var model_data = Object.assign({}, this.galleryOptions.data);

			switch (options.changing) {

				case 'mobile_active':
					if ( model_data.responsive ){
						this.render();
					}
					break;
					
				case 'captions':

					this.render();

					break;		

				case 'responsive':
					if ( this.galleryOptions.mobile_active){
						this.render();
					}
    				break;

				case 'image_padding':
					this.updatePadding();
    				break;

				case 'randomize':
					this.randomizeThumbSize();
					break;

				case 'image_alignment':
					this.setVerticalAlignment();
					this.setHorizontalAlignment();
					break;

				case 'thumbnail_size':
				case 'gallery_changed':

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
			this.setElAttributes();
			this.images = _.sortBy(this.parentView.images, 'index');

			var model_data = Object.assign({}, this.galleryOptions.data);
			// set defaults for galleries that havent gotten updated settings
			if ( !model_data.hasOwnProperty('captions') ){
				model_data.captions = true;
			}			
			var increment = 0;

			// fill in incomplete data
			_.each(this.images, function(image, index){

				// set up default meta data
				if ( !_.property(index)(model_data.meta_data)  ){

					var width = increment%2 == 0 ? 66.666 : 33.33;
					increment++;
					meta_data = {
						width: width
					}

				} else {
					meta_data = model_data.meta_data[index];
				}

				if ( image.meta.hasOwnProperty('freeform') ){
					model_data.meta_data[index] = _.defaults(image.meta.freeform, meta_data);
				} else {
					model_data.meta_data[index] = meta_data
				}


			});

			// clean up meta data for images that do not exist
			for(var i in model_data.meta_data ){

				// clean up metadata
				if ( !this.images[i] ){
					delete model_data.meta_data[i]
				}

			}


			this.galleryOptions.data = Object.assign({}, model_data);

			// keep the gallery options local to the view
			if ( this.parentView.options && this.parentView.options.data ){
				// this used to call parentView.updateOptions on the galleryoptions but we want to retain the local 'responsive' value;
				this.parentView.options.data.meta_data = Object.assign({}, model_data.meta_data);
				this.parentView.updateOptions(this.parentView.options, true)
			}

			this.el.innerHTML = ''


			_.each( this.images, function(imageObject, index) {

				var image = _this.createItem(imageObject);

				image.setAttribute('data-gallery-item', '')

				// this step realigns serialized order with render order
				image.setAttribute('data-gallery-item-index', index);

				var interiorImages = image.querySelectorAll('img[width][height], iframe[width][height], video[width][height]')
				var caption = document.createElement('DIV')
				var hasCaption = false
				var isLink = false

				caption.className = 'gallery_image_caption'

				_.each(interiorImages, function(interiorImage){

					if (interiorImage.hasAttribute('data-caption')){
						caption.innerHTML = interiorImage.getAttribute('data-caption')
						hasCaption = true
					}

					if ( interiorImage.hasAttribute('data-elementresizer-child') ){
						return
					}

					$(interiorImage).attr({
						'data-elementresizer-no-resize' : '',
						'data-elementresizer-no-centering' : '',
						'data-elementresizer-no-vertical-resize': ''
					})

					interiorImage.removeAttribute('data-icon-mode')					

					interiorImage.style.width = ''
					interiorImage.style.height = ''
				});
				if ( image.hasAttribute('width') && image.hasAttribute('height') && !image.hasAttribute('data-elementresizer-child') ){
					$(image).attr({
						'data-elementresizer-no-resize' : '',
						'data-elementresizer-no-centering' : '',
						'data-elementresizer-no-vertical-resize': ''
					})

					image.removeAttribute('data-icon-mode')					

					image.style.width = ''
					image.style.height = ''
				}

				var ratio = image.getAttribute('height')/image.getAttribute('width')

				var thumb,
					ratio;

				if ( image.tagName === 'A' && interiorImages.length == 1 ){
					isLink = true
					thumb = image;
					ratio = interiorImages[0].getAttribute('height')/ interiorImages[0].getAttribute('width');

				} else {

					ratio = image.getAttribute('height')/image.getAttribute('width')
					thumb = document.createElement('DIV')
				};

				if ( imageObject.type == 'video'){
					thumb.setAttribute('draggable', true)
				}

				var setRotation = false;
				if ( !isNaN(imageObject.rotation) && imageObject.rotation !== 0 && imageObject.rotation!== 360 ){
					setRotation = true;
				}
				if ( imageObject.draggable){
					thumb.setAttribute('data-draggable', '')
				}

				$(thumb).attr({
					'class' : 'gallery_card',
					'image-gallery-col' : '',
					'image-gallery-pad' : model_data.image_padding,
					'data-gallery-item-id': index
				}).css({
					'transform': setRotation ? 'rotate('+imageObject.rotation+'deg)' : '',
					'width': model_data.meta_data[index].width + '%'
				})
				if ( imageObject.activeClass){
					image.classList.add('active')
				}
				var thumb_inner = document.createElement('DIV');

				if ( isLink ){

					$(interiorImages[0]).css({
						'width' : '',
						'height' : '',
						'margin' : ''
					}).removeAttr('data-scale');
					interiorImages[0].setAttribute('data-meta', JSON.stringify({
						'freeform':model_data.meta_data[index]
					}) )

					thumb_inner.appendChild(interiorImages[0])

				} else {

					$(image).css({
						'width' : '',
						'height' : '',
						'margin' : ''
					}).removeAttr('data-scale');

					image.setAttribute('data-meta', JSON.stringify({
						'freeform':model_data.meta_data[index]
					}) )
					thumb_inner.appendChild(image)
				}

				$(thumb_inner).attr({
					'class': 'gallery_card_image',
					'data-elementresizer-no-resize' : '',
					'data-elementresizer-no-centering' : '',
					'style': 'height: 0px; padding-bottom: ' + (ratio*100) + '%'
				})

				thumb.appendChild(thumb_inner)

				if ( isLink) {

					if ( interiorImages[0].hasAttribute('data-caption') ){

						caption.innerHTML = interiorImages[0].getAttribute('data-caption');
						hasCaption = true;

					}

				} else {

					if ( image.hasAttribute('data-caption') ){

						caption.innerHTML = image.getAttribute('data-caption');
						hasCaption = true;

					}

				}

				if ( hasCaption && model_data.captions){

					thumb.appendChild(caption);
					thumb.className += ' has_caption'
				}

				_this.el.appendChild(thumb)
			});

			// re-serialize because we probably shuffled around a lot of data
			if (Cargo.Helper.IsAdminEdit() ){
				this.parentView.images = this.serialize();
			}
			this.$el.find('.below-viewport').css('transition', 'initial').removeClass('below-viewport').css('transition', '')
			this.$el.addClass('initialized');

			// scrollMonitor.recalculateLocations()
			Cargo.Plugins.elementResizer.refresh();

			Cargo.Event.trigger('image_gallery_rendered', this);

			return this;
		}

	})


});
