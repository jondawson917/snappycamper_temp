"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testCampIds, testUserIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("user1", "bword");
    expect(user).toEqual({
      username: "user1",
      fullName: "artemisclyde",
      state: "MT",
      isAdmin: false,
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("user1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new",
    fullName: "Test",
    state: "Tester",
    isAdmin: false,
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].isAdmin).toEqual(false);
    console.log(found.rows[0].password);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].isAdmin).toEqual(true);
    console.log(found.rows[0].password);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "user1",
        fullName: "artemisclyde",
        state: "MT",
        isAdmin: false,
      },
      {
        username: "user2",
        fullName: "bulworth",
        state: "WV",
        isAdmin: true,
      },
      {
        username: "user3",
        fullName: "calvin",
        state: "FL",
        isAdmin: false,
      },
      {
        username: "user4",
        fullName: "marcusaurelius",
        state: "NH",
        isAdmin: false,
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("user1");
    expect(user).toEqual({
      id: 1,
      username: "user1",
      fullName: "artemisclyde",
      state: "MT",
      isAdmin: false,
      camps: [testCampIds[0]],
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    username: "newer",
    fullName: "newname",
    state: "AK",
    isAdmin: true,
  };

  test("works", async function () {
    let user = await User.update("user2", updateData);
    expect(user).toEqual({
      username: "newer",
      ...updateData,
    });
  });

  test("works: set password", async function () {
    let user = await User.update("user2", {
      password: "newpassword",
    });
    expect(user).toEqual({
      username: "user2",
      fullName: "bullworth",
      state: "WV",
      isAdmin: true,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u2'");
    expect(found.rows.length).toEqual(1);
    console.log(found.row[0].password);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        username: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("user1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await User.remove("user1");
    const res = await db.query(
        "SELECT * FROM users WHERE username='user1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** applyToJob */

describe("reserveCampsite", function () {
  test("works", async function () {
    await User.reserveCampsite(testUserIds[1], testCampIds[1]);

    const res = await db.query(
        "SELECT * FROM reservations WHERE camp_id=$1", [testCampIds[1]]);
    expect(res.rows).toEqual([{
      camp_id: testCampIds[1],
      user_id: testUserIds[1],
    }]);
  });

  test("not found if no such camp", async function () {
    try {
      await User.reserveCampsite(testUserIds[0], 9);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.reserveCampsite(99, testCampIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
