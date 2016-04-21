var Firebase = require("firebase");

var rootRef = new Firebase('https://docs-examples.firebaseio.com/web/data');
console.log(rootRef.child('users/mchen/name'));
