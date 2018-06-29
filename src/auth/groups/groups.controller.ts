import { Body, Controller, UseGuards, Query, Delete, Get, Param, Post, Put, Patch } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { AccessGuard } from '../guards/access.guard';

import { Groups } from '../groups/groups.decorator';
import { Roles } from '../roles/roles.decorator';

@UseGuards(AccessGuard)
@Controller("api/accounts")
export class UsersController {
	constructor(private readonly GroupsService: GroupsService) { }
	@Roles('administrator')
	@Get()
	async findAll() {
		return this.GroupsService.findAll();
	}

	@Roles('administrator')
	@Post()
	async createUsers(@Body() groups) {
		return (Array.isArray(groups)) ? this.GroupsService.createMany(groups) : this.GroupsService.createOne(groups);
	}

	@Roles('administrator')
	@Delete()
	async deleteWithWhere(@Param("where") where) {
		return this.GroupsService.deleteWithWhere(where);
	}

	@Roles('administrator')
	@Patch()
	async updateWithWhere(@Param("where") where, @Body() data) {
		return this.GroupsService.updateWithWhere(where, data);
	}

	@Roles('administrator')
	@Patch(":id")
	async updateById(@Param("id") id, @Body() data) {
		return this.GroupsService.updateById(id, data);
	}

	@Roles('administrator')
	@Get(":id")
	async findById(@Param("id") id) {
		return this.GroupsService.findById(id);
	}

	@Roles('administrator')
	@Delete(":id")
	async deleteById(@Param("id") id) {
		return this.GroupsService.deleteById(id);
	}
}
