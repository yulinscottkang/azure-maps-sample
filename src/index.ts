import atlas, { control, Map, ControlPosition, setDomain, source, Shape, data, layer, AuthenticationType } from 'azure-maps-control'
const StyleControl = control.StyleControl;
const ZoomControl = control.ZoomControl;
const TrafficControl = control.TrafficControl;
const DataSource = source.DataSource;
const BubbleLayer = layer.BubbleLayer;
const ImageLayer = layer.ImageLayer;

// imports resolved css inside az-map
require('../node_modules/azure-maps-control/dist/atlas.css');

const p: atlas.IconOptions = {
  anchor: 'center',
}

const b: atlas.BubbleLayerOptions = {
  color: 'red',
}

class MapComponent extends HTMLElement {
  map: atlas.Map

  constructor(){
    super()
    this.attachShadow({ mode: 'open' })
    const resolvedStyles = Array.from(this.querySelectorAll("style"));
    this.shadowRoot.append(...resolvedStyles)
    this.mapInit()
  }

  mapInit(){
    let inner: HTMLElement = document.createElement('div')
    inner.style.width = '100%'
    inner.style.height = '100%'
    this.shadowRoot.appendChild(inner)
  
    const authOptions = ENVIRONMENT.azureSubscriptionKey !== undefined 
      ? { authType: AuthenticationType.subscriptionKey, subscriptionKey: ENVIRONMENT.azureSubscriptionKey }
      : undefined;

    this.map = new Map(inner, {
      authOptions,
      showTileBoundaries: true,
      center: [-122.13949398, 47.64628823],
      zoom: 12
    })

    this.loadState()
    window.onpopstate = (event) => this.loadState();
    this.map.events.add('dragend', () => this.updateState())
    this.map.events.add('pitchend', () => this.updateState())
    this.map.events.add('zoomend', () => this.updateState())
    this.map.events.add('sourceremoved', () => console.log('sourceremoved'))
    this.map.events.add('sourceadded', () => console.log('sourceadded'))
    this.map.events.add('ready', event => {

      //Create an image layer and add it to the map.
      this.map.layers.add(new ImageLayer({
        url: 'https://azuremaps.blob.core.windows.net/demo/img/newark_nj_1922.jpg',
        coordinates: [
            [-74.22655, 40.773941], //Top Left Corner
            [-74.12544, 40.773941], //Top Right Corner
            [-74.12544, 40.712216], //Bottom Right Corner
            [-74.22655, 40.712216]  //Bottom Left Corner
        ]
      }))
    })
    
    this.map.controls.add(new ZoomControl(), { position: ControlPosition.TopRight })
    this.map.controls.add(new StyleControl({ mapStyles: 'all', layout: 'list' }), { position: ControlPosition.TopRight })
    this.map.controls.add(new TrafficControl({ flow: "absolute" }), { position: ControlPosition.TopRight })
  }

  loadState(){
    const params = new URLSearchParams(window.location.search);
    const latStr = params.get('lat') || "47.62"
    const lngStr = params.get('lng') || "-122.335"
    const pitchStr = params.get('pitch') || "0"
    const bearingStr = params.get('bearing') || "0"
    const zoomStr = params.get('zoom') || "12"
    this.map.setCamera({
      center: [parseFloat(lngStr), parseFloat(latStr)],
      zoom: parseFloat(zoomStr),
      pitch: parseFloat(pitchStr),
      bearing: parseFloat(bearingStr)
    });
  }

  updateState(){
    window.history.pushState('', 'Azure Maps Sample',
      `?lng=${this.map.getCamera().center[0]}` +
      `&lat=${this.map.getCamera().center[1]}` +
      `&pitch=${this.map.getCamera().pitch}` +
      `&bearing=${this.map.getCamera().bearing}` +
      `&zoom=${this.map.getCamera().zoom}`
    )
  }

  // 121.5, 25 for taipei
  flyTo(location: [number, number], zoom: number){
    this.map["map"].flyTo({ center: location, zoom })
  }

  addSampleBubble(){
    const datasource = new DataSource('bubble-source');
    datasource.setShapes([new Shape(new data.Point([-122.335, 47.62]))]);
    this.map.sources.add(datasource);
    this.map.layers.add(new BubbleLayer(datasource, 'bubble', {
      radius: 10,
      color: 'cyan'
    }));
  }
}

customElements.define("az-map", MapComponent)