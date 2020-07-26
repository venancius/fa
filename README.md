# FA

This project demonstrates data processing, backend service, and front end service

- On the data processing part, mostly the main idea is to bundle stream data into larger chunk first before storing
- Frontend part bootstrapped by create-react-app
- Backend part uses very straight forward routing structure

## Requirements

- [Node JS](https://nodejs.org/en/)
- This project uses [yarn](https://classic.yarnpkg.com/en/docs/install/)
- Data Source: [Test DB](https://github.com/datacharmer/test_db)


## Setup ETL

1. Install all requirements ( You can copy and run the Dockerfile from the test_db repo )
2. Import the datasource, all necessary information is already listed on the page
3. Execute `sql/emp_attendances.sql` and `sql/emp_leaves.sql` in your database
3. Run `yarn install`
4. Run `node script/emp_attendances.js`
5. Run `node script/emp_leaves.js`
6. Run `node script/salaries.js`


## Run Backend Service

1. Make sure all dependency installed, otherwise `yarn install`
2. This service uses kue, which depends on redis. Start redis service `yarn redis:run`
3. Run `node backend` to start


## Run Frontend Service

1. Make sure all dependency installed, otherwise `yarn install`
2. Run `yarn start`

