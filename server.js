let five = require("johnny-five");
let board = new five.Board();
const morgan = require('morgan')
let express = require('express');
let PubNub = require('pubnub');

const app = express()

app.use(morgan('dev'))
app.use(express.static(__dirname))


// CUSTOM VARIABLE
let lightStatus = undefined

//CONFIG
// const dev_config = require('./dev_config');
dev_config = {
  pubnubSettings:{
      　subscribe_key : 'sub-c-d4d3783e-c59b-11e8-a415-1a3a09e2960b',                          
      　publish_key   : 'pub-c-7575af19-80c3-444b-a9d1-9af723c5cb1e'
  }
}

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
    
  });

  proximity.on("change", function() {
    if(this.cm < 20 || lightStatus){
      anode.on();
    }else{
      anode.off();
    }  
  });

  app.get('/',function(req,res){
    res.sendFile(path.join(__dirname + '/index.html'));
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




app.listen(8000,function(){
console.log(`
Yehhey! It Worked!
Your Code has been served over: http://192.168.43.38:8000
`)
})
