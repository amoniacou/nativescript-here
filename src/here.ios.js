"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common = require("./here.common");
var here_common_1 = require("./here.common");
var utils_1 = require("tns-core-modules/utils/utils");
var types = require("tns-core-modules/utils/types");
var imageSrc = require("tns-core-modules/image-source");
var fs = require("tns-core-modules/file-system");
var icon_source_1 = require("./icon-source");
global.moduleMerge(common, exports);
var Here = (function (_super) {
    __extends(Here, _super);
    function Here() {
        var _this = _super.call(this) || this;
        _this.isReady = false;
        return _this;
    }
    Here.init = function (appId, appCode, licenseKey) {
        NMAApplicationContext.setAppIdAppCodeLicenseKey(appId, appCode, licenseKey);
    };
    Here.prototype.createNativeView = function () {
        this.nativeMarkers = new Map();
        this.markers = new Map();
        this.markersCallback = new Map();
        this.delegate = NMAMapViewDelegateImpl.initWithOwner(new WeakRef(this));
        this.gestureDelegate = NMAMapGestureDelegateImpl.initWithOwner(new WeakRef(this));
        var url = NSURL.URLWithString(icon_source_1.ios_icon);
        var data = NSData.dataWithContentsOfURL(url);
        this._defaultMarkerIcon = UIImage.imageWithData(data);
        console.dir('Before init');
        var initial = NMAMapView.alloc().initWithFrame(CGRectZero);
        console.dir('After init');
        return initial;
    };
    Here.prototype.initNativeView = function () {
        _super.prototype.initNativeView.call(this);
        var nativeView = this.nativeView;
        nativeView.delegate = this.delegate;
        nativeView.gestureDelegate = this.gestureDelegate;
        nativeView.setZoomLevelWithAnimation(this.zoomLevel, NMAMapAnimation.None);
        if (this.disableZoom) {
            nativeView.disableMapGestures(NMAMapGestureType.Pinch);
            nativeView.disableMapGestures(NMAMapGestureType.DoubleTap);
            nativeView.disableMapGestures(NMAMapGestureType.TwoFingerTap);
        }
        if (this.disableScroll) {
            nativeView.disableMapGestures(NMAMapGestureType.Pan);
        }
        switch (this.mapStyle) {
            case here_common_1.HereMapStyle.HYBRID_DAY:
                nativeView.mapScheme = NMAMapSchemeHybridDay;
                break;
            case here_common_1.HereMapStyle.SATELLITE_DAY:
                nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                break;
            case here_common_1.HereMapStyle.TERRAIN_DAY:
                nativeView.mapScheme = NMAMapSchemeTerrainDay;
                break;
            default:
                nativeView.mapScheme = NMAMapSchemeNormalDay;
                break;
        }
        nativeView.setGeoCenterWithAnimation(NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(this.latitude, this.longitude), NMAMapAnimation.None);
    };
    Here.prototype.disposeNativeView = function () {
        _super.prototype.disposeNativeView.call(this);
    };
    Here.prototype.onLoaded = function () {
        _super.prototype.onLoaded.call(this);
        this.isReady = true;
        this.notify({
            eventName: here_common_1.HereBase.mapReadyEvent,
            object: this,
            android: null,
            ios: this.nativeView
        });
    };
    Here.prototype.onMeasure = function (widthMeasureSpec, heightMeasureSpec) {
        var nativeView = this.nativeView;
        if (nativeView) {
            var width = utils_1.layout.getMeasureSpecSize(widthMeasureSpec);
            var height = utils_1.layout.getMeasureSpecSize(heightMeasureSpec);
            this.setMeasuredDimension(width, height);
        }
    };
    Here.prototype[here_common_1.zoomLevelProperty.setNative] = function (zoomLevel) {
        var nativeView = this.nativeView;
        if (this.isReady) {
            nativeView.setZoomLevelWithAnimation(+zoomLevel, NMAMapAnimation.Linear);
        }
    };
    Here.prototype[here_common_1.mapStyleProperty.setNative] = function (style) {
        var nativeView = this.nativeView;
        if (this.isReady) {
            switch (style) {
                case here_common_1.HereMapStyle.HYBRID_DAY:
                    nativeView.mapScheme = NMAMapSchemeHybridDay;
                    break;
                case here_common_1.HereMapStyle.SATELLITE_DAY:
                    nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                    break;
                case here_common_1.HereMapStyle.TERRAIN_DAY:
                    nativeView.mapScheme = NMAMapSchemeTerrainDay;
                    break;
                default:
                    nativeView.mapScheme = NMAMapSchemeNormalDay;
                    break;
            }
        }
    };
    Here.prototype[here_common_1.disableScrollProperty.setNative] = function (disable) {
        var nativeView = this.nativeView;
        if (this.isReady) {
            if (disable) {
                nativeView.disableMapGestures(NMAMapGestureType.Pan);
            }
            else {
                nativeView.enableMapGestures(NMAMapGestureType.Pan);
            }
        }
    };
    Here.prototype[here_common_1.disableZoomProperty.setNative] = function (disable) {
        var nativeView = this.nativeView;
        if (this.isReady) {
            if (disable) {
                nativeView.disableMapGestures(NMAMapGestureType.Pinch);
                nativeView.disableMapGestures(NMAMapGestureType.DoubleTap);
                nativeView.disableMapGestures(NMAMapGestureType.TwoFingerTap);
            }
            else {
                nativeView.enableMapGestures(NMAMapGestureType.Pinch);
                nativeView.enableMapGestures(NMAMapGestureType.DoubleTap);
                nativeView.enableMapGestures(NMAMapGestureType.TwoFingerTap);
            }
        }
    };
    Here.prototype._getMarkersCount = function () {
        return this.nativeMarkers ? this.nativeMarkers.size : 0;
    };
    Here.prototype._requestPremision = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.calculateRoute = function (points) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.showWay = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.startNavigation = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.stopNavigation = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.toNextWaypoint = function () {
    };
    Here.prototype.toPrevWaypoint = function () {
    };
    Here.prototype.setCenter = function (lat, lon, animated) {
        var _this = this;
        return new Promise(function (resolve) {
            if (_this.nativeView) {
                _this.nativeView.setGeoCenterWithAnimation(NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(lat, lon), animated ? NMAMapAnimation.Linear : NMAMapAnimation.None);
            }
            resolve();
        });
    };
    Here.prototype.createNavigation = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.addRoute = function (points) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    Here.prototype.addMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var map = _this.nativeView;
            var markerIcons = [];
            markers.forEach(function (marker) {
                if (marker.onTap && typeof marker.onTap === 'function') {
                    _this.markersCallback.set(marker.id, marker.onTap);
                }
                var nativeMarker = NMAMapMarker.alloc().initWithGeoCoordinates(NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude));
                if (marker.title) {
                    nativeMarker.title = marker.title;
                }
                if (marker.description) {
                    nativeMarker.textDescription = marker.description;
                }
                if (typeof marker.icon === 'string') {
                    if (marker.icon.startsWith('http')) {
                    }
                    else if (marker.icon.startsWith('res')) {
                        var src = imageSrc.fromResource(marker.icon);
                        var nativeImage = src ? src.ios : null;
                        if (nativeImage) {
                            nativeMarker.icon = nativeImage;
                        }
                    }
                    else if (marker.icon.startsWith('~/')) {
                        var path = fs.path.join(fs.knownFolders.currentApp().path, marker.icon.replace('~', ''));
                        var src = imageSrc.fromFileOrResource(path);
                        var nativeImage = src ? src.ios : null;
                        if (nativeImage) {
                            nativeMarker.icon = nativeImage;
                        }
                    }
                }
                else {
                    nativeMarker.icon = _this._defaultMarkerIcon;
                }
                nativeMarker.draggable = !!marker.draggable;
                _this.nativeMarkers.set(marker.id, nativeMarker);
                _this.markers.set(nativeMarker, marker);
                map.addMapObjects([nativeMarker]);
                if (!!marker.selected) {
                    nativeMarker.showInfoBubble();
                }
                else {
                    nativeMarker.hideInfoBubble();
                }
            });
            if (markerIcons.length > 0) {
                resolve();
            }
            else {
                resolve();
            }
        });
    };
    Here.prototype.removeMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var map = _this.nativeView;
            if (!markers) {
                map.removeMapObjects(Array.from(_this.nativeMarkers.values()));
                _this.markers.clear();
                _this.nativeMarkers.clear();
                _this.markersCallback.clear();
                resolve();
            }
            else {
                markers.forEach(function (id) {
                    var nativeMarker = _this.nativeMarkers.get(id);
                    if (nativeMarker) {
                        map.removeMapObject(nativeMarker);
                        _this.nativeMarkers.delete(id);
                        _this.markersCallback.delete(id);
                        _this.markers.delete(nativeMarker);
                    }
                });
                resolve();
            }
        });
    };
    Here.prototype.updateMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            markers.forEach(function (marker) {
                var nativeMarker = _this.nativeMarkers.get(marker.id);
                if (nativeMarker) {
                    nativeMarker.coordinates = NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude);
                    if (marker.title) {
                        nativeMarker.title = marker.title;
                    }
                    if (marker.description) {
                        nativeMarker.textDescription = marker.description;
                    }
                    if (types.isBoolean(marker.draggable)) {
                        nativeMarker.draggable = !!marker.draggable;
                    }
                    if (!!marker.selected) {
                        nativeMarker.showInfoBubble();
                    }
                    else {
                        nativeMarker.hideInfoBubble();
                    }
                    _this.nativeMarkers.set(marker.id, nativeMarker);
                    _this.markers.set(nativeMarker, marker);
                }
            });
            resolve();
        });
    };
    Here.prototype.updateMarker = function (marker) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var nativeMarker = _this.nativeMarkers.get(marker.id);
            if (nativeMarker) {
                nativeMarker.coordinates = NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude);
                if (marker.title) {
                    nativeMarker.title = marker.title;
                }
                if (marker.description) {
                    nativeMarker.textDescription = marker.description;
                }
                if (types.isBoolean(marker.draggable)) {
                    nativeMarker.draggable = !!marker.draggable;
                }
                if (!!marker.selected) {
                    nativeMarker.showInfoBubble();
                }
                else {
                    nativeMarker.hideInfoBubble();
                }
                _this.nativeMarkers.set(marker.id, nativeMarker);
                _this.markers.set(nativeMarker, marker);
            }
            resolve();
        });
    };
    return Here;
}(here_common_1.HereBase));
exports.Here = Here;
var NMAMapViewDelegateImpl = (function (_super) {
    __extends(NMAMapViewDelegateImpl, _super);
    function NMAMapViewDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NMAMapViewDelegateImpl_1 = NMAMapViewDelegateImpl;
    NMAMapViewDelegateImpl.initWithOwner = function (owner) {
        var delegate = new NMAMapViewDelegateImpl_1();
        delegate.owner = owner;
        return delegate;
    };
    NMAMapViewDelegateImpl.prototype.mapViewDidDraw = function (mapView) {
    };
    NMAMapViewDelegateImpl.prototype.mapViewDidBeginAnimation = function (mapView) {
    };
    NMAMapViewDelegateImpl.prototype.mapViewDidBeginMovement = function (mapView) {
    };
    NMAMapViewDelegateImpl.prototype.mapViewDidEndMovement = function (mapView) {
    };
    var NMAMapViewDelegateImpl_1;
    NMAMapViewDelegateImpl = NMAMapViewDelegateImpl_1 = __decorate([
        ObjCClass(NMAMapViewDelegate)
    ], NMAMapViewDelegateImpl);
    return NMAMapViewDelegateImpl;
}(NSObject));
var NMAMapGestureDelegateImpl = (function (_super) {
    __extends(NMAMapGestureDelegateImpl, _super);
    function NMAMapGestureDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NMAMapGestureDelegateImpl_1 = NMAMapGestureDelegateImpl;
    NMAMapGestureDelegateImpl.initWithOwner = function (owner) {
        var delegate = new NMAMapGestureDelegateImpl_1();
        delegate.owner = owner;
        return delegate;
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceiveDoubleTapAtLocation = function (mapView, location) {
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceiveLongPressAtLocation = function (mapView, location) {
        var owner = this.owner ? this.owner.get() : null;
        if (owner) {
            var cord = mapView.geoCoordinatesFromPoint(location);
            owner.notify({
                eventName: here_common_1.HereBase.mapLongClickEvent,
                object: owner,
                latitude: cord.latitude,
                longitude: cord.longitude
            });
        }
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceivePanAtLocation = function (mapView, translation, location) {
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceivePinchAtLocation = function (mapView, pinch, location) {
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceiveTapAtLocation = function (mapView, location) {
        var owner = this.owner ? this.owner.get() : null;
        if (owner) {
            var cord = mapView.geoCoordinatesFromPoint(location);
            owner.notify({
                eventName: here_common_1.HereBase.mapClickEvent,
                object: owner,
                latitude: cord.latitude,
                longitude: cord.longitude
            });
            var objects = mapView.objectsAtPoint(location);
            var count = objects.count;
            for (var i = 0; i < count; i++) {
                var nativeMarker = objects.objectAtIndex(i);
                var marker = owner.markers.get(nativeMarker);
                if (marker) {
                    var callback = owner.markersCallback.get(marker.id);
                    if (callback) {
                        callback(marker);
                    }
                }
            }
        }
    };
    NMAMapGestureDelegateImpl.prototype.mapViewDidReceiveTwoFingerTapAtLocation = function (mapView, location) {
    };
    var NMAMapGestureDelegateImpl_1;
    NMAMapGestureDelegateImpl = NMAMapGestureDelegateImpl_1 = __decorate([
        ObjCClass(NMAMapGestureDelegate)
    ], NMAMapGestureDelegateImpl);
    return NMAMapGestureDelegateImpl;
}(NSObject));
//# sourceMappingURL=here.ios.js.map