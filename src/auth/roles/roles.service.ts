import { Component, Inject } from "@nestjs/common";
import { Roles } from '../../sequelize/index';
import { Role } from './roles.interface';
import { CustomError } from '../../exeptions/custom.error';

@Component()
export class RolesService {

  constructor() { }
  // GET
  async findAll() {
    try {
      return await Roles.findAll();
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      return await Roles.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async findWithWhere(whereObj) {
    try {
      return await Roles.find(whereObj);
    } catch (error) {
      throw error;
    }
  }

  // POST 
  async createOne(instance) {
    try {
      return await Roles.create(instance)
    } catch (error) {
      throw error;
    }
  }

  async createMany(instances) {
    try {
      return await Roles.bulkCreate(instances);
    } catch (error) {
      throw error;
    }
  }


  // PUT
  async updateById(id: string, data) {
    try {
      const instance = await Roles.findById(id);
      const updateResult = await instance.update(data);
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  async updateWithWhere(whereObj, data) {
    try {
      const instance = await Roles.findOne({ where: whereObj });
      const updateResult = await instance.update(data);
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  // DELETE

  async deleteById(id) {
    try {
      return await Roles.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async deleteWithWhere(whereObj) {
    try {
      return await Roles.findOne({ where: whereObj })
    } catch (error) {
      throw error;
    }
  }
}

