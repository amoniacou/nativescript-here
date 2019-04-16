import {
    disableScrollProperty,
    disableZoomProperty,
    HereBase,
    HereMapStyle,
    HereMarker,
    mapStyleProperty,
    zoomLevelProperty,
    tiltProperty,
    landmarksProperty
} from './here.common';
import * as app from 'tns-core-modules/application';
import * as types from 'tns-core-modules/utils/types';
import * as imageSrc from 'tns-core-modules/image-source';
import * as fs from 'tns-core-modules/file-system';
import { Color } from 'tns-core-modules/color';
import { navigation_arrow } from './icon-arrow';


declare var com;

export class Here extends HereBase {

    private _layoutId: number;
    private fragment;
    private listener;
    private context;
    private FRAGMENT_ID = '';
    private isReady: boolean = false;
    private dragListener;
    private gestureListener;

    private nativeMarkers: Map<number, any>;
    private markersCallback: Map<number, any>;
    private markers: Map<any, HereMarker>;

    private nativeCircles: Map<number, any>;
    private circles: Map<any, any>;

    private navigationManager;
    private navigationManagerListener;
    private positionListener;
    private navigationRoute;
    private navigationRouteBoundingBox;
    private navigationArrowIcon;
    private navigationArrow;
    private routeOptions;
    private mapRoute;
    private navigationFollow: boolean = false;

    constructor() {
        super();
    }

    public static init(appId: string, appCode: string, licenseKey: string) {
    }

