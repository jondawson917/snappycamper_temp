"use strict";

/** Routes for companies. */
"";
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Camp = require("../models/camp");

const campNewSchema = require("../schemas/campNew.json");
const campUpdateSchema = require("../schemas/campUpdate.json");
const campSearchSchema = require("../schemas/campSearch.json");

const router = new express.Router();

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    console.log("Inside post request:", req.body);
    const validator = jsonschema.validate(req.body, campNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    console.log("Before create function");
    const camp = await Camp.create(req.body);
    console.log("caamps", camp);
    return res.status(201).json({ camp });
  } catch (err) {
    console.log("This error is", err);
    return next(err);
  }
});

/** GET /  =>
 *   { camps: [ { parkCode,
                    parkName,
                    cost,
                    image_url }, ...] }
 *
 * Can filter on provided search filters:
 * - max_cost
 * - toilets
 * - cellPhoneReception
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const q = req.query;
    // arrive as strings from querystring, but we want as ints
    if (q.max_cost !== undefined) q.max_cost = parseFloat(q.max_cost);
    const validator = jsonschema.validate(q, campSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const camps = await Camp.findAll(q);

    return res.json({ camps });
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
  try {
    const camp = await Camp.get(req.params.parkCode);
    return res.json({ camp });
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
    const validator = jsonschema.validate(req.body, campUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const camp = await Camp.update(req.params.parkCode, req.body);
    return res.json({ camp });
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
    await Camp.remove(req.params.parkCode);
    return res.json({ deleted: req.params.parkCode });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
