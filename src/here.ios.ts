import * as common from './here.common';
import {
    disableScrollProperty,
    disableZoomProperty,
    HereBase,
    HereMapStyle,
    HereMarker,
    mapStyleProperty,
    zoomLevelProperty
} from './here.common';
import { layout } from 'tns-core-modules/utils/utils';
import * as types from 'tns-core-modules/utils/types';
import { ios_icon } from './icon-source';

declare var NMAMapView,
    NMAApplicationContext,
    NMAMapViewDelegate,
    NMAMapSchemeHybridDay,
    NMAMapSchemeSatelliteDay,
    NMAMapSchemeTerrainDay,
    NMAMapSchemeNormalDay,
    NMAMapAnimation,
    NMAMapGestureType,
    NMAGeoCoordinates,
    NMAMapMarker,
    NMANavigationManager,
    NMACoreRouter,
    NMARoutingType,
    NMATransportMode,
    NMARoutingOption,
    NMARoutingMode;

global.moduleMerge(common, exports);

/**
 * Main HERE implementation class
 */
export class Here extends HereBase {
    nativeMarkers: Map<number, any>;
    nativeCircles: Map<number, any>;
    markersCallback: Map<number, any>;
    markers: Map<any, HereMarker>;
    private delegate: NMAMapViewDelegateImpl;
    private gestureDelegate: NMAMapGestureDelegateImpl;
    isReady: boolean = false;
    private _defaultMarkerIcon;
    private router;
    private navigationRouteBoundingBox;
    private navigationManager;
    private positionObserver;
    private route;
    private nativeStops;
    private routingMode;
    private mapRoute;

    readonly navigationModePressets = {
        walk: {
            transportMode: 'Pedestrian',
            routeType: 'Fastest'
        },
        bike: {
            transportMode: 'Scooter',
            routeType: 'Fastest'
        },
        car: {
            transportMode: 'Car',
            routeType: 'Fastest'
        },
        pub_tr: {
            transportMode: 'PublicTransport',
            routeType: 'Fastest'
        },
        uber: {
            transportMode: 'Car',
            routeType: 'Fastest'
        },
        boat: {
            transportMode: 'Pedestrian',
            routeType: 'Fastest'
        },
        copter: {
            transportMode: 'Pedestrian',
            routeType: 'Fastest'
        },
        horse: {
            transportMode: 'Pedestrian',
            routeType: 'Fastest'
        }
    }

    constructor() {
        super();
        console.log('HERE initialized')
    }

    public static init(appId: string, appCode: string, licenseKey: string) {
        NMAApplicationContext.setAppIdAppCodeLicenseKey(appId, appCode, licenseKey);
    }