    public createNativeView(): Object {
        this.nativeMarkers = new Map<number, any>();
        this.markersCallback = new Map<number, any>();
        this.markers = new Map<number, HereMarker>();
        this._layoutId = android.view.View.generateViewId();
        this.FRAGMENT_ID = `here-fragment-${this._domId}`;
        const nativeView = new android.widget.LinearLayout(this._context);
        nativeView.setId(this._layoutId);
        this.fragment = new com.here.android.mpa.mapping.SupportMapFragment() as any;
        const manager = (app.android.foregroundActivity as android.support.v7.app.AppCompatActivity).getSupportFragmentManager(); // (this as any)._getFragmentManager() as android.support.v4.app.FragmentManager;
        manager
            .beginTransaction()
            .replace(this._layoutId, this.fragment as any, this.FRAGMENT_ID)
            .commitAllowingStateLoss();

        const that = new WeakRef<Here>(this);

        this.dragListener = new com.here.android.mpa.mapping.MapMarker.OnDragListener({
            onMarkerDragStart(nativeMarker): void {

            },
            onMarkerDrag(nativeMarker) {

            },
            onMarkerDragEnd(nativeMarker) {
                const owner = that ? that.get() : null;
                if (owner) {
                    const marker = owner.markers.get(nativeMarker);
                    owner.nativeMarkers.set(marker.id, nativeMarker);
                    const cord = nativeMarker.getCoordinate();
                    marker.longitude = cord.getLongitude();
                    marker.latitude = cord.getLatitude();
                    owner.markers.set(nativeMarker, marker);
                }
            }
        });

        this.gestureListener = new com.here.android.mpa.mapping.MapGesture.OnGestureListener({
            onPanStart(): void {
            },

            onPanEnd(): void {
            },

            onMultiFingerManipulationStart(): void {
            },

            onMultiFingerManipulationEnd(): void {
            },

            onMapObjectsSelected(objects: java.util.List<any>): boolean {
                const owner = that ? that.get() : null;
                if (owner) {
                    const size = objects.size();
                    for (let i = 0; i < size; i++) {
                        const nativeMarker = objects.get(i);
                        const marker = owner.markers.get(nativeMarker);
                        if (marker) {
                            const callback = owner.markersCallback.get(marker.id);
                            if (callback) {
                                callback(marker);
                            }
                        }
                    }
                }
                return false;
            },

            onTapEvent(point: globalAndroid.graphics.PointF): boolean {
                const owner = that ? that.get() : null;
                if (owner) {
                    const map = owner.fragment ? owner.fragment.getMap() : null;
                    if (!map) return false;
                    const cord = map.pixelToGeo(point);
                    owner.notify({
                        eventName: HereBase.mapClickEvent,
                        object: owner,
                        latitude: cord.getLatitude(),
                        longitude: cord.getLongitude()
                    });
                }
                return false;
            },

            onDoubleTapEvent(param0: globalAndroid.graphics.PointF): boolean {
                return false;
            },

            onPinchLocked(): void {
            },

            onPinchZoomEvent(param0: number, param1: globalAndroid.graphics.PointF): boolean {
                return false;
            },

            onRotateLocked(): void {
            },

            onRotateEvent(param0: number): boolean {
                return false;
            },

            onTiltEvent(param0: number): boolean {
                return false;
            },

            onLongPressEvent(point: globalAndroid.graphics.PointF): boolean {
                const owner = that ? that.get() : null;
                if (owner) {
                    const map = owner.fragment ? owner.fragment.getMap() : null;
                    if (!map) return false;
                    const cord = map.pixelToGeo(point);
                    owner.notify({
                        eventName: HereBase.mapLongClickEvent,
                        object: owner,
                        latitude: cord.getLatitude(),
                        longitude: cord.getLongitude()
                    });
                }
                return false;
            },

            onLongPressRelease(): void {
            },

            onTwoFingerTapEvent(param0: globalAndroid.graphics.PointF): boolean {
                return false;
            },
        });

        this.fragment.setMapMarkerDragListener(this.dragListener);

        const isolatedDiskCacheRootPathStatus = com.here.android.mpa.common.MapSettings.setIsolatedDiskCacheRootPath(
            this._context.getExternalFilesDir(null) + java.io.File.separator + ".here-maps",
            "tns.here.MapService"
        )

        console.log(`Isolate Disk Cache: ${ isolatedDiskCacheRootPathStatus ? 'OK' : 'WITH ERRORS' }`)

        class NavigationManagerEventListener extends com.here.android.mpa.guidance.NavigationManager.NavigationManagerEventListener {
            onRunningStateChanged() {
                console.log("Running state changed")
                //android.widget.Toast.makeText(this._context, "Running state changed", android.widget.Toast.LENGTH_SHORT).show();
            }
    
            onNavigationModeChanged() {
                console.log("Navigation mode changed")
                //android.widget.Toast.makeText(this._context, "Navigation mode changed", android.widget.Toast.LENGTH_SHORT).show();
            }
    
            onEnded(navigationMode) {
                console.log(navigationMode + " was ended")
                //android.widget.Toast.makeText(this._context, navigationMode + " was ended", android.widget.Toast.LENGTH_SHORT).show();
                //stopForegroundService();
            }
    
            onMapUpdateModeChanged(mapUpdateMode) {
                console.log("Running state changed")
                //android.widget.Toast.makeText(this._context, "Map update mode is changed to " + mapUpdateMode, android.widget.Toast.LENGTH_SHORT).show();
            }
    
            onRouteUpdated(route) {
                console.log("Route updated")
                //android.widget.Toast.makeText(this._context, "Route updated", android.widget.Toast.LENGTH_SHORT).show();
            }
            
            onCountryInfo(s, s1) {
                console.log("Country info updated from " + s + " to " + s1)
                //android.widget.Toast.makeText(this._context, "Country info updated from " + s + " to " + s1, android.widget.Toast.LENGTH_SHORT).show();
            }
        }

        this.navigationManagerListener = new NavigationManagerEventListener()

        class PositionListener extends com.here.android.mpa.guidance.NavigationManager.PositionListener {
            onPositionUpdated(geoPosition) {
                // console.dir(geoPosition)

                const owner = that.get();
                if (!owner) return;
                const mapFragment = owner.fragment
                const map = mapFragment.getMap()
                const coordinate = geoPosition.getCoordinate()
                const lat = coordinate.getLatitude()
                const lng = coordinate.getLongitude()
                const heading = geoPosition.getHeading()
                const position = new com.here.android.mpa.common.GeoCoordinate(lat, lng)

                // const routeElement = geoPosition.getRoadElement();

                owner.notify({
                    eventName: HereBase.geoPositionChange,
                    object: owner,
                    latitude: lat,
                    longitude: lng,
                    heading
                });

                console.dir(`Navigation: lat: ${lat}, lng: ${lng}, heading: ${heading}`)

                // owner.navigationArrow.setCenter(position)

                owner.navigationArrow.setCoordinate(position)
                
                map.setCenter(
                    position,
                    com.here.android.mpa.mapping.Map.Animation.LINEAR,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL,
                    heading,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT
                )
            }
        }

        this.positionListener = new PositionListener()

        this.listener = new com.here.android.mpa.common.OnEngineInitListener({
            onEngineInitializationCompleted(error): void {
                const owner = that.get();
                if (!owner) return;
                if (error === com.here.android.mpa.common.OnEngineInitListener.Error.NONE) {
                    const mapFragment = owner.fragment
                    const map = mapFragment.getMap()
                    const mapGesture = mapFragment.getMapGesture()

                    owner.isReady = true;

                    mapGesture.addOnGestureListener(owner.gestureListener, 1, true)

                    owner.navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance()
                    owner.navigationManager.setMap(map)

                    owner.navigationManager.addNavigationManagerEventListener(
                        new java.lang.ref.WeakReference(owner.navigationManagerListener)
                    )

                    owner.navigationManager.addPositionListener(
                        new java.lang.ref.WeakReference(owner.positionListener)
                    )

                    class RerouteListene extends com.here.android.mpa.guidance.NavigationManager.RerouteListener {
                        onRerouteBegin() {
                            console.dir('Reroute!!')
                        }

                        onRerouteEnd(routeResults, routingError) {
                            if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                                if (routeResults.getRoute() != null) {
    
                                    owner.navigationRoute = routeResults.getRoute();
                                    console.log('navigationRoute')
    
                                    map.removeMapObject(this.mapRoute)
                                    this.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                                    console.log('mapRoute')
    
                                    this.mapRoute.setManeuverNumberVisible(true)
                                    map.addMapObject(this.mapRoute)
    
                                    owner.navigationRouteBoundingBox = routeResults.getRoute().getBoundingBox();
                                    owner.navigationRouteBoundingBox.expand(200, 200)
                                } else {
                                    console.log('Woooops... route results returned is not valid')
                                }
                            } else {
                                console.log('Woooops... route calculation returned error code: ' + routingError)
                            }
                        }
                    }

                    const rerouteListener = new RerouteListene()

                    owner.navigationManager.addRerouteListener(
                        new java.lang.ref.WeakReference(rerouteListener)
                    )

                    owner.navigationArrowIcon = new com.here.android.mpa.common.Image()

                    const decodedString = android.util.Base64.decode(navigation_arrow, android.util.Base64.DEFAULT);
                    const decodedByte = android.graphics.BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length); 
                    // console.log(decodedByte)
                    // console.dir(decodedByte)

                    owner.navigationArrowIcon.setBitmap(decodedByte)

                    owner.navigationArrow = new com.here.android.mpa.mapping.MapMarker(
                        new com.here.android.mpa.common.GeoCoordinate(0, 0),
                        owner.navigationArrowIcon
                    )

                    // owner.navigationArrow = new com.here.android.mpa.mapping.MapCircle(
                    //     4, new com.here.android.mpa.common.GeoCoordinate(0, 0)
                    // )
                    
                    // owner.navigationArrow.setLineColor(android.graphics.Color.rgb(255, 255, 255))
                    // owner.navigationArrow.setLineWidth(8)

                    map.addMapObject(owner.navigationArrow)

                    switch (owner.mapStyle) {
                        case HereMapStyle.HYBRID_DAY:
                            map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.HYBRID_DAY)
                            break;
                        case HereMapStyle.SATELLITE_DAY:
                            map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.SATELLITE_DAY)
                            break;
                        case HereMapStyle.TERRAIN_DAY:
                            map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.TERRAIN_DAY)
                            break;
                        default:
                            map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.NORMAL_DAY)
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

