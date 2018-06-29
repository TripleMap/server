import { Controller, Get, Param } from "@nestjs/common";

import { UsersLayersService } from "./users-layers.service";

@Controller("api/UsersLayers")
export class UsersLayersController {
	constructor(private readonly UsersLayersService: UsersLayersService) { }

	@Get()
	async findAll() {
		return this.UsersLayersService.findAll();
	}

	@Get(":id")
	async findById(@Param("id") id) {
		return this.UsersLayersService.findById(id);
	}
}
