import { Router } from "express";
import invoiceDiffRouter from "./invoiceDiffRoute";
import usersRouter from "./usersRoute";

const router = Router();

router.use("/invoice-diff", invoiceDiffRouter);
router.use("/users", usersRouter);

export default router;
