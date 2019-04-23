import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';
import { Here, HereMarker } from 'nativescript-here';

let page;
let markers;
let tilt;
let map = null;
let points = [
    {
        latitude: 59.435803,
        longitude: 24.757259,
        activationRadius: 10
    }, {
        latitude: 59.433808,
        longitude: 24.766438,
        activationRadius: 15
    }, {
        latitude: 59.438599,
        longitude: 24.791812,
        activationRadius: 25
    }
]

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    page = <pages.Page>args.object;
    markers = [1];
    tilt = 45;
    page.bindingContext = new HelloWorldModel();
    page.getViewById('map').on('mapReady', onMapReady.bind(this));
    page.getViewById('map').on('mapClick', onMapClick.bind(this));
    page.getViewById('map').on('mapLongClick', onMapLongClick.bind(this));
}

export function onLoaded(args) {
    args.object.on('mapReady', args => {
        console.dir('mapReady')
        onMapReady(args);
        map = args.object;
        console.log(map)

        // map.toggleScroll(false)
        // map.toggleZoom(false)
        map.setStops(points, true)
        map.calculateRoute()

        map.addCircles(points.map((point, index) => ({
            id: index,
            latitude: point.latitude,
            longitude: point.longitude,
            radius: point.activationRadius
        })))

        // map.addMarkers(<HereMarker[]>points.map((point, index) => ({
        //     id: index,
        //     latitude: point.latitude,
        //     longitude: point.longitude,
        //     title: `Point ${index}`,
        //     onTap: (marker) => {
        //         const updatedMarker = Object.assign({}, marker, {
        //             selected: !marker.selected
        //         });
        //         map.updateMarker(updatedMarker);
        //     }
        // })));
    });
}

export function removeMarkers() {
    map.removeMarkers(markers);
}

export function navigation() {
    map.calculateRoute().then(() => {
        map.startNavigation()
    })
}

export function calculate() {
    map.calculateRoute().then(() => {
    })
}

export function simulation() {
    map.startSimulation()
}

export function stop() {
    map.stopNavigation()
}

export function pause() {
    map.pauseNavigation()
}

export function resume() {
    map.resumeNavigation()
}

export function remove() {
    map.removeNavigation()
}

export function showWay() {
    map.showWay()
}

export function boat() {
    map.setNavigationMode("boat").then(() => {
        map.calculateRoute()
    })
}

export function car() {
    map.setNavigationMode("car").then(() => {
        map.calculateRoute()
    })
}

export function walk() {
    map.setNavigationMode("walk").then(() => {
        map.calculateRoute()
    })
}

export function navigateto() {
    map.navigateTo(points[0].latitude, points[0].longitude)
}

function onMapClick(event) {
    const count = map._getMarkersCount();
    const next = count + 1;

    // map.addMarkers(<HereMarker[]>[{
    //     id: next,
    //     latitude: event.latitude,
    //     longitude: event.longitude,
    //     title: `Click ${next}`
    // }]);
    // markers.push(next);
}

function onMapLongClick(event) {
    const count = map._getMarkersCount();
    const next = count + 1;

    // map.addMarkers(<HereMarker[]>[{
    //     id: next,
    //     latitude: event.latitude,
    //     longitude: event.longitude,
    //     title: `Long Click ${next}`,
    //     onTap: (marker) => {
    //         const updatedMarker = Object.assign({}, marker, {
    //             selected: !marker.selected
    //         });
    //         map.updateMarker(updatedMarker);
    //     }
    // }]);

    // markers.push(next);
}

export function updateMarker(event) {
    page.getViewById('map').updateMarker({
        id: 1,
        latitude: 10.6689243,
        longitude: -61.5315486,
    });
}

function onMapReady(event) {

}