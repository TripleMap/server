import { Component } from "@nestjs/common";
import { Layers, Users } from '../../sequelize/index';
import { CustomValidationError } from '../../exeptions/custom-validation.error';
import * as Sequelize from 'sequelize';
import { sequelize } from '../../database/database.providers'
import * as uuid from 'uuid';
import * as geojsonhint from '@mapbox/geojsonhint';

import { KnexFilterQueryBuilder } from './layers.filterQuery'
import { LayerSchemaDefine } from './layers.schema-defineService'


@Component()
export class LayersService {
  public KnexFilterQueryBuilder: any;
  public LayerSchemaDefine: LayerSchemaDefine;

  constructor() {
    this.KnexFilterQueryBuilder = new KnexFilterQueryBuilder();
    this.LayerSchemaDefine = new LayerSchemaDefine();
  }

  // GET
  async findAll() {
    try {
      return await Layers.findAll();
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      return await Layers.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async findWithWhere(whereObj) {
    try {
      return await Layers.find(whereObj);
    } catch (error) {
      throw error;
    }
  }

  async findUsersByLayerId(id: string) {
    try {
      return await Layers.findAll({
        where: { id },
        include: [Users]
      });
    } catch (error) {
      throw error;
    }
  }

  // POST 
  async createOne(instance) {

    try {
      return await Layers.create(instance);
    } catch (error) {
      throw error;


    }
  }

  async createMany(instances) {
    try {
      return await Layers.bulkCreate(instances);
    } catch (error) {
      throw error;
    }
  }


  // PUT
  async updateById(id: string, data) {
    try {
      const instance: any = await Layers.findById(id);
      return await instance.update(data);
    } catch (error) {
      throw error;
    }
  }

  async updateWithWhere(whereObj, data) {
    try {
      const instance: any = await Layers.findOne({ where: whereObj })
      return await instance.update(data);
    } catch (error) {
      throw error;
    }
  }

  // DELETE

  async deleteById(id) {
    try {
      const instance: any = await Layers.findById(id);
      return await instance.destroy();
    } catch (error) {
      throw error;
    }
  }

  async deleteWithWhere(whereObj) {
    try {
      const instance: any = await Layers.findOne({ where: whereObj })
      return await instance.destroy();
    } catch (error) {
      throw error;
    }
  }

  async getGeoJSONLayerSchema(layerId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      return schema;
    } catch (error) {
      throw error;
    }
  }

  async getGeoJSONLayerSchemaWithData(layerId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      schema = schema.toJSON().layer_schema;
      for (let key in schema.properties) {
        if (schema.properties[key].columnType === 'findMany' && schema.properties[key].dictionary && schema.properties[key].foreignTable) {
          let avaliableProperties = await sequelize.query(`SELECT * FROM ${schema.schema}.${schema.properties[key].dictionary}`);
          schema.properties[key].avaliableProperties = avaliableProperties[0];
          let currentProperties = await sequelize.query(
            `SELECT DISTINCT ${schema.properties[key].foreignTable}.code, ${schema.properties[key].dictionary}.description 
            FROM ${schema.schema}.${schema.properties[key].foreignTable}
            LEFT JOIN ${schema.schema}.${schema.properties[key].dictionary} ON ${schema.properties[key].foreignTable}.code = ${schema.properties[key].dictionary}.code 
            ORDER BY code`
          );
          schema.properties[key].currentProperties = currentProperties[0];
        }

        if (schema.properties[key].columnType === 'findOne' && schema.properties[key].dictionary) {
          let avaliableProperties = await sequelize.query(`SELECT * FROM geo.${schema.properties[key].dictionary}`);
          schema.properties[key].avaliableProperties = avaliableProperties[0];
          let currentProperties = await sequelize.query(
            `SELECT DISTINCT ${schema.properties[key].dictionary}.code , ${schema.properties[key].dictionary}.description
            FROM ${schema.schema}.${schema.table}
            LEFT JOIN ${schema.schema}.${schema.properties[key].dictionary} ON ${key} = ${schema.properties[key].dictionary}.code 
            ORDER BY code`
          );
          schema.properties[key].currentProperties = currentProperties[0];
        }

        if (schema.properties[key].columnType === 'findUser') {
          let avaliableProperties = await sequelize.query(`SELECT id, username FROM security.users`);
          schema.properties[key].avaliableProperties = avaliableProperties[0];
          let currentProperties = await sequelize.query(
            `SELECT DISTINCT users.id, username 
            FROM ${schema.schema}.${schema.table} 
            LEFT JOIN security.users ON ${key} = users.id
            WHERE ${key} IS NOT NULL`
          );
          schema.properties[key].currentProperties = currentProperties[0];
        }
      }

      return {
        id: layerId,
        name: schema.name,
        labelName: schema.labelName,
        properties: schema.properties
      };

    } catch (error) {
      throw error;
    }
  }

