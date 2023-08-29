"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Facility {
  /** Create a facility (from data), update db, return new camp data.
   *
   * data should be { parkCode, parkName, cost, image_url, commentary }
   *
   * Returns { parkCode, parkName, cost, image_url, commentary }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({
    parkCode,
    cellPhoneReception,
    toilets,
    boat_access,
    rv_access,
    wheelchair_access,
  }) {
    const duplicateCheck = await db.query(
      `SELECT parkCode, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access 
             FROM facility
             WHERE parkCode = $1`,
      [parkCode]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate facility for camp: ${parkCode}`);

    const result = await db.query(
      `INSERT INTO facility
             (parkCode, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING  parkCode, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access`,
      [
        parkCode,
        cellPhoneReception,
        toilets,
        boat_access,
        rv_access,
        wheelchair_access,
      ]
    );
    const facility = result.rows[0];

    return facility;
  }

  /** Find all facilities (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - max_cost
   * - toilets
   * - cellPhoneReception
   *
   * Returns [{ parkCode, parkName, cost, toilets, image_url, cellPhoneReception }, ...]
   * */

  static async findAll() {
    console.log("Inside findall");
    const result = await db.query(
      `SELECT c.parkName, f.parkCode,
        f.cellPhoneReception, f.toilets, f.boat_access, f.rv_access, f.wheelchair_access
         FROM facility f LEFT JOIN camps AS c ON c.parkCode = f.parkCode
         ORDER BY parkCode`
    );

    return result.rows;
  }

  /** Given a camp parkCode, return data about camp.
   *
   * Returns { parkCode, parkName, cost, image_url}
   *   where users is [{ username, fullName, state }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(parkCode) {
    const facilityRes = await db.query(
      `SELECT c.parkName, f.parkCode,
        f.cellPhoneReception, f.toilets, f.boat_access, f.rv_access, f.wheelchair_access
     FROM facility f LEFT JOIN camps AS c ON c.parkCode = f.parkCode WHERE f.parkCode = $1
     ORDER BY parkCode`,
      [parkCode]
    );

    const facility = facilityRes.rows[0];

    if (!facility) throw new NotFoundError(`No facilities for: ${parkCode}`);

    const usersRes = await db.query(
      `SELECT u.username, u.fullName, u.state, r.parkCode 
             FROM users u LEFT JOIN reservations as r ON r.username = u.username
             WHERE parkCode = $1
             ORDER BY username`,
      [parkCode]
    );

    if (usersRes.rows.length > 0) {
      facility.users = usersRes.rows;
    }
    return facility;
  }

  /** Update facility data with `data`.
   *
   * This is a "partial update"
   *
   * Data can include: {parkCode, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access}
   *
   * Returns {parkCode, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access}
   *
   * Throws NotFoundError if not found.
   */

  static async update(parkCode, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE facility 
                        SET ${setCols} 
                        WHERE parkCode = ${handleVarIdx} 
                        RETURNING parkCode, 
                                  cellPhoneReception,
                                  toilets, 
                                  boat_access, rv_access, wheelchair_access`;
    const result = await db.query(querySql, [...values, parkCode]);
    const facility = result.rows[0];

    if (!facility) throw new NotFoundError(`No company: ${parkCode}`);

    return facility;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(parkCode) {
    const result = await db.query(
      `DELETE
             FROM facility
             WHERE parkCode = $1
             RETURNING parkCode`,
      [parkCode]
    );
    const facility = result.rows[0];

    if (!facility) throw new NotFoundError(`No company: ${parkCode}`);
  }
}

module.exports = Facility;
