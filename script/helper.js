const getWeekdayDates = function(startDate, endDate) {
  let dates = []
  let currentDate = startDate

  const addDays = function(days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };


  while (currentDate <= endDate) {
    const isWeekday = currentDate.getDay() !== 0 && currentDate.getDay() !== 6
    if(isWeekday) {
      dates.push(currentDate);
    }
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

const randomIntFromInterval = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { getWeekdayDates, randomIntFromInterval }