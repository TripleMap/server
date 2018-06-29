import * as Sequelize from 'sequelize';
import { sequelize } from '../database/database.providers'
import * as uuid from 'uuid';

export const Layers = sequelize.define('layers', {
    id: {
        type: Sequelize.CHAR(100),
        allowNull: false,
        primaryKey: true,
        validate: {
            isUUID: 4
        }
    },
    layer_name: {
        type: Sequelize.CHAR(2044),
        allowNull: false,
    },
    layer_schema: {
        type: Sequelize.JSON,
        allowNull: false,
    }
}, {
        timestamps: false,
        schema: 'security'
    });

Layers.hook('beforeValidate', (instance, options) => {
    if (!instance.id) {
        instance.id = uuid.v4();
    }
});
