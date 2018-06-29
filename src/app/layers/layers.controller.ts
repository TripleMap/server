import { Body, Controller, Query, Delete, Get, Param, Post, Patch, UseGuards } from "@nestjs/common";

import { LayersService } from "./layers.service";
import { LayersEventsService } from "./layers.events.service";
import { LayersAdditionalCharsService } from './layer.additionalChars.service';
import { LayersLabelsService } from './layer.lablels.service';
import { LayersStylesService } from './layer.styles.service';
import { UserId } from '../../auth/users/user.userId.decorator'
import { AccessGuard } from '../../auth/guards/access.guard';
import { Roles } from '../../auth/roles/roles.decorator';


@Controller("api/Layers")
@UseGuards(AccessGuard)
export class LayersController {
	constructor(
		private readonly LayersService: LayersService,
		private readonly LayersEventsService: LayersEventsService,
		private readonly LayersAdditionalCharsService: LayersAdditionalCharsService,
		private readonly LayersLabelsService: LayersLabelsService,
		private readonly LayersStylesService: LayersStylesService
	) { }

	@Get()
	async findAll() {
		return this.LayersService.findAll();
	}

	@Post()
	async create(@Body() layer) {
		let res
		if (Array.isArray(layer)) {
			res = this.LayersService.createMany(layer);
		} else {
			res = this.LayersService.createOne(layer);
		}
		return res;
	}

	@Delete()
	async deleteWithWhere(@Param("where") where) {
		return this.LayersService.deleteWithWhere(where);
	}

	@Patch()
	async updateWithWhere(@Param("where") where, @Body() data) {
		return this.LayersService.updateWithWhere(where, data);
	}








	@Get('GetGeoJSONFeatures')
	async getGeoJSONFeatures(@Query("LayerId") id) {
		return this.LayersService.getGeoJSONFeatures(id);
	}

	@Get('GetGeoJSONFeature')
	async getGeoJSONFeatureById(@Query("LayerId") id, @Query("FeatureId") featureId) {
		return this.LayersService.getGeoJSONFeatureById(id, featureId);
	}


	@Patch('UpdateFeatureGeometry')
	async updateFeatureGeometry(@Query("LayerId") layerId, @Query("id") featureId, @Body() featureData) {
		return this.LayersService.updateFeatureGeometry(layerId, featureId, featureData);
	}

	@Delete('RemoveGeoJSONFeature')
	async removeGeoJSONFeatureById(@Query("LayerId") layerId, @Query("FeaturesId") featuresId) {
		if (featuresId) {
			let featureIds = featuresId.split(',');
			return (async () => {
				let count = 0;
				for (const id of featureIds) {
					await this.LayersService.removeGeoJSONFeatureById(layerId, id);
					await this.LayersService.deleteJSONFeatureById(layerId, id);
					count++;
				}
				return { count };
			})();
		} else {
			throw "featuresId не заданы";
		}
	}






	@Get('GetJSONFeatures')
	async getJSONFeatures(@Query("LayerId") id) {
		return this.LayersService.getJSONFeatures(id);
	}

	@Get('GetJSONFeature')
	async getJSONFeatureById(@Query("LayerId") id, @Query("FeatureId") featureId) {
		return this.LayersService.getJSONFeatureById(id, featureId);
	}

	@Post('CreateJSONFeature')
	async createJSONFeature(@Query("LayerId") id, @Query("withCadastralData") withCadastralData, @Body() featureData) {
		return this.LayersService.createJSONFeature(id, withCadastralData, featureData);
	}

	@Delete('DeleteJSONFeature')
	async deleteJSONFeatureById(@Query("LayerId") layerId, @Query("id") featureId) {
		return this.LayersService.deleteJSONFeatureById(layerId, featureId);
	}

	@Patch('UpdateJSONFeature')
	async updateJSONFeatureById(@Query("LayerId") layerId, @Query("id") featureId, @Body() featureData) {
		return this.LayersService.updateJSONFeatureById(layerId, featureId, featureData);
	}

	@Patch('UpdateJSONFeatures')
	async updateJSONFeatureByIds(@Query("LayerId") layerId, @Body("ids") featureIds, @Body('feature') featureData) {
		return this.LayersService.updateJSONFeatureByIds(layerId, featureIds, featureData);
	}










