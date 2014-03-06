(function() {

L.Control.FullScreen = L.Control.extend({
	options: {
		position: 'topleft',
		title: 'Full Screen',
		forceSeparateButton: false
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoom-fullscreen', buttonContainer;

		// Do nothing if we can't
		if (!fullScreenApi.supportsFullScreen) {
			return map.zoomControl ? map.zoomControl._container : L.DomUtil.create('div', '');
		}

		if (map.zoomControl && !this.options.forceSeparateButton) {
			buttonContainer = map.zoomControl._container;
		} else {
			buttonContainer = L.DomUtil.create('div', 'leaflet-bar');
		}

		this._map = map;
		this._createButton(this.options.title, className, buttonContainer, this.options.container || null, this.toogleFullScreen, this, map);

		return buttonContainer;
	},

	_createButton: function (title, className, buttonContainer, fullscreenContainer, fn, fsContext, mapContext) {
		var link = L.DomUtil.create('a', className, buttonContainer);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, fsContext);

		var fullscreenElContainer = fullscreenContainer || buttonContainer;
		L.DomEvent
			.addListener(fullscreenElContainer, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.addListener(fullscreenElContainer, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.addListener(fullscreenElContainer, fullScreenApi.fullScreenEventName, this._handleEscKey, fsContext);

		L.DomEvent
			.addListener(document, fullScreenApi.fullScreenEventName, L.DomEvent.stopPropagation)
			.addListener(document, fullScreenApi.fullScreenEventName, L.DomEvent.preventDefault)
			.addListener(document, fullScreenApi.fullScreenEventName, this._handleEscKey, fsContext);

		return link;
	},

	toogleFullScreen: function () {
		this._exitFired = false;
		if (fullScreenApi.supportsFullScreen) {
			var container = this.options.container || this._container;
			if (fullScreenApi.isFullScreen(container)) {
				fullScreenApi.cancelFullScreen(container);
				this._map.invalidateSize();
				this._map.fire('exitFullscreen');
				L.DomUtil.removeClass(container, "fullscreen");
				this._exitFired = true;
			} else {
				fullScreenApi.requestFullScreen(container);
				this._map.invalidateSize();
				this._map.fire('enterFullscreen');
				L.DomUtil.addClass(container, "fullscreen");
			}
		}
	},

	_handleEscKey: function () {
		if (!fullScreenApi.isFullScreen(this) && !this._exitFired) {
                    var container = this.options.container || this._container;
                    this._map.fire('exitFullscreen');
                    L.DomUtil.removeClass(container, "fullscreen");
			this._exitFired = true;
		}
	}
});

L.Map.addInitHook(function () {
	if (this.options.fullscreenControl) {
		this.fullscreenControl = L.control.fullscreen(this.options.fullscreenControlOptions);
		this.addControl(this.fullscreenControl);
	}
});

L.control.fullscreen = function (options) {
	return new L.Control.FullScreen(options);
};

/*
Native FullScreen JavaScript API
-------------
Assumes Mozilla naming conventions instead of W3C for now

source : http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/

*/

	var
		fullScreenApi = {
			supportsFullScreen: false,
			isFullScreen: function() { return false; },
			requestFullScreen: function() {},
			cancelFullScreen: function() {},
			fullScreenEventName: '',
			prefix: ''
		},
		browserPrefixes = 'webkit moz o ms khtml'.split(' ');

	// check for native support
	if (typeof document.exitFullscreen != 'undefined') {
		fullScreenApi.supportsFullScreen = true;
	} else {
		// check for fullscreen support by vendor prefix
		for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
			fullScreenApi.prefix = browserPrefixes[i];

			if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
                fullScreenApi.supportsFullScreen = true;

				break;
			}
		}
	}

    var ua = navigator.userAgent;
    if ((ua.indexOf('Safari') != -1) && ua.indexOf('Mac') != -1 && ua.indexOf('Chrome') == -1) {
        // it's Safari on Mac
        fullScreenApi.supportsFullScreen = false;
    }

	// update methods to do something useful
	if (fullScreenApi.supportsFullScreen) {
		fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';

		fullScreenApi.isFullScreen = function() {
			switch (this.prefix) {
				case '':
					return document.fullScreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		};
		fullScreenApi.requestFullScreen = function(el) {
			return (this.prefix === '') ? el.requestFullscreen() : el[this.prefix + 'RequestFullScreen'](Element.ALLOW_KEYBOARD_INPUT);
		};
		fullScreenApi.cancelFullScreen = function(el) {
			return (this.prefix === '') ? document.exitFullscreen() : document[this.prefix + 'CancelFullScreen']();
		};
	}

	// jQuery plugin
	if (typeof jQuery != 'undefined') {
		jQuery.fn.requestFullScreen = function() {

			return this.each(function() {
				var el = jQuery(this);
				if (fullScreenApi.supportsFullScreen) {
					fullScreenApi.requestFullScreen(el);
				}
			});
		};
	}

	// export api
	window.fullScreenApi = fullScreenApi;
})();
