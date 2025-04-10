import { DataTypes, Model, Sequelize } from "sequelize";
import getSequelize from "..";

const sequelize = getSequelize();

class Invoice extends Model {
    public id!: number;
    public invoice_number!: string;
    public amount!: number;
    public date!: Date;
    public status!: string;
}
export const initTasksManager = (sequelize: Sequelize) => {
    Invoice.init(
        {
            id: {
                type: DataTypes.NUMBER,
                primaryKey: true,
            },
            invoice_number: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            amount: {
                type: DataTypes.NUMBER,
                allowNull: false,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Invoice",
            tableName: "invoices",
            timestamps: false,
        }
    );
};

export default Invoice;
