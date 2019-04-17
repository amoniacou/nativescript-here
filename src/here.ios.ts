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
import * as imageSrc from 'tns-core-modules/image-source';
import * as fs from 'tns-core-modules/file-system';
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
    private route;

    constructor() {
        super();
        console.log('HERE initialized')
    }

    public static init(appId: string, appCode: string, licenseKey: string) {
        NMAApplicationContext.setAppIdAppCodeLicenseKey(appId, appCode, licenseKey);
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
        NMAPositioningManager.sharedPositioningManager().dataSource = null
        nativeView.positionIndicator.visible = true
        this.navigationManager.map = nativeView
        this.navigationManager.delegate = this
        // NMANavigationManager.setMap(nativeView)

        console.dir(nativeView)
        // this.navigationManager.setMap(nativeView.getMap())
        console.dir('Created: "navigationManager"')
    }

    public disposeNativeView(): void {
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

    _requestPremision(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            resolve()
        })
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
            const map = this.nativeView

            map.positionIndicator.visible = true
            this.navigationManager.map = map
            console.dir(map)

            const source = NMARoutePositionSource.alloc().initWithRoute(this.route)
            source.movementSpeed = 60

            NMAPositioningManager.sharedPositioningManager().dataSource = source
            this.navigationManager.mapTrackingEnabled = true
            this.navigationManager.mapTrackingAutoZoomEnabled = true
            this.navigationManager.mapTrackingOrientation = NMAMapTrackingOrientation.Dynamic
            this.navigationManager.speedWarningEnabled = true

            const result = this.navigationManager.startTurnByTurnNavigationWithRoute(this.route)
            console.dir(result)
            console.dir('Simulation Started')
            resolve()
        })
    }

    startNavigation(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const map = this.nativeView

            NMAPositioningManager.sharedPositioningManager().dataSource = null
            map.positionIndicator.visible = true
            this.navigationManager.map = map
            console.dir(map)

            this.navigationManager.mapTrackingEnabled = true
            this.navigationManager.mapTrackingAutoZoomEnabled = true
            this.navigationManager.mapTrackingOrientation = NMAMapTrackingOrientation.Dynamic
            this.navigationManager.speedWarningEnabled = true
            console.log("ROUTER: ")
            console.log(this.route)
            const result = this.navigationManager.startTurnByTurnNavigationWithRoute(this.route)
            console.log("Result of navigation")
            console.dir(result)
            console.dir('Navigation Started 2')
            resolve()
        })
    }

    stopNavigation(): void {
        this.navigationManager.stop()
        this.navigationManager.map = null
        this.navigationManager.mapTrackingEnabled = false
        this.navigationManager.mapTrackingAutoZoomEnabled = false

        NMAPositioningManager.sharedPositioningManager().dataSource = null

        const map = this.nativeView
        map.setBoundingBoxWithAnimation(
            this.navigationRouteBoundingBox,
            NMAMapAnimation.Linear
        )
        map.setOrientationWithAnimation(0, NMAMapAnimation.Linear)
        console.dir('Navigation Stoped')
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

    navigationManagerDidFindPosition(navigationManager): void {
        console.dir("Found position")
    }

    navigationManagerdidUpdateRouteWithResult(navigationManager, routeResult): void {
        console.dir("NManager did update route with result")
    }

    navigationManagerDidLosePosition(navigationManager): void {
        console.dir("NManager lose position")
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

