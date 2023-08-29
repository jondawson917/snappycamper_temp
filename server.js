"use strict";

const app = require("./app");

const {APP_PORT} = require("./config");

app.listen(APP_PORT, function () {
  console.log(`Started on ${APP_PORT}`);
});
