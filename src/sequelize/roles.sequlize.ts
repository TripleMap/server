

import * as Sequelize from 'sequelize';
import { sequelize } from '../database/database.providers'
import * as uuid from 'uuid';

export const Roles = sequelize.define('roles', {
    id: {
        type: Sequelize.CHAR(100),
        allowNull: false,
        primaryKey: true,
        validate: {
            isUUID: 4
        }
    },
    name: {
        allowNull: false,
        type: Sequelize.CHAR(2044)
    },
    description: {
        allowNull: true,
        type: Sequelize.CHAR(2044)
    }
},
    {
        timestamps: false,
        schema: 'security',
    });

Roles.hook('beforeValidate', (instance, options) => {
    if (!instance.id) {
        instance.id = uuid.v4();
    }
});
