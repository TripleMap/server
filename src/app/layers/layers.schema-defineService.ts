import { Users } from '../../sequelize/index';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers'
import * as uuid from 'uuid';

export interface ColumnData {
    columnName: string;
    primaryKey: boolean;
    required: boolean;
    description: 'string';
    length: number | null;
    precision: number | null; // суммарное колличество символов 
    scale: number | null; // колличество символов после запятой
    dictionary: string | null;
    foreignTable: string | null;
    columnType: "findSimple" | "findOne" | "findMany" | "findDate" | "findBoolean" | 'findUser';
    dataType: "char" | "text" | "date" | "dateOnly" | "boolean" | "integer" | "double" | "uuid" | "geometry";
    geometryType: "Polygon" | "MultyPolygon" | "Point" | "MultyPoint" | "LineString" | "MultyLineString" | null;
    srid: number | 'sridId';
    nullable: boolean;
    selectable: boolean
}


export class LayerSchemaDefine {
    constructor() { }

    defineShema(jsonSchema) {
        let attributes = {};
        for (const key in jsonSchema.properties) {
            if (!jsonSchema.properties[key].foreignTable) {
                let columnData: ColumnData = jsonSchema.properties[key];
                attributes[key] = this.defineColumn(columnData);
            }

        }

        let layerModel = sequelize.define(jsonSchema.table, attributes, { schema: 'geo', timestamps: false });
        let findOneModels = [];
        let findManyModels = [];
        let findManyThrougModels = [];
        layerModel.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                instance.id = uuid.v4();
            }
            if (instance.geometry && !instance.geometry.crs) {
                instance.geometry.crs = {
                    type: 'name',
                    properties: {
                        name: 'EPSG:4326'
                    }
                };
            }
        });



        for (const key in jsonSchema.properties) {
            let columnData: ColumnData = jsonSchema.properties[key];
            attributes[key] = this.defineColumn(columnData);
            if (columnData.columnType === 'findOne') {
                let findOneDictionaryModel = this.defineFindOneJoinToQueries(key, columnData, layerModel);
                findOneModels.push({ model: findOneDictionaryModel, as: `_${key}` })
            }
            if (columnData.columnType === 'findUser') {
                let findOneDictionaryModel = this.defineFindUserJoinToQueries(key, layerModel);
                findOneModels.push(findOneDictionaryModel)
            }
            if (columnData.columnType === 'findMany') {
                let findManyDictionaryModel = this.defineFindManyJoinToQueries(key, columnData, layerModel);
                findManyModels.push({ model: findManyDictionaryModel.dictionary, as: `_${key}` });
                findManyThrougModels.push({ model: findManyDictionaryModel.throughModel, as: `_${key}` })
            }
        }

        return { layerModel, findOneModels, findManyModels, findManyThrougModels };
    }

    defineColumn = (columnData: ColumnData) => ({
        type: this.defineColumnDataType(columnData.dataType, columnData.precision, columnData.scale, columnData.length, columnData.geometryType, columnData.srid),
        allowNull: columnData.nullable,
        primaryKey: columnData.primaryKey || false,
    });

    defineFindOneJoinToQueries(columnName, columnData: ColumnData, layerModel) {
        let dictionary = sequelize.define(columnData.dictionary, {
            code: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            description: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
            },
        }, { schema: 'geo', timestamps: false });

        layerModel.belongsTo(dictionary, {
            as: `_${columnName}`,
            foreignKey: `${columnName}`
        });
        return dictionary;
    }


    defineFindUserJoinToQueries(columnName, layerModel) {
        layerModel.belongsTo(Users, {
            as: `_${columnName}`,
            foreignKey: `${columnName}`,
            targetKey: 'id'
        });
        return { model: Users, as: `_${columnName}`, attributes: ['username', 'id'] };
    }

    defineFindManyThroughModel(columnData) {
        let throughModel = sequelize.define(columnData.foreignTable, {
            id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            code: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false,
                primaryKey: true,
            },
            feature_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false,
                primaryKey: true,
            },
        }, { schema: 'geo', timestamps: false });

        throughModel.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                instance.id = uuid.v4();
            }
        });
        return throughModel;

    }

    defineFindManyDictionaryModel(columnData) {
        return sequelize.define(columnData.dictionary, {
            code: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            description: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
            },
        }, { schema: 'geo', timestamps: false });
    }

    defineFindManyJoinToQueries(columnName, columnData: ColumnData, layerModel) {
        let throughModel = this.defineFindManyThroughModel(columnData);
        let dictionary = this.defineFindManyDictionaryModel(columnData);

        layerModel.belongsToMany(dictionary, {
            as: `_${columnName}`,
            through: {
                model: throughModel
            },
            foreignKeyConstraint: true,
            foreignKey: `feature_id`,
            otherKey: 'code',
        });

        dictionary.belongsToMany(layerModel, {
            through: {
                model: throughModel
            },
            foreignKeyConstraint: true,
            foreignKey: 'code',
            otherKey: `id`,
        });
        return { dictionary, throughModel };
    }

    defineColumnDataType = (type, precision, scale, length, geometryType, srid) => {
        let _length = length || 2044;
        let _scale = scale || 255;
        let _precision = precision || 50;
        let dataType;
        switch (type) {
            case "serial":
                dataType = Sequelize.INTEGER;
                break;
            case "char":
                dataType = Sequelize.CHAR(_length);
                break;
            case "json":
                dataType = Sequelize.JSON;
                break;
            case "text":
                dataType = Sequelize.TEXT();
                break;
            case "date":
                dataType = Sequelize.DATE;
                break;
            case "dateOnly":
                dataType = Sequelize.DATEONLY;
                break;
            case "boolean":
                dataType = Sequelize.BOOLEAN;
                break;
            case "integer":
                dataType = Sequelize.INTEGER(_scale);
                break;
            case "double":
                dataType = Sequelize["DOUBLE PRECISION"];
                break;
            case "uuid":
                dataType = Sequelize.UUIDV4;
                break;
            case "geometry":
                dataType = Sequelize.GEOMETRY(geometryType, srid);
                break;
            default:
                dataType = Sequelize.CHAR(_length);
                break;
        }
        return dataType;
    }
}



