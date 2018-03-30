import React from 'react';
import { StyleSheet, Text, View, ToastAndroid, Button, Picker, TouchableOpacity, ActivityIndicator } from 'react-native';
import TimerMixin from 'react-timer-mixin';
// import { setTimeout } from 'core-js/library/web/timers';
import KeepAwake from 'react-native-keep-awake';
import BluetoothSerial from 'react-native-bluetooth-serial'
import Orientation from 'react-native-orientation';
import DeviceInfo from 'react-native-device-info';

const BTID = "20:16:03:10:75:06";
  
////////////
require('./MockBT')
////////////

const Btn = ({title, onPress}) =>
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title.toUpperCase()}</Text>
  </TouchableOpacity>

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      status: "Init",
      timer: "5",
      resultTime: 0,
      resettingIn: 0,
    };
  }

  componentDidMount() {
    // this locks the view to Portrait Mode
    Orientation.lockToLandscape();
    KeepAwake.activate();
  }

  doToast(text) {
    this.setState({ status: "Toast: " + text})
    ToastAndroid.show(text, ToastAndroid.SHORT);
  }

  status(text) {
    this.setState({ status: text})
  }

  onPressButton = () => { // AROW FUNC so this is correct scope
    this.doToast("BT ID: " + BTID);
  }

  connect = () => {
    this.status("trying to connect...")
    Promise.all([
      BluetoothSerial.isEnabled(),
      // BluetoothSerial.list()
      BluetoothSerial.connect(BTID),
      // BluetoothSerial.clear(),
    ])
    .then((values) => {
      const [ isEnabled, devices ] = values
      this.setState({ status: "Connected!", connected: true});
        this.checkForData();
    })
    .catch((err) => this.doToast("GOT ERR!!! " + err.message))
  }

  checkForData = () => {
    BluetoothSerial.available().then((bytes) => {
      if (bytes > 1) {
        BluetoothSerial.readUntilDelimiter("\r").then((data) => {
          console.log("Got Data: '" + data + "'")
          
          if (data == "FirstTrigger") {
            this.setState({ status: "FirstTrigger"});
          }
          if (data.match(/^[0-9]+$/)) {
            time = parseInt(data);
            // this.setState({ status: "TIME: " +  });
            this.setState({ status: "GotTime", time:  parseFloat(time / 1000).toFixed(2) });

            this.setState({ resettingIn: this.state.timer} )
            this.startResetCountdown();
          }
        });
      }
      TimerMixin.setTimeout(this.checkForData, 100)
    })
  }

  startResetCountdown() {
    TimerMixin.setTimeout(() => {
      if (this.state.resettingIn == 0) {
        this.reset() // works in this scope????????
      } else {
        console.log("Setting new resetting in to: ", this.state.resettingIn - 1)
        this.setState({ resettingIn: parseInt(this.state.resettingIn) - 1 })
        this.startResetCountdown()
      }
    }, 1000)
  }

  disconnect = () => {
    BluetoothSerial.disconnect()
    .then(() => this.setState({ connected: false, status: "Disconnected" }))
    .catch((err) => this.doToast(err.message))
  }

  write = (message) => {
    if (!this.state.connected) {
      this.doToast('You must connect to device first')
      return
    }

    BluetoothSerial.write(message)
    .then((res) => {
      this.doToast('Successfuly wrote to device')
      this.setState({ connected: true, status: "Writing Data!" })
    })
    .catch((err) => this.doToast("WRITE ERR: " + err))
  }

  runIt = () => {
    this.write("R");
  }
  
  reset = () => {
    firstTrig = false;
    this.setState({ status: "Init", time: 0, resettingIn: 0 })
    this.write("D");
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Starting point MAC3</Text>
        <View style={styles.btncontainer}>
          <Picker style={styles.picker}
            selectedValue={this.state.timer}
            onValueChange={(itemValue, itemIndex) => this.setState({ timer: itemValue})}>
            <Picker.Item label="5s" value="5" />
            <Picker.Item label="15s" value="15" />
            <Picker.Item label="25s" value="25" />
            <Picker.Item label="35s" value="35" />
          </Picker>
          <Btn
            onPress={this.connect}
            title="Connect"
          />
          <Btn
            onPress={this.disconnect}
            title="Disconnect"
          />
          <Btn
            onPress={this.runIt}
            title="Run!"
          />
          <Btn
            onPress={this.reset}
            title="reset"
          />
        </View>
        <View style={styles.status}>
          <Text style={styles.statusText}>Status: {this.state.status}</Text>  
        </View>

        {this.state.status == "FirstTrigger" &&
          <View style={styles.container}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        }
        {this.state.status == "GotTime" &&
          <View style={styles.continer}>
            <Text style={styles.time}>{this.state.time}s</Text>  
            <Text style={styles.reset}>{this.state.resettingIn}s</Text>  
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
    // alignItems: '',
    justifyContent: 'center',
  },
  btncontainer: {
    // flex: 1,
    flexDirection: 'row',
    height: 40,
  },
  button: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: 'grey',
    // padding: 10,
    margin: 10,
    width: '15%',
    height: 30,

  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  picker: {
    width: '15%',
  },
  status: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 19,
  },
  timerText: {
    fontSize: 15,
    fontWeight: 'bold',
    padding: 15,
  },
  time: {
    fontSize: 120,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reset: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
