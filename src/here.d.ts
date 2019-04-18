import { HereBase, HereMarker } from './here.common';
export declare class Here extends HereBase {
    nativeMarkers: Map<number, any>;
    markersCallback: Map<number, any>;
    markers: Map<any, HereMarker>;
    private delegate;
    private gestureDelegate;
    isReady: boolean;
    private _defaultMarkerIcon;
    private router;
    private navigationRouteBoundingBox;
    private navigationManager;
    private route;
    constructor();
    static init(appId: string, appCode: string, licenseKey: string): void;
    createNativeView(): Object;
    initNativeView(): void;
    disposeNativeView(): void;
    onLoaded(): void;
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    toggleScroll(enable: boolean): void;
    toggleZoom(enable: boolean): void;
    _getMarkersCount(): number;
    calculateRoute(points: any): Promise<any>;
    showWay(): any;
    startSimulation(): Promise<any>;
    startNavigation(): Promise<any>;
    pauseNavigation(): Promise<any>;
    resumeNavigation(): Promise<any>;
    stopNavigation(): void;
    setCenter(lat: number, lon: number, animated: boolean): Promise<any>;
    addMarkers(markers: HereMarker[]): Promise<any>;
    removeMarkers(markers?: number[]): Promise<any>;
    updateMarkers(markers: HereMarker[]): Promise<any>;
    updateMarker(marker: HereMarker): Promise<any>;
    addCircle(circle: any): void;
    navigationManagerDidFindPosition(navigationManager: any): void;
    navigationManagerdidUpdateRouteWithResult(navigationManager: any, routeResult: any): void;
    navigationManagerDidLosePosition(navigationManager: any): void;
}
