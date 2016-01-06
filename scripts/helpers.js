var isType = function (child, type){
  return Object.keys(child)[ 0 ] == type;
};
let helpers = {
  rando: function (arr){
    return arr[ Math.floor(Math.random() * arr.length) ];
  },
  slugify: function (text){
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  },
  parseType: function (objects, type){
    var filteredObjects = objects.filter(child => isType(child, type));
    return filteredObjects.map(key => key[ type ]);
  },
  getRandomIntInclusive: function (min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};


export default helpers;
