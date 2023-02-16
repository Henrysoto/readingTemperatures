window.addEventListener('DOMContentLoaded', () => {
  (async function() {
      let res = await fetch('api/data');
      if (res.status == 200) {
        let data = await res.text();
        let jj = JSON.parse(data);
        let result = {};
        const div = document.getElementById("charts");
        
        // console.log(Object.keys(jj)[0]);
        // console.log(jj);
        // console.log(jj[Object.keys(jj)[0]].Timestamp);
        // console.log(jj[Object.keys(jj)[0]].RealTemp);
        // console.log(jj[Object.keys(jj)[0]].Setpoint);
        
        for (let i = 0; i < Object.keys(jj).length; i++) {
          
          // Create new canvas
          const canvas = document.createElement('canvas');
          canvas.id = Object.keys(jj)[i];
          canvas.style.border = "1px solid";
          
          // Append to main div
          div.appendChild(canvas);

          // Data arrays
          let timestamps = [];
          let setpoints = [];
          let realtemps = [];

          // Fill arrays
          jj[Object.keys(jj)[i]].forEach(index => {
            timestamps.push(index.Timestamp);
            setpoints.push(index.Setpoint);
            realtemps.push(index.RealTemp);
          });

          // Create new chart.js element
          new Chart(
            document.getElementById(Object.keys(jj)[i]),
            {
              type: 'line',
              data: {
                labels: timestamps,
                datasets: [{
                  label: `Sonde ${Object.keys(jj)[i].replaceAll('_', ' ')}`,
                  data: realtemps,
                  fill: false,
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.2
                }]
              }
            }
          );
        }
      }
  })();
});
