const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testCampIds = [];
const testUserIds = [];
async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM camps");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM reservations");

  const resultsUsers = await db.query(
    `
    INSERT INTO users (username, password, fullName, state, is_admin)
    VALUES ('user1', $1, 'artemisclyde', 'MT', false),
           ('user2', $2, 'bulworth', 'WV', true),
           ('user3', $3, 'calvin', 'FL', false),
           ('user4', $4, 'marcusaurelius', 'NH', false)
    RETURNING id`,
    [
      await bcrypt.hash("bword", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("cword", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("fword", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("sword", BCRYPT_WORK_FACTOR),
    ]
  );

  testUserIds.splice(0, 0, ...resultsUsers.rows.map((r) => r.id));
  console.log(testUserIds);
  const resultsCamps = await db.query(`
    INSERT INTO camps(parkCode, parkName, cost, image_url)
    VALUES ('cmp1', 'hoohah', '10.00', 'http://c1.img'),
           ('cmp2', 'marshmallow', '15.00', 'http://c2.img'),
           ('cmp3', 'twiggy', 3, '20.00', 'http://c3.img') RETURNING id`);

  testCampIds.splice(0, 0, ...resultsCamps.rows.map((r) => r.id));
  console.log(testCampIds);

  await db.query(
    `
        INSERT INTO reservations(user_id, camp_id)
        VALUES ($1, $2)`,
    [testUserIds[0], testCampIds[0]]
  );
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

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testCampIds, testUserIds
};