                    map.setZoomLevel(owner.zoomLevel, com.here.android.mpa.mapping.Map.Animation.NONE)

                    map.setTilt(owner.tilt)

                    map.setLandmarksVisible(owner.landmarks)

                    if (types.isNumber(+owner.latitude) && types.isNumber(+owner.longitude)) {
                        map.setCenter(
                            new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(owner.latitude).doubleValue(), java.lang.Double.valueOf(owner.longitude).doubleValue()),
                            com.here.android.mpa.mapping.Map.Animation.NONE,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT);
                    }

                    owner.notify({
                        eventName: HereBase.mapReadyEvent,
                        object: owner,
                        android: owner.fragment,
                        ios: null
                    });
                } else {
                    console.dir('ERROR')
                    console.log(error.getDetails());
                }
            }
        });

        return nativeView;
    }

    public initNativeView(): void {
        super.initNativeView();
        this.context = new com.here.android.mpa.common.ApplicationContext(this._context)
        this.fragment.init(this.context, this.listener);
    }

    public disposeNativeView(): void {
        if (this.fragment) {
            const mapGesture = typeof this.fragment.getMapGesture === 'function' ? this.fragment.getMapGesture() : null;
            console.log('this.fragment.removeOnMapRenderListener', this.fragment.removeOnMapRenderListener);
            //this.fragment.removeOnMapRenderListener(this.listener);
            console.log('mapGesture', mapGesture, 'gestureListener', this.gestureListener);
            if (mapGesture) {
                //this.fragment.getMapGesture().removeOnGestureListener(this.gestureListener);
            }
        }
        super.disposeNativeView();
    }

    [zoomLevelProperty.setNative](zoomLevel: number) {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap();
            map.setZoomLevel(zoomLevel, com.here.android.mpa.mapping.Map.Animation.LINEAR);
        }
    }

    [tiltProperty.setNative](tilt: number) {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap();
            map.setTilt(tilt);
        }
    }

    [landmarksProperty.setNative](state: boolean) {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap();
            map.setLandmarksVisible(state);
        }
    }

    [mapStyleProperty.setNative](style: HereMapStyle) {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap();
            if (!map) return;
            switch (style) {
                case HereMapStyle.HYBRID_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.HYBRID_DAY);
                    break;
                case HereMapStyle.SATELLITE_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.SATELLITE_DAY);
                    break;
                case HereMapStyle.TERRAIN_DAY:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.TERRAIN_DAY);
                    break;
                default:
                    map.setMapScheme(com.here.android.mpa.mapping.Map.Scheme.NORMAL_DAY);
                    break;
            }
        }
    }

    toggleScroll(enable: boolean) {
        if (this.fragment && this.isReady) {
            const mapGesture = this.fragment.getMapGesture();
            if (mapGesture) {
                mapGesture.setPanningEnabled(enable);
                mapGesture.setTwoFingerPanningEnabled(enable);
                mapGesture.setKineticFlickEnabled(enable);
            }
        }
    }

    [disableScrollProperty.setNative](enable: boolean) {
        this.toggleScroll(enable)
    }

    toggleZoom(enable: boolean) {
        if (this.fragment && this.isReady) {
            const mapGesture = this.fragment.getMapGesture();
            if (mapGesture) {
                mapGesture.setDoubleTapEnabled(enable);
                mapGesture.setPinchEnabled(enable);
                mapGesture.setTwoFingerTapEnabled(enable);
            }
        }
    }

    [disableZoomProperty.setNative](enable: boolean) {
        this.toggleZoom(enable)
    }

    _getMarkersCount(): number {
        return this.nativeMarkers ? this.nativeMarkers.size : 0;
    }

    _requestPremision(): any {
        return new Promise<any>((resolve, reject) => {
            const location_permissions = [ 
                (android as any).Manifest.permission.ACCESS_FINE_LOCATION
            ];

            const activityRequestPermissionsHandler_location = function(data) {
                app.android.off(app.AndroidApplication.activityRequestPermissionsEvent, activityRequestPermissionsHandler_location);

                if (data.requestCode === 1 ) {
                    if (data.grantResults.length > 0 && data.grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        resolve();
                    } else {
                        reject();
                    }
                }
            };

            (android.support.v4.app.ActivityCompat as any).requestPermissions( 
                app.android.foregroundActivity,
                location_permissions, 1
            )

            app.android.on(app.AndroidApplication.activityRequestPermissionsEvent, activityRequestPermissionsHandler_location);
        })
    }

    toNextWaypoint(): void {

    }

    toPrevWaypoint(): void {
        
    }

    setCenter(lat: number, lon: number, animated: boolean): Promise<any> {
        return new Promise<any>(resolve => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap();
                if (map) {
                    map.setCenter(
                        new com.here.android.mpa.common.GeoCoordinate(
                            java.lang.Double.valueOf(lat).doubleValue(), 
                            java.lang.Double.valueOf(lon).doubleValue()
                        ), 
                        !!animated ? com.here.android.mpa.mapping.Map.Animation.LINEAR : com.here.android.mpa.mapping.Map.Animation.NONE
                    );
                }
            }
            resolve();
        });
    }

    showWay(): any {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap()

            map.setOrientation(0);
            map.setTilt(0);
            map.zoomTo(
                this.navigationRouteBoundingBox, 
                com.here.android.mpa.mapping.Map.Animation.LINEAR, 
                com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION,
            );
        }
    }

    calculateRoute(points): Promise<any> {
        const owner = this;
        
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap()

                if(points.length < 2) {
                    reject();
                    return;
                }

                const coreRouter = new com.here.android.mpa.routing.CoreRouter()
                console.log('coreRouter')

                const routePlan = new com.here.android.mpa.routing.RoutePlan()
                console.log('routePlan')

                this.routeOptions = new com.here.android.mpa.routing.RouteOptions()

                this.routeOptions.setTransportMode(com.here.android.mpa.routing.RouteOptions.TransportMode.UNDEFINED)     
                this.routeOptions.setHighwaysAllowed(false)
                this.routeOptions.setParksAllowed(true)
                this.routeOptions.setRouteType(com.here.android.mpa.routing.RouteOptions.Type.FASTEST)
                this.routeOptions.setRouteCount(1)

                console.log('Route Params')

                points.forEach(point => {
                    routePlan.addWaypoint(
                        new com.here.android.mpa.routing.RouteWaypoint(
                            new com.here.android.mpa.common.GeoCoordinate(
                                java.lang.Double.valueOf(point.latitude).doubleValue(),
                                java.lang.Double.valueOf(point.longitude).doubleValue()
                            )
                        )
                    )
                })
                console.log('Added points')

                const routerListener = new com.here.android.mpa.routing.Router.Listener({
                    onProgress(percent) {
                        console.log(`Calculate route: ${percent}%`)
                        //android.widget.Toast.makeText(this._context, `Calculate route: ${percent}%`, android.widget.Toast.LENGTH_SHORT).show();
                    },
                    onCalculateRouteFinished(routeResults, routingError): void {
                        if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                            if (routeResults.get(0).getRoute() != null) {

                                owner.navigationRoute = routeResults.get(0).getRoute();
                                console.log('navigationRoute')

                                if(this.mapRoute) {
                                    map.removeMapObject(this.mapRoute)
                                }
                                
                                this.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                                console.log('mapRoute')

                                this.mapRoute.setManeuverNumberVisible(true)
                                map.addMapObject(this.mapRoute)

                                owner.navigationRouteBoundingBox = routeResults.get(0).getRoute().getBoundingBox();
                                owner.navigationRouteBoundingBox.expand(200, 200)

                                map.setOrientation(0);
                                map.zoomTo(
                                    owner.navigationRouteBoundingBox, 
                                    com.here.android.mpa.mapping.Map.Animation.NONE, 
                                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION
                                );

                                resolve();
                            } else {
                                console.log('Woooops... route results returned is not valid')
                                reject('Woooops... route results returned is not valid');
                            }
                        } else {
                            console.log('Woooops... route calculation returned error code: ' + routingError)
                            reject('Woooops... route calculation returned error code: ' + routingError);
                        }
                    }
                })

                coreRouter.calculateRoute(routePlan, routerListener)
            } else {
                reject();
            }
        }) 
    }

    startNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap()

                this._requestPremision()
                    .then(() => {
                        map.setTilt(60);
                        map.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE)

                        const managerError = this.navigationManager.startNavigation(this.navigationRoute)

                        console.dir(managerError)
                        resolve()
                    })
                    .catch(() => {
                        console.log("permission not granted!");
                        reject()
                    })
            }
        })
    }

    startSimulation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap()

                this._requestPremision()
                    .then(() => {
                        map.setTilt(60);
                        map.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE)

                        const managerError = this.navigationManager.simulate(this.navigationRoute, 15);

                        console.dir(managerError)
                        resolve()
                    })
                    .catch(() => {
                        console.log("permission not granted!");
                        reject()
                    })
            }
        })
    }

    stopNavigation(): void {
        if (this.fragment && this.isReady) {
            this.navigationManager.stop();
        }
    }

    addMarkers(markers: HereMarker[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const markerIcons = [];
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap();

                markers.forEach((marker) => {
                    
                    if (marker.onTap && typeof marker.onTap === 'function') {
                        this.markersCallback.set(marker.id, marker.onTap);
                    }

                    const nativeMarker = new com.here.android.mpa.mapping.MapMarker()

                    nativeMarker.setCoordinate(
                        new com.here.android.mpa.common.GeoCoordinate(
                            java.lang.Double.valueOf(marker.latitude).doubleValue(), 
                            java.lang.Double.valueOf(marker.longitude).doubleValue()
                        )
                    )

                    if (marker.title) {
                        nativeMarker.setTitle(marker.title);
                    }
                    if (marker.description) {
                        nativeMarker.setDescription(marker.description);
                    }

                    if (typeof marker.icon === 'string') {
                        if (marker.icon.startsWith('http')) {

                        } else if (marker.icon.startsWith('res')) {
                            const src = imageSrc.fromResource(marker.icon);
                            nativeMarker.icon = src ? src.ios : null;
                        } else if (marker.icon.startsWith('~/')) {
                            const path = fs.path.join(fs.knownFolders.currentApp().path, marker.icon.replace('~', ''));
                            const src = imageSrc.fromFileOrResource(path);
                            nativeMarker.icon = src ? src.ios : null;
                        }
                    }

                    nativeMarker.setDraggable(!!marker.draggable);
                    this.nativeMarkers.set(marker.id, nativeMarker);
                    this.markers.set(nativeMarker, marker);
                    map.addMapObject(nativeMarker);

                    // if (!!marker.selected) {
                    //     nativeMarker.showInfoBubble();
                    // } else {
                    //     nativeMarker.hideInfoBubble();
                    // }
                })

                resolve()
            } else {
                reject()
            }
        })
    }

    removeMarkers(markers?: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap();
                if (!markers) {
                    map.removeAllMapObjects();
                    this.markers.clear();
                    this.nativeMarkers.clear();
                    this.markersCallback.clear();
                } else {
                    markers.forEach(id => {
                        const nativeMarker = this.nativeMarkers.get(id);
                        if (nativeMarker) {
                            map.removeMapObject(nativeMarker);
                            this.nativeMarkers.delete(id);
                            this.markersCallback.delete(id);
                            this.markers.delete(nativeMarker);
                        }
                    });
                }
            }
            resolve();
        });
    }

    updateMarkers(markers: HereMarker[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            markers.forEach(marker => {
                const nativeMarker = this.nativeMarkers.get(marker.id);
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
                    } else {
                        nativeMarker.hideInfoBubble();
                    }

                    this.nativeMarkers.set(marker.id, nativeMarker);
                    this.markers.set(nativeMarker, marker);

                }
            });
        });
    }

    updateMarker(marker: HereMarker): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const nativeMarker = this.nativeMarkers.get(marker.id);
                if (nativeMarker) {
                    nativeMarker.setCoordinate(new com.here.android.mpa.common.GeoCoordinate(
                        java.lang.Double.valueOf(marker.latitude).doubleValue(), 
                        java.lang.Double.valueOf(marker.longitude).doubleValue()
                    ));
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
                    } else {
                        nativeMarker.hideInfoBubble();
                    }

                    this.nativeMarkers.set(marker.id, nativeMarker);
                    this.markers.set(nativeMarker, marker);
                }
            }
        });
    }

    addCircle(circle): void {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap()

            const nativeObj = new com.here.android.mpa.mapping.MapCircle()

            this._setCircleOptions(nativeObj, circle)
            
            this.nativeCircles.set(circle.id, nativeObj)
            this.circles.set(nativeObj, circle)
            map.addMapObject(nativeObj)
        }
    }

    updateCircle(circle): void {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap()

            const nativeObj = this.nativeCircles.get(circle.id);
            this._setCircleOptions(nativeObj, circle)
        }
    }

    _setCircleOptions(nativeObj, options) {
        nativeObj.setCenter(
            new com.here.android.mpa.common.GeoCoordinate(
                java.lang.Double.valueOf(options.latitude).doubleValue(), 
                java.lang.Double.valueOf(options.longitude).doubleValue()
            )
        )

        nativeObj.setRadius(
            java.lang.Double.valueOf(options.radius).doubleValue()
        )
        nativeObj.setFillColor(android.graphics.Color.argb(150, 5, 5, 255))
        nativeObj.setLineColor(android.graphics.Color.rgb(5, 5, 255))
        nativeObj.setLineWidth(5)
    }

    addCircles(circles): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                const map = this.fragment.getMap();

                circles.forEach((circle) => {
                    this.addCircle(circle)
                })

                console.log('Test')

                resolve()
            } else {
                reject()
            }
        })
    }
}
