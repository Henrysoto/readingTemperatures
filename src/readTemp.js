window.addEventListener('DOMContentLoaded', () => {
  (async function() {
      let res = await fetch('api/data');
      if (res.status == 200) {
        // Get JSON data from express
        let data = await res.text();
        let jj = JSON.parse(data);
        let tempDatasets = {};

        // Main div elem
        const div = document.getElementById("charts");
        
        // Generate random RGB colors for drawing lines
        var dynamicColors = function() {
          var r = Math.floor(Math.random() * 255);
          var g = Math.floor(Math.random() * 255);
          var b = Math.floor(Math.random() * 255);
          return "rgb(" + r + "," + g + "," + b + ")";
       };

        // Data arrays
        let timestamps = [];

        // Days counter
        let dayCount = 1;

        // Create main datasets
        Object.keys(jj).forEach(zone => {
          tempDatasets[zone] = {};
          let colors = dynamicColors();
          let rx = `Sonde ${zone.replaceAll('_', ' ')}`
          Object.keys(jj[zone]).forEach(days => {
            tempDatasets[zone][days] = {
              label: rx,
              data: [],
              setpoints: [],
              fill: false,
              borderColor: colors,
              tension: 0.5
            }
            dayCount++;
          }); 
        });
        
        dayCount = parseInt(dayCount/Object.keys(tempDatasets).length);
        let weekdays = [];
        weekdays[0] = "lundi";
        weekdays[1] = "mardi";
        weekdays[2] = "mercredi";
        weekdays[3] = "jeudi";
        weekdays[4] = "vendredi";
        weekdays[5] = "samedi";
        weekdays[6] = "dimanche";

        let weekdaysNum = [];
        Object.keys(jj).forEach(zone => {
          Object.keys(jj[zone]).forEach(dayNum => {
            if (weekdaysNum.indexOf(dayNum) === -1) {
              weekdaysNum.push(dayNum);
            }
          });
        });
        
        let overallAverage = 0.0;
        function computeAverage(zone, day) {
          let tmp = 0;
          for (let temp of jj[zone][day]) {
            tmp += temp.RealTemp;
          }
          overallAverage += parseFloat(tmp/jj[zone][day].length);
          return parseFloat(tmp/jj[zone][day].length).toFixed(2);
        }

        // Append each days to DOM
        for (let i = 0; i < dayCount; i++) {
          // Create title elem
          const jour = document.createElement('h5');
          const space = document.createElement('br');
          jour.innerText = `${weekdays[i][0].toUpperCase()}${weekdays[i].slice(1)}`;
          jour.style.color = "white"
          // Create table with average temperatures
          const detail = document.createElement('details');
          const summary = document.createElement('summary')
          summary.innerText = "Températures moyennes";
          const table = document.createElement('table');
          table.role = "grid";
          let iTable = `
            <thead>
                <tr>
                    <th scope="col">Zones</th>
                    <th scope="col">Températures moyennes</th>
                </tr>
            </thead>
            <tbody>`;
          
          Object.keys(jj).forEach(zone => {
            iTable = `${iTable}
              <tr>
                <td>${zone.replaceAll('_', ' ')}</td>
                <td>${computeAverage(zone, weekdaysNum[i])}</td>
              </tr>`;
          });
          iTable = `${iTable}
            <tfoot>
              <tr>
                <th scope="col">Température Moyenne Globale</td>
                <th scope="col">${parseFloat(overallAverage/Object.keys(jj).length).toFixed(2)}</td>
              </tr>
            </tfoot>`;
          iTable = `${iTable}</tbody>`;
          overallAverage = 0.0;
          table.innerHTML = iTable;
          detail.appendChild(summary);
          detail.appendChild(table);
          // Create canvas elem
          const canvas = document.createElement('canvas');
          canvas.id = weekdays[i];
          canvas.style.border = "1px solid";
          canvas.style.borderColor = "white";
          canvas.style.backgroundColor = "#1B1E24";
          // Append to main div
          div.appendChild(jour);
          div.appendChild(detail);
          div.appendChild(canvas);
          div.appendChild(space);
        }
        
        // Fill temperatures data into each zone per days
        Object.keys(jj).forEach(zone => {
          Object.keys(jj[zone]).forEach(days => {
            for (let heure of jj[zone][days]) {
              tempDatasets[zone][days].data.push(heure.RealTemp);
              tempDatasets[zone][days].setpoints.push(heure.Setpoint);
            } 
          });
        });

        // Get timestamp (same for each day)
        for (let day of jj.Cuisine[weekdaysNum[0]]) {
          timestamps.push(day.Timestamp);
        };

        let finalDatasets = {};

        // Fill chart datasets
        Object.keys(tempDatasets).forEach(zone => {
          Object.keys(tempDatasets[zone]).forEach(days => {
            if (days in finalDatasets === false) {
              finalDatasets[days] = [];
            }
            finalDatasets[days].push(tempDatasets[zone][days]);
          });
        });

        // Global chart color settings
        Chart.defaults.backgroundColor = '#CCBFAB';
        Chart.defaults.borderColor = '#CCBFAB';
        Chart.defaults.color = '#FFF';
        
        // Execute chart.js on each chart
        for (let i = 0; i < dayCount; i++) {
          new Chart(
            document.getElementById(weekdays[i]),
            {
              type: 'line',
              data: {
                labels: timestamps,
                datasets: finalDatasets[weekdaysNum[i]]
              },
              options: {
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        // Manually add setpoint data into the chart's tooltip
                        const labels = [
                          `${context.dataset.label}: ${context.dataset.data[context.dataIndex]}`,
                          `Consigne: ${context.dataset.setpoints[context.dataIndex]}`
                        ];
                        return labels;
                      }
                    }
                  }
                }
              }
            }
          );
        }
      }
  })();
});
