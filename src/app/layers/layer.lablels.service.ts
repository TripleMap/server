import { Component } from "@nestjs/common";
import { Layers } from '../../sequelize/index';
import { LayerSchemaDefine } from './layers.schema-defineService'

import * as uuid from 'uuid';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers';


@Component()
export class LayersLabelsService {
    public LayerSchemaDefine: LayerSchemaDefine;
    public model: any;
    constructor() {
        this.LayerSchemaDefine = new LayerSchemaDefine();
        this.model = this.generateLabelModel();
    }

    async getLayerFeaturesLables(layerId, fieldToLabel) {
        console.log(fieldToLabel);
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');

            let properties = schema.toJSON().layer_schema
            let definedModels = this.LayerSchemaDefine.defineShema(properties);
            let excludedFindManyAndFindOne = [];
            let potentialFieldToLabelCompareWithFindOneMany;

            let attributesToLabel = ['id'];


            for (let key in properties.properties) {
                let columnType = properties.properties[key].columnType;
                if (columnType === 'findMany' || columnType === 'findOne' || columnType === 'findUser') {
                    if (key === fieldToLabel) potentialFieldToLabelCompareWithFindOneMany = key;
                    excludedFindManyAndFindOne.push(key);
                }
            }

            if (!potentialFieldToLabelCompareWithFindOneMany) attributesToLabel.push(fieldToLabel);

            let queryResult = await definedModels.layerModel.findAll({
                attributes: attributesToLabel,
                include: [...definedModels.findOneModels, ...definedModels.findManyModels]
            });
            let result = {};
            queryResult.map(item => result[item.id] = (potentialFieldToLabelCompareWithFindOneMany) ? item['_' + potentialFieldToLabelCompareWithFindOneMany] : item[fieldToLabel])
            return result;
        } catch (error) {
            throw error;
        }
    }


    async getLables(userId) {
        try {
            if (!userId) throw new Error('Не указан id пользователя');
            return await this.model.findAll({
                where: { user_id: userId }
            });
        } catch (error) {
            throw error;
        }
    }

    async createLable(labelInstance, userId) {
        try {
            if (!userId) throw new Error('Не указан id пользователя');
            if (!labelInstance) throw new Error('Не задана подпись');
            labelInstance.user_id = userId;
            return await this.model.create(labelInstance);
        } catch (error) {
            throw error;
        }
    }

    async deleteLables(labelId, userId) {
        try {
            if (!labelId) throw new Error('Не указано id подписи');
            if (!userId) throw new Error('Не указан id пользователя');
            let instance = await this.model.findOne({
                where: { user_id: userId, id: labelId }
            });
            return instance.destroy();
        } catch (error) {
            throw error;
        }
    }

    async updateLables(labelId, userId, labelInstance) {
        try {
            if (!labelId) throw new Error('Не указано id подписи');
            if (!userId) throw new Error('Не указан id пользователя');
            labelInstance.user_id = userId;
            if (labelInstance.id) delete labelInstance.id;
            let instance = await this.model.findOne({
                where: { user_id: userId, id: labelId }
            });
            return instance.update(labelInstance);
        } catch (error) {
            throw error;
        }
    }



    generateLabelModel() {
        let labelModel = sequelize.define('users_labels', {
            id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                primaryKey: true,
                allowNull: false
            },
            layer_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false
            },
            user_id: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
                allowNull: false
            },
            field_to_label: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
            },
            label_color: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
            },
            label_font_size: {
                type: this.defineColumnDataType('char', 0, 0, 10, 0, 0),
            },
            halo_color: {
                type: this.defineColumnDataType('char', 0, 0, 100, 0, 0),
            },
            halo_size: {
                type: this.defineColumnDataType('char', 0, 0, 10, 0, 0),
            },
            active: {
                type: this.defineColumnDataType('boolean', 0, 0, 0, 0, 0)
            }
        }, { schema: `security`, timestamps: false });

        labelModel.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                instance.id = uuid.v4();
            }
        });
        return labelModel;
    }



    defineColumnDataType = (type, precision, scale, length, geometryType, srid) => {
        let _length = length || 2044;
        let _scale = scale || 255;
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