    public static estimateMapDataSize(points: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve();
        })
    }

    public static fetchMapData(points: any[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve();
        })
    }

    public updateRoute(newRoute: NMARoute): void {
        this.route = newRoute;
        if (this.mapRoute) {
            this.nativeView.removeMapObject(this.mapRoute)
        }
        this.navigationManager.setRoute(this.route)
        this.mapRoute = NMAMapRoute.alloc().initWithRoute(this.route)

        this.navigationRouteBoundingBox = this.route.boundingBox
        this.nativeView.addMapObject(this.mapRoute)
    }

    public createNativeView(): Object {
        this.nativeMarkers = new Map<number, any>();
        this.nativeCircles = new Map<number, any>();
        this.markers = new Map<any, HereMarker>();
        this.markersCallback = new Map<number, any>();
        this.delegate = NMAMapViewDelegateImpl.initWithOwner(new WeakRef<Here>(this));
        this.nativeStops = NSMutableArray.alloc().init();
        this.setNavigationMode('walk', false);

        const url = NSURL.URLWithString(ios_icon)
        const data = NSData.dataWithContentsOfURL(url)
        const image = UIImage.imageWithDataScale(data, 3)

        this._defaultMarkerIcon = NMAImage.imageWithUIImage(image)

        return NMAMapView.alloc().initWithFrame(CGRectZero);
    }

    public initNativeView(): void {
        super.initNativeView();
        this.nativeView.delegate = this.delegate;
        this.nativeView.setZoomLevelWithAnimation(this.zoomLevel, NMAMapAnimation.None);

        if (this.disableZoom) {
            this.nativeView.disableMapGestures(NMAMapGestureType.Pinch);
            this.nativeView.disableMapGestures(NMAMapGestureType.DoubleTap);
            this.nativeView.disableMapGestures(NMAMapGestureType.TwoFingerTap);
        }

        if (this.disableScroll) {
            this.nativeView.disableMapGestures(NMAMapGestureType.Pan);
        }

        switch (this.mapStyle) {
            case HereMapStyle.HYBRID_DAY:
                this.nativeView.mapScheme = NMAMapSchemeHybridDay;
                break;
            case HereMapStyle.SATELLITE_DAY:
                this.nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                break;
            case HereMapStyle.TERRAIN_DAY:
                this.nativeView.mapScheme = NMAMapSchemeTerrainDay;
                break;
            default:
                this.nativeView.mapScheme = NMAMapSchemeNormalDay;
                break;
        }

        this.nativeView.setGeoCenterWithAnimation(
            NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(this.latitude, this.longitude),
            NMAMapAnimation.None
        )

        this.navigationManager = NMANavigationManager.sharedNavigationManager()
        this.navigationManager.map = this.nativeView
        this.navigationManager.delegate = NMANavigationManagerDelegateImpl.initWithOwner(new WeakRef<Here>(this));
        //NMAPositioningManager.sharedPositioningManager().dataSource = NMADevicePositionSource.alloc().init()
        console.log('inited')
        return
    }

    public disposeNativeView(): void {
        this.removeNavigation()
        super.disposeNativeView();
        console.log('disposed native view')
    }

    public onLoaded(): void {
        super.onLoaded();
        this.isReady = true;
        console.log('MAP READY!!!!!')
        this.notify({
            eventName: HereBase.mapReadyEvent,
            object: this,
            android: null,
            ios: this.nativeView
        });
    }

    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
        if (this.nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            this.setMeasuredDimension(width, height);
        }
    }

    [zoomLevelProperty.setNative](zoomLevel: number) {
        if (this.isReady) {
            this.nativeView.setZoomLevelWithAnimation(+zoomLevel, NMAMapAnimation.Linear);
        }
    }

    [mapStyleProperty.setNative](style: HereMapStyle) {
        if (this.isReady) {
            switch (style) {
                case HereMapStyle.HYBRID_DAY:
                    this.nativeView.mapScheme = NMAMapSchemeHybridDay;
                    break;
                case HereMapStyle.SATELLITE_DAY:
                    this.nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                    break;
                case HereMapStyle.TERRAIN_DAY:
                    this.nativeView.mapScheme = NMAMapSchemeTerrainDay;
                    break;
                default:
                    this.nativeView.mapScheme = NMAMapSchemeNormalDay;
                    break;
            }
        }
    }

    toggleScroll(enable: boolean) {
        if (this.isReady) {
            if (!enable) {
                this.nativeView.disableMapGestures(NMAMapGestureType.Pan);
            } else {
                this.nativeView.enableMapGestures(NMAMapGestureType.Pan);
            }
        }
    }

    [disableScrollProperty.setNative](enable: boolean) {
        this.toggleScroll(enable)
    }

    toggleZoom(enable: boolean) {
        if (this.isReady) {
            if (!enable) {
                this.nativeView.disableMapGestures(NMAMapGestureType.Pinch);
                this.nativeView.disableMapGestures(NMAMapGestureType.DoubleTap);
                this.nativeView.disableMapGestures(NMAMapGestureType.TwoFingerTap);
            } else {
                this.nativeView.enableMapGestures(NMAMapGestureType.Pinch);
                this.nativeView.enableMapGestures(NMAMapGestureType.DoubleTap);
                this.nativeView.enableMapGestures(NMAMapGestureType.TwoFingerTap);
            }
        }
    }

    [disableZoomProperty.setNative](enable: boolean) {
        this.toggleZoom(enable)
    }

    _getMarkersCount(): number {
        return this.nativeMarkers ? this.nativeMarkers.size : 0;
    }

    calculateRoute(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this.isReady) {
                reject();
                return
            }
            if (this.nativeStops.count < 2) {
                console.log('empty stops')
                reject();
                return;
            }

            if (!this.router) {
                this.router = NMACoreRouter.alloc().init()
                console.dir('Created: "router"')
            }
            this.router.calculateRouteWithStopsRoutingModeCompletionBlock(this.nativeStops, this.routingMode, (result, error) => {
                if (error) {
                    console.dir(`Error: calculate route with error code: ${error}`)
                    reject({
                        code: error
                    })
                    return
                }

                if (!result && result.routes.count < 1) {
                    console.dir(`Error: route result returned is not valid`)
                    reject()
                    return
                }
                this.updateRoute(result.routes[0])
                this.showWay()
                resolve()
                console.log('route finished')
            })
        })
    }

    showWay(): any {
        const map = this.nativeView
        map.setOrientationWithAnimation(0, NMAMapAnimation.Linear)
        map.setTiltWithAnimation(0, NMAMapAnimation.Linear)
        map.setBoundingBoxWithAnimation(
            this.navigationRouteBoundingBox,
            NMAMapAnimation.Linear
        )
    }

    startSimulation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.navigationManager.mapTrackingEnabled = true
            this.navigationManager.mapTrackingAutoZoomEnabled = true
            this.navigationManager.mapTrackingOrientation = NMAMapTrackingOrientation.Dynamic
            this.navigationManager.speedWarningEnabled = true

            this.navigationManager.startTurnByTurnNavigationWithRoute(this.route)
            resolve()
        })
    }

    pauseNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve()
        })
    }

    resumeNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve()
        })
    }

    getCurrentPosition(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            console.log('get current position')
            const position = NMAPositioningManager.sharedPositioningManager().currentPosition;
            if (position) {
                console.log('return coordinates')
                const coords = {
                    latitude: position.coordinates.latitude,
                    longitude: position.coordinates.longitude
                }
                resolve(coords)
            } else {
                reject('unable to get current position from position manager')
            }
        })
    }

    startNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.positionObserver) {
                NSNotificationCenter.defaultCenter.removeObserver(this.positionObserver)
            }
            if (NMAPositioningManager.sharedPositioningManager().startPositioning()) {
                console.log('subscribe to events')
                this.positionObserver = PositionObserver.initWithOwner(new WeakRef<Here>(this))
                NSNotificationCenter.defaultCenter.addObserverSelectorNameObject(this.positionObserver, "positionDidUpdate", "NMAPositioningManagerDidUpdatePositionNotification", null)
                NSNotificationCenter.defaultCenter.addObserverSelectorNameObject(this.positionObserver, "didLosePosition", "NMAPositioningManagerDidLosePositionNotification", null)

                this.nativeView.positionIndicator.visible = true
            }
            console.log('set map')
            this.navigationManager.map = this.nativeView
            console.log('set track enabled')
            this.navigationManager.mapTrackingEnabled = true
            console.log('set autozoom enabled')
            this.navigationManager.mapTrackingAutoZoomEnabled = false
            console.log('set track orientation enabled')
            this.navigationManager.mapTrackingOrientation = NMAMapTrackingOrientation.Dynamic
            console.log('set track speed optimization enabled')
            this.navigationManager.speedWarningEnabled = true
            console.log('start TT navigation')
            this.nativeView.positionIndicator.visible = true
            const res = this.navigationManager.startTurnByTurnNavigationWithRoute(this.route)
            if (res) {
                switch (res) {
                    case NMANavigationError.InvalidOperation:
                        console.log("Invalid operation")
                        break;
                    case NMANavigationError.InvalidParameters:
                        console.log('Invalid parameters')
                        break;
                    case NMANavigationError.OperationNotAllowed:
                        console.log('Operation not allowed')
                        break;
                }
                reject({
                    code: res
                })
                return
            }
            console.log("navigation started!")
            resolve()
        })
    }

    stopNavigation(): void {
        // remove observers!
        if (this.positionObserver) {
            NSNotificationCenter.defaultCenter.removeObserver(this.positionObserver)
        }
        this.navigationManager.stop()
        const map = this.nativeView
        map.setBoundingBoxWithAnimation(
            this.navigationRouteBoundingBox,
            NMAMapAnimation.Linear
        )
        map.setOrientationWithAnimation(0, NMAMapAnimation.Linear)
        this.navigationManager.mapTrackingEnabled = false
        this.navigationManager.mapTrackingAutoZoomEnabled = false
        this.clearCircles()
        this.clearMarkers()
    }

    public removeNavigation(): void {
        this.stopNavigation();
        console.log("Stop positioning")
        //this.positionListener.stopPositioning()
        console.log("Stop navigation manager")
        this.navigationManager.stop()
        console.log("Stop navigation manager delegation")
        this.navigationManager.delegate = null
        this.navigationManager.resetAnnouncementRules()
        this.navigationManager.map = null
        console.log("Remove observers")
        NSNotificationCenter.defaultCenter.removeObserverNameObject(this.positionObserver, "NMAPositioningManagerDidUpdatePositionNotification", null)
        NSNotificationCenter.defaultCenter.removeObserverNameObject(this.positionObserver, "NMAPositioningManagerDidLosePositionNotification", null)
        console.log("Nullify router")
        this.router = null
        console.log("clear circles")
        this.clearCircles()
        console.log("clear makers")
        this.clearMarkers()
        console.log("Nullify maproute")
        if (this.mapRoute) {
            this.nativeView.removeMapObject(this.mapRoute)
        }
        this.mapRoute = null;
        console.log('Done of navigation removal')
    }

    /**
     * Build navigation to specific coordinates
     * @param latitude Latitude coordinate `number`
     * @param longitude Longitude coordinate `number`
     * @returns Promise
     */
    navigateTo(latitude: number, longitude: number): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const position = NMAPositioningManager.sharedPositioningManager().currentPosition
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
            this.setStops(points, true)
            this.calculateRoute().then(() => {
                resolve()
            }).catch(() => {
                reject()
            })
        });
    }

    setCenter(lat: number, lon: number, animated: boolean): Promise<any> {
        return new Promise<any>((resolve) => {
            if (this.nativeView) {
                this.nativeView.setGeoCenterWithAnimation(
                    NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(lat, lon),
                    animated ? NMAMapAnimation.Linear : NMAMapAnimation.None
                )
            }
            resolve();
        });
    }

    public setStops(points: Array<any>, showMarkers: boolean): void {
        console.log('add points')
        this.nativeStops = NSMutableArray.alloc().init();
        if (this.nativeMarkers.size > 0) {
            this.clearMarkers()
        }
        points.forEach((point, index) => {
            this.nativeStops.addObject(
                NMAWaypoint.alloc().initWithGeoCoordinatesWaypointType(
                    NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(
                        point.latitude,
                        point.longitude
                    ),
                    NMAWaypointType.StopWaypoint
                )
            )
            if (showMarkers) {
                this.addMarker(point)
            }
        })
    }

    clearCircles(): void {
        if (this.nativeCircles.size > 0) {
            const circles = Array.from(this.nativeCircles.values())
            circles.forEach(circle => {
                this.nativeView.removeMapObject(circle);
            })
            console.dir('remove objects')
        }
        this.nativeCircles.clear()
    }

    clearMarkers(): void {
        if (this.nativeMarkers.size > 0) {
            const markers = Array.from(this.nativeMarkers.values())
            markers.forEach(marker => {
                this.nativeView.removeMapObject(marker);
            })
            console.dir('remove objects')
        }
        this.markers.clear();
        this.nativeMarkers.clear();
        this.markersCallback.clear();
    }

    addMarker(marker): void {
        if (marker.onTap && typeof marker.onTap === 'function') {
            this.markersCallback.set(marker.id, marker.onTap);
        }

        const nativeMarker = NMAMapMarker.alloc().initWithGeoCoordinates(
            NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude)
        );

        (nativeMarker as any).draggable = !!marker.draggable

        if (marker.title) {
            nativeMarker.title = marker.title
        }

        if (marker.description) {
            nativeMarker.textDescription = marker.description
        }

        nativeMarker.icon = this._defaultMarkerIcon
        nativeMarker.setAnchorOffsetUsingLayoutPosition(NMALayoutPosition.BottomCenter)

        this.nativeMarkers.set(marker.id, nativeMarker)
        this.markers.set(nativeMarker, marker)
        this.nativeView.addMapObject(nativeMarker)
    }

    addCircle(circle): void {
        if (!this.isReady) return;
        console.log('Add circle')
        const nativeCircle = NMAMapCircle.alloc().init()

        this._setCircleOptions(nativeCircle, circle)
        this.nativeView.addMapObject(nativeCircle)
        this.nativeCircles.set(circle.id, nativeCircle)
        return
    }

    updateCircle(circle): void {
        if (!this.isReady) return;
        const nativeObj = this.nativeCircles.get(circle.id);
        if (nativeObj) {
            this._setCircleOptions(nativeObj, circle)
        } else {
            this.addCircle(circle)
        }
    }

    _setCircleOptions(nativeCircle, circle): void {
        nativeCircle.center = NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(circle.latitude, circle.longitude)
        nativeCircle.radius = circle.radius
        nativeCircle.lineColor = UIColor.alloc().initWithRedGreenBlueAlpha(0, 0.5, 1, 0.7);
        nativeCircle.lineWidth = 4;
        nativeCircle.fillColor = UIColor.alloc().initWithRedGreenBlueAlpha(0, 0.5, 1, 0.4);
    }

    addCircles(circles): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this.isReady) {
                reject()
                return
            }
            circles.forEach((circle) => {
                this.addCircle(circle)
            })
            resolve();
        });
    }

    setNavigationMode(mode: string, recalculate: boolean = true): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const optionsPreset = this.navigationModePressets[mode]
            this.routingMode = NMARoutingMode.alloc().initWithRoutingTypeTransportModeRoutingOptions(
                NMARoutingType[optionsPreset.routeType],
                NMATransportMode[optionsPreset.transportMode],
                NMARoutingOption.AvoidHighway
            )
            // this.router = null
            if (!recalculate) return;
            this.calculateRoute().then(() => {
                resolve()
            }).catch((e) => {
                reject(e)
            })
        })
    }
}

