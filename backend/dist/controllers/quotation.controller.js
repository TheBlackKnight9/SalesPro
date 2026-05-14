"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const quotation_service_1 = require("../services/quotation.service");
const shared_types_1 = require("../types/shared.types");
const quotationService = new quotation_service_1.QuotationService();
class QuotationController {
    // POST /api/quotations
    async create(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const quote = await quotationService.create(req.body, req.user);
            res.status(201).json({ success: true, message: "Quotation created.", data: quote });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/quotations/:id
    async findById(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            const quote = await quotationService.findById(id);
            res.status(200).json({ success: true, message: "Quotation fetched.", data: quote });
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/quotations/:id/pdf
    async downloadPdf(req, res, next) {
        try {
            if (!req.user)
                throw new shared_types_1.AppError("Not authenticated.", 401);
            const id = String(req.params.id);
            // Ensure quotation exists before generating
            const quote = await quotationService.findById(id);
            const pdfBuffer = await quotationService.generatePdf(id);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${quote.quotationNumber}.pdf`);
            res.setHeader("Content-Length", pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.QuotationController = QuotationController;
//# sourceMappingURL=quotation.controller.js.map