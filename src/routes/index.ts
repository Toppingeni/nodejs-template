import { Router } from "express";
import usersRouter from "./usersRoute";
import { requestLogger } from "../middlewares/requestLogger";

const router = Router();
router.use(requestLogger);
router.use("/users", usersRouter);

export default router;
