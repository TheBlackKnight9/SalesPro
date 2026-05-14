"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeController = void 0;
const office_service_1 = require("../services/office.service");
const officeService = new office_service_1.OfficeService();
class OfficeController {
    // POST /api/offices
    async create(req, res, next) {
        try {
            const office = await officeService.create(req.body);
            res.status(201).json({ success: true, message: "Office created.", data: office });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/offices
    async findAll(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const result = await officeService.findAll(page, limit, search);
            res.status(200).json({ success: true, message: "Offices fetched.", ...result });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/offices/:id
    async findById(req, res, next) {
        try {
            const id = String(req.params.id);
            const office = await officeService.findById(id);
            res.status(200).json({ success: true, message: "Office fetched.", data: office });
        }
        catch (err) {
            next(err);
        }
    }
    // PUT /api/offices/:id
    async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const office = await officeService.update(id, req.body);
            res.status(200).json({ success: true, message: "Office updated.", data: office });
        }
        catch (err) {
            next(err);
        }
    }
    // DELETE /api/offices/:id
    async delete(req, res, next) {
        try {
            const id = String(req.params.id);
            await officeService.delete(id);
            res.status(200).json({ success: true, message: "Office deleted." });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OfficeController = OfficeController;
//# sourceMappingURL=office.controller.js.map