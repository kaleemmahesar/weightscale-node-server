const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const TEST_MODE = false; // Set true for dummy weights
const SIMULATION_INTERVAL = 2000;

app.use(express.static('public'));

wss.on('connection', (ws) => {
    console.log('✅ WebSocket client connected');
});

// ✅ Broadcast weight to all connected clients
function broadcastWeight(weight) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(weight.toString());
        }
    });
}

// ✅ Serial Port Connection & Data Parsing
async function connectSerial() {
    try {
        const ports = await SerialPort.list();
        console.log("\nAvailable Serial Ports:");
        ports.forEach((port, index) => {
            console.log(`${index + 1}. ${port.path} (${port.manufacturer || 'Unknown'})`);
        });

        const selectedPort = ports.find((p) => p.path === config.serialPortPath);
        if (!selectedPort) {
            console.error(`❌ Port ${config.serialPortPath} not found!`);
            startSimulation();
            return;
        }

        console.log(`\nAttempting to open: ${config.serialPortPath}`);

        const port = new SerialPort({
            path: config.serialPortPath,
            baudRate: config.baudRate,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            autoOpen: false
        });

        port.open((err) => {
            if (err) {
                console.error(`❌ Serial error: ${err.message}`);
                console.warn(`⚠ Switching to SIMULATION MODE...`);
                startSimulation();
            } else {
                console.log(`✅ Serial port ${config.serialPortPath} opened`);
            }
        });

        // ✅ Handle incoming data (raw buffer)
        port.on('data', (rawBuffer) => {
            const asciiFrame = rawBuffer.toString('ascii').replace(/[^\x20-\x7E]/g, '');
            const match = asciiFrame.match(/([+-])(\d{7})/);

            if (match) {
                const sign = match[1];
                const rawDigits = match[2];
                let weight = parseInt(rawDigits, 10) / 10; // ✅ Adjust scaling
                if (sign === '-') weight = -weight;

                const displayWeight = weight.toFixed(1); // ✅ Always KG
                console.log(`✅ Weight: ${displayWeight} KG`);

                broadcastWeight(displayWeight);
            }
        });

        // ✅ TEST MODE fallback
        if (TEST_MODE) {
            setTimeout(() => {
                console.log("⚠ No data from device, sending dummy weights...");
                setInterval(() => {
                    const dummyWeight = (Math.random() * 1000).toFixed(1);
                    console.log(`🔹 Dummy Weight: ${dummyWeight} KG`);
                    broadcastWeight(dummyWeight);
                }, SIMULATION_INTERVAL);
            }, 3000);
        }

    } catch (error) {
        console.error("❌ Error connecting to serial port:", error.message);
        startSimulation();
    }
}

// ✅ Simulation mode (always active if device is not connected)
function startSimulation() {
    console.log("⚠ Using SIMULATION MODE...");
    setInterval(() => {
        const simulatedWeight = (Math.random() * 1000).toFixed(1);
        console.log(`Simulated: ${simulatedWeight} KG`);
        broadcastWeight(simulatedWeight);
    }, SIMULATION_INTERVAL);
}

// ✅ Start servers
server.listen(config.wsPort, () => {
    console.log(`✅ WebSocket server running on ws://localhost:${config.wsPort}`);
});
app.listen(config.httpPort, () => {
    console.log(`✅ Frontend available at http://localhost:${config.httpPort}`);
});

connectSerial();
