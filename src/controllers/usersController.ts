import { Request, Response, NextFunction } from "express";
import usersService from "../services/usersService";
import { BaseController } from "./BaseController";

class UserController extends BaseController {
    public getUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await usersService.getUsers();
            this.handleSuccess(res, result, "Invoice diff endpoint");
        } catch (error) {
            this.handleError(error, "getUsers");
        }
    }
}

export default new UserController();
