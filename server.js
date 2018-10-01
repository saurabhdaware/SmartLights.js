var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var anode = new five.Led.RGB({
    pins: {
      red: 6,
      green: 5,
      blue: 3
    },
    isAnode: true
  });

  var proximity = new five.Proximity({
    controller: "HCSR04",
    pin: 7
  });

  // Add led to REPL (optional)
  this.repl.inject({
    anode: anode
  });

  // Turn it on and set the initial color

  anode.color("#ffffff");

  // anode.blink(1000);


  proximity.on("data", function() {
    console.log(this.cm + " - "+ this.in);
    if(this.cm < 20){
      anode.on();
    }else{
      anode.off();
    }
  });

  proximity.on("change", function() {
    console.log("The obstruction has moved.");
  });

});


// board.on("ready", function() {
//   var proximity = new five.Proximity({
//     controller: "HCSR04",
//     pin: 7
//   });

//   proximity.on("data", function() {
//     console.log("Proximity: ");
//     console.log("  cm  : ", this.cm);
//     console.log("  in  : ", this.in);
//     console.log("-----------------");
//   });

//   proximity.on("change", function() {
//     console.log("The obstruction has moved.");
//   });
// });