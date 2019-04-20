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
import { ios_icon as icon_source } from './icon-source';
import * as app from 'tns-core-modules/application';
import * as types from 'tns-core-modules/utils/types';
import * as imageSrc from 'tns-core-modules/image-source';
import * as fs from 'tns-core-modules/file-system';
import { Color } from 'tns-core-modules/color';
import { navigation_arrow } from './icon-arrow';
const permissions = require('nativescript-permissions');

declare var com: any;

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
    private routeProgress: number = 0;
    private navigationMarkerIcon;
    private rerouteListener;
    private navigationMode: string = 'walk'
    private nativeStops;
    private routingMode;

    readonly navigationModePressets = {
        walk: {
            transportMode: 'PEDESTRIAN',
            routeType: 'FASTEST'
        },
        bike: {
            transportMode: 'SCOOTER',
            routeType: 'FASTEST'
        },
        car: {
            transportMode: 'CAR',
            routeType: 'FASTEST'
        },
        pub_tr: {
            transportMode: 'PUBLIC_TRANSPORT',
            routeType: 'FASTEST'
        },
        uber: {
            transportMode: 'CAR',
            routeType: 'FASTEST'
        },
        boat: {
            transportMode: 'PEDESTRIAN',
            routeType: 'FASTEST'
        },
        copter: {
            transportMode: 'PEDESTRIAN',
            routeType: 'FASTEST'
        },
        horse: {
            transportMode: 'PEDESTRIAN',
            routeType: 'FASTEST'
        }
    }

    constructor() {
        super();
    }

    public static init(appId: string, appCode: string, licenseKey: string) {
    }

    public createNativeView(): Object {
        this.nativeMarkers = new Map<number, any>();
        this.markersCallback = new Map<number, any>();
        this.nativeCircles = new Map<number, any>();
        this.circles = new Map<number, any>();
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

        this.dragListener = this._newDragListener(that);
        this.gestureListener = this._newGestureListener(that);

        this.fragment.setMapMarkerDragListener(this.dragListener);

        const isolatedDiskCacheRootPathStatus = com.here.android.mpa.common.MapSettings.setIsolatedDiskCacheRootPath(
            this._context.getExternalFilesDir(null) + java.io.File.separator + ".here-maps",
            "tns.here.MapService"
        )

        console.log(`Isolate Disk Cache: ${isolatedDiskCacheRootPathStatus ? 'OK' : 'WITH ERRORS'}`)

        this.navigationManagerListener = new NavigationManagerEventListener()
        this.positionListener = this._newPositionListener(that);
        this.rerouteListener = this._newRerouteListener(that);
        this.listener = this._newEngineInitListener(that);

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

        this.navigationManager.removeNavigationManagerEventListener(this.navigationManagerListener)
        this.navigationManager.removePositionListener(this.positionListener)
        this.navigationManager.removeRerouteListener(this.rerouteListener)

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

    public setStops(points: Array<any>, showMarkers: boolean): void {
        this.nativeStops = [];
        if (this.nativeMarkers.size > 0) {
            this.clearMarkers()
        }
        points.forEach((point, index) => {
            console.dir(`Point ${index} create`)
            const waypoint = new com.here.android.mpa.routing.RouteWaypoint(
                new com.here.android.mpa.common.GeoCoordinate(
                    java.lang.Double.valueOf(point.latitude).doubleValue(),
                    java.lang.Double.valueOf(point.longitude).doubleValue()
                )
            )
            this.nativeStops.push(waypoint)
            if (showMarkers) {
                this.addMarker(point)
            }
            console.dir(`Point ${index} created`)
        })
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

    navigateTo(latitude: number, longitude: number): Promise<any> {
        console.dir('Position object!')
        return new Promise<any>((resolve, reject) => {
            const position = com.here.android.mpa.common.PositioningManager.getInstance().getPosition()
            console.dir(position)
            console.dir('Position object!')

            if (!position) {
                reject()
                return
            }

            if (!latitude || !longitude) {
                reject()
                return
            }

            const points = [{
                latitude: position.coordinates.latitude,
                longitude: position.coordinates.longitude
            }, {
                latitude: latitude,
                longitude: longitude
            }]
            this.setStops(points, true);
            this.calculateRoute()
                .then(() => {
                    resolve()
                })
                .catch(() => {
                    reject()
                })
        });
    }

    calculateRoute(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {

                if (this.nativeStops.length < 2) {
                    reject();
                    return;
                }

                const coreRouter = new com.here.android.mpa.routing.CoreRouter()
                console.log('coreRouter')

                const routePlan = new com.here.android.mpa.routing.RoutePlan()
                console.log('routePlan')

                this.routeOptions = new com.here.android.mpa.routing.RouteOptions()

                const optionsPresset = this.navigationModePressets[this.navigationMode]

                this.routeOptions.setTransportMode(com.here.android.mpa.routing.RouteOptions.TransportMode[optionsPresset.transportMode])
                this.routeOptions.setHighwaysAllowed(false)
                this.routeOptions.setParksAllowed(true)
                this.routeOptions.setRouteType(com.here.android.mpa.routing.RouteOptions.Type[optionsPresset.routeType])
                this.routeOptions.setRouteCount(1)

                console.log('Route Params')

                routePlan.setRouteOptions(this.routeOptions);

                this.nativeStops.forEach(waypoint => {
                    routePlan.addWaypoint(waypoint)
                })
                console.log('Added points')

                const that = new WeakRef<Here>(this);
                const routerListener = this._newRouterListener(that, resolve, reject)

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
                permissions
                    .requestPermission(
                        android.Manifest.permission.ACCESS_FINE_LOCATION,
                        "I need these permissions to get your current location"
                    )
                    .then(() => {
                        map.setTilt(60);
                        map.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE)

                        const managerError = this.navigationManager.startNavigation(this.navigationRoute)

                        console.dir(managerError)
                        resolve()
                    }).catch(() => {
                        console.log("Uh oh, no permissions - plan B time!");
                        reject()
                    });

            }
        })
    }

    startSimulation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                permissions
                    .requestPermission(
                        android.Manifest.permission.ACCESS_FINE_LOCATION,
                        "I need these permissions to get your current location"
                    )
                    .then(() => {
                        const map = this.fragment.getMap()

                        map.setTilt(60);
                        map.setZoomLevel(18, com.here.android.mpa.mapping.Map.Animation.NONE)

                        const managerError = this.navigationManager.simulate(this.navigationRoute, 45);

                        console.dir(managerError)
                        resolve()
                    }).catch(() => {
                        console.log("Uh oh, no permissions - plan B time!");
                        reject()
                    });
            }
        })
    }

    stopNavigation(): void {
        if (this.fragment && this.isReady) {
            this.navigationManager.stop();
        }
    }

    pauseNavigation(): Promise<any> {
        return new Promise<any>(resolve => {
            if (this.fragment && this.isReady) {
                this.navigationManager.pause();
            }
        })
    }

    resumeNavigation(): Promise<any> {
        return new Promise<any>(resolve => {
            if (this.fragment && this.isReady) {
                this.navigationManager.resume();
            }
        })
    }

    addMarker(marker: HereMarker): void {
        const map = this.fragment.getMap();
        if (marker.onTap && typeof marker.onTap === 'function') {
            this.markersCallback.set(marker.id, marker.onTap);
        }

        const nativeMarker = new com.here.android.mpa.mapping.MapMarker(
            new com.here.android.mpa.common.GeoCoordinate(
                java.lang.Double.valueOf(marker.latitude).doubleValue(),
                java.lang.Double.valueOf(marker.longitude).doubleValue()
            ),
            this.navigationMarkerIcon
        )

        const ancor = nativeMarker.getAnchorPoint()
        console.dir(ancor)

        nativeMarker.setAnchorPoint(
            new android.graphics.PointF(
                java.lang.Double.valueOf(ancor.x).doubleValue(),
                java.lang.Double.valueOf(ancor.y * 2).doubleValue()
            )
        )
        console.dir('setAnchorPoint')

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
    }

    clearMarkers(): void {
        const map = this.fragment.getMap();
        map.removeMapObjects(Array.from(this.nativeMarkers.values()));
        this.markers.clear();
        this.nativeMarkers.clear();
        this.markersCallback.clear();
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
        nativeObj.setFillColor(android.graphics.Color.argb(90, 0, 153, 255))
        nativeObj.setLineColor(android.graphics.Color.rgb(0, 153, 255))
        nativeObj.setLineWidth(4)
    }

    addCircles(circles): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.fragment && this.isReady) {
                circles.forEach((circle) => {
                    this.addCircle(circle)
                })

                resolve()
            } else {
                reject()
            }
        })
    }

    setNavigationMode(mode: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.navigationMode = mode;
            this.calculateRoute().then(() => {
                resolve()
            }).catch(() => {
                reject()
            })
        })
    }

    _newRerouteListener(that): any {
        class RerouteListener extends com.here.android.mpa.guidance.NavigationManager.RerouteListener {
            onRerouteBegin() {
                console.dir('Reroute!!')
            }

            onRerouteEnd(routeResults, routingError) {
                const owner = that ? that.get() : null;
                if (!owner) return;
                const mapFragment = owner.fragment
                const map = mapFragment.getMap()

                if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                    if (routeResults.getRoute() != null) {

                        owner.navigationRoute = routeResults.getRoute();
                        console.log('navigationRoute')

                        map.removeMapObject(owner.mapRoute)
                        owner.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                        console.log('mapRoute')

                        owner.mapRoute.setManeuverNumberVisible(true)
                        map.addMapObject(owner.mapRoute)

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
        return new RerouteListener()
    }

    _newPositionListener(that): any {
        class PositionListener extends com.here.android.mpa.guidance.NavigationManager.PositionListener {
            onPositionUpdated(geoPosition) {
                const owner = that ? that.get() : null;
                // console.dir(geoPosition)
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
        return new PositionListener()
    }

    _newEngineInitListener(that) {
        return new com.here.android.mpa.common.OnEngineInitListener({
            onEngineInitializationCompleted(error): void {
                const owner = that ? that.get() : null;
                console.log('HERE ENGINE INIT!')
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

                    owner.navigationManager.addRerouteListener(
                        new java.lang.ref.WeakReference(owner.rerouteListener)
                    )

                    owner.navigationArrowIcon = new com.here.android.mpa.common.Image()
                    const decodedString = android.util.Base64.decode(navigation_arrow, android.util.Base64.DEFAULT);
                    const decodedByte = android.graphics.BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                    owner.navigationArrowIcon.setBitmap(decodedByte)
                    owner.navigationArrow = new com.here.android.mpa.mapping.MapMarker(
                        new com.here.android.mpa.common.GeoCoordinate(0, 0),
                        owner.navigationArrowIcon
                    )

                    // mapFragment.getPositionIndicator().setVisible(true);

                    owner.navigationMarkerIcon = new com.here.android.mpa.common.Image()
                    const decodedStringMarker = android.util.Base64.decode(
                        icon_source.replace('data:image/png;base64,', ''),
                        android.util.Base64.DEFAULT
                    )
                    const decodedByteMarker = android.graphics.BitmapFactory.decodeByteArray(decodedStringMarker, 0, decodedStringMarker.length);
                    owner.navigationMarkerIcon.setBitmap(decodedByteMarker)

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
        })
    }

    _newRouterListener(that, resolve, reject) {
        return new com.here.android.mpa.routing.Router.Listener({
            onProgress(percent): void {
                const owner = that ? that.get() : null;
                console.log(`Calculate route: ${percent}%`)
                owner.routeProgress = percent;
                //android.widget.Toast.makeText(this._context, `Calculate route: ${percent}%`, android.widget.Toast.LENGTH_SHORT).show();
            },

            onCalculateRouteFinished(routeResults, routingError): void {
                const owner = that ? that.get() : null;
                if (!owner) return;
                if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                    if (routeResults.get(0).getRoute() != null) {

                        owner.navigationRoute = routeResults.get(0).getRoute();

                        const map = owner.fragment.getMap();
                        console.log('navigationRoute')

                        console.dir(owner.mapRoute)
                        if (owner.mapRoute) {
                            map.removeMapObject(owner.mapRoute)
                        }

                        owner.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                        console.log('mapRoute')

                        owner.mapRoute.setManeuverNumberVisible(true)
                        map.addMapObject(owner.mapRoute)

                        owner.navigationRouteBoundingBox = routeResults.get(0).getRoute().getBoundingBox();
                        owner.navigationRouteBoundingBox.expand(200, 200)

                        map.setOrientation(0);
                        map.zoomTo(
                            owner.navigationRouteBoundingBox,
                            com.here.android.mpa.mapping.Map.Animation.NONE,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION
                        );
                        resolve()
                    } else {
                        console.log('Woooops... route results returned is not valid')
                        reject('Woooops... route results returned is not valid')
                    }
                } else {
                    console.log('Woooops... route calculation returned error code: ' + routingError)
                    reject('Woooops... route calculation returned error code: ' + routingError)
                }
            }
        })
    }

    _newGestureListener(that) {
        return new com.here.android.mpa.mapping.MapGesture.OnGestureListener({
            onPanStart(): void {
            },

            onPanEnd(): void {
            }
            ,
            onMultiFingerManipulationStart(): void {
            }
            ,
            onMultiFingerManipulationEnd(): void {
            }
            ,
            onMapObjectsSelected(objects: java.util.List<any>): boolean {
                const owner = that ? that.get() : null;
                if (!owner) return false;
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
                return false;
            }
            ,
            onTapEvent(point: globalAndroid.graphics.PointF): boolean {
                const owner = that ? that.get() : null;
                if (!owner) return false;
                const map = owner.fragment ? owner.fragment.getMap() : null;
                if (!map) return false;
                const cord = map.pixelToGeo(point);
                owner.notify({
                    eventName: HereBase.mapClickEvent,
                    object: owner,
                    latitude: cord.getLatitude(),
                    longitude: cord.getLongitude()
                });
                return false;
            }
            ,
            onDoubleTapEvent(param0: globalAndroid.graphics.PointF): boolean {
                return false;
            }
            ,
            onPinchLocked(): void {
            }
            ,
            onPinchZoomEvent(param0: number, param1: globalAndroid.graphics.PointF): boolean {
                return false;
            }
            ,
            onRotateLocked(): void {
            }
            ,
            onRotateEvent(param0: number): boolean {
                return false;
            }
            ,
            onTiltEvent(param0: number): boolean {
                return false;
            }
            ,
            onLongPressEvent(point: globalAndroid.graphics.PointF): boolean {
                const owner = that ? that.get() : null;
                if (!owner) return false;
                const map = owner.fragment ? owner.fragment.getMap() : null;
                if (!map) return false;
                const cord = map.pixelToGeo(point);
                owner.notify({
                    eventName: HereBase.mapLongClickEvent,
                    object: owner,
                    latitude: cord.getLatitude(),
                    longitude: cord.getLongitude()
                });
                return false;
            }
            ,
            onLongPressRelease(): void {
            }
            ,
            onTwoFingerTapEvent(param0: globalAndroid.graphics.PointF): boolean {
                return false;
            }
        })
    }

    _newDragListener(that) {
        return new com.here.android.mpa.mapping.MapMarker.OnDragListener({
            onMarkerDragStart(nativeMarker): void {

            }
            ,
            onMarkerDrag(nativeMarker) {

            },
            onMarkerDragEnd(nativeMarker) {
                const owner = that ? that.get() : null;
                if (!owner) return;
                const marker = owner.markers.get(nativeMarker);
                owner.nativeMarkers.set(marker.id, nativeMarker);
                const cord = nativeMarker.getCoordinate();
                marker.longitude = cord.getLongitude();
                marker.latitude = cord.getLatitude();
                owner.markers.set(nativeMarker, marker);
            }
        })
    }
}

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

    onStopoverReached(index) {
        console.log("Stopover " + index)
    }
}