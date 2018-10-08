const five = require("johnny-five");
const board = new five.Board();
const morgan = require('morgan')
const express = require('express');
const PubNub = require('pubnub');

const app = express()

const serverLocation = {
  lat:'19.116032',
  lon:'72.8875008'
}

app.use(morgan('dev'))
app.use(express.static(__dirname))


// CUSTOM VARIABLE
let lightStatus = undefined;
let currentFrame = [0, 0];
let lastFrame = [0, 0]
let frameDifference = 0;
let carsCount = 0;
let ruleBreakers = 0;
let timeLeft = 0;
let timeDifference = 0;
let timeReached = 0;

let componentConfig = [{
    ledPins: {
      red: 6,
      green: 5,
      blue: 3
    },
    ultrasonicPin: 7
  },
  {
    ledPins: {
      red: 11,
      green: 10,
      blue: 9
    },
    ultrasonicPin: 8
  }
]

let anodes = [];
let proximities = [];
//CONFIG
const dev_config = require('./dev_config');
const pubnub = new PubNub(dev_config.pubnubSettings); // see pubnub documentations for the pubnub setup

board.on("ready", function () {
  // DEFINATIONS
  for (let config of componentConfig) {
    let anode = new five.Led.RGB({
      pins: config.ledPins,
      isAnode: true
    });

    let proximity = new five.Proximity({
      controller: "HCSR04",
      pin: config.ultrasonicPin
    });

    anodes.push(anode);
    proximities.push(proximity)
  }

  // let photoresistor = new five.Sensor({
  //   pin: "A0",
  //   freq:250
  // });

  // photoresistor.on("data", function() {
  //   console.log('light'+this.value);
  // });


  // Definations end
  pubnub.subscribe({
    channels: ['smart-street-lights-node']
  });

  pubnub.addListener({
    message: function (m) {
      console.log(m.message.color);
      if(m.message.description == 'on-all'){
        for(let index in componentConfig){
          lightStatus = true;
          anodes[index].color(m.message.color);
        }
      }else if(m.message.description == 'off-all'){
        for(let index in componentConfig){
          lightStatus = undefined;
        }
      }else{
        for (let index in componentConfig) {
          anodes[index].color(m.message.color);
        }
      }
    }
  })

  // componentConfig.forEach(function(val,index){
  proximities[0].on("change", async function () {
    currentFrame[0] = this.cm;
    if (this.cm < 50) {
      anodes[0].on();
      frameDifference = lastFrame[0] - currentFrame[0];
      console.log(frameDifference);
      if (frameDifference > 100) {
        timeReached = new Date().getTime();
        if(timeLeft == 0){
          ruleBreakers++;
          var publishConfig = {
            channel: "smart-street-lights-node-to-site",
            message: {
                serverLocation:serverLocation,
                description: "Someone is coming from opposite direction of road!"
            }
          }
          pubnub.publish(publishConfig, function (status, response) {
          })
          console.log("ALERT! Someone is coming from opposite direction of road");
        }
        timeDifference = timeReached - timeLeft;
        timeLeft = 0;
        console.log(timeDifference);
        if(timeDifference < 500){
          ruleBreakers++;
          var publishConfig = {
            channel: "smart-street-lights-node-to-site",
            message: {
                serverLocation:serverLocation,
                description: "Someone's driving too fast to the positive direction of this road"
            }
          }
          pubnub.publish(publishConfig, function (status, response) {
          })        
          console.log("ALERT! Someone's driving too fast to the positive direction of this road");

        }
      }
    } else {
      if(!lightStatus) anodes[0].off();
    }
    lastFrame[0] = this.cm;
  });


  proximities[1].on("change", async function () {
    currentFrame[1] = this.cm;
    if (this.cm < 50) {
      anodes[1].on();
      frameDifference = lastFrame[1] - currentFrame[1];
      if (frameDifference > 100) {
        carsCount++;
        var publishConfig = {
          channel: "smart-street-lights-car-count",
          message: {
            carsCount:carsCount,
            ruleBreakers:ruleBreakers
          }
        }
        pubnub.publish(publishConfig)

        timeLeft = new Date().getTime();
        console.log(carsCount);
        timeReached = 0;
        // console.log(carsCount);
      }
    } else {
      if(!lightStatus) anodes[1].off();
    }
    lastFrame[1] = this.cm;
  });
  // })

  // app.get('/', function (req, res) {
  //   res.sendFile(path.join(__dirname + '/index.html'));
  // })

  // app.get('/alerts', function (req, res) {
  //   res.sendFile(path.join(__dirname + '/alerts.html'));
  //   // res.send("alerts!");
  // })

  app.get('/lights/on', function (req, res) {
    lightStatus = true;
    res.send({
      msg: 'Lights are turned on'
    });

  })

  app.get('/lights/off', function (req, res) {
    lightStatus = undefined;
    res.send({
      msg: 'Lights are turned off'
    });
  })

});




app.listen(80, function () {
  console.log(`
Yehhey! It Worked!
Your Code has been served over: http://192.168.43.38
`)
})
