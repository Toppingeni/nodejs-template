import { Get, Route, Tags } from "@tsoa/runtime";
import { BaseController } from "./BaseController";
import { usersService } from "../services/usersService";

@Route("users")
@Tags("Users")
export class UsersController extends BaseController {
    /** Get all active users */
    @Get("/")
    public async getUsers(): Promise<{ message: string; data: unknown[] }> {
        try {
            const data = await usersService.getUsers();
            return this.handleSuccess(data, "Success");
        } catch (error) {
            this.handleError(error, "UsersController.getUsers");
        }
    }
}

export default UsersController;
