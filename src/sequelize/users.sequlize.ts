

import * as Sequelize from 'sequelize';
import { sequelize } from '../database/database.providers'
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';

export const Users = sequelize.define('users',
    {
        id: {
            type: Sequelize.CHAR(100),
            allowNull: false,
            primaryKey: true,
            validate: {
                isUUID: 4
            }
        },
        username: {
            allowNull: false,
            type: Sequelize.CHAR(2044)
        },
        password: {
            allowNull: false,
            type: Sequelize.CHAR(2044)
        },
        email: {
            allowNull: false,
            type: Sequelize.CHAR(2044),
            validate: {
                isEmail: true
            },
        }
    },
    {
        timestamps: false,
        schema: 'security',
    });

Users.hook('beforeValidate', (instance, options) => {
    if (!instance.id) {
        instance.id = uuid.v4();
    }
});

Users.hook('beforeCreate', (instance, options) => {
    return bcrypt.hash(instance.password, 10)
        .then(hash => {
            instance.password = hash;
        }).catch(err => {
            console.log(err);
            throw new Error();
        });
});
