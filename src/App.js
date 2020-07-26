import React from 'react';
import './App.css';
import AverageAgeChart from './components/AverageAgeChart'
import AverageTitleSalary from './components/AverageTitleSalary';

function App() {
  return (
    <div className="App">
      <div className="container">
        <div>
        <h2>Average Employee Salary ( by title) </h2>
        <AverageTitleSalary/>
        </div>
        <div>
          <h2>Average Employee Age Chart</h2>
          <AverageAgeChart/>
        </div>
    </div>
    </div>
  );
}

export default App;
