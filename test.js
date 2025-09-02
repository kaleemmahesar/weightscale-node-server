const { SerialPort } = require('serialport');

const port = new SerialPort({
    path: 'COM4', // Change to your port
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
});

console.log("✅ Listening for weight data...\n");

port.on('data', (rawBuffer) => {
    const hexFrame = rawBuffer.toString('hex').match(/.{1,2}/g).join(' ');
    const asciiFrame = rawBuffer.toString('ascii').replace(/[^\x20-\x7E]/g, '');

    console.log("========================");
    console.log(`Frame (Hex): ${hexFrame}`);
    console.log(`Frame (ASCII): ${asciiFrame}`);

    const match = asciiFrame.match(/([+-])(\d{7})/); // Sign + 7 digits
    if (match) {
        const sign = match[1];
        const rawDigits = match[2]; // 7 digits from indicator
        let weight = parseInt(rawDigits, 10);

        // ✅ Scale adjustment:
        // - If indicator shows "60" but raw is 0000600 → divide by 10
        // - If indicator shows "100" but raw is 0001000 → divide by 10
        // - If indicator shows "12000" but raw is 0012000 → divide by 10
        weight = weight / 10;

        if (sign === '-') weight = -weight;

        // ✅ Format output (KG or TON)
        let displayWeight = '';
        if (weight >= 1000) {
            // Convert to tons
            displayWeight = weight.toFixed(1) + ' KG';
        } else {
            displayWeight = weight.toFixed(1) + ' KG';
        }

        console.log(`✅ Weight Detected: ${displayWeight}`);
    } else {
        console.log("⚠ No valid weight found");
    }

    console.log("========================\n");
});
