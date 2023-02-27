const { parse } = require('csv-parse');
const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ftpClient = require('ftp');

const config = {
    host: "192.168.5.21",
    port: 21,
    user: "administrator",
    password: "password"
}

// Retrieve CSV files from AMX FTP server
client = new ftpClient();
client.on('ready', () => {
    client.list((err, list) => {
        if (err) { throw err; }
        list.forEach(obj => {
            if (obj.name.indexOf('.csv') > -1) {
                client.get(obj.name, (err, stream) => {
                    if (err) { throw err; }
                    stream.once('close', () => { client.end(); });
                    stream.pipe(fs.createWriteStream(obj.name));
                });
            }
        });
        client.end();
    });
});

client.on('error', (err) => {
    console.error(`Could not connect to server with address: ${config.host} !`);
    console.log('Trying to read current directory for CSV files..');
    try {
        readTemp();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
})

client.on('end', () => {
    // Read CSV Files and host server
    try {
        readTemp();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
});

function readTemp() {
    fs.readdir(__dirname, (err, files) => {
        if (err) { return console.error(err.message); }
        let csvFiles = [];
        files.forEach(file => {
            if (path.extname(file) == ".csv") {
                csvFiles.push(file);
            }
        });

        let tempRecords = {};
        const parser = parse({
            columns: ['Timestamp', 'Zone', 'Setpoint', 'RealTemp']
        });
        
        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                if (record.Zone.indexOf('<EOL>') > -1) continue;

                // Format zone name
                let name = record.Zone
                    .slice(0, record.Zone.indexOf('('))
                    .trimEnd()
                    .replaceAll(' ', '_');

                // Format timestamp to Date object format
                let timestamp = record.Timestamp
                    .replaceAll('[', '')
                    .replaceAll(']', '')
                    .replaceAll('.', ' ');
                let parts = timestamp.split('-');
                let time = parts[2].split(' ')[1];
                time = time.slice(0, time.indexOf(':', 5));
                timestamp = `20${parts[2].split(' ')[0]}-${parts[1]}-${parts[0]}T${time}:00Z`;
                timestamp = new Date(timestamp);
                
                if (name in tempRecords === false) {
                    tempRecords[name] = {}
                }
                
                // Sort by days
                let day = timestamp.toLocaleDateString('fr-FR', { weekday: 'long' });
                if (day in tempRecords[name] === false) {
                    tempRecords[name][day] = []
                }

                tempRecords[name][day].push({ 
                    Timestamp: timestamp.toLocaleTimeString(),
                    RealTemp: parseFloat(record.RealTemp),
                    Setpoint: parseFloat(record.Setpoint)
                });
            }
        });

        parser.on('error', (err) => {
            console.error(err.message);
        });
        
        parser.on('end', () => {
            //console.log(tempRecords.Cuisine);
            
            app.use(express.static('src'));
        
            router.get('/', (req, res) => {
                res.sendFile(path.join(__dirname, 'src', 'index.html'));
            });

            router.get('/api/data', (req, res) => {
                res.json(tempRecords);
            });

            app.use('/', router);
            app.listen(process.env.PORT || 8001, '0.0.0.0');
            console.log(`Server listening: http://localhost:8001`);
        });

        csvFiles.forEach(file => {
            console.log(`Creating reading stream for file: ${file}`);
            fs.createReadStream(file).pipe(parser);
        });
    });
}

// Connect to FTP server
client.connect(config);
