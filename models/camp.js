"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Camp {
    /** Create a camp (from data), update db, return new camp data.
     *
     * data should be { parkCode, parkName, cost, image_url, commentary }
     *
     * Returns { parkCode, parkName, cost, image_url }
     *
     * Throws BadRequestError if camp already in database.
     * */
  
    static async create({ parkCode, parkName, cost, image_url}) {
      const duplicateCheck = await db.query(
            `SELECT id, parkCode, parkName, cost, image_url 
             FROM camps
             WHERE parkCode = $1`,
          [parkCode]);
  
      if (duplicateCheck.rows[0]){
        throw new BadRequestError(`Duplicate camp: ${parkCode} ID: ${duplicateCheck.rows[0].id}`);
      
    }
  
      const result = await db.query(
            `INSERT INTO camps
             (parkCode, parkName, cost, image_url)
             VALUES ($1, $2, $3, $4)
             RETURNING  id, parkCode, parkName, cost, image_url`,
          [
            parkCode,
            parkName,
            cost,
            image_url
          ],
      );
      const camp = result.rows[0];
  
      return camp;
    }
  
    /** Find all camps (optional filter on searchFilters).
     *
     * searchFilters (all optional):
     * - max_cost
     * - toilets
     * - cellPhoneReception
     *
     * Returns [{ parkCode, parkName, cost, toilets, image_url, cellPhoneReception }, ...]
     * */
  
    static async findAll({max_cost, toilets, cellPhoneReception}) {
      console.log("inside findall");
      let query = `SELECT id, parkCode,
                          parkName,
                          cost,
                          image_url
                   FROM camps c`;
      let whereExpressions = [];
      let queryValues = [];
  
      
      // For each possible search term, add to whereExpressions and queryValues so
      // we can generate the right SQL
  
      if (max_cost !== undefined) {
        queryValues.push(max_cost);
        whereExpressions.push(`cost <= $${queryValues.length}`);
      }
      //Returns park facilities with toilets
      if (toilets) {
        queryValues.push('');
        whereExpressions.push(`toilets <> $${queryValues.length}`);
        queryValues.push('%No%');
        whereExpressions.push(`AND toilets NOT ILIKE $${queryValues.length}`);
      }
  
      if (cellPhoneReception) {
        queryValues.push('');
        whereExpressions.push(`cellPhoneReception <> $${queryValues.length}`);
        queryValues.push('%No%');
        whereExpressions.push(`AND cellPhoneReception NOT ILIKE $${queryValues.length}`);
      }
  
      if (whereExpressions.length > 0) {
        query += " WHERE " + whereExpressions.join(" AND ");
      }
  
      // Finalize query and return results
  
      query += " ORDER BY parkName";
      console.log(query);
      const campsRes = await db.query(query, queryValues);
      return campsRes.rows;
    }
  
    /** Given a camp parkCode, return data about camp.
     *
     * Returns { parkCode, parkName, cost, image_url}
     *   where users is [{ username, fullName, state }, ...]
     *
     * Throws NotFoundError if not found.
     **/
  
    static async get(parkCode) {
      const campRes = await db.query(
            `SELECT parkCode,
                    parkName,
                    cost,
                    image_url
             FROM camps
             WHERE parkCode = $1`,
          [parkCode]);
  
      const camp = campRes.rows[0];
  
      if (!camp) throw new NotFoundError(`No camp: ${parkCode}`);
  
      const usersRes = await db.query(
            `SELECT r.user_id, r.camp_id, u.username, u.fullName, u.id  
             FROM reservations r LEFT JOIN users AS u on u.id = r.user_id
             WHERE r.camp_id = $1
             ORDER BY username`,
          [camp.id],
      );
  
      camp.users = usersRes.rows;
  
      return camp;
    }
  
    /** Update Camp data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
     *
     * Throws NotFoundError if not found.
     */
  
    static async update(parkCode, data) {
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {});
      const handleVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE camps 
                        SET ${setCols} 
                        WHERE parkCode = ${handleVarIdx} 
                        RETURNING parkCode, 
                                  parkName,
                                  cost, 
                                  image_url`;
      const result = await db.query(querySql, [...values, parkCode]);
      const camp = result.rows[0];
  
      if (!camp) throw new NotFoundError(`No camp: ${parkCode}`);
  
      return camp;
    }
  
    /** Delete given camp from database; returns undefined.
     *
     * Throws NotFoundError if camp not found.
     **/
  
    static async remove(parkCode) {
      const result = await db.query(
            `DELETE
             FROM camps
             WHERE parkCode = $1
             RETURNING parkCode`,
          [parkCode]);
      const camp = result.rows[0];
  
      if (!camp) throw new NotFoundError(`No camp: ${parkCode}`);
    }
  }
  
  
  module.exports = Camp;
  