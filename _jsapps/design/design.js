(function () {
	'use strict';

	// Instantiate libs for design.
    new MobileAdjustments();

    // baseUnit is intentionally included last so that MobileAdjustments has
    // the proper event listeners in place to immediately react when baseUnit inits
    // as to prevent layout flashing
	window.baseUnit = new BaseUnit();

/**
 * Element resizing 
 * 
 * 	(note: never run this in a ready callback, this needs to fire 
 * 	 before elementresizer inits.)
 */

Cargo.Event.on('element_resizer_init', function(plugin) {
    plugin.setOptions({
        cargo_refreshEvents: ['inline-editor-load-complete', 'inspector_preview', 'page_collection_reset', 'direct_link_loaded', 'mobile_padding_set'],
        generic_refreshEvents: [],
        updateEvents: ['resize', 'orientationchange'],
        forceVerticalMargin: 0,
        forceMobileImagesFullWidth: Cargo.Model.DisplayOptions.get('layout_options').mobile_images_full_width,
        adjustElementsToWindowHeight: Cargo.Model.DisplayOptions.get('layout_options').limit_vertical_images,
        scrollTransitionThreshold: -100,
        scrollTransition: Cargo.Model.DisplayOptions.get('layout_options').scroll_transition
    });
});

})();
