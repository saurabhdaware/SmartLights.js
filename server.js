let five = require("johnny-five");
let board = new five.Board();
const morgan = require('morgan')
let express = require('express');
let PubNub = require('pubnub');

const app = express()

app.use(morgan('dev'))
app.use(express.static(__dirname))


// Custom variables
let lightStatus = undefined

//configs
const dev_config = require('./dev_config');

const pubnub = new PubNub(dev_config.pubnubSettings); // see pubnub documentations for the pubnub setup

board.on("ready", function() {
  // DEFINATIONS
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

  this.repl.inject({
    anode: anode
  });
  pubnub.subscribe({
      channels: ['smart-street-lights-node']
  });

  pubnub.addListener({
    message: function(m){
      console.log(m.message.color);
      anode.color(m.message.color);
    }
  })



  anode.off();
  proximity.on("data", function() {
    if(this.cm < 20 || lightStatus){
      anode.on();
    }else{
      anode.off();
    }
  });

  proximity.on("change", function() {
    // console.log("The obstruction has moved.");
  });

  app.get('/',function(req,res){
    res.send({status:"Board Running Properly"});
  })
  
  app.get('/lights/on',function(req,res){
    lightStatus = true;
    res.send({msg:'Lights are turned on'});

  })
  
  app.get('/lights/off',function(req,res){
    lightStatus = undefined;
    res.send({msg:'Lights are turned off'});
  })

});





app.listen(8000)
