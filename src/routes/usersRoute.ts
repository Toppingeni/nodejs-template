import { Router } from "express";
import usersController from "../controllers/usersController";
import { asyncErrorWrapper } from "../utils/asyncErrorWrapper";

const router = Router();

router.get("/", asyncErrorWrapper(usersController.getUsers));

export default router;