  async getGeoJSONFeatures(layerId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let definedModels = this.LayerSchemaDefine.defineShema(schema.toJSON().layer_schema);
      let features = await definedModels.layerModel.findAll({ include: [...definedModels.findOneModels, ...definedModels.findManyModels] });
      
      return {
        'type': "FeatureCollection",
        'features': features.map((feature: any) => ({
          type: "Feature",
          geometry: feature.geometry,
          properties: { id: feature.dataValues.id }
        }))
      }
    } catch (error) {
      throw error;
    }
  }

  async getGeoJSONFeatureById(layerId, featureId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');

      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let definedModels = this.LayerSchemaDefine.defineShema(schema.toJSON().layer_schema);
      return await definedModels.layerModel.findAll({
        where: {
          id: featureId
        }, include: [...definedModels.findOneModels, ...definedModels.findManyModels]
      });

    } catch (error) {
      throw error;
    }
  }


  async removeGeoJSONFeatureById(layerId, featureId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');

      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let definedModels = this.LayerSchemaDefine.defineShema(schema.toJSON().layer_schema);
      let feature = await definedModels.layerModel.findById(featureId);
      if (!feature) throw new Error('Объект не существует');
      return feature.destroy();

    } catch (error) {
      throw error;
    }
  }



  async updateFeatureGeometry(layerId, featureId, featureData) {
    if (!layerId) throw new Error('Не задан id слоя');
    if (!featureId) throw new Error('Не задан id объекта');
    try {
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let definedModels = this.LayerSchemaDefine.defineShema(schema.toJSON().layer_schema);
      const instance: any = await definedModels.layerModel.findById(featureId);

      if (!instance) throw new Error('Объекта с таким id не существует');

      let errors = geojsonhint.hint(featureData);
      let onlyMessagesError = errors.filter(error => (error.level === "message") ? error : false).length === errors.length;
      if ((errors && !errors.length) || (errors && errors.length && onlyMessagesError)) {
        return await instance.update({ geometry: featureData });
      } else {
        throw new CustomValidationError({
          message: 'Не валидная геометрия',
          errors
        });
      }
    } catch (error) {
      throw error;
    }
  }




  async getJSONFeatures(layerId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);
      let excludedFindManyAndFindOne = [];

      for (let key in properties.properties) {
        if (
          properties.properties[key].columnType === 'findMany'
          || properties.properties[key].columnType === 'findOne'
          || properties.properties[key].columnType === 'findUser'
        ) {
          excludedFindManyAndFindOne.push(key);
        }
      }
      return await definedModels.layerModel.findAll({
        attributes: {
          exclude: ['geometry', ...excludedFindManyAndFindOne]
        }, include: [...definedModels.findOneModels, ...definedModels.findManyModels]
      });
    } catch (error) {
      throw error;
    }
  }


  async getJSONFeatureById(layerId, featureId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);
      let excludedFindManyAndFindOne = [];

      for (let key in properties.properties) {
        if (
          properties.properties[key].columnType === 'findMany'
          || properties.properties[key].columnType === 'findOne'
          || properties.properties[key].columnType === 'findUser') {
          excludedFindManyAndFindOne.push(key);
        }
      }
      return definedModels.layerModel.findById(featureId, {
        attributes: {
          exclude: ['geometry', ...excludedFindManyAndFindOne]
        },
        include: [...definedModels.findOneModels, ...definedModels.findManyModels]
      });
    } catch (error) {
      throw error;
    }
  }

  async createJSONFeature(layerId, withCadastralData, geoJSONFeature) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!geoJSONFeature) throw new Error('Нет объекта для записи в БД');
      let errors = geojsonhint.hint(geoJSONFeature);
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);
      let onlyMessagesError = errors.filter(error => (error.level === "message") ? error : false).length === errors.length;
      if ((errors && !errors.length) || (errors && errors.length && onlyMessagesError)) {
        let cn = geoJSONFeature.properties.cn;
        let geometry = geoJSONFeature.geometry;
        const instance: any = withCadastralData ? await definedModels.layerModel.create({ geometry, cn }) : await definedModels.layerModel.create({ geometry });
        if (withCadastralData) {
          let cadastralProperties = geoJSONFeature.properties;
          cadastralProperties.id = instance.id;
          let cadastralTable = properties.cadastralTable;
          if (cadastralProperties && cadastralTable) {
            let cadSchema: any = await Layers.findById(cadastralTable);
            if (!cadSchema) throw new Error('нет схемы кадастровых данных');
            let cadSchemaProps = cadSchema.toJSON().layer_schema;
            let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);
            const cadIns = await cadDefinedModels.layerModel.create(cadastralProperties);
          }
        }

        return {
          type: "Feature",
          geometry: instance.geometry,
          properties: { id: instance.dataValues.id }
        }
      } else {
        throw new CustomValidationError({
          message: 'Не валидная геометрия',
          errors
        });
      }
    } catch (error) {
      throw error;
    }
  }


  async createFeatureCadastralInfo(layerId, featureId, cadastralProperties) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');
      if (!cadastralProperties) throw new Error('Не задан объект для записи в БД');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema;
      cadastralProperties.id = featureId;
      let cadastralTable = properties.cadastralTable;

      if (cadastralProperties && cadastralTable) {
        let cadSchema: any = await Layers.findById(cadastralTable);
        if (!cadSchema) throw new Error('нет схемы кадастровых данных');
        let cadSchemaProps = cadSchema.toJSON().layer_schema;
        let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);
        cadastralProperties.id = featureId;
        await cadDefinedModels.layerModel.create(cadastralProperties);

        let excludedFindManyAndFindOne = [];

        for (let key in properties.properties) {
          if (
            properties.properties[key].columnType === 'findMany'
            || properties.properties[key].columnType === 'findOne'
            || properties.properties[key].columnType === 'findUser'
          ) {
            excludedFindManyAndFindOne.push(key);
          }
        }
        return await cadDefinedModels.layerModel.findById(featureId, {
          attributes: {
            exclude: ['geometry', ...excludedFindManyAndFindOne]
          },
          include: [...cadDefinedModels.findOneModels, ...cadDefinedModels.findManyModels]
        });

      } else {
        throw new CustomValidationError({
          message: 'Нет объектов или нет таблицы для вставки'
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async updateFeatureCadastralInfo(layerId, cadastralNumber, cadastralProperties) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!cadastralNumber) throw new Error('Не задан кадастровый номер объекта');
      if (!cadastralProperties) throw new Error('Не задан объект для записи в БД');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema;
      let cadastralTable = properties.cadastralTable;

      if (cadastralProperties && cadastralTable) {
        let cadSchema: any = await Layers.findById(cadastralTable);
        if (!cadSchema) throw new Error('нет схемы кадастровых данных');
        let cadSchemaProps = cadSchema.toJSON().layer_schema;
        let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);
        let cadInstance = await cadDefinedModels.layerModel.find({
          where: {
            cn: cadastralNumber
          }
        });
        if (!cadInstance) throw new Error('Не найден объект для обновления');

        await cadInstance.update(cadastralProperties);

        let excludedFindManyAndFindOne = [];

        for (let key in properties.properties) {
          if (
            properties.properties[key].columnType === 'findMany'
            || properties.properties[key].columnType === 'findOne'
            || properties.properties[key].columnType === 'findUser') {
            excludedFindManyAndFindOne.push(key);
          }
        }
        return await cadDefinedModels.layerModel.findById(cadInstance.toJSON().id, {
          attributes: {
            exclude: ['geometry', ...excludedFindManyAndFindOne]
          },
          include: [...cadDefinedModels.findOneModels, ...cadDefinedModels.findManyModels]
        });
      } else {
        throw new CustomValidationError({
          message: 'Нет объектов или нет таблицы для вставки'
        });
      }
    } catch (error) {
      throw error;
    }
  }


  async deleteJSONFeatureById(layerId, featureId) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');

      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');

      let properties = schema.toJSON().layer_schema;
      let cadastralTable = properties.cadastralTable;
      if (cadastralTable) {
        let cadSchema: any = await Layers.findById(cadastralTable);
        if (!cadSchema) throw new Error('нет схемы кадастровых данных');
        let cadSchemaProps = cadSchema.toJSON().layer_schema;
        let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);
        let cadInstance = await cadDefinedModels.layerModel.findById(featureId);
        if (!cadInstance) return null;
        await cadInstance.destroy();
      } else {
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  async updateJSONFeatureById(layerId, featureId, featureData) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureId) throw new Error('Не задан id объекта');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);


      let excludedFindMany = [];
      let excludedFindManyUpdateOptions = {};
      for (let key in properties.properties) {
        if (properties.properties[key].columnType === 'findOne') {
          if (featureData.hasOwnProperty(key)) {
            featureData[key] = featureData[key] ?
              featureData[key].code ? featureData[key].code : featureData[key] : featureData[key];
          }
        }
        if (properties.properties[key].columnType === 'findUser') {
          if (featureData.hasOwnProperty(key)) {
            featureData[key] = featureData[key] ?
              featureData[key].id ? featureData[key].id : featureData[key] : featureData[key];
          }
        }

        if (properties.properties[key].columnType === 'findMany') {

          if (featureData.hasOwnProperty(key)) {
            excludedFindMany.push(key);
            excludedFindManyUpdateOptions[key] = featureData[key];
            delete featureData[key];
          }
        }
      }
      const instance: any = await definedModels.layerModel.findById(featureId, {
        attributes: {
          exclude: ['geometry']
        },
        include: [...definedModels.findOneModels, ...definedModels.findManyModels]
      });

      if (!instance) throw new Error('Объекта с таким id не существует');
      let awaitUpdateInstancePlain = await instance.update(featureData);

      await Promise.all(excludedFindMany.map(key => {
        let alreadyValues = instance[`_${key}`].map(item => item.code);
        let newValues = excludedFindManyUpdateOptions[key].map(item => item.code);
        let valuesToAdd = newValues.filter(item => alreadyValues.indexOf(item) === -1 ? item : false);
        let valuesToRemove = alreadyValues.filter(item => newValues.indexOf(item) === -1 ? item : false);

        let currentThroughtModel;
        definedModels.findManyThrougModels.map(model => {
          if (model.as === `_${key}`) currentThroughtModel = model.model;
        });
        if (!currentThroughtModel) {
          return null;
        } else {
          let removePromise = null;
          if (valuesToRemove.length > 0) {
            removePromise = currentThroughtModel.destroy({
              where: {
                code: valuesToRemove,
                feature_id: featureId
              }
            })
          }
          let addPromise = null;
          if (valuesToAdd.length > 0) {
            addPromise = currentThroughtModel.bulkCreate(valuesToAdd.map(item => ({
              id: uuid.v4(),
              code: item,
              feature_id: featureId
            })))
          }
          return Promise.all([removePromise, addPromise])
        }
      })).catch(error => {
        throw new Error(error)
      });

      return awaitUpdateInstancePlain;
    } catch (error) {
      throw error;
    }
  }


  async updateJSONFeatureByIds(layerId, featuresId, featureData) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featuresId) throw new Error('Не заданы id объектов');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);


      let excludedFindMany = [];
      let excludedFindManyUpdateOptions = {};
      for (let key in properties.properties) {
        if (properties.properties[key].columnType === 'findOne') {
          if (featureData.hasOwnProperty(key)) {
            featureData[key] = featureData[key] ? featureData[key].code ? featureData[key].code : featureData[key] : featureData[key];
          }
        }
        if (properties.properties[key].columnType === 'findUser') {
          if (featureData.hasOwnProperty(key)) {
            featureData[key] = featureData[key] ? featureData[key].id ? featureData[key].id : featureData[key] : featureData[key];
          }
        }

        if (properties.properties[key].columnType === 'findMany') {
          if (featureData.hasOwnProperty(key)) {
            excludedFindMany.push(key);
            excludedFindManyUpdateOptions[key] = featureData[key];
            delete featureData[key];
          }
        }
      }

      const transaction = await sequelize.transaction();

      try {
        return (async () => {
          await definedModels.layerModel.update(
            featureData,
            { where: { id: { [Sequelize.Op.in]: featuresId } }, transaction },
          );

          const instances = await definedModels.layerModel.findAll(
            {
              where: { id: { [Sequelize.Op.in]: featuresId } },
              attributes: { exclude: ['geometry'] },
              include: [...definedModels.findOneModels, ...definedModels.findManyModels]
            },
          );

          for (const key of excludedFindMany) {
            for (const i of instances) {
              let instance = i.toJSON();
              let alreadyValues = instance[`_${key}`].map(item => item.code);
              let featureId = instance.id;
              let newValues = excludedFindManyUpdateOptions[key].map(item => item.code);
              let valuesToAdd = newValues.filter(item => alreadyValues.indexOf(item) === -1 ? item : false);
              let valuesToRemove = alreadyValues.filter(item => newValues.indexOf(item) === -1 ? item : false);

              let currentThroughtModel;
              definedModels.findManyThrougModels.map(model => {
                if (model.as === `_${key}`) currentThroughtModel = model.model;
              });
              if (!currentThroughtModel) {
                return null;
              } else {
                if (valuesToRemove.length > 0) {
                  await currentThroughtModel.destroy({
                    where: { code: valuesToRemove, feature_id: featureId },
                    transaction
                  })
                }
                if (valuesToAdd.length > 0) {
                  await currentThroughtModel.bulkCreate(
                    valuesToAdd.map(item => ({
                      id: uuid.v4(), code: item, feature_id: featureId
                    })), {
                      transaction
                    }
                  )
                }
              }
            }
          }
          await transaction.commit();
          return { message: 'done' };
        })();
      } catch (error) {
        await transaction.rollback();
      }
    } catch (error) {
      throw error;
    }
  }




  async getFeaturesByFilters(layerId, filterParams) {
    if (!layerId) throw new Error('Не задан id слоя');
    if (!filterParams) {
      return;
    }
    let schema: any = await Layers.findById(layerId);
    if (!schema) throw new Error('Слой не существует');
    schema = schema.toJSON().layer_schema;

    let knexQueryFunction = this.KnexFilterQueryBuilder.knex
      .withSchema(schema.schema)
      .join('parcels_cad', `${schema.table}.id`, 'parcels_cad.id')
      .select('parcels.id', 'parcels_cad.cn', 'parcels_cad.center')
      .from(schema.table)

    try {
      if (filterParams.spatialFilter) {
        knexQueryFunction = this.KnexFilterQueryBuilder.spatialFilter(knexQueryFunction, filterParams.spatialFilter);
      }

      if (filterParams.survey || filterParams.segmented || filterParams.squareFrom || filterParams.squareTo || filterParams.squareUnit) {

        knexQueryFunction = this.KnexFilterQueryBuilder.squareFilter(knexQueryFunction, ...[
          (filterParams.survey || null),
          (filterParams.segmented || null),
          (filterParams.squareFrom || null),
          (filterParams.squareTo || null),
          (filterParams.squareUnit || null)
        ]);
      }

      if (filterParams.distanceFrom || filterParams.distanceTo) {
        knexQueryFunction = this.KnexFilterQueryBuilder.distanceFilter(knexQueryFunction, (filterParams.distanceFrom || null), (filterParams.distanceTo || null));
      }

      if (filterParams.sideFilters && filterParams.sideFilters.length > 0) {
        for (let i = 0; i < filterParams.sideFilters.length; i++) {
          for (let key in schema.properties) {
            if (key === filterParams.sideFilters[i].column) {
              filterParams.sideFilters[i].column = schema.properties[key];
              filterParams.sideFilters[i].column.columnName = key;
              filterParams.sideFilters[i].column.tableName = schema.table;
            }
          }
        }
        knexQueryFunction = this.KnexFilterQueryBuilder.sideFilter(knexQueryFunction, filterParams.sideFilters);
      }
      let result = await sequelize.query(knexQueryFunction.toString());
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async splitFeaturesByLine(geoJSONs, splitLine) {
    try {
      if (!geoJSONs || !splitLine) throw new Error('Не задан id слоя');
      let intersectsGeoms = geoJSONs.map(geometry => `SELECT ST_Intersects(ST_GeomFromGeoJSON('${JSON.stringify(geometry.geometry)}'), ST_GeomFromGeoJSON('${JSON.stringify(splitLine)}')) AS intersects;`);
      let intersectsResults = await Promise.all(intersectsGeoms.map(row => sequelize.query(row)));
      let geometriesThatIntersects = []
      intersectsResults.forEach((intersectsResult, index) => { if (intersectsResult[0][0].intersects) { geometriesThatIntersects.push(geoJSONs[index]) } })
      let rows = geometriesThatIntersects.map(geometry => `SELECT ST_Split(ST_GeomFromGeoJSON('${JSON.stringify(geometry.geometry)}'), ST_GeomFromGeoJSON('${JSON.stringify(splitLine)}')) AS split;`);
      let result = await Promise.all(rows.map(row => sequelize.query(row)));
      let featuresResult = []
      result.forEach((promiseItem, index) => {
        let oldFeatures = geometriesThatIntersects[index];
        let geojsonObj = { type: 'FeatureCollection', features: [] };
        geojsonObj.features = promiseItem[0][0].split.geometries;
        geojsonObj.features = geojsonObj.features.map(geom => {
          return {
            type: 'Feature',
            geometry: geom,
            properties: oldFeatures.properties
          }
        });
        featuresResult.push(geojsonObj);
      });
      return featuresResult;
    } catch (error) {
      throw error;
    }
  }

  async createFeaturesOnFeatureSplit(layerId, featureId, geoJSONFeatureCollection) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!geoJSONFeatureCollection) throw new Error('Нет объекта для записи в БД');
      let errors = geojsonhint.hint(geoJSONFeatureCollection);
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);
      let onlyMessagesError = errors.filter(error => (error.level === "message") ? error : false).length === errors.length;
      const featureInstance = await definedModels.layerModel.findById(featureId);
      if (!featureInstance) throw new Error('Нет объекта в БД');

      if (!((errors && !errors.length) || (errors && errors.length && onlyMessagesError))) {
        throw new CustomValidationError({
          message: 'Не валидная геометрия',
          errors
        });
      }
      let result = [];
      let cadastralTable = properties.cadastralTable;
      if (cadastralTable) {
        let cadSchema: any = await Layers.findById(cadastralTable);
        if (!cadSchema) throw new Error('нет схемы кадастровых данных');
        let cadSchemaProps = cadSchema.toJSON().layer_schema;
        let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);
        const cadInstance = await cadDefinedModels.layerModel.findById(featureId);
        // if (!cadInstance) throw new Error('В базе данных нет кадастровой информации по объекту');
        let transaction;
        try {
          transaction = await sequelize.transaction();
          return (async () => {
            await featureInstance.destroy({ transaction });
            let createdFeature = featureInstance.toJSON();
            let createdCadFeature;

            if (cadInstance) {
              await cadInstance.destroy({ transaction });
              createdCadFeature = cadInstance.toJSON();
            }

            for (const feature of geoJSONFeatureCollection.features) {
              let multyGeometry;
              if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'LineString' || feature.geometry.type === 'Point') {
                multyGeometry = feature.geometry.type = `Multi${feature.geometry.type}`;
                feature.geometry.coordinates = [feature.geometry.coordinates];
              }
              createdFeature.id = uuid.v4();
              createdFeature.geometry = feature.geometry;
              let transactionCreatedFeature = await definedModels.layerModel.create(createdFeature, { transaction });

              if (createdCadFeature) {
                createdCadFeature.id = createdFeature.id;
                await cadDefinedModels.layerModel.create(createdCadFeature, { transaction });
              }
              let dirtyFeature = transactionCreatedFeature.toJSON();
              let crearFeature = {
                type: 'Feature',
                properties: {},
                geometry: dirtyFeature.geometry
              }

              for (const key in dirtyFeature) {
                if (key !== 'geometry') crearFeature.properties[key] = dirtyFeature[key];
              }

              result.push(crearFeature);
            }
            await transaction.commit();
            return result;
          })();
        } catch (error) {
          await transaction.rollback();
        }
      }
    } catch (error) {
      throw error;
    }
  }


  async unionGeoJSONObjectsById(layerId, featureIds, mainFeatureIdToUnion) {
    try {
      if (!layerId) throw new Error('Не задан id слоя');
      if (!featureIds) throw new Error('Нет элементов для объединения');
      if (!mainFeatureIdToUnion) throw new Error('Нет id объекта, атрибуты которого будут использоваться');
      let schema: any = await Layers.findById(layerId);
      if (!schema) throw new Error('Слой не существует');
      let properties = schema.toJSON().layer_schema
      let definedModels = this.LayerSchemaDefine.defineShema(properties);


      let result = [];
      let cadastralTable = properties.cadastralTable;
      let cadSchema: any = await Layers.findById(cadastralTable);
      if (!cadSchema) throw new Error('нет схемы кадастровых данных');
      let cadSchemaProps = cadSchema.toJSON().layer_schema;
      let cadDefinedModels = this.LayerSchemaDefine.defineShema(cadSchemaProps);


      const cadInstance = await cadDefinedModels.layerModel.findById(mainFeatureIdToUnion);
      const featureInstance = await definedModels.layerModel.findById(mainFeatureIdToUnion);
      if (!featureInstance) throw new Error('Нет объекта в БД');


      let whereStatment;
      for (let i = 0; i < featureIds.length; i++) {
        whereStatment = (i === 0) ? `id='${featureIds[i]}' ` : `${whereStatment} OR id='${featureIds[i]}' `
      }

      let transaction;
      try {
        transaction = await sequelize.transaction();
        return (async () => {
          let unionGeometryQuery = await sequelize.query(`SELECT ST_Multi(ST_Union(ARRAY(SELECT geometry FROM ${properties.schema}.${properties.table} WHERE ${whereStatment})));`, { transaction });

          for (const featureId of featureIds) {
            await definedModels.layerModel.destroy({
              where: { id: featureId },
              transaction
            });
            await cadDefinedModels.layerModel.destroy({
              where: { id: featureId },
              transaction
            });
          };

          let createdFeature = featureInstance.toJSON();
          let createdCadFeature;
          if (cadInstance) createdCadFeature = cadInstance.toJSON();

          createdFeature.id = uuid.v4();
          createdFeature.geometry = unionGeometryQuery[0][0].st_multi;
          let transactionCreatedFeature = await definedModels.layerModel.create(createdFeature, { transaction });

          let dirtyFeature = transactionCreatedFeature.toJSON();
          let crearFeature = {
            type: 'Feature',
            properties: {},
            geometry: dirtyFeature.geometry
          }

          for (const key in dirtyFeature) {
            if (key !== 'geometry') crearFeature.properties[key] = dirtyFeature[key];
          }

          if (createdCadFeature) {
            createdCadFeature.id = createdFeature.id;
            await cadDefinedModels.layerModel.create(createdCadFeature, { transaction });
          }
          await transaction.commit();
          return crearFeature;
        })();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }


    } catch (error) {
      throw error;
    }
  }
}