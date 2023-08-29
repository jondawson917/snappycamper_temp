"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ExistsError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, password, fullName, state, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
      `SELECT username,
                  password,
                  fullName,
                  state,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, fullName, state, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register({ username, password, fullName, state, isAdmin }) {
    const duplicateCheck = await db.query(
      `SELECT username
           FROM users
           WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    console.log("Hashed Password", hashedPassword);
    const result = await db.query(
      `INSERT INTO users
           (username,
            password,
            fullName,
            state,
            is_admin)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING username, fullName, state, is_admin AS "isAdmin"`,
      [username, hashedPassword, fullName, state, isAdmin]
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, fullName, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
      `SELECT username,
                  fullName,
                  state,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, FullName, state, is_admin }
   *   where camp is { parkCode, name, cost, image_url, user_id
   *  }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
      `SELECT id, username,
                  fullName,
                  state,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
      [username]
    );

    const user = userRes.rows[0];
    
    if (!user) throw new NotFoundError(`No user: ${username}`);

    const userCampRes = await db.query(
      `SELECT r.user_id, r.camp_id, c.parkCode, c.parkName  
            FROM reservations r LEFT JOIN camps AS c on c.id = r.camp_id
            WHERE r.user_id = $1`,
      [user.id]
    );
    user.camps = (userCampRes.rows.length > 0) ? userCampRes.rows.map((c) => c) : [];
    console.log("User camps:", user)
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { fullName, password, state, isAdmin }
   *
   * Returns { username, fullName, state, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      isAdmin: "is_admin",
    });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                fullName,
                                state,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
      `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Reservea a camp: update db, returns undefined.
   *
   * - user_id: user id of user reserving the campsite
   * - camp_id: camp id
   **/

  static async reserveCampsite(user_id, camp_id) {
    console.log("Inside reserve campsite last function:");
    console.log("User ID: ", user_id, "camp ID", camp_id);

    const preCheck = await db.query(
      `SELECT parkCode, id
           FROM camps
           WHERE id = $1`,
      [camp_id]
    );
    const camp = preCheck.rows[0];
    console.log("Camp in reserveCampsite", camp);
    if (!camp) throw new NotFoundError(`No camp: ${camp_id}`);

    const preCheck2 = await db.query(
      `SELECT id, username, fullName, state
           FROM users
           WHERE id = $1`,
      [user_id]
    );
    const user = preCheck2.rows[0];
    console.log("User in reserveCampsite", user);
    if (!user) throw new NotFoundError(`No username: ${user_id}`);

    const preCheck3 = await db.query(
      `SELECT user_id, camp_id FROM reservations WHERE camp_id = $1 and user_id = $2`,
      [camp_id, user_id]
    );
    const reservation = preCheck3.rows[0];
    console.log(reservation);
    if (reservation)
      throw new ExistsError(
        `Reservation already exists. ID: ${reservation.id}`
      );

    await db.query(
      `INSERT INTO reservations (user_id, camp_id)
           VALUES ($1, $2)`,
      [user_id, camp_id]
    );
  }

  static async removeReservation(user_id, camp_id){
     let result = await db.query(
      `DELETE
           FROM reservations
           WHERE user_id = $1 and camp_id = $2
           RETURNING user_id, camp_id`,
      [user_id, camp_id]
    );
    const reserve = result.rows[0]; console.log(reserve);

    if (!reserve) throw new NotFoundError(`No reservation for User: ${user_id} Camp: ${camp_id} `);
  } 
  
}

module.exports = User;
