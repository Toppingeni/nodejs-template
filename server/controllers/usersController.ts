import usersService from "../services/usersService";
import { Controller, Get, Route, Tags } from "tsoa";

export type UserDto = {
    user_id: string;
    user_name: string;
};

export type GetUsersResponse = {
    message: string;
    data: UserDto[];
};

@Route("users")
@Tags("Users")
export class UsersController extends Controller {
    @Get("/")
    public async getUsers(): Promise<GetUsersResponse> {
        const users = await usersService.getUsers();
        const data: UserDto[] = users.map((u) => ({
            user_id: String(u.user_id),
            user_name: String(u.user_name),
        }));

        return { message: "Success", data };
    }
}

export default UsersController;
