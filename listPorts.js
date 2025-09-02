const { SerialPort } = require('serialport');

SerialPort.list()
  .then(ports => {
    if (ports.length === 0) {
      console.log('❌ No serial ports found.');
    } else {
      console.log('✅ Available Serial Ports:');
      ports.forEach(port => {
        console.log(`- ${port.path} (${port.manufacturer || 'Unknown'})`);
      });
    }
  })
  .catch(err => console.error(`❌ Error listing ports: ${err.message}`));
