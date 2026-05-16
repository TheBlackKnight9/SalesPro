import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new CustomerController();

router.use(authenticate);

router.get("/", ctrl.findAll.bind(ctrl));
router.post("/", ctrl.create.bind(ctrl));
router.get("/:id", ctrl.findById.bind(ctrl));
router.patch("/:id", ctrl.update.bind(ctrl));

export default router;
