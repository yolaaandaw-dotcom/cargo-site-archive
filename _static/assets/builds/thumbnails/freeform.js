define([

],
function(

) {
	return Backbone.View.extend({

		name: 'Freeform',
		parentView: null,

		/**
		 * Set attributes to el for layout options.
		 *
		 * @return {Object} attributes
		 */
		attributes: function () {
			var model_data = this.model.get('data')

			var attributes = {
				'thumbnails': this.name.toLowerCase(),
				'grid-row'   : '',
				'thumbnails-pad'   : '',
				'thumbnails-gutter': '',
				'data-elementresizer': '',

				'thumbnail-vertical-align': model_data.thumb_vertical_align,
				'thumbnail-horizontal-align': model_data.thumb_horizontal_align

			};

			if (model_data.responsive) {
				attributes['grid-responsive'] = '';
			}

			return attributes;
		},

		setVerticalAlignment: function(){
			this.el.setAttribute('thumbnail-vertical-align', this.model.get('data').thumb_vertical_align)
		},
		setHorizontalAlignment: function(){
			this.el.setAttribute('thumbnail-horizontal-align', this.model.get('data').thumb_horizontal_align)
		},		

		/**
		 * Bind event listeners.
		 *
		 * @return {Object} this
		 */
		initialize: function (options) {
			
			// Register any handlebar helpers used by this template
			this.registerHandlebarHelpers();

			if(options && options.parentView) {
				this.parentView = options.parentView;
			}

			// this.collection = page collection. Render on change
            this.listenTo(this.collection, 'sync', function(collection, response, options){

                if(options.from_pagination) {
                    this.render(response);
                } else {
                    this.render();
                }

            });

			// this.model = thumbnail settings. Render on change to dynamically update
			this.listenTo(this.model, 'change', this.handleUpdates);

			this.listenTo(this.collection, 'change', this.collectionChange);


			// Listener for when this view begins editing after it is first rendered
			// for a static way to check if we are editing use:
			// this.parentView.isEditing
			this.listenTo(this.parentView, 'is_editing', _.bind(this.toggleEvents, this));

			return this;
		},

		/**
		 * Fired when a collection has changed
		 * Check to see if there is thumb_meta data in the 
		 * attributes and if so, re-render
		 * @param  {Object} model The model that has changed
		 */
		collectionChange: function(model) {

			var allow_change = ['thumb_meta', 'title', 'tags'];
			var has_change = _.findKey(model.changedAttributes(), function(value, key, object){ return (_.indexOf(allow_change, key) >= 0); });
			
			// There was a change to the thumb data, run an update
			if(has_change !== undefined) {
				this.render();
			}
		},	

		interactive: false,
		dragged_thumb: false,
		post_drag: false,
		dragging: false,

		/**
		 * Fired when a the user enters or exits editing mode
		 * and when rendering
		 */
 		toggleEvents: function(){

			if ( this.parentView.isEditing ){
	 			// this.events = events
				this.delegateEvents(this.editor_events)

			} else {
	 			// this.events = {}
				this.undelegateEvents();
			}
		},	

		editor_events: {
			'mousedown .thumbnail': 'mousedown',
			'click .thumbnail a': 'click',
			'mousemove': 'mousemove',
			'mouseup': 'dragend',
			'mouseleave': 'dragend',
			'mouseenter .thumbnail': 'addResizeHandle',
			'mouseenter .resize-handle': 'makeResizable',
			'mouseleave .resize-handle': 'removeResizable',
			'mouseleave .thumbnail': 'removeResizeHandle',
		},

		makeResizable: function(event){
			this.can_resize = true
		},

		removeResizable: function(event){
			this.can_resize = false
		},

		addResizeHandle: function(event){

			if ( this.dragging || this.resizing ){ return}

			// don't allow resizing of default image
			var default_image = event.currentTarget.querySelector('.default_image')
			if ( default_image ){
				return
			}

			if ( $('.resize-handle', event.currentTarget).length > 0){
				return
			}

			event.currentTarget.dataset.canMove = ''				

			var handle = document.createElement("div");
			handle.className = 'resize-handle'
			handle.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 16 16" style="enable-background:new 0 0 16 16;" xml:space="preserve"><polygon class="resize_path_outline" points="14.99908,13.95654 14.78149,8.95294 14.68274,6.68225 13.07538,8.28918 11.91467,9.44965 6.55005,4.08533 7.71069,2.92468 9.31812,1.31726 7.04706,1.21851 2.04346,1.00092 0.95355,0.95355 1.00092,2.04346 1.21851,7.04706 1.31732,9.31812 2.92468,7.71069 4.17883,6.45654 9.5434,11.82117 8.28931,13.07526 6.68188,14.68268 8.95294,14.78143 13.95654,14.99902 15.04645,15.04645 "/><g><polygon class="resize_path" points="4.17883,5.04236 10.95764,11.82117 8.9964,13.78241 14,14 13.78241,8.9964 11.91461,10.86377 5.1358,4.08539 7.0036,2.21759 2,2 2.21759,7.0036 "/></g></svg>'

			event.currentTarget.querySelector('.thumb_image').appendChild(handle)
		},

		removeResizeHandle: function(event){

			if ( this.dragging || this.resizing ){ return}

			if (event){
				delete event.currentTarget.dataset.canMove 				
				event.currentTarget.className = "thumbnail"				
			}

			$('.resize-handle', this.$el).remove();

			var _this = this;
			setTimeout(function(){
				_this.mousemove(event)
			}, 400)

		},

		mousedown: function(event){
			var _this = this;

			event.preventDefault();

			var thumb = this.target_thumb = event.currentTarget;
			var model_data = this.model.get('data');

			this.mouse_down = true;
			this.thumb_changed = false;	

			this.mouseTimeout = window.setTimeout(function(){
				_this.thumb_changed = true
			}, 250)

			var event_pid = parseInt(thumb.getAttribute('data-id'));
			var page = this.collection.findWhere({'id': event_pid})
			var el_style = window.getComputedStyle(this.el)
			var paddings = parseFloat(el_style.paddingLeft) + parseFloat(el_style.paddingRight)
			var el_width = this.el.offsetWidth -paddings;

			var thumb_style = window.getComputedStyle(thumb)
			var thumb_paddings = parseFloat(thumb_style.paddingLeft) + parseFloat(thumb_style.paddingRight)


			thumb.dataset.start_width = thumb.offsetWidth;
			thumb.dataset.resize_width = thumb.dataset.start_width/el_width

			thumb.dataset.width = Math.max(thumb.offsetWidth, 1);
			thumb.dataset.height = Math.max(thumb.offsetHeight, 1);

			thumb.dataset.pos_x = thumb.offsetLeft;
			thumb.dataset.pos_y = thumb.offsetTop;

			// used for resizing
			thumb.dataset.start_x = event.clientX
			thumb.dataset.start_y = event.clientY

		},

		click: function(event){
			// simply stop propagation if editing

		
			if ( this.thumb_changed ){
				event.preventDefault();
				event.stopPropagation();
			}			

			// if ( this.parentView.isEditing ){

			// 	event.preventDefault();

			// 	if(!(typeof top.editor !== "undefined" && top.editor.editorInstance.inspectorOverlay.disabled === false)) {
			// 		event.stopPropagation();
			// 	} 

			// }
			
		},

		mousemove: function(event){


			var el_style = window.getComputedStyle(this.el)
			var paddings = parseFloat(el_style.paddingLeft) + parseFloat(el_style.paddingRight)
			var el_width = this.el.offsetWidth -paddings;


			if ( ((this.can_resize && this.mouse_down) || this.resizing) && !this.dragging ){
				this.resizing = true;				
			} else {
				return;
			}

			var model_data = this.model.get('data')
			var thumb = this.target_thumb;

			// make resizing happen
			if ( this.resizing ){

				this.thumb_changed = true;

				this.el.dataset.resizing = 'true'

				var min_size, resize_x, resize_y, total_resize, init_width, mouse_offset_y_px, mouse_offset_x_px;

				var thumb_image = thumb_ratio = thumb.querySelector('.thumb_image img')
				var thumb_ratio = thumb_image.getAttribute('width')/thumb_image.getAttribute('height')
				min_size = .05;
				resize_x = (event.clientX - parseFloat(thumb.dataset.start_x))/el_width
				resize_y = (event.clientY - parseFloat(thumb.dataset.start_y))/el_width

				var offset_x_px = parseFloat(thumb.dataset.pos_x)*.01 * el_width
				var offset_y_px = parseFloat(thumb.dataset.pos_y)*.01 * el_width

				if ( model_data.thumb_vertical_align =="middle" || model_data.thumb_vertical_align == "bottom"){

					mouse_offset_y_px = (event.clientY - parseFloat(thumb.dataset.start_y))*2 + parseFloat(thumb.dataset.height)

				} else {

					mouse_offset_y_px = (event.clientY - parseFloat(thumb.dataset.start_y)) + parseFloat(thumb.dataset.height)					

				}

				if ( model_data.thumb_horizontal_align =="middle" || model_data.thumb_horizontal_align == "right"){

					mouse_offset_x_px = (event.clientX - parseFloat(thumb.dataset.start_x))*2 + parseFloat(thumb.dataset.width)

				} else {

					mouse_offset_x_px = (event.clientX - parseFloat(thumb.dataset.start_x)) + parseFloat(thumb.dataset.width)

				}


				var off_percent_x = mouse_offset_x_px / parseFloat(thumb.dataset.width)
				var off_percent_y = mouse_offset_y_px / parseFloat(thumb.dataset.height)

				var y_px_motion = event.clientY - parseFloat(thumb.dataset.start_y)
				var y_percent_motion = y_px_motion/ el_width
				// total_resize = Math.max(resize_x,resize_y)
				// percentage
				// init_width = parseFloat(thumb.dataset.start_width);
				// thumb.dataset.resize_width = Math.max(total_resize + init_width, min_size);

				thumb.dataset.resize_width = Math.max(Math.max(off_percent_x, off_percent_y)*parseFloat(thumb.dataset.width)/el_width, min_size);
				thumb.style.width = parseFloat(thumb.dataset.resize_width)*100  + '%';

				var difference = parseFloat(thumb.dataset.start_width) - parseFloat(thumb.dataset.resize_width) * el_width;
				var difference_y = difference/thumb_ratio

				var difference_x_percent = (parseFloat(thumb.dataset.resize_width) + -parseFloat(thumb.dataset.start_width)/el_width )*-100

				if ( model_data.thumb_vertical_align =="middle" || model_data.thumb_vertical_align == "bottom"){

					thumb.style.marginTop = difference_y*.5 + 'px'
					thumb.style.marginBottom = difference_y*.5 + 'px'

				} else {
					thumb.style.marginBottom = difference_y + 'px'		
				}

				if ( model_data.thumb_horizontal_align =="middle" || model_data.thumb_horizontal_align == "right"){

					thumb.style.marginRight = difference_x_percent*.5 +'%';
					thumb.style.marginLeft = difference_x_percent*.5 +'%';

				} else {

					thumb.style.marginRight = difference_x_percent +'%';

				}

				thumb.style.zIndex = 99999;

			}

		},

		dragend: function(event){

			this.mouse_down = false;
			window.clearTimeout(this.mouseTimeout);

			// if there's no dragged thumb or if it wasnt resizing or dragging, return			
			if ( !this.target_thumb || (!this.resizing && !this.dragging) ){
				return;
			}

			var _this = this;
			var model_data = this.model.get('data');

			var thumb = this.target_thumb;
			var event_pid = parseInt(thumb.getAttribute('data-id'));
			var target_page = this.collection.findWhere({'id': event_pid})

			if ( this.resizing){

				this.el.removeAttribute('data-resizing')
				this.thumb_changed = true;

				var page_thumb_mid = target_page.get('thumb_meta') && target_page.get('thumb_meta').thumbnail_crop ? target_page.get('thumb_meta').thumbnail_crop.imageModel.id : target_page.get('id')
				var current_options;

				if ( model_data.meta_data[page_thumb_mid] ){
					current_options = model_data.meta_data[page_thumb_mid];
				} else {
					current_options = {
						width: 25
					}
				}

				current_options.width = parseFloat(thumb.dataset.resize_width)*100;

				this.setThumbMetaWidth(page_thumb_mid, current_options.width )
				model_data.meta_data[page_thumb_mid] = {
					width: current_options.width
				}
				thumb.style.zIndex = ''				
				thumb.style.marginRight = ''		
				thumb.style.marginBottom = ''				
				thumb.style.marginLeft = ''		
				thumb.style.marginTop = ''		

				this.model.set('data', model_data, {silent: true})
				this.handleUpdates(null, {changing: 'thumbnail_size'})
				
				Cargo.Plugins.elementResizer.update()				
			}

			this.can_resize = false;
			this.resizing = false;
			this.target_thumb = false;


			if ( event && $(event.target).closest('.thumbnail').length > 0){
				this.addResizeHandle(event)
			} else {
				this.removeResizeHandle();
			}

		},

		/**
		 * Sets the thumbnail width for this thumb
		 * Will call to the parent model and save there
		 * @param {Number} mid   Image id
		 * @param {Number} width Width
		 */
		setThumbMetaWidth: function(mid, width, options) {

			if ( this.parentView.isEditing ){

				try {
					var meta = {};
					meta[parseInt(mid)] = {
						width : width
					}
					this.model.setThumbMeta(meta, options);
				} catch(e){
					console.warn('Thumbnail settings not accessible')
				}	

			}					
		},

		/**
		* Randomize thumbnail size. Triggered from settings view
		**/
		random_index: 0,
		randomizeThumbSize: function(){

			var base_sizes = [15, 30, 40, 100];
			var thumbs = this.el.querySelectorAll('.thumbnail');

			if ( base_sizes[this.random_index] == 100 ){
				for (var i=0; i < thumbs.length; i++) {
					var width = Math.floor(Math.random()*45 + 15);
					thumbs[i].style.width = width + "%";

					var event_pid = parseInt(thumbs[i].getAttribute('data-id'));
					var page = this.collection.findWhere({'id': event_pid})			
					var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');					

					// Update the meta with this new width
					this.setThumbMetaWidth(mid, width);
				}	
			} else {
				for (var i=0; i < thumbs.length; i++) {
					var width = base_sizes[this.random_index] + Math.floor(Math.random()*15);
					thumbs[i].style.width = width + "%";


					var event_pid = parseInt(thumbs[i].getAttribute('data-id'));
					var page = this.collection.findWhere({'id': event_pid})			
					var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');	
					
					// Update the meta with this new width
					this.setThumbMetaWidth(mid, width);
				}				
			}
			this.random_index = (this.random_index+1) % base_sizes.length
			Cargo.Plugins.elementResizer.update()
		},		

		/**
		 * Handle the changes to the model triggered from the admin panel
		 * @param  {Object} event
		 * @param  {Object} options sent from settings model, changing and value
		 */		
		handleUpdates: function(event, options){
			if ( !options){
				return
			}

			if ( this.hidden ){
				return
			}

			var model_data = this.model.get('data');

			switch (options.changing) {

				case 'mobile_active':
					if ( model_data.responsive ){
						this.render();	
					}
					break;

				case 'responsive':
					if ( this.model.get('mobile_active')){
						this.render();	
					}
    				break;

				case 'thumbnail_mode':
					break;

				case 'thumbnail_align':
					this.setVerticalAlignment();
					this.setHorizontalAlignment();
					break;			

				case 'crop':
					this.render();
					break;

				case 'thumb_crop':
					this.render();
					break;					

				case 'show_tags':
					this.render();
					break;		

				case 'show_thumbs':
					if ( model_data.show_thumbs ){
						this.render();						
					}
					break;

				case 'show_title':
					this.render();
					break;	

				case 'show_excerpt':
					this.render();
					break;

				default:
				    break;
			}

		},

		/**
		* Update 'responsive' attribute on the thumbnail view element
		**/
		updateResponsive: function(){
			var model_data = this.model.get('data')

			if ( model_data.responsive ){
				this.el.setAttribute('grid-responsive', '')
			} else {
				this.el.removeAttribute('grid-responsive')
			}		

		},

		/**
		 * @return {Object} this
		 */
		render: function (response) {

			var _this = this;

			var model_data = this.model.get('data')

			var data = Cargo.API.GetDataPackage('Pages', this.collection.toJSON());

			if ( response ){

				var pages = _.filter(response, function(page, index){

					if ( data.Pages[index] ){
						if ( page.id !== data.Pages[index].id) {
							return true
						}						
					}

				});

				data.Pages = pages

				// if there are no pages, we do not render
				if ( pages.length == 0){
					return
				}

			}			

			// fill in incomplete data
			this.collection.each(function(page, index){
				// use pid for mid if mid is not available
				var mid = (page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop) ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');
				mid = parseInt(mid, 10);

				if ( !_.property(mid)(model_data.meta_data) ){
					console.log('setting default')
					_this.setThumbMetaWidth(mid, 50, {silent: true})
					model_data.meta_data[mid] = {
						width: 50
					}
				}
			});			

			// Load the template
			var template = Cargo.Template.Get(this.model.get('name'), this.model.getTemplatePath());

			data = _.extend(data, { 'settings' : model_data });

			var markup = Cargo.Core.Handlebars.Render(template, data);

			if ( response ){
				this.$el.append(markup)
			} else {
				this.$el.html(markup);				
			}
			
			Cargo.Plugins.elementResizer.refresh();
			this.toggleEvents()

			Cargo.Event.trigger('thumbnails_render_complete');
			
			return this;
		},

		hideThumbs: function(){
			this.el.style.display = "none"
		},

		showThumbs: function(){
			this.el.style.display = "";
		},		

		/**
		 * This will register any handlebar helpers we need
		 */
		registerHandlebarHelpers : function() {
			/**
			 * Helper to get the width for a single thumbnail
			 * based on image id
			 * @param  {Int} id Image id
			 */
			Handlebars.registerHelper ('getFreeformWidth', function (id, settings) {
				var item = settings.meta_data[id]
				// return (item) ? "width:" + item.width + "%" : "";
				return (item) ? "width:" + item.width + "%" : "width: 50%";
			});
		}
	})
	

});
