"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_view_model_1 = require("./main-view-model");
var page;
var markers;
var tilt;
var map = null;
function pageLoaded(args) {
    page = args.object;
    markers = [1];
    tilt = 45;
    page.bindingContext = new main_view_model_1.HelloWorldModel();
    page.getViewById('map').on('mapReady', onMapReady.bind(this));
    page.getViewById('map').on('mapClick', onMapClick.bind(this));
    page.getViewById('map').on('mapLongClick', onMapLongClick.bind(this));
}
exports.pageLoaded = pageLoaded;
function onLoaded(args) {
    var points = [
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
    ];
    args.object.on('mapReady', function (args) {
        onMapReady(args);
        map = args.object;
        map.toggleScroll(false);
        map.toggleZoom(false);
        map
            .calculateRoute(points)
            .then(function () {
            map.addMarkers(points.map(function (point, index) { return ({
                id: index,
                latitude: point.latitude,
                longitude: point.longitude,
                title: "Point " + index,
                onTap: function (marker) {
                    var updatedMarker = Object.assign({}, marker, {
                        selected: !marker.selected
                    });
                    map.updateMarker(updatedMarker);
                }
            }); }));
        });
    });
}
exports.onLoaded = onLoaded;
function removeMarkers() {
    map.removeMarkers(markers);
}
exports.removeMarkers = removeMarkers;
function navigation() {
    map.startNavigation();
}
exports.navigation = navigation;
function simulation() {
    map.startSimulation();
}
exports.simulation = simulation;
function stop() {
    map.stopNavigation();
}
exports.stop = stop;
function showWay() {
    map.showWay();
}
exports.showWay = showWay;
function onMapClick(event) {
    var count = map._getMarkersCount();
    var next = count + 1;
}
function onMapLongClick(event) {
    var count = map._getMarkersCount();
    var next = count + 1;
}
function updateMarker(event) {
    page.getViewById('map').updateMarker({
        id: 1,
        latitude: 10.6689243,
        longitude: -61.5315486,
    });
}
exports.updateMarker = updateMarker;
function onMapReady(event) {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1wYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbi1wYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEscURBQW9EO0FBR3BELElBQUksSUFBSSxDQUFDO0FBQ1QsSUFBSSxPQUFPLENBQUM7QUFDWixJQUFJLElBQUksQ0FBQztBQUNULElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztBQUdmLG9CQUEyQixJQUEwQjtJQUVqRCxJQUFJLEdBQWUsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMvQixPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNkLElBQUksR0FBRyxFQUFFLENBQUM7SUFDVixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO0lBQzVDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDOUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFURCxnQ0FTQztBQUVELGtCQUF5QixJQUFJO0lBQ3pCLElBQU0sTUFBTSxHQUFHO1FBQ1g7WUFDSSxRQUFRLEVBQUUsU0FBUztZQUNuQixTQUFTLEVBQUUsU0FBUztZQUNwQixnQkFBZ0IsRUFBRSxFQUFFO1NBQ3ZCLEVBQUU7WUFDQyxRQUFRLEVBQUUsU0FBUztZQUNuQixTQUFTLEVBQUUsU0FBUztZQUNwQixnQkFBZ0IsRUFBRSxFQUFFO1NBQ3ZCLEVBQUU7WUFDQyxRQUFRLEVBQUUsU0FBUztZQUNuQixTQUFTLEVBQUUsU0FBUztZQUNwQixnQkFBZ0IsRUFBRSxFQUFFO1NBQ3ZCO0tBQ0osQ0FBQTtJQUVELElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFBLElBQUk7UUFDM0IsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWpCLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRWxCLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDdkIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVyQixHQUFHO2FBQ0UsY0FBYyxDQUFDLE1BQU0sQ0FBQzthQUN0QixJQUFJLENBQUM7WUFDRixHQUFHLENBQUMsVUFBVSxDQUFlLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFLLEVBQUUsS0FBSyxJQUFLLE9BQUEsQ0FBQztnQkFDdkQsRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO2dCQUN4QixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQzFCLEtBQUssRUFBRSxXQUFTLEtBQU87Z0JBQ3ZCLEtBQUssRUFBRSxVQUFDLE1BQU07b0JBQ1YsSUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFO3dCQUM1QyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUTtxQkFDN0IsQ0FBQyxDQUFDO29CQUNILEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7YUFDSixDQUFDLEVBWHdELENBV3hELENBQUMsQ0FBQyxDQUFDO1FBQ1QsQ0FBQyxDQUFDLENBQUE7SUFDVixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUExQ0QsNEJBMENDO0FBRUQ7SUFDSSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFGRCxzQ0FFQztBQUVEO0lBQ0ksR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFBO0FBQ3pCLENBQUM7QUFGRCxnQ0FFQztBQUVEO0lBQ0ksR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFBO0FBQ3pCLENBQUM7QUFGRCxnQ0FFQztBQUVEO0lBQ0ksR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFBO0FBQ3hCLENBQUM7QUFGRCxvQkFFQztBQUVEO0lBQ0ksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFBO0FBQ2pCLENBQUM7QUFGRCwwQkFFQztBQUVELG9CQUFvQixLQUFLO0lBQ3JCLElBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3JDLElBQU0sSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFTM0IsQ0FBQztBQUVELHdCQUF3QixLQUFLO0lBQ3pCLElBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ3JDLElBQU0sSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFnQjNCLENBQUM7QUFFRCxzQkFBNkIsS0FBSztJQUM5QixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUNqQyxFQUFFLEVBQUUsQ0FBQztRQUNMLFFBQVEsRUFBRSxVQUFVO1FBQ3BCLFNBQVMsRUFBRSxDQUFDLFVBQVU7S0FDekIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQU5ELG9DQU1DO0FBRUQsb0JBQW9CLEtBQUs7QUFFekIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIG9ic2VydmFibGUgZnJvbSAndG5zLWNvcmUtbW9kdWxlcy9kYXRhL29ic2VydmFibGUnO1xuaW1wb3J0ICogYXMgcGFnZXMgZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9wYWdlJztcbmltcG9ydCB7IEhlbGxvV29ybGRNb2RlbCB9IGZyb20gJy4vbWFpbi12aWV3LW1vZGVsJztcbmltcG9ydCB7IEhlcmUsIEhlcmVNYXJrZXIgfSBmcm9tICduYXRpdmVzY3JpcHQtaGVyZSc7XG5cbmxldCBwYWdlO1xubGV0IG1hcmtlcnM7XG5sZXQgdGlsdDtcbmxldCBtYXAgPSBudWxsO1xuXG4vLyBFdmVudCBoYW5kbGVyIGZvciBQYWdlICdsb2FkZWQnIGV2ZW50IGF0dGFjaGVkIGluIG1haW4tcGFnZS54bWxcbmV4cG9ydCBmdW5jdGlvbiBwYWdlTG9hZGVkKGFyZ3M6IG9ic2VydmFibGUuRXZlbnREYXRhKSB7XG4gICAgLy8gR2V0IHRoZSBldmVudCBzZW5kZXJcbiAgICBwYWdlID0gPHBhZ2VzLlBhZ2U+YXJncy5vYmplY3Q7XG4gICAgbWFya2VycyA9IFsxXTtcbiAgICB0aWx0ID0gNDU7XG4gICAgcGFnZS5iaW5kaW5nQ29udGV4dCA9IG5ldyBIZWxsb1dvcmxkTW9kZWwoKTtcbiAgICBwYWdlLmdldFZpZXdCeUlkKCdtYXAnKS5vbignbWFwUmVhZHknLCBvbk1hcFJlYWR5LmJpbmQodGhpcykpO1xuICAgIHBhZ2UuZ2V0Vmlld0J5SWQoJ21hcCcpLm9uKCdtYXBDbGljaycsIG9uTWFwQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgcGFnZS5nZXRWaWV3QnlJZCgnbWFwJykub24oJ21hcExvbmdDbGljaycsIG9uTWFwTG9uZ0NsaWNrLmJpbmQodGhpcykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb25Mb2FkZWQoYXJncykge1xuICAgIGNvbnN0IHBvaW50cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGF0aXR1ZGU6IDU5LjQzNTgwMyxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogMjQuNzU3MjU5LFxuICAgICAgICAgICAgYWN0aXZhdGlvblJhZGl1czogMTBcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGF0aXR1ZGU6IDU5LjQzMzgwOCxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogMjQuNzY2NDM4LFxuICAgICAgICAgICAgYWN0aXZhdGlvblJhZGl1czogMTVcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGF0aXR1ZGU6IDU5LjQzODU5OSxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogMjQuNzkxODEyLFxuICAgICAgICAgICAgYWN0aXZhdGlvblJhZGl1czogMjVcbiAgICAgICAgfVxuICAgIF1cblxuICAgIGFyZ3Mub2JqZWN0Lm9uKCdtYXBSZWFkeScsIGFyZ3MgPT4ge1xuICAgICAgICBvbk1hcFJlYWR5KGFyZ3MpO1xuXG4gICAgICAgIG1hcCA9IGFyZ3Mub2JqZWN0O1xuXG4gICAgICAgIG1hcC50b2dnbGVTY3JvbGwoZmFsc2UpXG4gICAgICAgIG1hcC50b2dnbGVab29tKGZhbHNlKVxuXG4gICAgICAgIG1hcFxuICAgICAgICAgICAgLmNhbGN1bGF0ZVJvdXRlKHBvaW50cylcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBtYXAuYWRkTWFya2Vycyg8SGVyZU1hcmtlcltdPnBvaW50cy5tYXAoKHBvaW50LCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGluZGV4LFxuICAgICAgICAgICAgICAgICAgICBsYXRpdHVkZTogcG9pbnQubGF0aXR1ZGUsXG4gICAgICAgICAgICAgICAgICAgIGxvbmdpdHVkZTogcG9pbnQubG9uZ2l0dWRlLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogYFBvaW50ICR7aW5kZXh9YCxcbiAgICAgICAgICAgICAgICAgICAgb25UYXA6IChtYXJrZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWRNYXJrZXIgPSBPYmplY3QuYXNzaWduKHt9LCBtYXJrZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZDogIW1hcmtlci5zZWxlY3RlZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAudXBkYXRlTWFya2VyKHVwZGF0ZWRNYXJrZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgIH0pXG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVNYXJrZXJzKCkge1xuICAgIG1hcC5yZW1vdmVNYXJrZXJzKG1hcmtlcnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmF2aWdhdGlvbigpIHtcbiAgICBtYXAuc3RhcnROYXZpZ2F0aW9uKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpbXVsYXRpb24oKSB7XG4gICAgbWFwLnN0YXJ0U2ltdWxhdGlvbigpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9wKCkge1xuICAgIG1hcC5zdG9wTmF2aWdhdGlvbigpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93V2F5KCkge1xuICAgIG1hcC5zaG93V2F5KClcbn1cblxuZnVuY3Rpb24gb25NYXBDbGljayhldmVudCkge1xuICAgIGNvbnN0IGNvdW50ID0gbWFwLl9nZXRNYXJrZXJzQ291bnQoKTtcbiAgICBjb25zdCBuZXh0ID0gY291bnQgKyAxO1xuXG4gICAgLy8gbWFwLmFkZE1hcmtlcnMoPEhlcmVNYXJrZXJbXT5be1xuICAgIC8vICAgICBpZDogbmV4dCxcbiAgICAvLyAgICAgbGF0aXR1ZGU6IGV2ZW50LmxhdGl0dWRlLFxuICAgIC8vICAgICBsb25naXR1ZGU6IGV2ZW50LmxvbmdpdHVkZSxcbiAgICAvLyAgICAgdGl0bGU6IGBDbGljayAke25leHR9YFxuICAgIC8vIH1dKTtcbiAgICAvLyBtYXJrZXJzLnB1c2gobmV4dCk7XG59XG5cbmZ1bmN0aW9uIG9uTWFwTG9uZ0NsaWNrKGV2ZW50KSB7XG4gICAgY29uc3QgY291bnQgPSBtYXAuX2dldE1hcmtlcnNDb3VudCgpO1xuICAgIGNvbnN0IG5leHQgPSBjb3VudCArIDE7XG5cbiAgICAvLyBtYXAuYWRkTWFya2Vycyg8SGVyZU1hcmtlcltdPlt7XG4gICAgLy8gICAgIGlkOiBuZXh0LFxuICAgIC8vICAgICBsYXRpdHVkZTogZXZlbnQubGF0aXR1ZGUsXG4gICAgLy8gICAgIGxvbmdpdHVkZTogZXZlbnQubG9uZ2l0dWRlLFxuICAgIC8vICAgICB0aXRsZTogYExvbmcgQ2xpY2sgJHtuZXh0fWAsXG4gICAgLy8gICAgIG9uVGFwOiAobWFya2VyKSA9PiB7XG4gICAgLy8gICAgICAgICBjb25zdCB1cGRhdGVkTWFya2VyID0gT2JqZWN0LmFzc2lnbih7fSwgbWFya2VyLCB7XG4gICAgLy8gICAgICAgICAgICAgc2VsZWN0ZWQ6ICFtYXJrZXIuc2VsZWN0ZWRcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgbWFwLnVwZGF0ZU1hcmtlcih1cGRhdGVkTWFya2VyKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1dKTtcblxuICAgIC8vIG1hcmtlcnMucHVzaChuZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZU1hcmtlcihldmVudCkge1xuICAgIHBhZ2UuZ2V0Vmlld0J5SWQoJ21hcCcpLnVwZGF0ZU1hcmtlcih7XG4gICAgICAgIGlkOiAxLFxuICAgICAgICBsYXRpdHVkZTogMTAuNjY4OTI0MyxcbiAgICAgICAgbG9uZ2l0dWRlOiAtNjEuNTMxNTQ4NixcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gb25NYXBSZWFkeShldmVudCkge1xuICAgXG59Il19