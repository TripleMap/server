
import * as Sequelize from 'sequelize';
import { sequelize } from '../database/database.providers';

export const UsersLayers = sequelize.define('users_layers', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.CHAR(2044),
    },
    layer_id: {
        type: Sequelize.CHAR(2044),
    }
}, { timestamps: false, schema: 'security' });