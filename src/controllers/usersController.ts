import { Request, Response, NextFunction } from "express";
import User from "../libs/sequelize/models/usersModel";

class UserController {
    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await User.findAll();
            res.json({ message: "Invoice diff endpoint", data: result });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
