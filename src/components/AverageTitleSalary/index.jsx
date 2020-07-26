import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { VerticalBarSeries, XYPlot, XAxis, YAxis } from 'react-vis'

function AverageTitleSalary() {
  const [data, setData] = useState([]);


  useEffect(() => {
    async function fetchData(){
      console.log('calls')
      const result = await axios(
        'http://localhost:4000/average-title-salary',
      );

      setData(result.data);
    }
    fetchData()
  }, []);

  if(data.length === 0) {
    return <h3>Fetching..</h3>
  }

  return (
    <XYPlot
    width={800}
    height={300}
    xType="ordinal"
  >
  <VerticalBarSeries
    data={data}
    width={300}
    height={300}
  />
    <XAxis />
    <YAxis
      tickFormat={function tickFormat(d){
        return `${d}K`
       }}
    />
  </XYPlot>
  )
}

export default AverageTitleSalary