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

export class Here extends HereBase {
    nativeMarkers: Map<number, any>;
    markersCallback: Map<number, any>;
    markers: Map<any, HereMarker>;
    private delegate: NMAMapViewDelegateImpl;
    private gestureDelegate: NMAMapGestureDelegateImpl;
    isReady: boolean = false;
    private _defaultMarkerIcon;
    private router;
    private navigationRouteBoundingBox;
    private navigationManager;
    private positionListener;
    private positionObserver;
    private route;

    constructor() {
        super();
        console.log('HERE initialized')
    }

    public static init(appId: string, appCode: string, licenseKey: string) {
        NMAApplicationContext.setAppIdAppCodeLicenseKey(appId, appCode, licenseKey);
    }

    public updateRoute(newRoute: NMARoute): void {
        this.route = newRoute;
        this.navigationManager.setRoute(this.route)
    }

    public createNativeView(): Object {
        this.nativeMarkers = new Map<number, any>();
        this.markers = new Map<any, HereMarker>();
        this.markersCallback = new Map<number, any>();
        this.delegate = NMAMapViewDelegateImpl.initWithOwner(new WeakRef<Here>(this));
        this.gestureDelegate = NMAMapGestureDelegateImpl.initWithOwner(new WeakRef<Here>(this));

        const url = NSURL.URLWithString(ios_icon)
        const data = NSData.dataWithContentsOfURL(url)
        const image = UIImage.imageWithDataScale(data, 3)

        this._defaultMarkerIcon = NMAImage.imageWithUIImage(image)

        return NMAMapView.alloc().initWithFrame(CGRectZero);
    }

    public initNativeView(): void {
        super.initNativeView();
        const nativeView = this.nativeView;
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
            case HereMapStyle.HYBRID_DAY:
                nativeView.mapScheme = NMAMapSchemeHybridDay;
                break;
            case HereMapStyle.SATELLITE_DAY:
                nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                break;
            case HereMapStyle.TERRAIN_DAY:
                nativeView.mapScheme = NMAMapSchemeTerrainDay;
                break;
            default:
                nativeView.mapScheme = NMAMapSchemeNormalDay;
                break;
        }

        nativeView.setGeoCenterWithAnimation(
            NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(this.latitude, this.longitude),
            NMAMapAnimation.None
        )

        this.navigationManager = NMANavigationManager.sharedNavigationManager()
        this.navigationManager.map = nativeView
        this.navigationManager.delegate = NMANavigationManagerDelegateImpl.initWithOwner(new WeakRef<Here>(this));
        this.positionListener = NMAPositioningManager.sharedPositioningManager()
        this.positionListener.dataSource = NMADevicePositionSource.alloc().init()

