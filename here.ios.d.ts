import { HereBase, HereMarker } from './here.common';
export declare class Here extends HereBase {
    nativeMarkers: Map<number, any>;
    markersCallback: Map<number, any>;
    markers: Map<any, HereMarker>;
    private delegate;
    private gestureDelegate;
    isReady: boolean;
    private _defaultMarkerIcon;
    constructor();
    static init(appId: string, appCode: string, licenseKey: string): void;
    createNativeView(): Object;
    initNativeView(): void;
    disposeNativeView(): void;
    onLoaded(): void;
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    _getMarkersCount(): number;
    _requestPremision(): Promise<any>;
    calculateRoute(points: any): Promise<any>;
    showWay(): Promise<any>;
    startNavigation(): Promise<any>;
    stopNavigation(): Promise<any>;
    toNextWaypoint(): void;
    toPrevWaypoint(): void;
    setCenter(lat: number, lon: number, animated: boolean): Promise<any>;
    createNavigation(): Promise<any>;
    addRoute(points: any): Promise<any>;
    addMarkers(markers: HereMarker[]): Promise<any>;
    removeMarkers(markers?: number[]): Promise<any>;
    updateMarkers(markers: HereMarker[]): Promise<any>;
    updateMarker(marker: HereMarker): Promise<any>;
}