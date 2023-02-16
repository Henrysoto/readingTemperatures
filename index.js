const { parse } = require('csv-parse');
const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ftpClient = require('ftp');

const config = {
    host: '192.168.5.21',
    port: 21,
    user: 'administrator',
    password: 'password'
}

// Retrieve CSV files from AMX FTP server
client = new ftpClient();
client.on('ready', () => {
    client.list((err, list) => {
        if (err) console.error(err.message);
        list.forEach(obj => {
            if (obj.name.indexOf('.csv') > -1) {
                client.get(obj.name, (err, stream) => {
                    if (err) console.error(err.message);
                    stream.once('close', () => { client.end(); });
                    stream.pipe(fs.createWriteStream(obj.name));
                });
            }
        });
        client.end();
    });
});

client.on('end', () => {
    // Read CSV Files and host server
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
                
                let name = record.Zone
                    .slice(0, record.Zone.indexOf('('))
                    .trimEnd()
                    .replaceAll(' ', '_');
                if (name in tempRecords === false) {
                    tempRecords[name] = []
                } else {
                    tempRecords[name].push({ 
                        Timestamp: record.Timestamp,
                        RealTemp: parseFloat(record.RealTemp),
                        Setpoint: parseFloat(record.Setpoint)
                    });
                }
            }
        });

        parser.on('error', (err) => {
            console.error(err.message);
        });
        
        parser.on('end', () => {
            console.log(tempRecords);

            app.use(express.static('src'))
        
            router.get('/', (req, res) => {
                res.sendFile(path.join(__dirname, 'src', 'index.html'));
            });

            router.get('/api/data', (req, res) => {
                res.json(tempRecords);
            });

            app.use('/', router);
            app.listen(process.env.port || 8001);
        });

        csvFiles.forEach(file => {
            fs.createReadStream(file).pipe(parser);
        });
    });
});

// Connect to FTP
client.connect(config);
