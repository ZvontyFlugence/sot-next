import { IGameItem, INatFocusTypes, IRankingTypeMap } from "./ui";

// Different Types of Companies That Can Be Create
export const COMPANY_TYPES = [
  { text: 'Wheat', item: 0, css: 'sot-icon sot-wheat' },
  { text: 'Iron', item: 1, css: 'sot-icon sot-iron' },
  { text: 'Oil', item: 2, css: 'sot-icon sot-oil' },
  { text: 'Uranium', item: 3, css: 'sot-icon sot-uranium' },
  { text: 'Aluminum', item: 4, css: 'sot-icon sot-aluminum' },
  { text: 'Steel', item: 5, css: 'sot-icon sot-steel' },
  { text: 'Bread', item: 6, css: 'sot-icon sot-bread' },
];

// Raw Resources (id * 3 for Low, +1 for Medium, +2 for High, -1 for None)
export const RESOURCES = [
  { id: 0, name: 'Wheat', css: 'sot-icon sot-wheat' },
  { id: 1, name: 'Iron', css: 'sot-icon sot-iron' },
  { id: 2, name: 'Oil', css: 'sot-icon sot-oil' },
  { id: 3, name: 'Uranium', css: 'sot-icon sot-uranium' },
  { id: 4, name: 'Aluminum', css: 'sot-icon sot-aluminum' },
  { id: 5, name: 'Steel', css: 'sot-icon sot-steel' },
];

// Items (Raw => quality: 0 + Manufactured => 1...5)
export const ITEMS: IGameItem[] = [
  { id: 0, name: 'Wheat', quality: 0, image: 'sot-icon sot-wheat' },
  { id: 1, name: 'Iron', quality: 0, image: 'sot-icon sot-iron' },
  { id: 2, name: 'Oil', quality: 0, image: 'sot-icon sot-oil' },
  { id: 3, name: 'Uranium', quality: 0, image: 'sot-icon sot-uranium' },
  { id: 4, name: 'Aluminum', quality: 0, image: 'sot-icon sot-aluminum' },
  { id: 5, name: 'Steel', quality: 0, image: 'sot-icon sot-steel' },
  { id: 6, name: 'Bread', quality: 1, image: 'sot-icon sot-bread' },
  { id: 7, name: 'Bread', quality: 2, image: 'sot-icon sot-bread' },
  { id: 8, name: 'Bread', quality: 3, image: 'sot-icon sot-bread' },
  { id: 9, name: 'Bread', quality: 4, image: 'sot-icon sot-bread' },
  { id: 10, name: 'Bread', quality: 5, image: 'sot-icon sot-bread' },
];

// National Focus Types
// TODO: Figure out modifiers for focuses
export const NATIONAL_FOCUS_TYPES: INatFocusTypes = {
  'OFFENSIVE': {
    name: 'Offensive Focus',
    icon: '',
    modifiers: {},
  },
  'DEFENSIVE': {
    name: 'Defensive Focus',
    icon: '',
    modifiers: {},
  },
  'ECONOMIC': {
    name: 'Economic Focus',
    icon: '',
    modifiers: {},
  }
}

// Ranking Types
export const RANKING_TYPES: IRankingTypeMap = {
  'country': {
    label: (
      <span>Countries</span>
    ),
    route: '/rankings/countries',
  },
  'citizens': {
    label: (
      <span>Citizens</span>
    ),
    route: '/rankings/citizens?scope=global&stat=xp',
  },
  'newspapers': {
    label: (
      <span>Newspapers</span>
    ),
    route: '/rankings/newspapers',
  },
  'parties': {
    label: (
      <span>Parties</span>
    ),
    route: `/rankings/parties`,
  },
};

// Citizen Stat Types
export const CitizenStats = {
  STRENGTH: 'strength',
  XP: 'xp',
};

// Alert Types
export const AlertTypes = {
  BATTLE_HERO: 'battle_hero',
  IMPEACHED: 'impeached',
  LAW_PROPOSED: 'law_proposed',
  LEVEL_UP: 'level_up',
  SEND_FR: 'send_fr',
};

// Google Map Style
export const MAP_STYLE = [
  {
    "featureType": "all",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" },
      { "lightness": "-100" }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      { "saturation": 36 },
      { "color": "#000000" },
      { "lightness": 40 }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      { "visibility": "on" },
      { "color": "#000000" },
      { "lightness": 16 }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 20 }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 17 },
      { "weight": 1.2 },
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 20 }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 21 }
    ]
  },
  {
    "featureType": "road",
    "elementType": "all",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 17 }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 29 },
      { "weight": 0.2 }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 18 }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 16 }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 19 }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" },
      { "lightness": 17 }
    ]
  }
];