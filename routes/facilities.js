"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Facility = require("../models/facility");

const facilityNewSchema = require("../schemas/facilityNew.json");
const facilityUpdateSchema = require("../schemas/facilityUpdate.json");

const router = new express.Router();

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, facilityNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const facility = await Facility.create(req.body);
    return res.status(201).json({ facility });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { facilities: [ { parkCode,
                    parkName,
                    cellPhoneReception, toilets, boat_access, wheelchair_access, rv_access
                    image_url }, ...] }
 
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
  try {
    console.log("Inside the get route");

    const facilities = await Facility.findAll();
    return res.json({ facilities });
  } catch (err) {
    return next(err);
  }
});

/** GET /[parkCode]  =>  { camp }
 *
 *  Camp is { parkCode, parkName, cost, image_url }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */
router.get("/:parkCode", async function (req, res, next) {
  try {console.log("Inside get with parkCode");
    const facility = await Facility.get(req.params.parkCode);
    return res.json({ facility });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[parkCode] { fld1, fld2, ... } => { camp }
 *
 * Patches camp data.
 *
 * fields can be: {parkCode, parkName, cost, image_url }
 *
 * Returns { parkCode, parkName, cost, image_url}
 *
 * Authorization required: admin
 */

router.patch("/:parkCode", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, facilityUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const facility = await Facility.update(req.params.parkCode, req.body);
    return res.json({ facility });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[parkCode]  =>  { deleted: parkCode }
 *
 * Authorization: admin
 */

router.delete("/:parkCode", ensureAdmin, async function (req, res, next) {
  try {
    await Facility.remove(req.params.parkCode);
    return res.json({ deleted: req.params.parkCode });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
