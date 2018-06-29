import { Component, Inject } from "@nestjs/common";
import { Groups } from '../../sequelize/index';
import { Group } from './groups.interface';
import { CustomError } from '../../exeptions/custom.error';

@Component()
export class GroupsService {

  constructor() { }
  // GET
  async findAll() {
    try {
      return await Groups.findAll();
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string) {
    try {
      return await Groups.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async findWithWhere(whereObj) {
    try {
      return await Groups.find(whereObj);
    } catch (error) {
      throw error;
    }
  }

  // POST 
  async createOne(instance) {
    try {
      return await Groups.create(instance)
    } catch (error) {
      throw error;
    }
  }

  async createMany(instances) {
    try {
      return await Groups.bulkCreate(instances);
    } catch (error) {
      throw error;
    }
  }


  // PUT
  async updateById(id: string, data) {
    try {
      const instance: any = await Groups.findById(id);
      const updateResult = await instance.update(data);
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  async updateWithWhere(whereObj, data) {
    try {
      const instance: any = await Groups.findOne({ where: whereObj });
      const updateResult = await instance.update(data);
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  // DELETE

  async deleteById(id) {
    try {
      return await Groups.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async deleteWithWhere(whereObj) {
    try {
      return await Groups.findOne({ where: whereObj })
    } catch (error) {
      throw error;
    }
  }
}

