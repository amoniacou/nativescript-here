"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var here_common_1 = require("./here.common");
var app = require("tns-core-modules/application");
var types = require("tns-core-modules/utils/types");
var imageSrc = require("tns-core-modules/image-source");
var fs = require("tns-core-modules/file-system");
var icon_arrow_1 = require("./icon-arrow");
var Here = (function (_super) {
    __extends(Here, _super);
    function Here() {
        var _this = _super.call(this) || this;
        _this.FRAGMENT_ID = '';
        _this.isReady = false;
        _this.navigationFollow = false;
        return _this;
    }
    Here.init = function (appId, appCode, licenseKey) {
    };
    Here.prototype.createNativeView = function () {
        this.nativeMarkers = new Map();
        this.markersCallback = new Map();
        this.markers = new Map();
        this._layoutId = android.view.View.generateViewId();
        this.FRAGMENT_ID = "here-fragment-" + this._domId;
        var nativeView = new android.widget.LinearLayout(this._context);
        nativeView.setId(this._layoutId);
        this.fragment = new com.here.android.mpa.mapping.SupportMapFragment();
        var manager = app.android.foregroundActivity.getSupportFragmentManager();
        manager
            .beginTransaction()
            .replace(this._layoutId, this.fragment, this.FRAGMENT_ID)
            .commitAllowingStateLoss();
        var that = new WeakRef(this);
        this.dragListener = new com.here.android.mpa.mapping.MapMarker.OnDragListener({
            onMarkerDragStart: function (nativeMarker) {
            },
            onMarkerDrag: function (nativeMarker) {
            },
            onMarkerDragEnd: function (nativeMarker) {
                var owner = that ? that.get() : null;
                if (owner) {
                    var marker = owner.markers.get(nativeMarker);
                    owner.nativeMarkers.set(marker.id, nativeMarker);
                    var cord = nativeMarker.getCoordinate();
                    marker.longitude = cord.getLongitude();
                    marker.latitude = cord.getLatitude();
                    owner.markers.set(nativeMarker, marker);
                }
            }
        });
        this.gestureListener = new com.here.android.mpa.mapping.MapGesture.OnGestureListener({
            onPanStart: function () {
            },
            onPanEnd: function () {
            },
            onMultiFingerManipulationStart: function () {
            },
            onMultiFingerManipulationEnd: function () {
            },
            onMapObjectsSelected: function (objects) {
                var owner = that ? that.get() : null;
                if (owner) {
                    var size = objects.size();
                    for (var i = 0; i < size; i++) {
                        var nativeMarker = objects.get(i);
                        var marker = owner.markers.get(nativeMarker);
                        if (marker) {
                            var callback = owner.markersCallback.get(marker.id);
                            if (callback) {
                                callback(marker);
                            }
                        }
                    }
                }
                return false;
            },
            onTapEvent: function (point) {
                var owner = that ? that.get() : null;
                if (owner) {
                    var map = owner.fragment ? owner.fragment.getMap() : null;
                    if (!map)
                        return false;
                    var cord = map.pixelToGeo(point);
                    owner.notify({
                        eventName: here_common_1.HereBase.mapClickEvent,
                        object: owner,
                        latitude: cord.getLatitude(),
                        longitude: cord.getLongitude()
                    });
                }
                return false;
            },
            onDoubleTapEvent: function (param0) {
                return false;
            },
            onPinchLocked: function () {
            },
            onPinchZoomEvent: function (param0, param1) {
                return false;
            },
            onRotateLocked: function () {
            },
            onRotateEvent: function (param0) {
                return false;
            },
            onTiltEvent: function (param0) {
                return false;
            },
            onLongPressEvent: function (point) {
                var owner = that ? that.get() : null;
                if (owner) {
                    var map = owner.fragment ? owner.fragment.getMap() : null;
                    if (!map)
                        return false;
                    var cord = map.pixelToGeo(point);
                    owner.notify({
                        eventName: here_common_1.HereBase.mapLongClickEvent,
                        object: owner,
                        latitude: cord.getLatitude(),
                        longitude: cord.getLongitude()
                    });
                }
                return false;
            },
            onLongPressRelease: function () {
            },
            onTwoFingerTapEvent: function (param0) {
                return false;
            },
        });
        this.fragment.setMapMarkerDragListener(this.dragListener);
        var isolatedDiskCacheRootPathStatus = com.here.android.mpa.common.MapSettings.setIsolatedDiskCacheRootPath(this._context.getExternalFilesDir(null) + java.io.File.separator + ".here-maps", "tns.here.MapService");
        console.log("Isolate Disk Cache: " + (isolatedDiskCacheRootPathStatus ? 'OK' : 'WITH ERRORS'));
        var NavigationManagerEventListener = (function (_super) {
            __extends(NavigationManagerEventListener, _super);
            function NavigationManagerEventListener() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            NavigationManagerEventListener.prototype.onRunningStateChanged = function () {
                console.log("Running state changed");
            };
            NavigationManagerEventListener.prototype.onNavigationModeChanged = function () {
                console.log("Navigation mode changed");
            };
            NavigationManagerEventListener.prototype.onEnded = function (navigationMode) {
                console.log(navigationMode + " was ended");
            };
            NavigationManagerEventListener.prototype.onMapUpdateModeChanged = function (mapUpdateMode) {
                console.log("Running state changed");
            };
            NavigationManagerEventListener.prototype.onRouteUpdated = function (route) {
                console.log("Route updated");
            };
            NavigationManagerEventListener.prototype.onCountryInfo = function (s, s1) {
                console.log("Country info updated from " + s + " to " + s1);
            };
            return NavigationManagerEventListener;
        }(com.here.android.mpa.guidance.NavigationManager.NavigationManagerEventListener));
        this.navigationManagerListener = new NavigationManagerEventListener();
        var PositionListener = (function (_super) {
            __extends(PositionListener, _super);
            function PositionListener() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            PositionListener.prototype.onPositionUpdated = function (geoPosition) {
                var owner = that.get();
                if (!owner)
                    return;
                var mapFragment = owner.fragment;
                var map = mapFragment.getMap();
                var coordinate = geoPosition.getCoordinate();
                var lat = coordinate.getLatitude();
                var lng = coordinate.getLongitude();
                var heading = geoPosition.getHeading();
                var position = new com.here.android.mpa.common.GeoCoordinate(lat, lng);
                owner.notify({
                    eventName: here_common_1.HereBase.geoPositionChange,
                    object: owner,
                    latitude: lat,
                    longitude: lng,
                    heading: heading
                });
                console.dir("Navigation: lat: " + lat + ", lng: " + lng + ", heading: " + heading);
                owner.navigationArrow.setCoordinate(position);
                map.setCenter(position, com.here.android.mpa.mapping.Map.Animation.LINEAR, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL, heading, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT);
            };
            return PositionListener;
        }(com.here.android.mpa.guidance.NavigationManager.PositionListener));
        this.positionListener = new PositionListener();
        this.listener = new com.here.android.mpa.common.OnEngineInitListener({
            onEngineInitializationCompleted: function (error) {
                var owner = that.get();
                if (!owner)
                    return;
                if (error === com.here.android.mpa.common.OnEngineInitListener.Error.NONE) {
                    var mapFragment = owner.fragment;
                    var map_1 = mapFragment.getMap();
                    var mapGesture = mapFragment.getMapGesture();
                    owner.isReady = true;
                    mapGesture.addOnGestureListener(owner.gestureListener, 1, true);
                    owner.navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance();
                    owner.navigationManager.setMap(map_1);
                    owner.navigationManager.addNavigationManagerEventListener(new java.lang.ref.WeakReference(owner.navigationManagerListener));
                    owner.navigationManager.addPositionListener(new java.lang.ref.WeakReference(owner.positionListener));
                    var RerouteListene = (function (_super) {
                        __extends(RerouteListene, _super);
                        function RerouteListene() {
                            return _super !== null && _super.apply(this, arguments) || this;
                        }
                        RerouteListene.prototype.onRerouteBegin = function () {
                            console.dir('Reroute!!');
                        };
                        RerouteListene.prototype.onRerouteEnd = function (routeResults, routingError) {
                            if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                                if (routeResults.getRoute() != null) {
                                    owner.navigationRoute = routeResults.getRoute();
                                    console.log('navigationRoute');
                                    map_1.removeMapObject(this.mapRoute);
                                    this.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                                    console.log('mapRoute');
                                    this.mapRoute.setManeuverNumberVisible(true);
                                    map_1.addMapObject(this.mapRoute);
                                    owner.navigationRouteBoundingBox = routeResults.getRoute().getBoundingBox();
                                    owner.navigationRouteBoundingBox.expand(200, 200);
                                }
                                else {
                                    console.log('Woooops... route results returned is not valid');
                                }
                            }
                            else {
                                console.log('Woooops... route calculation returned error code: ' + routingError);
                            }
                        };
                        return RerouteListene;
                    }(com.here.android.mpa.guidance.NavigationManager.RerouteListener));
                    var rerouteListener = new RerouteListene();
                    owner.navigationManager.addRerouteListener(new java.lang.ref.WeakReference(rerouteListener));
                    owner.navigationArrowIcon = new com.here.android.mpa.common.Image();
                    var decodedString = android.util.Base64.decode(icon_arrow_1.navigation_arrow, android.util.Base64.DEFAULT);
                    var decodedByte = android.graphics.BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                    owner.navigationArrowIcon.setBitmap(decodedByte);
                    owner.navigationArrow = new com.here.android.mpa.mapping.MapMarker(new com.here.android.mpa.common.GeoCoordinate(0, 0), owner.navigationArrowIcon);
                    map_1.addMapObject(owner.navigationArrow);
                    switch (owner.mapStyle) {
                        case here_common_1.HereMapStyle.HYBRID_DAY:
                            map_1.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.HYBRID_DAY);
                            break;
                        case here_common_1.HereMapStyle.SATELLITE_DAY:
                            map_1.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.SATELLITE_DAY);
                            break;
                        case here_common_1.HereMapStyle.TERRAIN_DAY:
                            map_1.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.TERRAIN_DAY);
                            break;
                        default:
                            map_1.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.NORMAL_DAY);
                            break;
                    }
                    if (owner.disableZoom) {
                        mapGesture.setDoubleTapEnabled(false);
                        mapGesture.setPinchEnabled(false);
                        mapGesture.setTwoFingerTapEnabled(false);
                        mapGesture.setKineticFlickEnabled(false);
                    }
                    if (owner.disableScroll) {
                        mapGesture.setPanningEnabled(false);
                        mapGesture.setTwoFingerPanningEnabled(false);
                    }
                    map_1.setZoomLevel(owner.zoomLevel, com.here.android.mpa.mapping.Map.Animation.NONE);
                    map_1.setTilt(owner.tilt);
                    map_1.setLandmarksVisible(owner.landmarks);
                    if (types.isNumber(+owner.latitude) && types.isNumber(+owner.longitude)) {
                        map_1.setCenter(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(owner.latitude).doubleValue(), java.lang.Double.valueOf(owner.longitude).doubleValue()), com.here.android.mpa.mapping.Map.Animation.NONE, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT);
                    }
                    owner.notify({
                        eventName: here_common_1.HereBase.mapReadyEvent,
                        object: owner,
                        android: owner.fragment,
                        ios: null
                    });
                }
                else {
                    console.dir('ERROR');
                    console.log(error.getDetails());
                }
            }
        });
        return nativeView;
    };
    Here.prototype.initNativeView = function () {
        _super.prototype.initNativeView.call(this);
        this.context = new com.here.android.mpa.common.ApplicationContext(this._context);
        this.fragment.init(this.context, this.listener);
    };
    Here.prototype.disposeNativeView = function () {
        if (this.fragment) {
            var mapGesture = typeof this.fragment.getMapGesture === 'function' ? this.fragment.getMapGesture() : null;
            console.log('this.fragment.removeOnMapRenderListener', this.fragment.removeOnMapRenderListener);
            console.log('mapGesture', mapGesture, 'gestureListener', this.gestureListener);
            if (mapGesture) {
            }
        }
        _super.prototype.disposeNativeView.call(this);
    };
    Here.prototype[here_common_1.zoomLevelProperty.setNative] = function (zoomLevel) {
        if (this.fragment && this.isReady) {
            var map = this.fragment.getMap();
            map.setZoomLevel(zoomLevel, com.here.android.mpa.mapping.Map.Animation.LINEAR);
        }
    };
    Here.prototype[here_common_1.tiltProperty.setNative] = function (tilt) {
        if (this.fragment && this.isReady) {
            var map = this.fragment.getMap();
            map.setTilt(tilt);
        }
    };
    Here.prototype[here_common_1.landmarksProperty.setNative] = function (state) {
        if (this.fragment && this.isReady) {
            var map = this.fragment.getMap();
            map.setLandmarksVisible(state);
        }
    };
    Here.prototype[here_common_1.mapStyleProperty.setNative] = function (style) {
        if (this.fragment && this.isReady) {
            var map = this.fragment.getMap();
            if (!map)
                return;
            switch (style) {
                case here_common_1.HereMapStyle.HYBRID_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.HYBRID_DAY);
                    break;
                case here_common_1.HereMapStyle.SATELLITE_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.SATELLITE_DAY);
                    break;
                case here_common_1.HereMapStyle.TERRAIN_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.TERRAIN_DAY);
                    break;
                default:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.NORMAL_DAY);
                    break;
            }
        }
    };
    Here.prototype.toggleScroll = function (enable) {
        if (this.fragment && this.isReady) {
            var mapGesture = this.fragment.getMapGesture();
            if (mapGesture) {
                mapGesture.setPanningEnabled(enable);
                mapGesture.setTwoFingerPanningEnabled(enable);
                mapGesture.setKineticFlickEnabled(enable);
            }
        }
    };
    Here.prototype[here_common_1.disableScrollProperty.setNative] = function (enable) {
        this.toggleScroll(enable);
    };
    Here.prototype.toggleZoom = function (enable) {
        if (this.fragment && this.isReady) {
            var mapGesture = this.fragment.getMapGesture();
            if (mapGesture) {
                mapGesture.setDoubleTapEnabled(enable);
                mapGesture.setPinchEnabled(enable);
                mapGesture.setTwoFingerTapEnabled(enable);
            }
        }
    };
    Here.prototype[here_common_1.disableZoomProperty.setNative] = function (enable) {
        this.toggleZoom(enable);
    };
    Here.prototype._getMarkersCount = function () {
        return this.nativeMarkers ? this.nativeMarkers.size : 0;
    };
    Here.prototype._requestPremision = function () {
        return new Promise(function (resolve, reject) {
            var location_permissions = [
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ];
            var activityRequestPermissionsHandler_location = function (data) {
                app.android.off(app.AndroidApplication.activityRequestPermissionsEvent, activityRequestPermissionsHandler_location);
                if (data.requestCode === 1) {
                    if (data.grantResults.length > 0 && data.grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        resolve();
                    }
                    else {
                        reject();
                    }
                }
            };
            android.support.v4.app.ActivityCompat.requestPermissions(app.android.foregroundActivity, location_permissions, 1);
            app.android.on(app.AndroidApplication.activityRequestPermissionsEvent, activityRequestPermissionsHandler_location);
        });
    };
    Here.prototype.toNextWaypoint = function () {
    };
    Here.prototype.toPrevWaypoint = function () {
    };
    Here.prototype.setCenter = function (lat, lon, animated) {
        var _this = this;
        return new Promise(function (resolve) {
            if (_this.fragment && _this.isReady) {
                var map = _this.fragment.getMap();
                if (map) {
                    map.setCenter(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(lat).doubleValue(), java.lang.Double.valueOf(lon).doubleValue()), !!animated ? com.here.android.mpa.mapping.Map.Animation.LINEAR : com.here.android.mpa.mapping.Map.Animation.NONE);
                }
            }
            resolve();
        });
    };
    Here.prototype.showWay = function () {
        if (this.fragment && this.isReady) {
            var map = this.fragment.getMap();
            map.setOrientation(0);
            map.setTilt(0);
            map.zoomTo(this.navigationRouteBoundingBox, com.here.android.mpa.mapping.Map.Animation.LINEAR, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION);
        }
    };
    Here.prototype.calculateRoute = function (points) {
        var _this = this;
        var owner = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                var map_2 = _this.fragment.getMap();
                if (points.length < 2) {
                    reject();
                    return;
                }
                var coreRouter = new com.here.android.mpa.routing.CoreRouter();
                console.log('coreRouter');
                var routePlan_1 = new com.here.android.mpa.routing.RoutePlan();
                console.log('routePlan');
                _this.routeOptions = new com.here.android.mpa.routing.RouteOptions();
                _this.routeOptions.setTransportMode(com.here.android.mpa.routing.RouteOptions.TransportMode.UNDEFINED);
                _this.routeOptions.setHighwaysAllowed(false);
                _this.routeOptions.setParksAllowed(true);
                _this.routeOptions.setRouteType(com.here.android.mpa.routing.RouteOptions.Type.FASTEST);
                _this.routeOptions.setRouteCount(1);
                console.log('Route Params');
                points.forEach(function (point) {
                    routePlan_1.addWaypoint(new com.here.android.mpa.routing.RouteWaypoint(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(point.latitude).doubleValue(), java.lang.Double.valueOf(point.longitude).doubleValue())));
                });
                console.log('Added points');
                var routerListener = new com.here.android.mpa.routing.Router.Listener({
                    onProgress: function (percent) {
                        console.log("Calculate route: " + percent + "%");
                    },
                    onCalculateRouteFinished: function (routeResults, routingError) {
                        if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                            if (routeResults.get(0).getRoute() != null) {
                                owner.navigationRoute = routeResults.get(0).getRoute();
                                console.log('navigationRoute');
                                if (this.mapRoute) {
                                    map_2.removeMapObject(this.mapRoute);
                                }
                                this.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                                console.log('mapRoute');
                                this.mapRoute.setManeuverNumberVisible(true);
                                map_2.addMapObject(this.mapRoute);
                                owner.navigationRouteBoundingBox = routeResults.get(0).getRoute().getBoundingBox();
                                owner.navigationRouteBoundingBox.expand(200, 200);
                                map_2.setOrientation(0);
                                map_2.zoomTo(owner.navigationRouteBoundingBox, com.here.android.mpa.mapping.Map.Animation.NONE, com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION);
                                resolve();
                            }
                            else {
                                console.log('Woooops... route results returned is not valid');
                                reject();
                            }
                        }
                        else {
                            console.log('Woooops... route calculation returned error code: ' + routingError);
                            reject();
                        }
                    }
                });
                coreRouter.calculateRoute(routePlan_1, routerListener);
            }
            else {
                reject();
            }
        });
    };
    Here.prototype.startNavigation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                var map_3 = _this.fragment.getMap();
                _this._requestPremision()
                    .then(function () {
                    map_3.setTilt(60);
                    map_3.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE);
                    var managerError = _this.navigationManager.startNavigation(_this.navigationRoute);
                    console.dir(managerError);
                    resolve();
                })
                    .catch(function () {
                    console.log("permission not granted!");
                    reject();
                });
            }
        });
    };
    Here.prototype.startSimulation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                var map_4 = _this.fragment.getMap();
                _this._requestPremision()
                    .then(function () {
                    map_4.setTilt(60);
                    map_4.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE);
                    var managerError = _this.navigationManager.simulate(_this.navigationRoute, 15);
                    console.dir(managerError);
                    resolve();
                })
                    .catch(function () {
                    console.log("permission not granted!");
                    reject();
                });
            }
        });
    };
    Here.prototype.stopNavigation = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                _this.navigationManager.stop();
            }
            resolve();
        });
    };
    Here.prototype.addMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var markerIcons = [];
            if (_this.fragment && _this.isReady) {
                var map_5 = _this.fragment.getMap();
                markers.forEach(function (marker) {
                    if (marker.onTap && typeof marker.onTap === 'function') {
                        _this.markersCallback.set(marker.id, marker.onTap);
                    }
                    var nativeMarker = new com.here.android.mpa.mapping.MapMarker();
                    nativeMarker.setCoordinate(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(marker.latitude).doubleValue(), java.lang.Double.valueOf(marker.longitude).doubleValue()));
                    if (marker.title) {
                        nativeMarker.setTitle(marker.title);
                    }
                    if (marker.description) {
                        nativeMarker.setDescription(marker.description);
                    }
                    if (typeof marker.icon === 'string') {
                        if (marker.icon.startsWith('http')) {
                        }
                        else if (marker.icon.startsWith('res')) {
                            var src = imageSrc.fromResource(marker.icon);
                            nativeMarker.icon = src ? src.ios : null;
                        }
                        else if (marker.icon.startsWith('~/')) {
                            var path = fs.path.join(fs.knownFolders.currentApp().path, marker.icon.replace('~', ''));
                            var src = imageSrc.fromFileOrResource(path);
                            nativeMarker.icon = src ? src.ios : null;
                        }
                    }
                    nativeMarker.setDraggable(!!marker.draggable);
                    _this.nativeMarkers.set(marker.id, nativeMarker);
                    _this.markers.set(nativeMarker, marker);
                    map_5.addMapObject(nativeMarker);
                });
                resolve();
            }
            else {
                reject();
            }
        });
    };
    Here.prototype.removeMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                var map_6 = _this.fragment.getMap();
                if (!markers) {
                    map_6.removeAllMapObjects();
                    _this.markers.clear();
                    _this.nativeMarkers.clear();
                    _this.markersCallback.clear();
                }
                else {
                    markers.forEach(function (id) {
                        var nativeMarker = _this.nativeMarkers.get(id);
                        if (nativeMarker) {
                            map_6.removeMapObject(nativeMarker);
                            _this.nativeMarkers.delete(id);
                            _this.markersCallback.delete(id);
                            _this.markers.delete(nativeMarker);
                        }
                    });
                }
            }
            resolve();
        });
    };
    Here.prototype.updateMarkers = function (markers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            markers.forEach(function (marker) {
                var nativeMarker = _this.nativeMarkers.get(marker.id);
                if (nativeMarker) {
                    nativeMarker.setCoordinate(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(marker.latitude).doubleValue(), java.lang.Double.valueOf(marker.longitude).doubleValue()));
                    if (marker.title) {
                        nativeMarker.setTitle(marker.title);
                    }
                    if (marker.description) {
                        nativeMarker.setDescription(marker.description);
                    }
                    if (types.isBoolean(marker.draggable)) {
                        nativeMarker.setDraggable(marker.draggable);
                    }
                    if (!!marker.selected && !nativeMarker.isInfoBubbleVisible()) {
                        nativeMarker.showInfoBubble();
                    }
                    else {
                        nativeMarker.hideInfoBubble();
                    }
                    _this.nativeMarkers.set(marker.id, nativeMarker);
                    _this.markers.set(nativeMarker, marker);
                }
            });
        });
    };
    Here.prototype.updateMarker = function (marker) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.fragment && _this.isReady) {
                var nativeMarker = _this.nativeMarkers.get(marker.id);
                if (nativeMarker) {
                    nativeMarker.setCoordinate(new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(marker.latitude).doubleValue(), java.lang.Double.valueOf(marker.longitude).doubleValue()));
                    if (marker.title) {
                        nativeMarker.setTitle(marker.title);
                    }
                    if (marker.description) {
                        nativeMarker.setDescription(marker.description);
                    }
                    if (types.isBoolean(marker.draggable)) {
                        nativeMarker.setDraggable(marker.draggable);
                    }
                    if (!!marker.selected && !nativeMarker.isInfoBubbleVisible()) {
                        nativeMarker.showInfoBubble();
                    }
                    else {
                        nativeMarker.hideInfoBubble();
                    }
                    _this.nativeMarkers.set(marker.id, nativeMarker);
                    _this.markers.set(nativeMarker, marker);
                }
            }
        });
    };
    return Here;
}(here_common_1.HereBase));
exports.Here = Here;
//# sourceMappingURL=here.android.js.map