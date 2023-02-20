window.addEventListener('DOMContentLoaded', () => {
  (async function() {
      let res = await fetch('api/data');
      if (res.status == 200) {
        let data = await res.text();
        let jj = JSON.parse(data);
        let tempDatasets = [];
        const div = document.getElementById("charts");
        
        // console.log(Object.keys(jj)[0]);
        // console.log(jj);
        // console.log(jj[Object.keys(jj)[0]].Timestamp);
        // console.log(jj[Object.keys(jj)[0]].RealTemp);
        // console.log(jj[Object.keys(jj)[0]].Setpoint);

        var dynamicColors = function() {
          var r = Math.floor(Math.random() * 255);
          var g = Math.floor(Math.random() * 255);
          var b = Math.floor(Math.random() * 255);
          return "rgb(" + r + "," + g + "," + b + ")";
       };

        // Data arrays
        let timestamps = [];

        // Create main datasets
        Object.keys(jj).forEach(zone => {
          tempDatasets.push({
            label: `Sonde ${zone.replaceAll('_', ' ')}`,
            data: [],
            fill: false,
            borderColor: dynamicColors(),
            tension: 0.5
          });
        });

         // Create new canvas
         const canvas = document.createElement('canvas');
         canvas.id = 'mainChart';
         canvas.style.border = "1px solid";
         
         // Append to main div
         div.appendChild(canvas);
        
        for (let i = 0; i < Object.keys(jj).length; i++) {
          // Fill data array
          jj[Object.keys(jj)[i]].forEach(index => {
            tempDatasets[i].data.push(index.RealTemp);
          });
        }

        jj[Object.keys(jj)[0]].forEach(index => {
          timestamps.push(index.Timestamp);
        });
        
        // console.log(tempDatasets);

        // Create new chart.js element
        new Chart(
          document.getElementById('mainChart'),
          {
            type: 'line',
            data: {
              labels: timestamps,
              datasets: tempDatasets
            }
          }
        );
      }
  })();
});
