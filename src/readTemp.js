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

        // Append chart per days
        for (let i = 0; i < dayCount; i++) {
          // Create canvas elem
          const jour = document.createElement('p');
          jour.innerText = `${weekdays[i][0].toUpperCase()}${weekdays[i].slice(1)}`;
          const canvas = document.createElement('canvas');
          canvas.id = weekdays[i];
          canvas.style.border = "1px solid";
          // Append to main div
          div.appendChild(jour);
          div.appendChild(canvas);
        }
        
        // Fill temperatures data into each zone per days
        Object.keys(jj).forEach(zone => {
          Object.keys(jj[zone]).forEach(days => {
            for (let heure of jj[zone][days]) {
              tempDatasets[zone][days].data.push(heure.RealTemp);
            } 
          });
        });

        // Get timestamp (same for each day)
        for (let day of jj.Cuisine.dimanche) {
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
        
        // Execute chart.js on each chart
        for (let i = 0; i < dayCount; i++) {
          new Chart(
            document.getElementById(weekdays[i]),
            {
              type: 'line',
              data: {
                labels: timestamps,
                datasets: finalDatasets[weekdays[i]]
              }
            }
          );
        }
      }
  })();
});
