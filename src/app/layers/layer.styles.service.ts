import { Component } from "@nestjs/common";
import { Layers } from '../../sequelize/index';
import { LayerSchemaDefine } from './layers.schema-defineService'

import * as uuid from 'uuid';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers';


@Component()
export class LayersStylesService {
    public LayerSchemaDefine: LayerSchemaDefine;
    public model: any;
    constructor() {
        this.LayerSchemaDefine = new LayerSchemaDefine();
        this.model = this.generateStyleModel();
    }

    async getLayerFeaturesStyles(layerId, fieldToStyle) {
        try {
            if (!layerId) throw new Error('Не задан id слоя');
            let schema: any = await Layers.findById(layerId);
            if (!schema) throw new Error('Слой не существует');

            let properties = schema.toJSON().layer_schema
            let definedModels = this.LayerSchemaDefine.defineShema(properties);
            let excludedFindManyAndFindOne = [];
            let potentialFieldToStyleCompareWithFindOneMany;

            let attributesToStyle = ['id'];


            for (let key in properties.properties) {
                let columnType = properties.properties[key].columnType;
                if (columnType === 'findMany' || columnType === 'findOne' || columnType === 'findUser') {
                    if (key === fieldToStyle) potentialFieldToStyleCompareWithFindOneMany = key;
                    excludedFindManyAndFindOne.push(key);
                }
            }

            if (!potentialFieldToStyleCompareWithFindOneMany) attributesToStyle.push(fieldToStyle);

            let queryResult = await definedModels.layerModel.findAll({
                attributes: attributesToStyle,
                include: [...definedModels.findOneModels, ...definedModels.findManyModels]
            });
            let result = {};

            queryResult.map(item => result[item.id] = (potentialFieldToStyleCompareWithFindOneMany) ? item['_' + potentialFieldToStyleCompareWithFindOneMany] : item[fieldToStyle])
            return result;
        } catch (error) {
            throw error;
        }
    }


    async getStyles(userId) {
        try {
            if (!userId) throw new Error('Не указан id пользователя');
            return await this.model.findAll({
                where: { user_id: userId }
            });
        } catch (error) {
            throw error;
        }
    }

    async createStyle(styleInstance, userId) {
        try {
            if (!userId) throw new Error('Не указан id пользователя');
            if (!styleInstance) throw new Error('Не задан стиль');
            styleInstance.user_id = userId;
            return await this.model.create(styleInstance);
        } catch (error) {
            throw error;
        }
    }

    async deleteStyle(styleId, userId) {
        try {
            if (!styleId) throw new Error('Не указано id стиля');
            if (!userId) throw new Error('Не указан id пользователя');
            let instance = await this.model.findOne({
                where: { user_id: userId, id: styleId }
            });
            return instance.destroy();
        } catch (error) {
            throw error;
        }
    }

    async updateStyle(styleId, userId, styleInstance) {
        try {
            if (!styleId) throw new Error('Не указано id стиля');
            if (!userId) throw new Error('Не указан id пользователя');
            styleInstance.user_id = userId;
            if (styleInstance.id) delete styleInstance.id;
            let instance = await this.model.findOne({
                where: { user_id: userId, id: styleId }
            });
            return instance.update(styleInstance);
        } catch (error) {
            throw error;
        }
    }



    generateStyleModel() {
        let styleModel = sequelize.define('users_styles', {
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
            field_to_style: {
                type: this.defineColumnDataType('char', 0, 0, 2044, 0, 0),
            },
            active: {
                type: this.defineColumnDataType('boolean', 0, 0, 0, 0, 0)
            },
            options: {
                type: this.defineColumnDataType('json', 0, 0, 2044, 0, 0),
            },
        }, { schema: `security`, timestamps: false });

        styleModel.hook('beforeValidate', (instance, options) => {
            if (!instance.id) {
                instance.id = uuid.v4();
            }
        });
        return styleModel;
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