class PositionObserver extends NSObject {
    owner: WeakRef<Here>;

    public static initWithOwner(owner: WeakRef<Here>): PositionObserver {
        const observer = new PositionObserver();
        observer.owner = owner;
        return observer;
    }

    public positionDidUpdate(notification: NSNotification): void {
        const owner = this.owner ? this.owner.get() : null;
        if (!owner) {
            return
        }
        const position = NMAPositioningManager.sharedPositioningManager().currentPosition
        if (!position) {
            return
        }
        owner.notify({
            eventName: HereBase.geoPositionChange,
            object: owner,
            latitude: position.coordinates.latitude,
            longitude: position.coordinates.longitude,
        });
        console.log("position update!!!!");
    }

    public didLosePosition(): void {
        console.log("position lose!!!!");
    }

    public static ObjCExposedMethods = {
        "positionDidUpdate": { returns: interop.types.void, params: [NSNotification] },
        "didLosePosition": { returns: interop.types.void, params: [] },
    };
}


// @ts-ignore
@ObjCClass(NMANavigationManagerDelegate)
class NMANavigationManagerDelegateImpl extends NSObject implements NMANavigationManagerDelegate {
    owner: WeakRef<Here>;

    public static initWithOwner(owner: WeakRef<Here>): NMANavigationManagerDelegateImpl {
        const delegate = new NMANavigationManagerDelegateImpl();
        delegate.owner = owner;
        return delegate;
    }

