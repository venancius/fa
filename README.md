# FA ETL

A series of etl command for generating certain data


## Requirements

- [Node JS](https://nodejs.org/en/)
- [yarn](https://classic.yarnpkg.com/en/docs/install/)
- Data Source: [Test DB](https://github.com/datacharmer/test_db)


## Setup

1. Install all requirements ( You can put and run the Dockerfile from the test_db repo )
2. Import the datasource, all necessary information is already listed on the page
3. Execute `emp_attendances.sql` and `emp_leaves.sql`
3. Run `yarn install`
4. Run `node script/emp_attendances.js`
5. Run `node script/emp_leaves.js`
6. Run `node script/salaries.js`
