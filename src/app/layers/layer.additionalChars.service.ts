import { Component } from "@nestjs/common";
import { Layers } from '../../sequelize/index';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers';
import * as uuid from 'uuid';

import { KnexFilterQueryBuilder } from './layers.filterQuery'

// interface ColumnData {
//     columnName: string;
//     primaryKey: boolean;
//     required: boolean;
//     description: 'string';
//     length: number | null;
//     precision: number | null; // суммарное колличество символов 
//     scale: number | null; // колличество символов после запятой
//     dictionary: string | null;
//     foreignTable: string | null;
//     columnType: "findSimple" | "findOne" | "findMany" | "findDate" | "findBoolean" | "findUser";
//     dataType: "char" | "text" | "date" | "dateOnly" | "boolean" | "integer" | "double" | "uuid" | "geometry";
//     geometryType: "Polygon" | "MultyPolygon" | "Point" | "MultyPoint" | "LineString" | "MultyLineString" | null;
//     srid: number | 'sridId';
//     nullable: boolean;
//     selectable: boolean
// }


@Component()
export class LayersAdditionalCharsService {
    public KnexFilterQueryBuilder: any;
    constructor() {
        this.KnexFilterQueryBuilder = new KnexFilterQueryBuilder();
    }

    async getAdditionalCharacters(layerId, featureId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            if (!featureId) throw new Error('Не задан id объекта');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let additionalCharactersTableName = schema.toJSON().layer_schema.additionalChars;
            if (!additionalCharactersTableName) throw new Error('У слоя нет дополнительных параметров');
            let additionalTable = this.generateAdditionalCharacterModel(schema, additionalCharactersTableName);

            return additionalTable.findAll({
                where: {
                    feature_id: featureId
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getAdditionalCharacterById(layerId, additionalCharacterId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let additionalCharactersTableName = schema.toJSON().layer_schema.additionalChars;
            if (!additionalCharactersTableName) throw new Error('У слоя нет дополнительных параметров');
            let additionalTable = this.generateAdditionalCharacterModel(schema, additionalCharactersTableName);
            return additionalTable.findById(additionalCharacterId);
        } catch (error) {
            throw error;
        }
    }

    async createAdditionalCharacterById(layerId, additionalCharacterInstance, feature_id) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let additionalCharactersTableName = schema.toJSON().layer_schema.additionalChars;
            if (!additionalCharactersTableName) throw new Error('У слоя нет дополнительных параметров');
            let additionalTable = this.generateAdditionalCharacterModel(schema, additionalCharactersTableName);
            if (!feature_id) throw new Error('Не задан id объекта');
            let character_name = additionalCharacterInstance.character_name;
            if (!character_name) throw new Error('Не задано название атрибута');
            let instance = {
                feature_id,
                character_name,
                character_value: additionalCharacterInstance.character_value
            };
            return additionalTable.create(instance);
        } catch (error) {
            throw error;
        }
    }

    async updateAdditionalCharacterById(layerId, additionalCharacterId, additionalCharacterInstance) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            if (!additionalCharacterId) throw new Error('Не задан id дополнительного атрибута');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let additionalCharactersTableName = schema.toJSON().layer_schema.additionalChars;
            if (!additionalCharactersTableName) throw new Error('У слоя нет дополнительных параметров');
            let additionalTable = this.generateAdditionalCharacterModel(schema, additionalCharactersTableName);
            let additionalCharacter: any = await additionalTable.findById(additionalCharacterId);
            let character_name = additionalCharacterInstance.character_name || additionalCharacter.toJSON().character_name
            let character_value = additionalCharacterInstance.character_value || additionalCharacter.toJSON().character_value
            let user_id = additionalCharacterInstance.user_id || additionalCharacter.toJSON().user_id || null;
            return await additionalCharacter.update({ character_name, character_value, user_id });
        } catch (error) {
            throw error;
        }
    }

    async deleteAdditionalCharacterById(layerId, additionalCharacterId) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');
            let additionalCharactersTableName = schema.toJSON().layer_schema.additionalChars;
            if (!additionalCharactersTableName) throw new Error('У слоя нет дополнительных параметров');
            let additionalTable = this.generateAdditionalCharacterModel(schema, additionalCharactersTableName);
            const instance: any = await additionalTable.findById(additionalCharacterId);
            if (!instance) throw new Error('Дополнительного атрибута с таким id не существует');
            return await instance.destroy();
        } catch (error) {
            throw error;
        }
    }


    generateAdditionalCharacterModel(schema, additionalCharactersTableName) {
        let additionalTable = sequelize.define(additionalCharactersTableName, {
            id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            feature_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false
            },
            character_name: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
                allowNull: false
            },
            character_value: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
            },
            user_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
            },
        }, { schema: `${schema.toJSON().layer_schema.schema}`, timestamps: false });

        additionalTable.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                instance.id = uuid.v4();
            }
        });
        return additionalTable;
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