    public navigationManagerDidUpdateRouteWithResult(navigationManager: NMANavigationManager, result: NMARouteResult): void {
        const owner = this.owner ? this.owner.get() : null;
        if (!owner) {
            return
        }
        if (!result) {
            return
        }
        if (!result.routes) {
            return
        }
        owner.updateRoute(result.routes[0]);
    }

    public navigationManagerDidReachDestination(navigationManager: NMANavigationManager): void {
        console.log("We did reach destination!!!")
    }

    public navigationManagerWillReroute(navigationManager: NMANavigationManager): void {
        console.log("Reroute started!!!!")
    }

    public navigationManagerDidFindAlternateRouteWithResult(navigationManager: NMANavigationManager, result: NMARouteResult): void {
        const owner = this.owner ? this.owner.get() : null;
        if (!owner) {
            return
        }
        console.log("Found new alternatives routes!!!!")
        if (!result) {
            return
        }
        if (!result.routes) {
            return
        }
        owner.updateRoute(result.routes[0]);
    }

    public navigationManagerDidReachStopover(navigationManager: NMANavigationManager, stopover: NMAWaypoint): void {
        console.log("Waypoint reached!!!")
    }
}

// @ts-ignore
@ObjCClass(NMAMapViewDelegate)
class NMAMapViewDelegateImpl extends NSObject implements NMAMapViewDelegate {
    owner: WeakRef<Here>;

