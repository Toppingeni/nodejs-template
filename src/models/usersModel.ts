import { DataTypes, Model, Sequelize } from "sequelize";
import getSequelize from "../libs/sequelize";

class User extends Model {
    public user_id!: number;
    public user_name!: string;
}

export const initUserModel = (sequelize: Sequelize) => {
    User.init(
        {
            user_id: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            user_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "users",
            tableName: "users",
            timestamps: false,
        }
    );
};

export default User;
