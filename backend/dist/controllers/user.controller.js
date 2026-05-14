"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const shared_types_1 = require("../types/shared.types");
const userService = new user_service_1.UserService();
class UserController {
    // POST /api/users
    async create(req, res, next) {
        try {
            const { name, email, password, officeId, role, phone } = req.body;
            if (!name || !email || !password || !officeId) {
                throw new shared_types_1.AppError("name, email, password, officeId are required.", 400);
            }
            const user = await userService.create(req.body);
            res.status(201).json({ success: true, message: "User created.", data: user });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/users
    async findAll(req, res, next) {
        try {
            const page = parseInt(String(req.query.page)) || 1;
            const limit = parseInt(String(req.query.limit)) || 10;
            const search = req.query.search ? String(req.query.search) : undefined;
            const officeId = req.query.officeId ? String(req.query.officeId) : undefined;
            const role = req.query.role ? String(req.query.role) : undefined;
            const result = await userService.findAll(page, limit, search, officeId, role);
            res.status(200).json({ success: true, message: "Users fetched.", ...result });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/users/:id
    async findById(req, res, next) {
        try {
            const id = String(req.params.id);
            const user = await userService.findById(id);
            res.status(200).json({ success: true, message: "User fetched.", data: user });
        }
        catch (err) {
            next(err);
        }
    }
    // PUT /api/users/:id
    async update(req, res, next) {
        try {
            const id = String(req.params.id);
            const user = await userService.update(id, req.body);
            res.status(200).json({ success: true, message: "User updated.", data: user });
        }
        catch (err) {
            next(err);
        }
    }
    // DELETE /api/users/:id (soft delete)
    async deactivate(req, res, next) {
        try {
            const id = String(req.params.id);
            if (req.user?.userId === id) {
                throw new shared_types_1.AppError("You cannot deactivate your own account.", 400);
            }
            await userService.deactivate(id);
            res.status(200).json({ success: true, message: "User deactivated." });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/users/office/:officeId
    async findByOffice(req, res, next) {
        try {
            const officeId = String(req.params.officeId);
            const users = await userService.findByOffice(officeId);
            res.status(200).json({ success: true, message: "Office users fetched.", data: users });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map