    public static initWithOwner(owner: WeakRef<Here>): NMAMapViewDelegateImpl {
        const delegate = new NMAMapViewDelegateImpl();
        delegate.owner = owner;
        return delegate;
    }

    mapViewDidDraw(mapView): void {
    }

    mapViewDidBeginAnimation(mapView): void {
    }

    mapViewDidBeginMovement(mapView): void {
    }

    mapViewDidEndMovement(mapView): void {

    }
}

// @ts-ignore
@ObjCClass(NMAMapGestureDelegate)
class NMAMapGestureDelegateImpl extends NSObject implements NMAMapGestureDelegate {
    owner: WeakRef<Here>;

    public static initWithOwner(owner: WeakRef<Here>): NMAMapGestureDelegateImpl {
        const delegate = new NMAMapGestureDelegateImpl();
        delegate.owner = owner;
        return delegate;
    }

    mapViewDidReceiveDoubleTapAtLocation(mapView, location: CGPoint): void {

    }

    mapViewDidReceiveLongPressAtLocation(mapView, location: CGPoint): void {
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
            const cord = mapView.geoCoordinatesFromPoint(location);
            owner.notify({
                eventName: HereBase.mapLongClickEvent,
                object: owner,
                latitude: cord.latitude,
                longitude: cord.longitude
            });
        }
    }

    mapViewDidReceivePanAtLocation(mapView, translation: CGPoint, location: CGPoint): void {
    }

    mapViewDidReceivePinchAtLocation(mapView, pinch: number, location: CGPoint): void {
    }

    mapViewDidReceiveTapAtLocation(mapView, location: CGPoint): void {
        const owner = this.owner ? this.owner.get() : null;
        if (owner) {
            const cord = mapView.geoCoordinatesFromPoint(location);
            owner.notify({
                eventName: HereBase.mapClickEvent,
                object: owner,
                latitude: cord.latitude,
                longitude: cord.longitude
            });

            const objects = mapView.objectsAtPoint(location);
            const count = objects.count;
            for (let i = 0; i < count; i++) {
                const nativeMarker = objects.objectAtIndex(i);
                const marker = owner.markers.get(nativeMarker);
                if (marker) {
                    const callback = owner.markersCallback.get(marker.id);
                    if (callback) {
                        callback(marker);
                    }
                }
            }
        }
    }

    mapViewDidReceiveTwoFingerTapAtLocation(mapView, location: CGPoint): void {
    }
}

