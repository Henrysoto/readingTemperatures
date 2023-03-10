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
                if (file in csvFiles === false) {
                    csvFiles.push(file);
                }
            }
        });

        csvFiles.sort();
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
                time = time.split(':');
                timestamp = new Date(
                    `20${parts[2].split(' ')[0]}`,
                    parts[1],
                    parts[0],
                    time[0],
                    time[1],
                    time[2]
                );

                if (name in tempRecords === false) {
                    tempRecords[name] = {}
                }
                
                // Sort by days
                let day = timestamp.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' });
                if (day in tempRecords[name] === false) {
                    tempRecords[name][day] = []
                }

                tempRecords[name][day].push({ 
                    Timestamp: timestamp.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' }),
                    RealTemp: parseFloat(record.RealTemp),
                    Setpoint: parseFloat(record.Setpoint)
                });
            }
        });

        parser.on('error', (err) => {
            console.error(err.message);
        });
        
        parser.on('end', () => {
            
            // temp fix for azure
            Object.keys(tempRecords).forEach(zone => {
                Object.fromEntries(
                    Object.entries(tempRecords[zone]).sort()
                );
            })
            
            app.use(express.static('src'));
        
            router.get('/', async function(req, res, next) {
                try {
                    res.sendFile(path.join(__dirname, 'src', 'index.html'));
                } catch(err) {
                    console.error(`Error retrieving index: ${err.message}`);
                    next(err);
                }
            });

            router.get('/api/data', async function(req, res, next) {
                try {
                    res.json(tempRecords);
                } catch(err) {
                    console.error(`Error retrieving data: ${err.message}`);
                    next(err);
                }
            });

            router.get('/api/data/zones', async function(req, res, next) {
                try {
                    let zones = [];
                    Object.keys(tempRecords).forEach(zone => {
                        zones.push(zone.replaceAll('_', ' '));
                    });
                    res.json(zones);
                } catch(err) {
                    console.error(`Error retrieving zones data: ${err.message}`);
                    next(err);
                }
            });

            router.get('/api/data/:zone', async function(req, res, next) {
                try {
                    res.json(tempRecords[req.params.zone]);
                } catch(err) {
                    console.error(`Error retrieving zone: ${req.params.zone} ${err.message}`);
                    next(err);
                }
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
