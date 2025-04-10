import { Request, Response, NextFunction } from "express";
import User from "../libs/sequelize/models/usersModel";
import usersService from "../services/usersService";

class UserController {
    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.getUsers();
            res.json({ message: "Invoice diff endpoint", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
