import * as Sequelize from 'sequelize';
export const sequelize = new Sequelize(process.env.DB_DB, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    operatorsAliases: false,
    define: {
        freezeTableName: true
    }
});

sequelize.authenticate();

export const DatabaseProviders = [
    {
        provide: 'TripleB',
        useFactory: async () => {
            // const sequelize = new Sequelize({
            //     name: process.env.DB_DB,
            //     username: process.env.DB_USER,
            //     password: process.env.DB_PASSWORD,
            //     dialect: 'postgres',
            //     host: process.env.DB_HOST,
            //     port: process.env.DB_PORT,
            //     operatorsAliases: false
            // });

            // sequelize.addModels([users, users_layers, layers]);
            // await sequelize.authenticate();
        },
    },
];
