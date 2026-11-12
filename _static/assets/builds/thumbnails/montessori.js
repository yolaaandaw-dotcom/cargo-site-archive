define([

],
function(

) {
	return Backbone.View.extend({

		name: 'Montessori',
		parentView: null,

		interactive: false,
		target_thumb: false,
		can_drag: false,
		thumb_changed: false,
		dragging: false,
		mouse_down: false,

		/**
		 * Set attributes to el for layout options.
		 *
		 * @return {Object} attributes
		 */
		attributes: function () {
			var model_data = this.model.get('data')

			var attributes = {
				'thumbnails': this.name.toLowerCase(),
				'style': 'padding-bottom: ' + model_data.height +'%;',
				'data-elementresizer': ''

			};

			if (model_data.responsive) {
				attributes['grid-responsive'] = '';
			}

			return attributes;
		},

		/**
		 * Bind event listeners.
		 *
		 * @return {Object} this
		 */
		initialize: function (options) {
			if(options && options.parentView) {
				this.parentView = options.parentView;
			}

			// this.collection = page collection. Render on change
			this.updateScrollPositionCallback = this.updateScrollPosition.bind(this)
			this.scrollDownThrottled = _.throttle(this.scrollDown.bind(this), 15, {leading: false})
			this.scrollUpThrottled = _.throttle(this.scrollUp.bind(this), 15, {leading: false})

		    $(window).on("scroll", this.updateScrollPositionCallback);

			this.listenTo(this.collection, 'update', this.render);
			this.listenTo(this.collection, 'sync', this.render);


			// this.model = thumbnail settings. Render on change to dynamically update
			this.listenTo(this.model, 'change', this.handleUpdates);

			this.listenTo(this.collection, 'change', this.collectionChange);			

			// Register any handlebar helpers used by this template
			this.registerHandlebarHelpers();

			// Listener for when this view begins editing after it is first rendered
			// for a static way to check if we are editing use:
			// this.parentView.isEditing
			this.listenTo(this.parentView, 'is_editing', _.bind(this.toggleEvents, this));

			return this;
		},

		remove: function(){
			this.stopListening();
		    $(window).off("scroll", this.updateScrollPositionCallback);
			Backbone.View.prototype.remove.apply(this, arguments);
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
			'mouseenter .thumbnail': 'addResizeHandle',
			'mouseenter .resize-handle': 'makeResizable',
			'mouseleave .resize-handle': 'removeResizable',
			'mouseleave .thumbnail': 'removeResizeHandle',
			'mousemove': 'mousemove',
			'mouseup': 'dragend',
			'mouseleave': 'dragend'	
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

			event.currentTarget.dataset.canMove = ''				

			var handle = document.createElement("div");
			handle.className = 'resize-handle'
			handle.innerHTML = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 16 16" style="enable-background:new 0 0 16 16;" xml:space="preserve"><polygon class="resize_path_outline" points="14.99908,13.95654 14.78149,8.95294 14.68274,6.68225 13.07538,8.28918 11.91467,9.44965 6.55005,4.08533 7.71069,2.92468 9.31812,1.31726 7.04706,1.21851 2.04346,1.00092 0.95355,0.95355 1.00092,2.04346 1.21851,7.04706 1.31732,9.31812 2.92468,7.71069 4.17883,6.45654 9.5434,11.82117 8.28931,13.07526 6.68188,14.68268 8.95294,14.78143 13.95654,14.99902 15.04645,15.04645 "/><g><polygon class="resize_path" points="4.17883,5.04236 10.95764,11.82117 8.9964,13.78241 14,14 13.78241,8.9964 11.91461,10.86377 5.1358,4.08539 7.0036,2.21759 2,2 2.21759,7.0036 "/></g></svg>'
			// handle.innerHTML = '<svg x="0px" y="0px" viewBox="0 0 40 40" style="enable-background:new 0 0 40 40; width: 40px; height: 40px; top: 0; left: 0;" xml:space="preserve"><g><path class="resize_path" d="M10,10v20h20V10H10z M29,29H11V11h18V29z"></path><polygon class="resize_path" points="17.17883,18.04236 21.95764,22.82117 19.9964,24.78241 25,25 24.78241,19.9964 22.91461,21.86377 18.1358,17.08539 20.0036,15.21759 15,15 15.21759,20.0036"></polygon></g></svg>'

			event.currentTarget.querySelector('.thumb_image').appendChild(handle)
		},

		removeResizeHandle: function(event){

			if ( this.dragging || this.resizing ){ return}

			if (event){

				delete event.currentTarget.dataset.canMove 				
				event.currentTarget.className = "thumbnail"				
			}

			handles = this.el.querySelectorAll('.resize-handle')
			for (var i = 0; i <handles.length; i++){
				handles[i].remove()
			}

		},

		mousedown: function(event){
			var _this = this;
			event.preventDefault();

			var thumb = this.target_thumb = event.currentTarget;
			var model_data = this.model.get('data');
			this.mouseTimeout = window.setTimeout(function(){
				_this.thumb_changed = true
			}, 250)

			this.mouse_down = true;
			this.can_drag = true;
			this.thumb_changed = false;	

			var event_pid = parseInt(thumb.getAttribute('data-id'));
			var page = this.collection.findWhere({'id': event_pid})
			var el_width = this.el.firstElementChild.offsetWidth;
			var thumb_style = window.getComputedStyle(thumb)


			var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		


			thumb.dataset.start_width = parseFloat(window.getComputedStyle(thumb).width)/ el_width;
			thumb.dataset.resize_width = thumb.dataset.start_width

			thumb.dataset.width = Math.max(thumb.offsetWidth, 1);
			thumb.dataset.height = Math.max(thumb.offsetHeight, 1);


			var transform_string = thumb_style.transform;

			var x_pos = model_data.meta_data[mid].x;
			var y_pos = model_data.meta_data[mid].y;
			var z_pos = model_data.meta_data[mid].z;

			thumb.dataset.pos_x = x_pos;
			thumb.dataset.pos_y = y_pos;

			// used for resizing
			thumb.dataset.start_x = event.clientX
			thumb.dataset.start_y = event.clientY

			// used for dragging
			thumb.dataset.mouse_start_x = (event.clientX+window.pageXOffset) - (x_pos*.01)*el_width
			thumb.dataset.mouse_start_y = (event.clientY+window.pageYOffset) - (y_pos*.01)*el_width

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

			this.thumb_changed = false

			var el_width = this.el.firstElementChild.offsetWidth;


			if ( ((this.can_resize && this.mouse_down) || this.resizing) && !this.dragging ){
				this.resizing = true;				
			} else if ( ((this.mouse_down && this.can_drag ) || this.dragging) && !this.resizing)  {
				this.dragging = true;
			} else {
				return;
			}

			var model_data = this.model.get('data')
			var thumb = this.target_thumb;

			// make resizing happen
			if ( this.resizing ){
				this.el.dataset.resizing = 'true'

				var min_size, resize_x, resize_y, total_resize, init_width;
				var thumb_image = thumb_ratio = thumb.querySelector('.thumb_image img')
				var thumb_ratio = thumb_image.getAttribute('width')/thumb_image.getAttribute('height')
				min_size = .05;
				resize_x = (event.clientX - parseFloat(thumb.dataset.start_x))/el_width
				resize_y = (event.clientY - parseFloat(thumb.dataset.start_y))/el_width

				var offset_x_px = parseFloat(thumb.dataset.pos_x)*.01 * el_width
				var offset_y_px = parseFloat(thumb.dataset.pos_y)*.01 * el_width
				var mouse_offset_x_px = (event.clientX - parseFloat(thumb.dataset.start_x)) + parseFloat(thumb.dataset.width)
				var mouse_offset_y_px = (event.clientY - parseFloat(thumb.dataset.start_y)) + parseFloat(thumb.dataset.height)
				var off_percent_x = mouse_offset_x_px / parseFloat(thumb.dataset.width)
				var off_percent_y = mouse_offset_y_px / parseFloat(thumb.dataset.height)

				total_resize = Math.max(resize_x,resize_y)
				// percentage
				// init_width = parseFloat(thumb.dataset.start_width);
				// thumb.dataset.resize_width = Math.max(total_resize + init_width, min_size);

				thumb.dataset.resize_width = Math.max(Math.max(off_percent_x, off_percent_y)*parseFloat(thumb.dataset.width)/el_width, min_size);
				thumb.style.width = parseFloat(thumb.dataset.resize_width)*100  + '%';
				thumb.style.zIndex = 99999;

			// otherwise change location
			} else {
			

				this.in_lower_drag_zone = window.innerHeight -event.clientY < 40
				this.in_upper_drag_zone = event.clientY < 40

				if ( this.in_lower_drag_zone ){
					this.scrollDownThrottled()
				} else if ( this.in_upper_drag_zone ){
					this.scrollUpThrottled()
				}

				var move_x = (event.clientX+window.pageXOffset) - parseFloat(thumb.dataset.mouse_start_x)
				var move_y = (event.clientY+window.pageYOffset) - parseFloat(thumb.dataset.mouse_start_y)

				thumb.dataset.pos_x = (move_x/el_width)*100;
				thumb.dataset.pos_y = (move_y/el_width)*100;

				thumb.style.top = (move_y/el_width)*100 + '%'
				thumb.style.left = (move_x/el_width)*100 + '%'				
				thumb.style.zIndex = 99999

			}

		},

		scrollUp: function(){

			if ( !this.in_upper_drag_zone || !this.dragging ){
				return
			}

			var el_height = this.el.offsetHeight
			var increment = 20
			var scrollTop = $(window).scrollTop()
			var current_pos = parseFloat($(this.target_thumb).css('top'))

			if ( current_pos <= 0 ){
				this.in_upper_drag_zone = false;
				$(window).scrollTop(scrollTop-increment)
				return
			}

			$(window).scrollTop(scrollTop-increment)
			this.scrollUpThrottled()
		},		

		scrollDown: function(){

			if ( !this.in_lower_drag_zone || !this.dragging ){
				return
			}

			var el_height = this.el.offsetHeight
			var increment = 20
			var current_pos = parseFloat($(this.target_thumb).css('top'))
			var scrollTop = $(window).scrollTop()

			if ( current_pos + $(this.target_thumb).height() >=el_height ){
				this.in_lower_drag_zone = false;
				$(window).scrollTop(scrollTop+increment)
				return
			}

			$(window).scrollTop(scrollTop+increment)
			this.scrollDownThrottled()
		},

		scroll_position:0,

		updateScrollPosition: function(){
			var current_scroll = $(window).scrollTop()
			var scroll_delta = current_scroll - this.scroll_position

			this.scroll_position = current_scroll

			if ( !this.dragging || !this.target_thumb){
				return
			}


			var thumbImage = this.target_thumb.querySelector('img');

			if ( thumbImage._referenceScrollWatch !== undefined){
				thumbImage._referenceScrollWatch.recalculateLocation()	
				thumbImage._referenceScrollWatch.update()
				thumbImage._referenceScrollWatch.triggerCallbacks()					
			}

			if ( thumbImage._scrollWatcher !== undefined){
				thumbImage._scrollWatcher.recalculateLocation()	
				thumbImage._scrollWatcher.update()
				thumbImage._scrollWatcher.triggerCallbacks()					
			}		

			if ( thumbImage._scrollWatchEnterThreshold !== undefined){
				thumbImage._scrollWatchEnterThreshold.recalculateLocation()	
				thumbImage._scrollWatchEnterThreshold.update()
				thumbImage._scrollWatchEnterThreshold.triggerCallbacks()					
			}				

			var el_width = this.el.firstElementChild.offsetWidth
			var current_thumb_pos = parseFloat(this.target_thumb.style.top)
			this.target_thumb.dataset.pos_y = current_thumb_pos + (scroll_delta/el_width)*100

			this.target_thumb.style.top = current_thumb_pos + (scroll_delta/el_width)*100+'%'
		},

		dragend: function(event){

			this.mouse_down = false;

			// if there's no dragged thumb or if it wasnt resizing or dragging, return			
			if ( !this.target_thumb || (!this.resizing && !this.dragging) ){
				return;
			}

			var _this = this;
			var model_data = this.model.get('data');

			var thumb = this.target_thumb;
			var event_pid = parseInt(thumb.getAttribute('data-id'));
			var target_page = this.collection.findWhere({'id': event_pid})

			window.clearTimeout(this.mouseTimeout)

			if ( this.dragging ){

				// collect thumbnails into array sorted by z-index
				var pages_z_pid_pair = [];
				var lowest_y = 9e9

				this.collection.each(function(page, index){

					var page_thumb_mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		
					var pid = page.get('id')

					if ( pid == event_pid){
						pages_z_pid_pair.push({
							pid: pid,
							z: 9e9
						})
					} else {
						pages_z_pid_pair.push({
							pid: pid,
							z: model_data.meta_data[page_thumb_mid].z
						})				
					}

				});

				pages_z_pid_pair = _.sortBy(pages_z_pid_pair, 'z')

				// Then update options
				for (var index = 0; index < pages_z_pid_pair.length; index++){

					var page = this.collection.findWhere({'id': pages_z_pid_pair[index].pid});
					var page_thumb_mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		
			
					var current_options = model_data.meta_data[page_thumb_mid]

					if ( pages_z_pid_pair[index].pid == event_pid ){

						current_options.x = parseFloat(thumb.dataset.pos_x);
						current_options.y = parseFloat(thumb.dataset.pos_y);

						current_options.z = index;

					} else {

						current_options.z = index;		

					}

					lowest_y = Math.min(current_options.y, lowest_y)
					model_data.meta_data[page_thumb_mid] = {
						width: current_options.width,
						x: current_options.x,
						y: current_options.y,
						z: current_options.z
					}
					this.setThumbMetaData(page_thumb_mid, current_options.width, current_options.x, current_options.y, current_options.z)

				}

				if ( lowest_y != 0){

					this.collection.each(function(page, index){

						var page_thumb_mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		;
						// calc offset for thumbnails that is moved above threshold
						model_data.meta_data[page_thumb_mid].y = model_data.meta_data[page_thumb_mid].y - lowest_y
						_this.setThumbMetaData(page_thumb_mid, model_data.meta_data[page_thumb_mid].width, model_data.meta_data[page_thumb_mid].x, model_data.meta_data[page_thumb_mid].y, model_data.meta_data[page_thumb_mid].z)

					});	

				}

				// trigger handleUpdate manually since setting data object does not work
				this.model.set('data', model_data, {silent: true})
				this.handleUpdates(null, {changing: 'thumbnail_layout'});

				var thumbImage = this.target_thumb.querySelector('img');

				if ( thumbImage._referenceScrollWatch !== undefined){
					thumbImage._referenceScrollWatch.recalculateLocation()	
					thumbImage._referenceScrollWatch.update()
					thumbImage._referenceScrollWatch.triggerCallbacks()					
				}

				if ( thumbImage._scrollWatcher !== undefined){
					thumbImage._scrollWatcher.recalculateLocation()	
					thumbImage._scrollWatcher.update()
					thumbImage._scrollWatcher.triggerCallbacks()					
				}		

				if ( thumbImage._scrollWatchEnterThreshold !== undefined){
					thumbImage._scrollWatchEnterThreshold.recalculateLocation()	
					thumbImage._scrollWatchEnterThreshold.update()
					thumbImage._scrollWatchEnterThreshold.triggerCallbacks()					
				}						

			} else if ( this.resizing){

				this.el.removeAttribute('data-resizing')
				var page_thumb_mid = target_page.get('thumb_meta') && target_page.get('thumb_meta').thumbnail_crop ? target_page.get('thumb_meta').thumbnail_crop.imageModel.id : target_page.get('id');		
				var current_options;

				if ( model_data.meta_data[page_thumb_mid] ){
					current_options = model_data.meta_data[page_thumb_mid];
				} else {
					current_options = {
						width: 25,
						x: 0,
						y: 0,
						z: 0
					}
				}

				current_options.width = parseFloat(thumb.dataset.resize_width)*100;
				current_options.x = thumb.dataset.pos_x;
				current_options.y = thumb.dataset.pos_y;

				this.setThumbMetaData(page_thumb_mid, current_options.width, current_options.x, current_options.y, current_options.z)
				model_data.meta_data[page_thumb_mid] = {
					width: current_options.width,
					x: current_options.x,
					y: current_options.y,
					z: current_options.z
				}
				this.model.set('data', model_data, {silent: true})
				this.handleUpdates(null, {changing: 'index_size'})
				
				Cargo.Plugins.elementResizer.update()				

			}

			if ( this.dragging || this.resizing){
				this.thumb_changed = true;
			}

			this.can_drag = false;
			this.can_resize = false;
			this.dragging = false;
			this.resizing = false;
			this.target_thumb = false;
		},

		/**
		 * Sets the thumbnail width for this thumb
		 * Will call to the parent model and save there
		 * @param {Number} mid   Image id
		 * @param {Number} width Width
		 */

		setThumbMetaData: function(mid, width, x, y, z, options) {

			if ( this.parentView.isEditing ){

				try {

					var meta = {};
					meta[parseInt(mid)] = {
						width : width,
						x: x,
						y: y,
						z: z
					}
					this.model.setThumbMeta(meta, options);

				} catch(e){
					console.warn('Thumbnail settings not accessible')
				}	

			}
		},		

		random_index: 0,
		randomizeThumbSize: function(){
			var _this = this;
			var model_data = this.model.get('data')
			var base_sizes = [20, 30, 40, 50];
			this.random_index = this.random_index+1
			var random_size = base_sizes[this.random_index%base_sizes.length]
			var lowest_y = 9e9;

			this.collection.each(function(page, index){

				var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		

				var width = random_size
				var thumbs_per_row = Math.floor(100/random_size)
				var remainder = 100%(thumbs_per_row*width)

				var x_offset = ((index%(thumbs_per_row))/(thumbs_per_row-1))*remainder || 0
				var x_pos = (index%thumbs_per_row)*random_size +x_offset
				var y_pos = Math.floor(index/thumbs_per_row)*width*2


				// width = Math.max(Math.min(width+Math.random()*width, 100), 5)
				var random_tester = Math.random()

				if ( random_tester > .9){
					width = Math.min(width +20, 100)
				} else if ( random_tester > .66){
					width = width +10
				} else if ( random_tester > .33 ){
					width = width - 5
				}

				random_tester = Math.random()

				if ( random_tester > .66 && x_pos < (100-width)-5 ){
					x_pos = x_pos +5
				} else if ( random_tester > .33 && x_pos > 5 ){
					x_pos = x_pos - 5
				}

				if ( x_pos > (100-width)){
					x_pos = Math.floor(Math.random()*(100-width)*.2)*5
				}

				y_pos = y_pos + Math.floor(Math.random()*random_size*2*.2)*5
				lowest_y = Math.min(y_pos, lowest_y)

				var z_index = index+1;		

				model_data.meta_data[mid] = {
					width: width,
					x: x_pos,
					y: y_pos,
					z: z_index
				}

			});


			this.collection.each(function(page, index){

				var page_thumb_mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		
				// calc offset for thumbnails that is moved above threshold
				model_data.meta_data[page_thumb_mid].y = model_data.meta_data[page_thumb_mid].y - lowest_y
				_this.setThumbMetaData(page_thumb_mid, model_data.meta_data[page_thumb_mid].width, model_data.meta_data[page_thumb_mid].x, model_data.meta_data[page_thumb_mid].y, model_data.meta_data[page_thumb_mid].z)

			});				

			this.model.set('data', model_data, {silent: true})
			this.handleUpdates(null, {changing: 'thumbnail_layout'})
			this.updateWidths();
			Cargo.Plugins.elementResizer.update();
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

			var model_data = this.model.get('data')

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

				case 'thumbnail_layout':
					this.findIndexHeight();
					this.updatePositions();
					break;

				case 'index_size':
					this.findIndexHeight();
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
		render: function () {
			var _this = this;

			var model_data = _.clone(this.model.get('data') )

			// render temporary data if there isnt any
			var changed_data = false
			var change_index = 0
			this.collection.each(function(page, index){

				var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		

				if ( !_.property(mid)(model_data.meta_data) ){

					var x_pos = (change_index%4)*26.66
					var y_pos = Math.floor(index/4)*30
					var width = 20
					var z_index = index+1;				

					_this.setThumbMetaData(mid, width, x_pos, y_pos, z_index, {silent: true})
					model_data.meta_data[mid] = {
						width: width,
						x: x_pos,
						y: y_pos,
						z: z_index
					}

					change_index++;
					changed_data = true;

				}

			});

			if ( changed_data ){
				this.model.set('data', model_data)
			}

			// Load the template
			var template = Cargo.Template.Get(this.model.get('name'), this.model.getTemplatePath());

			var data  = Cargo.API.GetDataPackage('Pages', this.collection.toJSON());
			data = _.extend(data, { 'settings' : model_data });

			var markup = Cargo.Core.Handlebars.Render(template, data);
			this.$el.html(markup);
			this.rendered = true;
			this.findIndexHeight();

			Cargo.Plugins.elementResizer.refresh()
			this.toggleEvents()
			
			Cargo.Event.trigger('thumbnails_render_complete');

			return this;
		},

		updatePositions: function(){
			if ( !this.rendered ){
				return;
			}

			var _this = this;
			var thumbs = this.el.querySelectorAll('.thumbnail');
			var el_width = this.el.firstElementChild.offsetWidth;			
			var model_data = this.model.get('data')

			if ( thumbs.length == 0){
				return
			}

			this.collection.each(function(page, index){

				var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		
				var thumb = _this.el.querySelector('[data-mid="'+mid+'"]') ||_this.el.querySelector('[data-id="'+mid+'"]')

				if ( !thumb ){ return}

				thumb.style.left = parseFloat(model_data.meta_data[mid].x) + '%'
				thumb.style.top = parseFloat(model_data.meta_data[mid].y) + '%'

				// thumb.style.left = parseFloat(model_data.meta_data[mid].x) * el_width + 'px'
				// thumb.style.top = parseFloat(model_data.meta_data[mid].y) * el_width + 'px'
				thumb.style.zIndex = parseFloat(model_data.meta_data[mid].z)

			});

		},

		/**
		* Update 'width' property on all thumbs
		**/
		updateWidths: function(){

			if ( !this.rendered ){
				return;
			}

			var model_data = this.model.get('data')

			var thumbs = this.el.querySelectorAll('.thumbnail');

			if ( thumbs.length == 0){
				return
			}

			var _this = this;

			this.collection.each(function(page, index){
				var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		
				var thumb = _this.el.querySelector('[data-mid="'+mid+'"]') || _this.el.querySelector('[data-id="'+mid+'"]')
				if ( !thumb ){ return}

				thumb.style.width = parseFloat(model_data.meta_data[mid].width)+"%"			

			});			

		},

		/**
		* Find tallest thumb
		**/
		findIndexHeight: function(){

			if ( !this.rendered ){
				return;
			}

			var model_data = this.model.get('data')

			var thumbs = this.el.querySelectorAll('.thumbnail');

			if ( thumbs.length == 0){
				return
			}
			var _this = this;

			var max_y = 0;
			var lowest_thumb_mid = 0

			this.collection.each(function(page, index){

				var mid = page.get('thumb_meta') && page.get('thumb_meta').thumbnail_crop ? page.get('thumb_meta').thumbnail_crop.imageModel.id : page.get('id');		

				var scaled_thumb_width = model_data.meta_data[mid].width *.01
				var thumb_image_height = 1;
				var thumb_image_width = 1;

				if (model_data.meta_data.crop){

					if ( model_data.meta_data.thumb_crop == '16x9'){
						thumb_image_height = 16;
						thumb_image_width = 9;	
					} else if ( model_data.meta_data.thumb_crop == '4x3'){
						thumb_image_height = 4;
						thumb_image_width = 3;	
					} else {
						thumb_image_height = thumb_image_width = 1;		
					}

				} else {

					if ( _.isEmpty(page.get('thumb_meta')) || !page.get('thumb_meta').thumbnail_crop){
						thumb_image_width = thumb_image_height = 1;
					} else {
						thumb_image_width = page.get('thumb_meta').thumbnail_crop.imageModel.width							
						thumb_image_height = page.get('thumb_meta').thumbnail_crop.imageModel.height						
					}

				}

				var y_ratio = thumb_image_height/thumb_image_width
				var scaled_height = y_ratio * scaled_thumb_width*100

				var thumb_y = parseFloat(model_data.meta_data[mid].y)+scaled_height
				if ( thumb_y > max_y ){
					lowest_thumb_mid = mid
					max_y = thumb_y
				}

			});


			model_data.height = max_y

			this.model.set('data', model_data, {silent: true})

			if ( model_data.show_title || model_data.show_tags ){
				var height = 0;
				var measureThumb = $('[data-mid="'+lowest_thumb_mid+'"].thumbnail')


				if ( measureThumb ){

					if ( model_data.show_title ){
						var $title = $('.title', measureThumb);
						if ( $title.length > 0 ){
							var titleStyle = window.getComputedStyle($title[0]);
							var position = titleStyle.getPropertyValue('position');
							if ( position === 'static' || position === 'relative'){
								height+= $title.outerHeight(true)							
							}							
						}

					}

					if ( model_data.show_tags ){
						var $tags = $('.tags', measureThumb);
						if ($tags.length > 0){
							var tagsStyle = window.getComputedStyle($tags[0]);
							var position = tagsStyle.getPropertyValue('position');
							if ( position === 'static' || position === 'relative'){
								height+= $tags.outerHeight(true)							
							}							
						}

					}

				}
				this.el.style.paddingBottom  = 'calc(' + model_data.height + '% + '+height+'px)'

			} else {
				this.el.style.paddingBottom  = model_data.height + '%'							
			}

		},


		hideThumbs: function(){
			this.hidden = true;
			this.el.style.display = "none"
		},

		showThumbs: function(){
			this.hidden = false;
			this.el.style.display = "";
		},

		/**
		 * This will register any handlebar helpers we need
		 */
		registerHandlebarHelpers : function() {
			// /**
			//  * Helper to get the width for a single thumbnail
			//  * based on image id
			//  * @param  {Int} id Image id
			//  */
			Handlebars.registerHelper ('getMontessoriData', function (mid, settings, id) {

				// if no mid, then we track by id
				if ( !mid ){
					mid = id
				}

				if(_.has(settings.meta_data, mid)) {
					var item = settings.meta_data[mid];
					return (item) ? 'width: '+item.width + '%; top: '+item.y+'%; left: '+item.x+'%; z-index: '+item.z+';' :
					'width: 25%; top: '+index*5+'%; left: '+index*5+'%; z-index: '+index+1+';' ;
				} else {
					var x_pos = (index%4)*26.66
					var y_pos = Math.floor(index/4)*30
					var width = 20
					var z_index = index+1;				
					return 'width:'+width+'%; top: '+y_pos+'%; left: '+x_pos+'%; z-index: '+z_index+';'
				}

			});
		
		}		
	})
	

});