	@Post('CreateFeatureCadastralInfo')
	async createFeatureCadastralInfo(@Query("LayerId") id, @Query("FeatureId") FeatureId, @Body() cadastralProperties) {
		return this.LayersService.createFeatureCadastralInfo(id, FeatureId, cadastralProperties)
	}

	@Post('UpdateFeatureCadastralInfo')
	async updateFeatureCadastralInfo(@Query("LayerId") id, @Query("cn") cadastralNumber, @Body() cadastralProperties) {
		return this.LayersService.updateFeatureCadastralInfo(id, cadastralNumber, cadastralProperties)
	}








	@Get('GetAdditionalCharacters')
	async getAdditionalCharacters(@Query("LayerId") id, @Query("FeatureId") featureId) {
		return this.LayersAdditionalCharsService.getAdditionalCharacters(id, featureId);
	}

	@Get('GetAdditionalCharacter')
	async getAdditionalCharacterById(@Query("LayerId") id, @Query("id") additionalCharacterId) {
		return this.LayersAdditionalCharsService.getAdditionalCharacterById(id, additionalCharacterId);
	}

	@Post('CreateAdditionalCharacter')
	async createAdditionalCharacterById(@Query("LayerId") id, @Query("FeatureId") featureId, @Body() additionalCharacterInstance) {
		return this.LayersAdditionalCharsService.createAdditionalCharacterById(id, additionalCharacterInstance, featureId)
	}

	@Delete("DeleteAdditionalCharacter")
	async deleteAdditionalCharacterById(@Query("LayerId") layerId, @Query("id") additionalCharacterId) {
		return this.LayersAdditionalCharsService.deleteAdditionalCharacterById(layerId, additionalCharacterId);
	}

	@Patch("UpdateAdditionalCharacter")
	async updateAdditionalCharacterById(@Query("LayerId") layerId, @Query("id") additionalCharacterId, @Body() additionalCharacterInstance) {
		return this.LayersAdditionalCharsService.updateAdditionalCharacterById(layerId, additionalCharacterId, additionalCharacterInstance);
	}





	@Get('GetEvents')
	async getEvents(@Query("LayerId") id, @Query("FeatureId") featureId) {
		return this.LayersEventsService.getEvents(id, featureId);
	}

	@Get('GetEvent')
	async getEventById(@Query("LayerId") id, @Query("EventId") eventId) {
		return this.LayersEventsService.getEventById(id, eventId);
	}

	@Roles('administrator', 'staff')
	@Post('CreateEvent')
	async createEvent(@Query("LayerId") id, @Query("FeatureId") featureId, @Body() eventInstance, @UserId() userId) {
		return this.LayersEventsService.createEvent(id, featureId, eventInstance, userId)
	}

	@Delete("DeleteEvent")
	async deleteEvent(@Query("LayerId") layerId, @Query("EventId") eventId) {
		return this.LayersEventsService.deleteEvent(layerId, eventId);
	}

	@Patch("UpdateEvent")
	async updateEvent(@Query("LayerId") layerId, @Query("EventId") eventId, @Body() eventInstance) {
		return this.LayersEventsService.updateEvent(layerId, eventId, eventInstance);
	}











	@Get('GetGeoJSONLayerSchema')
	async getGeoJSONLayerSchema(@Query("LayerId") id) {
		return this.LayersService.getGeoJSONLayerSchema(id);
	}

	@Get('GetGeoJSONLayerSchemaWithData')
	async getGeoJSONLayerSchemaWithData(@Query("LayerId") id) {
		return this.LayersService.getGeoJSONLayerSchemaWithData(id);
	}










	@Roles('administrator', 'staff', 'trainee')
	@Get('GetLables')
	async getLables(@UserId() userId) {
		return this.LayersLabelsService.getLables(userId);
	}

	@Roles('administrator', 'staff', 'trainee')
	@Post('CreateLable')
	async createLable(@Body() labelInstance, @UserId() userId) {
		console.log(userId);
		return this.LayersLabelsService.createLable(labelInstance, userId)
	}

	@Roles('administrator', 'staff', 'trainee')
	@Delete("DeleteLable")
	async deleteLables(@Query("LabelId") labelId, @UserId() userId) {
		return this.LayersLabelsService.deleteLables(labelId, userId);
	}