        NSNotificationCenter.defaultCenter.removeObserver(this)
        if (this.positionListener.startPositioning()) {
            console.log("Start observing")
            this.positionObserver = PositionObserver.initWithOwner(new WeakRef<Here>(this))
            NSNotificationCenter.defaultCenter.addObserverSelectorNameObject(this.positionObserver, "positionDidUpdate", "NMAPositioningManagerDidUpdatePositionNotification", this.positionListener)
            NSNotificationCenter.defaultCenter.addObserverSelectorNameObject(this.positionObserver, "didLosePosition", "NMAPositioningManagerDidLosePositionNotification", this.positionListener)

            nativeView.positionIndicator.visible = true
        }
    }

    public disposeNativeView(): void {
        console.log("stop positioning")
        this.positionListener.stopPositioning()
        this.navigationManager.stop()
        NSNotificationCenter.defaultCenter.removeObserverNameObject(this.positionObserver, "NMAPositioningManagerDidUpdatePositionNotification", this.positionListener)
        NSNotificationCenter.defaultCenter.removeObserverNameObject(this.positionObserver, "NMAPositioningManagerDidLosePositionNotification", this.positionListener)
        super.disposeNativeView();
    }

    public onLoaded(): void {
        super.onLoaded();
        this.isReady = true;
        this.notify({
            eventName: HereBase.mapReadyEvent,
            object: this,
            android: null,
            ios: this.nativeView
        });
    }

    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {
        const nativeView = this.nativeView;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            this.setMeasuredDimension(width, height);
        }
    }

    [zoomLevelProperty.setNative](zoomLevel: number) {
        const nativeView = this.nativeView;
        if (this.isReady) {
            nativeView.setZoomLevelWithAnimation(+zoomLevel, NMAMapAnimation.Linear);
        }
    }

    [mapStyleProperty.setNative](style: HereMapStyle) {
        const nativeView = this.nativeView;
        if (this.isReady) {
            switch (style) {
                case HereMapStyle.HYBRID_DAY:
                    nativeView.mapScheme = NMAMapSchemeHybridDay;
                    break;
                case HereMapStyle.SATELLITE_DAY:
                    nativeView.mapScheme = NMAMapSchemeSatelliteDay;
                    break;
                case HereMapStyle.TERRAIN_DAY:
                    nativeView.mapScheme = NMAMapSchemeTerrainDay;
                    break;
                default:
                    nativeView.mapScheme = NMAMapSchemeNormalDay;
                    break;
            }
        }
    }

    toggleScroll(enable: boolean) {
        const nativeView = this.nativeView;
        if (this.isReady) {
            if (!enable) {
                nativeView.disableMapGestures(NMAMapGestureType.Pan);
            } else {
                nativeView.enableMapGestures(NMAMapGestureType.Pan);
            }
        }
    }

    [disableScrollProperty.setNative](enable: boolean) {
        this.toggleScroll(enable)
    }

    toggleZoom(enable: boolean) {
        const nativeView = this.nativeView;
        if (this.isReady) {
            if (!enable) {
                nativeView.disableMapGestures(NMAMapGestureType.Pinch);
                nativeView.disableMapGestures(NMAMapGestureType.DoubleTap);
                nativeView.disableMapGestures(NMAMapGestureType.TwoFingerTap);
            } else {
                nativeView.enableMapGestures(NMAMapGestureType.Pinch);
                nativeView.enableMapGestures(NMAMapGestureType.DoubleTap);
                nativeView.enableMapGestures(NMAMapGestureType.TwoFingerTap);
            }
        }
    }

    [disableZoomProperty.setNative](enable: boolean) {
        this.toggleZoom(enable)
    }

    _getMarkersCount(): number {
        return this.nativeMarkers ? this.nativeMarkers.size : 0;
    }

    calculateRoute(points): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            console.dir(this.isReady)

            const stops = new NSMutableArray(points.length)

            points.forEach((point, index) => {
                console.dir(`Point ${index} create`)
                stops.addObject(
                    NMAWaypoint.alloc().initWithGeoCoordinates(
                        NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(
                            point.latitude,
                            point.longitude
                        )
                    )
                )
                console.dir(`Point ${index} created`)
            })

            const routingMode = NMARoutingMode.alloc().initWithRoutingTypeTransportModeRoutingOptions(
                NMARoutingType.Fastest,
                NMATransportMode.Car,
                NMARoutingOption.AvoidHighway
            )
            console.dir('Created: "routingMode"')

            if (!this.router) {
                this.router = NMACoreRouter.alloc().init()
                console.dir('Created: "router"')
            }

            const res = this.router.calculateRouteWithStopsRoutingModeCompletionBlock(stops, routingMode, (result, error) => {
                if (error) {
                    console.dir(`Error: calculate route with error code: ${error}`)
                    reject()
                    return
                }

                if (!result && result.routes.count < 1) {
                    console.dir(`Error: route result returned is not valid`)
                    reject()
                    return
                }

                this.route = result.routes[0]
                console.log(this.route)

                const mapRoute = NMAMapRoute.alloc().initWithRoute(this.route)

                this.navigationRouteBoundingBox = this.route.boundingBox
                this.nativeView.addMapObject(mapRoute)

                this.showWay()

                console.dir('Calculate route done!')
                resolve()
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
            this.positionListener.dataSource = NMARoutePositionSource.alloc().initWithRoute(this.route)
            this.positionListener.dataSource.movementSpeed = 60
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
            if (this.positionListener.dataSource) {
                this.positionListener.dataSource.movementSpeed = 0
            }
            resolve()
        })
    }

    resumeNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.positionListener.dataSource) {
                this.positionListener.dataSource.movementSpeed = 60
            }
            resolve()
        })
    }

    startNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            this.navigationManager.mapTrackingEnabled = true
            this.navigationManager.mapTrackingAutoZoomEnabled = true
            this.navigationManager.mapTrackingOrientation = NMAMapTrackingOrientation.Dynamic
            this.navigationManager.speedWarningEnabled = true
            this.navigationManager.startTurnByTurnNavigationWithRoute(this.route)
            resolve()
        })
    }

    stopNavigation(): void {
        this.positionListener.dataSource = NMAHEREPositionSource.alloc().init()
        this.navigationManager.stop()
        this.navigationManager.mapTrackingEnabled = false
        this.navigationManager.mapTrackingAutoZoomEnabled = false

        const map = this.nativeView
        map.setBoundingBoxWithAnimation(
            this.navigationRouteBoundingBox,
            NMAMapAnimation.Linear
        )
        map.setOrientationWithAnimation(0, NMAMapAnimation.Linear)
        console.dir('Navigation Stoped')
    }

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
            this.calculateRoute(points).then(() => {
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

    addMarkers(markers: HereMarker[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const map = this.nativeView

            markers.forEach((marker) => {
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
                map.addMapObject(nativeMarker)
            })

            resolve()
        });
    }

    removeMarkers(markers?: number[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const map = this.nativeView;
            if (!markers) {
                map.removeMapObjects(Array.from(this.nativeMarkers.values()));
                this.markers.clear();
                this.nativeMarkers.clear();
                this.markersCallback.clear();
                resolve();
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
                resolve();
            }
        });
    }

    updateMarkers(markers: HereMarker[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            markers.forEach(marker => {
                const nativeMarker = this.nativeMarkers.get(marker.id);
                if (nativeMarker) {
                    nativeMarker.coordinates = NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude);
                    if (marker.title) {
                        nativeMarker.title = marker.title;
                    }
                    if (marker.description) {
                        nativeMarker.textDescription = marker.description;
                    }
                    if (types.isBoolean(marker.draggable)) {
                        (nativeMarker as any).draggable = !!marker.draggable;
                    }

                    if (!!marker.selected) {
                        nativeMarker.showInfoBubble();
                    } else {
                        nativeMarker.hideInfoBubble();
                    }

                    this.nativeMarkers.set(marker.id, nativeMarker);
                    this.markers.set(nativeMarker, marker);

                }
            });
            resolve();
        });
    }

    updateMarker(marker: HereMarker): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const nativeMarker = this.nativeMarkers.get(marker.id);
            if (nativeMarker) {
                nativeMarker.coordinates = NMAGeoCoordinates.geoCoordinatesWithLatitudeLongitude(marker.latitude, marker.longitude);

                if (marker.title) {
                    nativeMarker.title = marker.title;
                }
                if (marker.description) {
                    nativeMarker.textDescription = marker.description;
                }
                if (types.isBoolean(marker.draggable)) {
                    (nativeMarker as any).draggable = !!marker.draggable;
                }

                if (!!marker.selected) {
                    nativeMarker.showInfoBubble();
                } else {
                    nativeMarker.hideInfoBubble();
                }

                this.nativeMarkers.set(marker.id, nativeMarker);
                this.markers.set(nativeMarker, marker);
            }
            resolve();
        });
    }

    addCircle(circle): void {

    }

    addCircles(circles): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve();
        });
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
        console.log("New route found!!!!")
        console.dir(result)
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

