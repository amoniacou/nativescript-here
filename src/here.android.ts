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
//import { Color } from 'tns-core-modules/color';
//import { navigation_arrow } from './icon-arrow';
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
    private positionListenerKlass;
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
    private coreRouter;
    private routePlan;
    private routerListener;

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

    public static init(appId: string, appCode: string, licenseKey: string) {

    }

    public static estimateMapDataSize(points: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const mdp = com.here.android.mpa.prefetcher.MapDataPrefetcher.getInstance()

            const coreRouter = new com.here.android.mpa.routing.CoreRouter()
            const routePlan = new com.here.android.mpa.routing.RoutePlan()
            const routeOptions = new com.here.android.mpa.routing.RouteOptions()

            routeOptions.setTransportMode(com.here.android.mpa.routing.RouteOptions.TransportMode.CAR)
            routeOptions.setHighwaysAllowed(false)
            routeOptions.setParksAllowed(true)
            routeOptions.setRouteType(com.here.android.mpa.routing.RouteOptions.Type.FASTEST)
            routeOptions.setRouteCount(1)

            routePlan.setRouteOptions(routeOptions);

            points.forEach((point, index) => {
                const waypoint = new com.here.android.mpa.routing.RouteWaypoint(
                    new com.here.android.mpa.common.GeoCoordinate(
                        java.lang.Double.valueOf(point.latitude).doubleValue(),
                        java.lang.Double.valueOf(point.longitude).doubleValue()
                    ),
                    com.here.android.mpa.routing.RouteWaypoint.Type.STOP_WAYPOINT
                )

                routePlan.addWaypoint(waypoint)
            })

            const routerListener = new com.here.android.mpa.routing.CoreRouter.Listener({
                onProgress(_percent): void { },
                onCalculateRouteFinished(routeResults, routingError): void {
                    if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                        const route = routeResults.get(0).getRoute();

                        if (route !== null) {
                            const result = mdp.estimateMapDataSize(route, 500)

                            resolve(result);
                        } else {
                            reject();
                        }
                    } else {
                        reject();
                    }
                }
            });

            coreRouter.calculateRoute(routePlan, routerListener)
        })
    }

    public static fetchMapData(points: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve();
        })
    }

    public createNativeView(): Object {
        console.log('create a new native view')
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
        const activity =
            app.android.foregroundActivity || app.android.startActivity;
        const manager = activity.getSupportFragmentManager();
        manager
            .beginTransaction()
            .replace(this._layoutId, this.fragment as any, this.FRAGMENT_ID)
            .commitAllowingStateLoss();

        const that = new WeakRef<Here>(this);
        //const owner = this;
        console.log("current object is: ", this._layoutId);

        this.dragListener = this._newDragListener(that);
        this.gestureListener = this._newGestureListener(that);

        this.fragment.setMapMarkerDragListener(this.dragListener);

        const isolatedDiskCacheRootPathStatus = com.here.android.mpa.common.MapSettings.setIsolatedDiskCacheRootPath(
            this._context.getExternalFilesDir(null) + java.io.File.separator + ".here-maps",
            "tns.here.MapService"
        )

        console.log(`Isolate Disk Cache: ${isolatedDiskCacheRootPathStatus ? 'OK' : 'WITH ERRORS'}`)

        //this.positionListenerKlass = PositionListenerImpl
        this.listener = this._newEngineInitListener(that);

        return nativeView;
    }

    public initNativeView(): void {
        (<any>this.nativeView).owner = this;
        this.context = new com.here.android.mpa.common.ApplicationContext(this._context)
        this.fragment.init(this.context, this.listener);
        super.initNativeView();
    }

    public disposeNativeView(): void {
        console.log('free memory')
        this.removeNavigation()
        super.disposeNativeView();
    }

    public removeNavigation(): void {
        console.log('remove navigation')
        if (this.fragment) {
            const mapGesture = typeof this.fragment.getMapGesture === 'function' ? this.fragment.getMapGesture() : null;
            //this.fragment.removeOnMapRenderListener(this.listener);
            if (mapGesture) {
                console.log('remove gesture listener')
                this.fragment.getMapGesture().removeOnGestureListener(this.gestureListener);
            }
        }
        console.log('clear markers')
        this.clearMarkers()
        console.log('clear circles')
        this.clearCircles()
        console.log('remove position manager')
        const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance()
        if (this.navigationManagerListener) {
            navigationManager.removeNavigationManagerEventListener(this.navigationManagerListener)
            this.navigationManagerListener = null;
        }
        if (this.positionListener) {
            navigationManager.removePositionListener(this.positionListener)
            this.positionListener = null;
        }
        if (this.rerouteListener) {
            navigationManager.removeRerouteListener(this.rerouteListener);
            this.rerouteListener = null;
        }
        console.log('stop navigation manager!!!!')
        if (navigationManager) {
            navigationManager.stop()
            console.log('nullify map')
            navigationManager.setMap(null);
        }
        console.log('stoppping positioning manager');
        com.here.android.mpa.common.PositioningManager.getInstance().stop()
        com.here.android.mpa.guidance.NavigationManager.getInstance().getAudioPlayer().stop()
        console.log('navigation removal finished')
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
        console.log('set stops')
        if (this.nativeMarkers.size > 0) {
            this.clearMarkers()
        }
        console.log('afterClear')
        points.forEach((point, index) => {
            console.dir(`Point ${index} create`)
            const waypoint = new com.here.android.mpa.routing.RouteWaypoint(
                new com.here.android.mpa.common.GeoCoordinate(
                    java.lang.Double.valueOf(point.latitude).doubleValue(),
                    java.lang.Double.valueOf(point.longitude).doubleValue()
                ),
                com.here.android.mpa.routing.RouteWaypoint.Type.STOP_WAYPOINT
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

                if (!this.coreRouter) {
                    this.coreRouter = new com.here.android.mpa.routing.CoreRouter()
                    console.log('coreRouter')
                }

                this.routePlan = new com.here.android.mpa.routing.RoutePlan()
                console.log('routePlan')

                this.routeOptions = new com.here.android.mpa.routing.RouteOptions()

                const optionsPresset = this.navigationModePressets[this.navigationMode]

                this.routeOptions.setTransportMode(com.here.android.mpa.routing.RouteOptions.TransportMode[optionsPresset.transportMode])
                this.routeOptions.setHighwaysAllowed(false)
                this.routeOptions.setParksAllowed(true)
                this.routeOptions.setRouteType(com.here.android.mpa.routing.RouteOptions.Type[optionsPresset.routeType])
                this.routeOptions.setRouteCount(1)

                console.log('Route Params')

                this.routePlan.setRouteOptions(this.routeOptions);

                this.nativeStops.forEach(waypoint => {
                    this.routePlan.addWaypoint(waypoint)
                })
                console.log('Added points')

                const that = new WeakRef<Here>(this);
                this.routerListener = this._newRouterListener(that, resolve, reject)

                this.coreRouter.calculateRoute(this.routePlan, this.routerListener)
            } else {
                reject();
            }
        })
    }

    getCurrentPosition(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const position = com.here.android.mpa.common.PositioningManager.getInstance().getPosition()
            if (position) {
                resolve({
                    latitude: position.coordinates.latitude,
                    longitude: position.coordinates.longitude,
                })
            } else {
                reject('unable to get current position from position manager')
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
                        console.log('set enabled speed warning')
                        const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance()
                        navigationManager.setSpeedWarningEnabled(false)
                        console.log('trying to start navigation')
                        const managerError = navigationManager.startNavigation(this.navigationRoute)
                        if (managerError == com.here.android.mpa.guidance.NavigationManager.Error.NONE) {
                            map.setZoomLevel(map.getMaxZoomLevel(), com.here.android.mpa.mapping.Map.Animation.NONE)
                            map.setTilt(60);
                            console.log('set map update mode')
                            const that = new WeakRef<Here>(this);
                            if (this.navigationManagerListener) {
                                navigationManager.removeNavigationManagerEventListener(this.navigationManagerListener)
                                this.navigationManagerListener = null;
                            }
                            this.navigationManagerListener = this._newNavigationManagerListener(that);
                            navigationManager.addNavigationManagerEventListener(
                                new java.lang.ref.WeakReference(this.navigationManagerListener)
                            )
                            if (this.positionListener) {
                                navigationManager.removePositionListener(this.positionListener)
                                this.positionListener = null;
                            }
                            this.positionListener = this._newPositionListener(that);
                            if (this.rerouteListener) {
                                navigationManager.removeRerouteListener(this.rerouteListener);
                                this.rerouteListener = null;
                            }
                            this.rerouteListener = this._newRerouteListener(that);

                            navigationManager.addPositionListener(
                                new java.lang.ref.WeakReference(this.positionListener)
                            )

                            navigationManager.addRerouteListener(
                                new java.lang.ref.WeakReference(this.rerouteListener)
                            )
                            navigationManager.setMapUpdateMode(com.here.android.mpa.guidance.NavigationManager.MapUpdateMode.ROADVIEW_NOZOOM)
                            resolve()
                        } else {
                            reject(managerError)
                        }
                    }).catch((e) => {
                        console.log("Uh oh, no permissions - plan B time!");
                        console.dir(e)
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

                        //console.dir(managerError)
                        resolve()
                    }).catch(() => {
                        console.log("Uh oh, no permissions - plan B time!");
                        reject()
                    });
            }
        })
    }

    stopNavigation(): void {
        if (this.fragment) {
            const mapGesture = typeof this.fragment.getMapGesture === 'function' ? this.fragment.getMapGesture() : null;
            if (mapGesture) {
                console.log('clear map gesture')
                this.fragment.getMapGesture().removeOnGestureListener(this.gestureListener);
            }
        }
        const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance()
        if (this.navigationManagerListener) {
            console.log('remove navigation manager listener')
            navigationManager.removeNavigationManagerEventListener(this.navigationManagerListener)
            console.log('set navigation manager listener to null')
            this.navigationManagerListener = null;
            console.log('set navigation manager listener to null - done')
        }
        if (this.positionListener) {
            console.log('remove position listener')
            navigationManager.removePositionListener(this.positionListener)
            console.log('set position listener to null')
            this.positionListener = null;
            console.log('set position listener to null - done')
        }
        if (this.rerouteListener) {
            console.log('remove rerouter listener')
            navigationManager.removeRerouteListener(this.rerouteListener);
            console.log('set reouter listener to null')
            this.rerouteListener = null;
            console.log('set reouter listener to null - done')
        }
        console.log('clear markers')
        this.clearMarkers()
        console.log('clear circles')
        this.clearCircles()
        if (navigationManager) {
            navigationManager.stop()
        }
        console.log('stop navigation manager')
        com.here.android.mpa.guidance.NavigationManager.getInstance().stop()
        console.log('navigation manager stopped')
        com.here.android.mpa.guidance.NavigationManager.getInstance().getAudioPlayer().stop()
        console.log('stopped audio player')
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

        nativeMarker.setAnchorPoint(
            new android.graphics.PointF(
                java.lang.Double.valueOf(ancor.x).doubleValue(),
                java.lang.Double.valueOf(ancor.y * 2).doubleValue()
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
    }

    clearMarkers(): void {
        const map = this.fragment.getMap();
        //console.dir('get fragment')
        //console.dir(this.nativeMarkers.size)
        if (this.nativeMarkers.size > 0) {
            const markers = Array.from(this.nativeMarkers.values())
            markers.forEach(marker => {
                map.removeMapObject(marker);
            })
            //console.dir('remove objects')
        }
        //console.dir('after remove')
        this.markers.clear();
        //console.dir('markers.clear')
        this.nativeMarkers.clear();
        //console.dir('nativeMarkers.clear')
        this.markersCallback.clear();
        //console.dir('markersCallback.clear')
    }

    addCircle(circle): void {
        if (this.fragment && this.isReady) {
            const map = this.fragment.getMap()

            const nativeObj = new com.here.android.mpa.mapping.MapCircle()

            this._setCircleOptions(nativeObj, circle)
            map.addMapObject(nativeObj)
            this.nativeCircles.set(circle.id, nativeObj)
        }
    }

    updateCircle(circle): void {
        if (this.fragment && this.isReady) {
            const nativeObj = this.nativeCircles.get(circle.id);
            if (!nativeObj) return this.addCircle(circle);
            this._setCircleOptions(nativeObj, circle)
        }
    }

    clearCircles(): void {
        const map = this.fragment.getMap();
        if (this.nativeCircles.size > 0) {
            const circles = Array.from(this.nativeCircles.values())
            circles.forEach(circle => {
                map.removeMapObject(circle);
            })
            console.dir('remove objects')
        }
        this.nativeCircles.clear()
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
            }).catch((e) => {
                reject(e)
            })
        })
    }

    _newRerouteListener(that): any {
        class RerouteListener extends com.here.android.mpa.guidance.NavigationManager.RerouteListener {
            public ownerLink;

            setOwner(thatLink) {
                this.ownerLink = thatLink;
            }

            onRerouteBegin() {
                console.dir('Reroute started!!')
            }

            onRerouteEnd(routeResults, routingError) {
                const owner = this.ownerLink ? this.ownerLink.get() : null;
                if (!owner) return;
                const mapFragment = owner.fragment
                const map = mapFragment.getMap()

                if (routingError == com.here.android.mpa.routing.RoutingError.NONE) {
                    const route = routeResults.getRoute()
                    if (route) {
                        map.removeMapObject(owner.mapRoute)
                        owner.mapRoute.setRoute(route)
                        map.addMapObject(owner.mapRoute)
                        //owner.mapRoute.setManeuverNumberVisible(true)

                        //owner.navigationRouteBoundingBox = routeResults.getRoute().getBoundingBox();
                        //owner.navigationRouteBoundingBox.expand(200, 200)
                    } else {
                        console.log('Woooops... route results returned is not valid')
                    }
                } else {
                    console.log('Woooops... route calculation returned error code: ' + routingError)
                }
            }
        }
        const listener = new RerouteListener();
        listener.setOwner(that)
        return listener;
    }

    _newPositionListener(that): any {
        class PositionListenerImpl extends com.here.android.mpa.guidance.NavigationManager.PositionListener {
            public ownerLink;

            setOwner(thatLink) {
                this.ownerLink = thatLink;
            }

            onPositionUpdated(geoPosition) {
                const owner = this.ownerLink ? this.ownerLink.get() : null;
                // console.dir(geoPosition)
                console.log('get owner in position update!')
                if (!owner) return;
                console.log('get fragment in position update!')
                console.log("current object owner is: ", owner._layoutId);
                const mapFragment = owner.fragment
                if (!mapFragment) return;
                console.log('get map in position update!')
                const map = mapFragment.getMap()
                if (!map) return
                console.log('get coordinate in position update!')
                const coordinate = geoPosition.getCoordinate()
                if (!coordinate) return
                const lat = coordinate.getLatitude()
                const lng = coordinate.getLongitude()
                const heading = geoPosition.getHeading()
                const position = new com.here.android.mpa.common.GeoCoordinate(lat, lng)

                console.log('set center in position update!')
                map.setCenter(
                    position,
                    com.here.android.mpa.mapping.Map.Animation.LINEAR,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL,
                    heading,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT
                )
                console.log('notify about position update!')
                console.dir(`Navigation: lat: ${lat}, lng: ${lng}, heading: ${heading}`)
                owner.notify({
                    eventName: HereBase.geoPositionChange,
                    object: owner,
                    latitude: lat,
                    longitude: lng,
                    heading
                });
                return
            }
        }
        const listener = new PositionListenerImpl()
        listener.setOwner(that)
        return listener;
    }

    _newNavigationManagerListener(that): any {
        class NavigationManagerEventListener extends com.here.android.mpa.guidance.NavigationManager.NavigationManagerEventListener {
            public ownerLink;

            setOwner(thatLink) {
                this.ownerLink = thatLink;
            }

            onRunningStateChanged() {
                console.log("Running state changed")
                //android.widget.Toast.makeText(this._context, "Running state changed", android.widget.Toast.LENGTH_SHORT).show();
            }

            onNavigationModeChanged() {
                console.log("Navigation mode changed")
                //android.widget.Toast.makeText(this._context, "Navigation mode changed", android.widget.Toast.LENGTH_SHORT).show();
            }

            onEnded(navigationMode) {
                console.log("Navigation ended")
                //android.widget.Toast.makeText(this._context, navigationMode + " was ended", android.widget.Toast.LENGTH_SHORT).show();
                //stopForegroundService();
            }

            onMapUpdateModeChanged(mapUpdateMode) {
                console.log("Running state changed in onMapUpdateModeChanged: ", mapUpdateMode)
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
                console.log("stopover reached")
                const owner = this.ownerLink ? this.ownerLink.get() : null;
                if (!owner) return;
                const mapFragment = owner.fragment
                if (!mapFragment) return;
                const map = mapFragment.getMap()
                if (!map) return
                const geoPosition = com.here.android.mpa.common.PositioningManager.getInstance().getPosition()
                const coordinate = geoPosition.getCoordinate()
                const lat = coordinate.getLatitude()
                const lng = coordinate.getLongitude()
                const heading = geoPosition.getHeading()
                const position = new com.here.android.mpa.common.GeoCoordinate(lat, lng)
                map.setCenter(
                    position,
                    com.here.android.mpa.mapping.Map.Animation.LINEAR,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL,
                    heading,
                    com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT
                )

                owner.notify({
                    eventName: HereBase.geoPositionChange,
                    object: owner,
                    latitude: lat,
                    longitude: lng,
                    heading
                })

                console.dir(`Navigation: lat: ${lat}, lng: ${lng}, heading: ${heading}`)
            }
        }
        const listener = new NavigationManagerEventListener()
        listener.setOwner(that)
        return listener
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
                    map.setExtrudedBuildingsVisible(false)
                    const mapGesture = mapFragment.getMapGesture()

                    owner.isReady = true;

                    if (mapGesture) {
                        mapGesture.addOnGestureListener(owner.gestureListener, 1, true)
                    }

                    com.here.android.mpa.common.PositioningManager.getInstance().start(
                        com.here.android.mpa.common.PositioningManager.LocationMethod.GPS_NETWORK
                    )

                    const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance()
                    navigationManager.setMap(map)
                    owner.navigationMarkerIcon = new com.here.android.mpa.common.Image()
                    const decodedStringMarker = android.util.Base64.decode(
                        icon_source.replace('data:image/png;base64,', ''),
                        android.util.Base64.DEFAULT
                    )
                    const decodedByteMarker = android.graphics.BitmapFactory.decodeByteArray(decodedStringMarker, 0, decodedStringMarker.length);
                    owner.navigationMarkerIcon.setBitmap(decodedByteMarker)

                    //mapFragment.getPositionIndicator().setMarker(owner.navigationArrowIcon)
                    mapFragment.getPositionIndicator().setVisible(true);
                    //map.addMapObject(owner.navigationArrow)

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

                    map.setZoomLevel((map.getMaxZoomLevel() + map.getMinZoomLevel()) / 2)

                    map.setTilt(owner.tilt)

                    map.setLandmarksVisible(true)
                    map.setExtrudedBuildingsVisible(true)
                    owner.navigationManager = navigationManager;

                    if (types.isNumber(+owner.latitude) && types.isNumber(+owner.longitude)) {
                        map.setCenter(
                            new com.here.android.mpa.common.GeoCoordinate(java.lang.Double.valueOf(owner.latitude).doubleValue(), java.lang.Double.valueOf(owner.longitude).doubleValue()),
                            com.here.android.mpa.mapping.Map.Animation.NONE,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ZOOM_LEVEL,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_TILT);
                    }
                    console.log('check voice catalog')
                    const voiceCatalog = com.here.android.mpa.guidance.VoiceCatalog.getInstance()
                    console.log('get eng voice id')
                    let id = owner.engVoiceId();
                    // Need to download
                    if (id === -1) {
                        console.log('download voice catalog')
                        voiceCatalog.downloadCatalog(new com.here.android.mpa.guidance.VoiceCatalog.OnDownloadDoneListener({
                            onDownloadDone(error) {
                                if (error == com.here.android.mpa.guidance.VoiceCatalog.Error.NONE) {
                                    let vid = owner.engVoiceId()
                                    console.log('catalog downloaded. ID: ', vid)
                                    owner.downloadVoiceAndNotify(vid, owner.fragment);
                                } else {
                                    console.log('Error in download catalog: ', error)
                                    owner.downloadVoiceAndNotify(-1, owner.fragment);
                                }
                            }
                        }))

                    } else {
                        console.log('no need to download catalog')
                        owner.downloadVoiceAndNotify(id, owner.fragment)
                    }


                } else {
                    console.dir('ERROR')
                    console.log(error.getDetails());
                }
            }
        })
    }

    downloadVoiceAndNotify(id, fragment) {
        if (id === -1) {
            this.notify({
                eventName: HereBase.mapReadyEvent,
                object: this,
                android: fragment,
                ios: null
            });
            return;
        }
        const voiceCatalog = com.here.android.mpa.guidance.VoiceCatalog.getInstance()
        const owner = this;
        console.log('is local voice skin?')
        if (!voiceCatalog.isLocalVoiceSkin(id)) {
            console.log('need to download voice skin')
            voiceCatalog.downloadVoice(id, new com.here.android.mpa.guidance.VoiceCatalog.OnDownloadDoneListener({
                onDownloadDone(error) {
                    if (error == com.here.android.mpa.guidance.VoiceCatalog.Error.NONE) {
                        console.log('skin downloaded')
                        const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance();
                        const voiceGuidanceOptions = navigationManager.getVoiceGuidanceOptions();
                        voiceGuidanceOptions.setVoiceSkin(voiceCatalog.getLocalVoiceSkin(id))
                        owner.notify({
                            eventName: HereBase.mapReadyEvent,
                            object: owner,
                            android: fragment,
                            ios: null
                        });
                        return
                    } else {
                        console.log('skin not downloaded:')
                        console.dir(error == com.here.android.mpa.guidance.VoiceCatalog.Error.NOT_ENOUGH_DISK_SPACE ? "no disk space" : "unknown")
                        owner.notify({
                            eventName: HereBase.mapReadyEvent,
                            object: owner,
                            android: fragment,
                            ios: null
                        });
                    }
                }
            }))
        } else {
            console.log("set voice language to :", id)
            const navigationManager = com.here.android.mpa.guidance.NavigationManager.getInstance();
            const voiceGuidanceOptions = navigationManager.getVoiceGuidanceOptions();
            voiceGuidanceOptions.setVoiceSkin(voiceCatalog.getLocalVoiceSkin(id))
            owner.notify({
                eventName: HereBase.mapReadyEvent,
                object: owner,
                android: fragment,
                ios: null
            });
        }
    }

    engVoiceId() {
        let id = -1;
        const voicePackages = com.here.android.mpa.guidance.VoiceCatalog.getInstance().getCatalogList()
        //console.dir(voicePackages)
        //voicePackages
        for (let i = 0, len = voicePackages.size(); i < len; i++) {
            const vPackage = voicePackages.get(i);
            //console.dir(vPackage)
            if (vPackage) {
                console.log("voice: ", vPackage.getMarcCode(), vPackage.getId(), vPackage.isTts())
            }
            if (vPackage.getMarcCode() == "eng" || vPackage.getMarcCode() == "ENG") {
                if (vPackage.isTts()) {
                    id = vPackage.getId()
                    break;
                }
            }
        }
        return id;
    }

    _newRouterListener(that, resolve, reject) {
        return new com.here.android.mpa.routing.CoreRouter.Listener({
            onProgress(percent): void {
                const owner = that ? that.get() : null;
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
                        console.log('navigationRoute calculation finished')

                        if (owner.mapRoute) {
                            console.log('remove map route if exist')
                            map.removeMapObject(owner.mapRoute)
                        }

                        owner.mapRoute = new com.here.android.mpa.mapping.MapRoute(owner.navigationRoute);
                        if (!owner.mapRoute) {
                            reject("no route!!!")
                            return
                        }
                        console.log('mapRoute')

                        owner.mapRoute.setManeuverNumberVisible(true)
                        console.log('add new map route to map')
                        map.addMapObject(owner.mapRoute)

                        console.log('set route bounding boxes')
                        owner.navigationRouteBoundingBox = routeResults.get(0).getRoute().getBoundingBox();
                        owner.navigationRouteBoundingBox.expand(200, 200)

                        console.log('set orientation')
                        map.setOrientation(0);
                        console.log('set zoom')
                        map.zoomTo(
                            owner.navigationRouteBoundingBox,
                            com.here.android.mpa.mapping.Map.Animation.NONE,
                            com.here.android.mpa.mapping.Map.MOVE_PRESERVE_ORIENTATION
                        );
                        console.log('calculation finished and added')
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
                //const owner = that ? that.get() : null;
                //if (!owner) return false;
                //const size = objects.size();
                //for (let i = 0; i < size; i++) {
                //    const nativeMarker = objects.get(i);
                //    const marker = owner.markers.get(nativeMarker);
                //    if (marker) {
                //        const callback = owner.markersCallback.get(marker.id);
                //        if (callback) {
                //            callback(marker);
                //        }
                //    }
                //}
                return false;
            }
            ,
            onTapEvent(point: globalAndroid.graphics.PointF): boolean {
                //const owner = that ? that.get() : null;
                //if (!owner) return false;
                //const map = owner.fragment ? owner.fragment.getMap() : null;
                //if (!map) return false;
                //const cord = map.pixelToGeo(point);
                //if (!cord) {
                //    return false
                //}
                //owner.notify({
                //    eventName: HereBase.mapClickEvent,
                //    object: owner,
                //    latitude: cord.getLatitude(),
                //    longitude: cord.getLongitude()
                //});
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
                //const owner = that ? that.get() : null;
                //if (!owner) return false;
                //const map = owner.fragment ? owner.fragment.getMap() : null;
                //if (!map) return false;
                //const cord = map.pixelToGeo(point);
                //owner.notify({
                //    eventName: HereBase.mapLongClickEvent,
                //    object: owner,
                //    latitude: cord.getLatitude(),
                //    longitude: cord.getLongitude()
                //});
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
                //const owner = that ? that.get() : null;
                //if (!owner) return;
                //const marker = owner.markers.get(nativeMarker);
                //owner.nativeMarkers.set(marker.id, nativeMarker);
                //const cord = nativeMarker.getCoordinate();
                //marker.longitude = cord.getLongitude();
                //marker.latitude = cord.getLatitude();
                //owner.markers.set(nativeMarker, marker);
            }
        })
    }
}