	@Roles('administrator', 'staff', 'trainee')
	@Patch("UpdateLable")
	async updateLables(@Query("LabelId") labelId, @UserId() userId, @Body() labelInstance) {
		return this.LayersLabelsService.updateLables(labelId, userId, labelInstance);
	}



	@Roles('administrator', 'staff', 'trainee')
	@Get('GetStyles')
	async getStyles(@UserId() userId) {
		return this.LayersStylesService.getStyles(userId);
	}

	@Roles('administrator', 'staff', 'trainee')
	@Post('CreateStyle')
	async createStyle(@Body() styleInstance, @UserId() userId) {
		console.log(userId);
		return this.LayersStylesService.createStyle(styleInstance, userId)
	}

	@Roles('administrator', 'staff', 'trainee')
	@Delete("DeleteStyle")
	async deleteStyle(@Query("StyleId") styleId, @UserId() userId) {
		return this.LayersStylesService.deleteStyle(styleId, userId);
	}

	@Roles('administrator', 'staff', 'trainee')
	@Patch("UpdateStyle")
	async updateStyle(@Query("StyleId") styleId, @UserId() userId, @Body() styleInstance) {
		return this.LayersStylesService.updateStyle(styleId, userId, styleInstance);
	}







	@Post("GetFeaturesByFilters")
	async getFeaturesByFilters(
		@Query("LayerId") layerId,
		@Body("filterParams") filterParams,
	) {
		let spatialFilter = filterParams.spatialFilter || null,
			survey = filterParams.survey || null,
			segmented = filterParams.segmented || null,
			squareFrom = filterParams.squareFrom || null,
			squareTo = filterParams.squareTo || null,
			squareUnit = filterParams.squareUnit || null,
			distanceFrom = filterParams.distanceFrom || null,
			distanceTo = filterParams.distanceTo || null,
			sideFilters = filterParams.sideFilters || null;
		return this.LayersService.getFeaturesByFilters(layerId, { spatialFilter, survey, segmented, squareFrom, squareTo, squareUnit, distanceFrom, distanceTo, sideFilters });
	}

	@Get('GetLayerFeaturesLables')
	async getLayerFeaturesLables(@Query("LayerId") id, @Query("FieldToLabel") fieldToLabel) {
		return this.LayersLabelsService.getLayerFeaturesLables(id, fieldToLabel);
	}

	@Get('GetLayerFeaturesStyles')
	async getLayerFeaturesStyles(@Query("LayerId") id, @Query("FieldToStyle") fieldToStyle) {
		return this.LayersStylesService.getLayerFeaturesStyles(id, fieldToStyle);
	}








	@Post("SplitFeaturesByLine")
	async splitFeaturesByLine(
		@Body("geometries") geometries,
		@Body("splitLine") splitLine,
	) {
		return this.LayersService.splitFeaturesByLine(geometries, splitLine);
	}


	@Post("UnionGeoJSONObjectsById")
	async unionGeoJSONObjectsById(
		@Query("LayerId") layerId,
		@Query("MainFeatureIdToUnion") mainFeatureIdToUnion,
		@Body("featureIds") featureIds,
	) {
		return this.LayersService.unionGeoJSONObjectsById(layerId, featureIds, mainFeatureIdToUnion);
	}

	@Post("CreateFeaturesOnFeatureSplit")
	async createFeaturesOnFeatureSplit(
		@Query("LayerId") layerId,
		@Query("featureId") featureId,
		@Body() geoJSONFeatureCollection
	) {
		return this.LayersService.createFeaturesOnFeatureSplit(layerId, featureId, geoJSONFeatureCollection);
	}








	@Get("layerUsers/:id")
	async findUserLayersByUserId(@Param("id") id) {
		return this.LayersService.findUsersByLayerId(id);
	}

	@Patch(":id")
	async updateById(@Param("id") id, @Body() data) {
		return this.LayersService.updateById(id, data);
	}

	@Get(":id")
	async findById(@Param("id") id) {
		return this.LayersService.findById(id);
	}

	@Delete(":id")
	async deleteById(@Param("id") id) {
		return this.LayersService.deleteById(id);
	}

}
