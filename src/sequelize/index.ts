import { Layers } from './layers.sequlize';
import { Users } from './users.sequlize';
import { UsersLayers } from './users-layers.sequlize';
import { Roles } from './roles.sequlize';
import { Groups } from './groups.sequlize';


Users.belongsToMany(Layers, {
    through: UsersLayers,
    foreignKey: 'user_id'
});

Users.belongsTo(Roles, {
    foreignKey: 'role_id'
});

Users.belongsTo(Groups, {
    foreignKey: 'group_id'
});

Layers.belongsToMany(Users, {
    through: UsersLayers,
    foreignKey: 'layer_id'
});



export {
    Layers, Users, Roles, UsersLayers, Groups
}