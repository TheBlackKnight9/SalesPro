import { Router } from "express";
import { QuotationController } from "../controllers/quotation.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new QuotationController();

router.use(authenticate);

router.get("/", ctrl.findAll.bind(ctrl));
router.post("/", ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.patch("/:id/status", ctrl.updateStatus.bind(ctrl));
router.get("/:id/pdf", ctrl.downloadPdf.bind(ctrl));

export default router;
