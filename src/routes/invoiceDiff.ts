import { Router } from "express";
import invoiceDiffController from "../controllers/invoiceDiffController";
import usersController from "../controllers/usersController";

const router = Router();

router.get("/", invoiceDiffController.getInvoiceDiff);
router.get("/sequelize", invoiceDiffController.getInvoiceSequelize);
router.get("/users", usersController.getUsers);

export default router;
