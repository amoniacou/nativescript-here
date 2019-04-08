import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';
import { Here, HereMarker } from 'nativescript-here';

let page;
let markers;
let tilt;

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
    const points = [
        {
            latitude: 59.435803,
            longitude: 24.757259
        }, {
            latitude: 59.433808,
            longitude: 24.766438
        }, {
            latitude: 59.438599,
            longitude: 24.791812
        }
    ]

    args.object.on('mapReady', args => {
        onMapReady(args);

        args.object.toggleScroll(false)
        args.object.toggleZoom(false)

        args.object
            .calculateRoute(points)
            .then(() => {
                args.object.addMarkers(<HereMarker[]>points.map((point, index) => {
                    console.log(index)
                    return {
                        id: index,
                        latitude: point.latitude,
                        longitude: point.longitude,
                        title: `Point ${index}`,
                        onTap: (marker) => {
                            const updatedMarker = Object.assign({}, marker, {
                                selected: !marker.selected
                            });
                            args.object.updateMarker(updatedMarker);
                        }
                    }
                }));
            })
    });
}

export function removeMarkers() {
    page.getViewById('map').removeMarkers(markers);
}

export function navigation() {
    const map = page.getViewById('map');

    map.startNavigation()
}

export function simulation() {
    const map = page.getViewById('map');

    map.startSimulation()
}

export function stop() {
    const map = page.getViewById('map');

    map.stopNavigation()
}

function onMapClick(event) {
    const map = event.object;
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
    const map = event.object;
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

export function goToNY() {
    const map = page.getViewById('map') as Here;
}

export function updateMarker(event) {
    page.getViewById('map').updateMarker({
        id: 1,
        latitude: 10.6689243,
        longitude: -61.5315486,
    });
}

function onMapReady(event) {
    const map = event.object;

}