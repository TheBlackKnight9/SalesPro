import { Response, NextFunction } from "express";
import { QuotationService } from "../services/quotation.service";
import { AppError, AuthRequest } from "../types/shared.types";

const quotationService = new QuotationService();

export class QuotationController {
  // POST /api/quotations
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);

      const quote = await quotationService.create(req.body, req.user);
      res.status(201).json({ success: true, message: "Quotation created.", data: quote });
    } catch (err) { next(err); }
  }

  // GET /api/quotations/:id
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      
      const id = String(req.params.id);
      const quote = await quotationService.findById(id);
      res.status(200).json({ success: true, message: "Quotation fetched.", data: quote });
    } catch (err) { next(err); }
  }

  // GET /api/quotations/:id/pdf
  async downloadPdf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError("Not authenticated.", 401);
      
      const id = String(req.params.id);
      
      // Ensure quotation exists before generating
      const quote = await quotationService.findById(id);

      const pdfBuffer = await quotationService.generatePdf(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${quote.quotationNumber}.pdf`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (err) { next(err); }
  }
}
