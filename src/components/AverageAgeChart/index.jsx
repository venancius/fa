import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { RadialChart } from 'react-vis'

function AverageAgeChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData(){
      console.log('calls')
      const result = await axios(
        'http://localhost:4000/average-employee-age',
      );

      setData(result.data);
    }
    fetchData()
}, []);

  if(data.length === 0) {
    return <h3>Fetching..</h3>
  }

  return (
  <RadialChart
    data={data}
    width={300}
    height={300}
    showLabels
  />)
}

export default AverageAgeChart