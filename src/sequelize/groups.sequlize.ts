

import * as Sequelize from 'sequelize';
import { sequelize } from '../database/database.providers'
import * as uuid from 'uuid';

export const Groups = sequelize.define('groups', {
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
    access: {
        allowNull: true,
        type: Sequelize.BOOLEAN
    }
},
    {
        timestamps: false,
        schema: 'security',
    });

Groups.hook('beforeValidate', (instance, options) => {
    if (!instance.id) {
        instance.id = uuid.v4();
    }
});
