import React from 'react';
import { StyleSheet, Text, View, ToastAndroid, Button, TouchableOpacity } from 'react-native';
import KeepAwake from 'react-native-keep-awake';
import BluetoothSerial from 'react-native-bluetooth-serial'
import { setTimeout } from 'core-js/library/web/timers';

const BTID = "20:16:03:10:75:06";
  
const Btn = ({title, onPress}) =>
  // <Button style={styles.button}
  //   onPress={onPress}
  //   title={title}
  // />
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title.toUpperCase()}</Text>
  </TouchableOpacity>

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      status: "Init",
    };
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
          this.setState({ status: "DATA: " + data });
        });
      }
      setTimeout(this.checkForData, 1)
    })
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
    this.write("D");
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Starting point MAC1</Text>
        <KeepAwake />
        {/* <Btn
          onPress={this.onPressButton}
          title="Toast Me"
        /> */}
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
        <Text>{this.state.status}</Text>       
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    backgroundColor: 'grey',
    padding: 10,
    margin: 10,

  },
  buttonText: {
    color: '#7B1FA2',
    fontWeight: 'bold',
    fontSize: 30,
  },
});
