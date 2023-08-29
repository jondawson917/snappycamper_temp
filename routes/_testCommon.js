"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Camp = require("../models/camp");
const { createToken } = require("../helpers/tokens");



async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM camps");

  await Camp.create(
      {
        parkCode: "abcd",
        parkName: "Solid Park",
        cost: 10.00,
        image_url: "http://abcd.img",
      });
  await Camp.create(
    {
      parkCode: "efgh",
      parkName: "Rock and a Hard Place",
      cost: 30.00,
      image_url: "http://efgh.img",
    });
  await Camp.create(
    {
      parkCode: "ijkl",
      parkName: "Dome for your home national park",
      cost: 20.00,
      image_url: "http://ijkl.img",
    });



  await User.register({
    username: "u1",
    password: "password1",
    fullName: "U1F",
    state: "GA",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    password: "password2",
    fullName: "U2F",
    state: "CA",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    password: "password3",
    fullName: "U3F",
    state: "MA",
    isAdmin: false,
  });

  await User.applyToJob("u1", testJobIds[0]);
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  u2Token,
  adminToken,
};
