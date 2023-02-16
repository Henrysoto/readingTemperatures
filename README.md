# readingTemperatures
Retrieving temperatures from Thermozyklus heating system through an AMX system and displaying the data nicely with the help of nodeJS as backend and chart.js in frontend.

# Thermozyklus
- Connection is made through an RS485 port and using the MODBUS protocol.

# AMX
- Asking sensors temperatures to Thermozyklus, retrieving the data and writing to a CSV file with the following scheme: Timestamp,Zone(addr),setpoint,temperature.

# Server
- NodeJS with express for handling the requests. Client can choose between a raw JSON response or an html page with a script handling the data through Chart.js.
