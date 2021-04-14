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
export const ITEMS = [
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
